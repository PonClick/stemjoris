// Microfoonluisteraar: haalt audio op via een AnalyserNode en meldt per frame een toonhoogte.
// De audio blijft op het apparaat; er wordt niets opgenomen of verstuurd.

import type { PitchReading } from '../types';
import { getAudioContext, resumeAudio } from './context';
import { detectPitch, minBlockSize } from './pitch';

export interface ListenerOptions {
  /** Laagste te zoeken frequentie in Hz (standaard 27, net onder A0). */
  minFreq?: number;
  /** Hoogste te zoeken frequentie in Hz (standaard 1500). */
  maxFreq?: number;
  /** Blokken met een lagere RMS gelden als stilte (standaard 0.005, ongeveer -46 dBFS). */
  minRms?: number;
  /** Metingen met een lagere betrouwbaarheid worden null (standaard 0.8). */
  minClarity?: number;
}

const MIN_FFT_SIZE = 4096;
const MAX_FFT_SIZE = 32768;

const MSG_INSECURE =
  'De microfoon werkt alleen via een beveiligde verbinding (https). Open de app via https.';
const MSG_UNSUPPORTED =
  'Je browser ondersteunt geen microfoontoegang. Gebruik een recente versie van Chrome, Safari of Firefox.';
const MSG_DENIED = 'Geen toegang tot de microfoon. Sta microfoontoegang toe in je browser.';
const MSG_NOT_FOUND = 'Geen microfoon gevonden. Sluit een microfoon aan of controleer je instellingen.';
const MSG_BUSY =
  'De microfoon kan niet worden gestart. Mogelijk gebruikt een andere app hem al; sluit die en probeer het opnieuw.';
const MSG_GENERIC = 'De microfoon kon niet worden gestart. Probeer het opnieuw.';

function micErrorMessage(err: unknown): string {
  const name = err instanceof Error || (typeof err === 'object' && err !== null && 'name' in err)
    ? String((err as { name: unknown }).name)
    : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return MSG_DENIED;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return MSG_NOT_FOUND;
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return MSG_BUSY;
    default:
      return MSG_GENERIC;
  }
}

function pickFftSize(sampleRate: number, minFreq: number): number {
  const needed = Math.max(MIN_FFT_SIZE, minBlockSize(sampleRate, minFreq));
  let size = MIN_FFT_SIZE;
  while (size < needed && size < MAX_FFT_SIZE) size <<= 1;
  return size;
}

const schedule: (cb: () => void) => number =
  typeof requestAnimationFrame === 'function'
    ? (cb) => requestAnimationFrame(cb)
    : (cb) => setTimeout(cb, 16) as unknown as number;
const unschedule: (id: number) => void =
  typeof cancelAnimationFrame === 'function'
    ? (id) => cancelAnimationFrame(id)
    : (id) => clearTimeout(id);

export class PitchListener {
  private minFreq: number;
  private maxFreq: number;
  private readonly minRms: number;
  private readonly minClarity: number;

  private onReading: ((r: PitchReading | null) => void) | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private buf: Float32Array<ArrayBuffer> = new Float32Array(MIN_FFT_SIZE);
  private frameId: number | null = null;
  private starting: Promise<void> | null = null;
  /** Wordt bij elke start en stop opgehoogd, zodat een trage getUserMedia na stop() niets meer start. */
  private generation = 0;
  private active = false;

  constructor(opts: ListenerOptions = {}) {
    this.minFreq = opts.minFreq ?? 27;
    this.maxFreq = opts.maxFreq ?? 1500;
    this.minRms = opts.minRms ?? 0.005;
    this.minClarity = opts.minClarity ?? 0.8;
  }

  get running(): boolean {
    return this.active;
  }

  /**
   * Vraagt microfoontoegang en start de analyse. Roep aan vanuit een klik of tik.
   * Gooit een Error met een Nederlandse melding als de microfoon niet beschikbaar is.
   * Een tweede aanroep start geen tweede lus; hij vervangt alleen de callback.
   */
  start(onReading: (r: PitchReading | null) => void): Promise<void> {
    this.onReading = onReading;
    if (this.active) return Promise.resolve();
    if (this.starting) return this.starting;
    const p = this.doStart().finally(() => {
      if (this.starting === p) this.starting = null;
    });
    this.starting = p;
    return p;
  }

  private async doStart(): Promise<void> {
    const gen = ++this.generation;

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      throw new Error(MSG_INSECURE);
    }
    const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!media || typeof media.getUserMedia !== 'function') {
      throw new Error(typeof window !== 'undefined' && !window.isSecureContext ? MSG_INSECURE : MSG_UNSUPPORTED);
    }

    // Synchroon, nog binnen het gebruikersgebaar: context aanmaken en hervatten.
    const ctx = getAudioContext();
    const resumed = resumeAudio().catch(() => undefined);

    let stream: MediaStream;
    try {
      stream = await media.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
    } catch (err) {
      throw new Error(micErrorMessage(err));
    }
    if (gen !== this.generation) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    await resumed;
    if (gen !== this.generation) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);
    // Niet met ctx.destination verbinden: geen terugkoppeling naar de speaker.

    this.stream = stream;
    this.source = source;
    this.analyser = analyser;
    this.applyFftSize();
    for (const track of stream.getAudioTracks()) {
      track.addEventListener('ended', this.handleTrackEnded);
    }
    this.active = true;
    this.frameId = schedule(this.tick);
  }

  /** Stopt de analyse en de microfoontracks (het opname-indicatortje gaat uit). */
  stop(): void {
    this.generation++;
    this.active = false;
    if (this.frameId !== null) {
      unschedule(this.frameId);
      this.frameId = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        // al losgekoppeld
      }
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {
        // al losgekoppeld
      }
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.removeEventListener('ended', this.handleTrackEnded);
        track.stop();
      }
    }
    this.stream = null;
    this.source = null;
    this.analyser = null;
  }

  /** Past het zoekbereik aan (bijvoorbeeld per instrument); werkt ook tijdens het luisteren. */
  setRange(minFreq: number, maxFreq: number): void {
    if (!(minFreq > 0) || !(maxFreq > minFreq)) return;
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
    this.applyFftSize();
  }

  private applyFftSize(): void {
    const analyser = this.analyser;
    if (!analyser) return;
    const size = pickFftSize(analyser.context.sampleRate, this.minFreq);
    if (analyser.fftSize !== size) analyser.fftSize = size;
    if (this.buf.length !== analyser.fftSize) this.buf = new Float32Array(analyser.fftSize);
  }

  private readonly handleTrackEnded = (): void => {
    const cb = this.onReading;
    this.stop();
    cb?.(null);
  };

  private readonly tick = (): void => {
    const analyser = this.analyser;
    if (!this.active || !analyser) return;
    this.frameId = schedule(this.tick);

    const buf = this.buf;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i]!;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    const time = performance.now();

    let reading: PitchReading | null = null;
    if (rms >= this.minRms) {
      const result = detectPitch(buf, analyser.context.sampleRate, {
        minFreq: this.minFreq,
        maxFreq: this.maxFreq,
        threshold: 1 - this.minClarity,
      });
      if (result && result.clarity >= this.minClarity) {
        reading = { freq: result.freq, clarity: result.clarity, rms, time };
      }
    }
    try {
      this.onReading?.(reading);
    } catch (err) {
      console.error(err);
    }
  };
}
