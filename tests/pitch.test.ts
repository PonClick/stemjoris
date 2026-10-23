import { describe, expect, it } from 'vitest';
import { detectPitch } from '../src/audio/pitch';
import { noteToFreq } from '../src/music/notes';

const N = 4096;
const RATES = [44100, 48000];

/** Deterministische ruis (mulberry32), uniform in [-1, 1). */
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/** Som van harmonischen (amps[0] = grondtoon) met vaste fasen, plus optionele ruis. */
function synth(freq: number, sampleRate: number, amps: number[], noise = 0, seed = 1): Float32Array {
  const rand = rng(seed);
  const phases = amps.map((_, i) => 0.3 + i * 1.7);
  const buf = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let v = 0;
    for (let h = 0; h < amps.length; h++) {
      v += amps[h]! * Math.sin((2 * Math.PI * freq * (h + 1) * i) / sampleRate + phases[h]!);
    }
    buf[i] = 0.3 * v + noise * rand();
  }
  return buf;
}

function centsOff(measured: number, expected: number): number {
  return 1200 * Math.log2(measured / expected);
}

const SINE = [1];
const GUITAR = [1, 0.7, 0.5, 0.35, 0.25, 0.15];
const WEAK_FUNDAMENTAL = [0.2, 1.0];

function expectPitch(buf: Float32Array, sampleRate: number, expected: number, tolCents: number): void {
  const r = detectPitch(buf, sampleRate);
  expect(r, `geen toon gevonden voor ${expected} Hz`).not.toBeNull();
  const off = centsOff(r!.freq, expected);
  expect(Math.abs(off), `${expected} Hz @ ${sampleRate}: ${off.toFixed(3)} cent`).toBeLessThan(tolCents);
  expect(r!.clarity).toBeGreaterThan(0.8);
  expect(r!.clarity).toBeLessThanOrEqual(1);
}

const MID = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4'];
const LOW = ['B0', 'E1', 'A1', 'E2'];
const HIGH = ['E5', 'A5', 'C6'];

describe.each(RATES)('detectPitch @ %i Hz, blok 4096', (sampleRate) => {
  it('zuivere sinus, middenbereik < 1 cent', () => {
    for (const n of MID) expectPitch(synth(noteToFreq(n), sampleRate, SINE), sampleRate, noteToFreq(n), 1);
  });

  it('harmonisch rijk (gitaarachtig, 6 harmonischen) < 1 cent', () => {
    for (const n of MID) expectPitch(synth(noteToFreq(n), sampleRate, GUITAR), sampleRate, noteToFreq(n), 1);
  });

  it('zwakke grondtoon (0.2 tegen 1.0 op de 2e harmonische) geeft de grondtoon', () => {
    for (const n of [...LOW, ...MID]) {
      expectPitch(synth(noteToFreq(n), sampleRate, WEAK_FUNDAMENTAL), sampleRate, noteToFreq(n), 1);
    }
  });

  it('lage tonen (B0, E1, A1, E2) < 2 cent', () => {
    for (const n of LOW) {
      const f = noteToFreq(n);
      expectPitch(synth(f, sampleRate, SINE), sampleRate, f, 2);
      expectPitch(synth(f, sampleRate, GUITAR), sampleRate, f, 2);
    }
  });

  it('hoge tonen (E5, A5, C6) < 1 cent', () => {
    for (const n of HIGH) {
      const f = noteToFreq(n);
      expectPitch(synth(f, sampleRate, SINE), sampleRate, f, 1);
      expectPitch(synth(f, sampleRate, GUITAR), sampleRate, f, 1);
    }
  });

  it('licht verstemde tonen worden in cent nauwkeurig gemeten', () => {
    for (const detune of [-37, -8, 3, 21]) {
      const f = 110 * Math.pow(2, detune / 1200);
      expectPitch(synth(f, sampleRate, GUITAR), sampleRate, f, 1);
    }
  });

  it('met lichte ruis (SNR ~17 dB): geen octaaffouten, < 2 cent', () => {
    for (const n of [...LOW, ...MID, ...HIGH]) {
      const f = noteToFreq(n);
      for (const amps of [SINE, GUITAR, WEAK_FUNDAMENTAL]) {
        expectPitch(synth(f, sampleRate, amps, 0.05, Math.round(f)), sampleRate, f, 2);
      }
    }
  });

  it('stilte geeft null', () => {
    expect(detectPitch(new Float32Array(N), sampleRate)).toBeNull();
    expect(detectPitch(new Float32Array(N).fill(1e-7), sampleRate)).toBeNull();
  });

  it('witte ruis geeft null', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rand = rng(seed);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = 0.5 * rand();
      expect(detectPitch(buf, sampleRate)).toBeNull();
    }
  });
});

describe('detectPitch opties', () => {
  it('respecteert minFreq/maxFreq', () => {
    const buf = synth(82.41, 48000, GUITAR);
    expect(detectPitch(buf, 48000, { minFreq: 100, maxFreq: 1000 })?.freq ?? 0).not.toBeCloseTo(82.41, 0);
    expect(detectPitch(buf, 48000, { minFreq: 60, maxFreq: 400 })?.freq).toBeCloseTo(82.41, 1);
  });

  it('werkt ook met andere bloklengtes en hergebruikt buffers', () => {
    const f = 196;
    const a = detectPitch(synth(f, 48000, GUITAR).subarray(0, 2048), 48000, { minFreq: 60 });
    expect(Math.abs(centsOff(a!.freq, f))).toBeLessThan(1);
    const b = detectPitch(synth(f, 48000, GUITAR), 48000);
    expect(Math.abs(centsOff(b!.freq, f))).toBeLessThan(1);
  });

  it('is snel genoeg voor ~60 metingen per seconde', () => {
    const buf = synth(82.41, 48000, GUITAR, 0.02);
    for (let i = 0; i < 20; i++) detectPitch(buf, 48000);
    const runs = 200;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) detectPitch(buf, 48000);
    const ms = (performance.now() - t0) / runs;
    // Desktop haalt ruim < 1 ms; ruime marge voor trage CI-machines.
    expect(ms).toBeLessThan(8);
  });
});
