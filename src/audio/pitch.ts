// Toonhoogtedetectie: YIN met FFT-autocorrelatie en een octaafcorrectie.
// Puur, zonder DOM; draait in Node en in de browser.
//
// Algoritme (de Cheveigné & Kawahara 2002, "YIN"):
//  1. Differentiefunctie d(tau) = sum_{j<W} (x[j] - x[j+tau])^2 met een vast venster W = N - tauMax.
//     Uitgerekend als e0 + e(tau) - 2 r(tau): de energietermen via prefixsommen, de kruiscorrelatie
//     r(tau) via één complexe FFT (O(N log N) in plaats van O(N * tauMax)).
//  2. Cumulatief-gemiddeld genormaliseerde differentiefunctie d'(tau) = d(tau) * tau / sum_{1..tau} d.
//  3. Keuze van de periode, robuust tegen octaaffouten: eerst het globale minimum dMin van d' in het
//     bereik; daarna het EERSTE dal met d' < dMin + 0.04 + 0.25 * dMin. Zo winnen veelvouden van de
//     periode (2T, 3T, ...) niet (die zijn hooguit even goed), en wint T/2 bij een zwakke grondtoon
//     niet zolang de echte periode duidelijk periodieker is.
//     Bij een grondtoon van 0.2 naast een 2e harmonische van 1.0 is d'(T/2) ~ 0.08 tegen ~0 op T.
//  4. Het laagste punt in dat dal, verfijnd met een kleinste-kwadraten-parabool op de ruwe d
//     (halve breedte T/32, zodat ruis bij lage tonen uitmiddelt).
//
// Bloklengte: het venster W moet minstens één periode van de laagste toon bevatten, dus
// N >= 2 * sampleRate / minFreq. Bij 4096 samples is de ondergrens 2 * 44100 / 4096 = 21.5 Hz
// (44,1 kHz) en 23.4 Hz (48 kHz): B0 (30.87 Hz) en A0 (27.5 Hz) passen. Bij een te kort blok wordt tauMax
// afgekapt op N/2, wat de laagste detecteerbare frequentie verhoogt tot 2 * sampleRate / N.

import type { PitchResult } from '../types';

export interface DetectOptions {
  /** Laagste te zoeken frequentie in Hz (standaard 27, net onder A0). */
  minFreq?: number;
  /** Hoogste te zoeken frequentie in Hz (standaard 1500). */
  maxFreq?: number;
  /** Maximale aperiodiciteit d' (0..1) om nog een toon te melden (standaard 0.2, dus clarity >= 0.8). */
  threshold?: number;
}

const DEFAULT_MIN_FREQ = 27;
const DEFAULT_MAX_FREQ = 1500;
const DEFAULT_THRESHOLD = 0.2;
/** Onder deze RMS geldt het blok als stilte. */
const SILENCE_RMS = 1e-5;

/** Minimale bloklengte voor een gegeven laagste frequentie. */
export function minBlockSize(sampleRate: number, minFreq: number): number {
  return Math.ceil((2 * sampleRate) / minFreq) + 2;
}

// ---------------------------------------------------------------------------------------------
// FFT (radix-2, iteratief, in-place) met per lengte gecachete tabellen en werkbuffers.

interface Workspace {
  n: number;
  m: number;
  rev: Uint32Array;
  cos: Float64Array;
  sin: Float64Array;
  re: Float64Array;
  im: Float64Array;
  pr: Float64Array;
  pi: Float64Array;
  prefix: Float64Array;
  d: Float64Array;
  dn: Float64Array;
}

const workspaces = new Map<number, Workspace>();

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function getWorkspace(n: number): Workspace {
  let ws = workspaces.get(n);
  if (ws) return ws;
  const m = nextPow2(n);
  const bits = Math.round(Math.log2(m));
  const rev = new Uint32Array(m);
  for (let i = 0; i < m; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const half = m >> 1;
  const cos = new Float64Array(half);
  const sin = new Float64Array(half);
  for (let i = 0; i < half; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / m);
    sin[i] = -Math.sin((2 * Math.PI * i) / m);
  }
  const lags = (n >> 1) + 2;
  ws = {
    n,
    m,
    rev,
    cos,
    sin,
    re: new Float64Array(m),
    im: new Float64Array(m),
    pr: new Float64Array(m),
    pi: new Float64Array(m),
    prefix: new Float64Array(n + 1),
    d: new Float64Array(lags),
    dn: new Float64Array(lags),
  };
  // Beperk de cache: in de praktijk zijn er één of twee bloklengtes in gebruik.
  if (workspaces.size >= 4) workspaces.clear();
  workspaces.set(n, ws);
  return ws;
}

/** Voorwaartse DFT (exp(-2 pi i k n / m)) in-place. */
function fft(re: Float64Array, im: Float64Array, ws: Workspace): void {
  const { m, rev, cos, sin } = ws;
  for (let i = 0; i < m; i++) {
    const j = rev[i]!;
    if (j > i) {
      let t = re[i]!;
      re[i] = re[j]!;
      re[j] = t;
      t = im[i]!;
      im[i] = im[j]!;
      im[j] = t;
    }
  }
  for (let size = 2; size <= m; size <<= 1) {
    const halfSize = size >> 1;
    const step = m / size;
    for (let start = 0; start < m; start += size) {
      for (let k = 0, t = 0; k < halfSize; k++, t += step) {
        const wr = cos[t]!;
        const wi = sin[t]!;
        const a = start + k;
        const b = a + halfSize;
        const xr = re[b]! * wr - im[b]! * wi;
        const xi = re[b]! * wi + im[b]! * wr;
        re[b] = re[a]! - xr;
        im[b] = im[a]! - xi;
        re[a] = re[a]! + xr;
        im[a] = im[a]! + xi;
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------

/**
 * Bepaalt de grondfrequentie van een blok audio. Geeft null bij stilte, ruis of geen duidelijke
 * periode. Hergebruikt interne buffers per bloklengte: geen allocaties na de eerste aanroep.
 */
export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
  opts: DetectOptions = {},
): PitchResult | null {
  const n = buf.length;
  if (n < 64 || !(sampleRate > 0)) return null;
  const minFreq = opts.minFreq ?? DEFAULT_MIN_FREQ;
  const maxFreq = opts.maxFreq ?? DEFAULT_MAX_FREQ;
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  if (!(minFreq > 0) || !(maxFreq > minFreq)) return null;

  const ws = getWorkspace(n);
  const { m, re, im, pr, pi, prefix, d, dn } = ws;

  const tauMin = Math.max(2, Math.floor(sampleRate / maxFreq));
  const tauMax = Math.min(Math.ceil(sampleRate / minFreq) + 1, n >> 1);
  if (tauMax - tauMin < 3) return null;
  const w = n - tauMax;

  // Energie (prefixsommen) en stiltecontrole.
  prefix[0] = 0;
  for (let i = 0; i < n; i++) {
    const v = buf[i]!;
    prefix[i + 1] = prefix[i]! + v * v;
  }
  if (!(prefix[n]! > n * SILENCE_RMS * SILENCE_RMS)) return null;

  // Kruiscorrelatie r(tau) = sum_{j<W} x[j] x[j+tau] via één complexe FFT van z = x + i*a,
  // met a = x[0..W) en nullen daarna. Er treedt geen circulaire omslag op omdat j + tau < n <= m.
  for (let i = 0; i < m; i++) {
    const v = i < n ? buf[i]! : 0;
    re[i] = v;
    im[i] = i < w ? v : 0;
  }
  fft(re, im, ws);
  // P_k = conj(A_k) * X_k, met X_k = (Z_k + conj Z_{m-k})/2 en A_k = (Z_k - conj Z_{m-k})/(2i).
  // We slaan conj(P) op, zodat een voorwaartse FFT de inverse geeft: r = Re(FFT(conj P)) / m.
  for (let k = 0; k < m; k++) {
    const k2 = k === 0 ? 0 : m - k;
    const zr = re[k]!;
    const zi = im[k]!;
    const mr = re[k2]!;
    const mi = im[k2]!;
    const a1 = (zi + mi) * 0.5;
    const b1 = (zr - mr) * 0.5;
    const x1 = (zr + mr) * 0.5;
    const y1 = (zi - mi) * 0.5;
    pr[k] = a1 * x1 - b1 * y1;
    pi[k] = -(a1 * y1 + b1 * x1);
  }
  fft(pr, pi, ws);

  // Differentiefunctie en CMNDF.
  const e0 = prefix[w]!;
  const invM = 1 / m;
  d[0] = 0;
  dn[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    const et = prefix[tau + w]! - prefix[tau]!;
    let v = e0 + et - 2 * pr[tau]! * invM;
    if (v < 0) v = 0;
    d[tau] = v;
    running += v;
    dn[tau] = running > 0 ? (v * tau) / running : 1;
  }

  // Globaal minimum binnen het bereik.
  let dMin = Number.POSITIVE_INFINITY;
  for (let tau = tauMin; tau < tauMax; tau++) {
    if (dn[tau]! < dMin) dMin = dn[tau]!;
  }
  if (!(dMin <= threshold)) return null;

  // Eerste dal dat (bijna) zo goed is als het globale minimum. Binnen dat dal nemen we het laagste
  // punt (niet het eerste lokale minimum): bij lage tonen is het dal breed en maakt ruis er
  // kleine putjes in. Het volgende kandidaat-dal (een octaaf) ligt minstens tau/2 verder.
  const accept = dMin + 0.04 + 0.25 * dMin;
  let start = -1;
  for (let tau = tauMin; tau < tauMax; tau++) {
    if (dn[tau]! < accept) {
      start = tau;
      break;
    }
  }
  if (start < 0) return null;
  const end = Math.min(tauMax - 1, start + Math.ceil(start * 0.25) + 2);
  let best = start;
  for (let tau = start + 1; tau <= end; tau++) {
    if (dn[tau]! < dn[best]!) best = tau;
  }

  // Verfijning: kleinste-kwadraten-parabool op de ruwe d rond het minimum. De halve breedte groeit
  // met de periode (T/32), zodat ruis bij lage tonen uitmiddelt; bij hoge tonen is het de klassieke
  // driepuntsinterpolatie. Twee rondes, de tweede gecentreerd op de eerste schatting.
  const maxHalf = Math.max(1, Math.floor(best / 32));
  let period = best;
  for (let round = 0; round < 2; round++) {
    const center = Math.round(period);
    // Symmetrisch venster, zo nodig ingekort aan de rand van het bereik.
    const half = Math.min(maxHalf, center - 1, tauMax - center);
    if (half < 1) break;
    let sx2 = 0;
    let sx4 = 0;
    let sy = 0;
    let sxy = 0;
    let sx2y = 0;
    for (let x = -half; x <= half; x++) {
      const y = d[center + x]!;
      const x2 = x * x;
      sx2 += x2;
      sx4 += x2 * x2;
      sy += y;
      sxy += x * y;
      sx2y += x2 * y;
    }
    const meanX2 = sx2 / (2 * half + 1);
    const a = (sx2y - meanX2 * sy) / (sx4 - meanX2 * sx2);
    const b = sxy / sx2;
    if (!(a > 0)) break;
    let shift = -b / (2 * a);
    if (shift > half) shift = half;
    else if (shift < -half) shift = -half;
    period = center + shift;
  }
  const freq = sampleRate / period;
  if (freq < minFreq * 0.97 || freq > maxFreq * 1.03) return null;

  let clarity = 1 - dn[best]!;
  if (clarity < 0) clarity = 0;
  else if (clarity > 1) clarity = 1;
  return { freq, clarity };
}
