import { describe, expect, it } from 'vitest';
import { PitchGate } from '../src/audio/gate';
import { detectPitch } from '../src/audio/pitch';
import { PitchSmoother } from '../src/audio/smoothing';

describe('PitchGate', () => {
  it('laat een duidelijke aanslag door en weigert een zwakke nieuwe toon', () => {
    const g = new PitchGate();
    expect(g.accept(110, 0.6, 0.002, 0)).toBe(false);
    expect(g.accept(110, 0.95, 0.05, 10)).toBe(true);
  });

  it('accepteert een zwakker uitklinkend signaal op dezelfde noot', () => {
    const g = new PitchGate();
    expect(g.accept(110, 0.95, 0.05, 0)).toBe(true);
    expect(g.accept(110.5, 0.6, 0.002, 16)).toBe(true);
    expect(g.accept(110.3, 0.55, 0.0015, 32)).toBe(true);
  });

  it('weigert een zwak signaal op een andere noot of na een te lange pauze', () => {
    const g = new PitchGate();
    expect(g.accept(110, 0.95, 0.05, 0)).toBe(true);
    expect(g.accept(146.8, 0.6, 0.002, 16)).toBe(false); // D3 i.p.v. A2
    expect(g.accept(110, 0.6, 0.002, 1000)).toBe(false); // te lang stil geweest
  });

  it('weigert ruis en stilte, ook tijdens uitklinken', () => {
    const g = new PitchGate();
    expect(g.accept(110, 0.95, 0.05, 0)).toBe(true);
    expect(g.accept(110, 0.1, 0.002, 16)).toBe(false);
    expect(g.accept(110, 0.9, 0.0005, 32)).toBe(false);
    expect(g.accept(null, 0, 0.05, 48)).toBe(false);
  });

  it('reset vergeet de vorige toon', () => {
    const g = new PitchGate();
    g.accept(110, 0.95, 0.05, 0);
    g.reset();
    expect(g.accept(110, 0.6, 0.002, 16)).toBe(false);
  });
});

describe('PitchSmoother.holding', () => {
  it('meldt wanneer een waarde wordt vastgehouden', () => {
    const s = new PitchSmoother({ holdMs: 500 });
    s.push(110, 0);
    expect(s.holding).toBe(false);
    expect(s.push(null, 100)).not.toBeNull();
    expect(s.holding).toBe(true);
    s.push(110, 200);
    expect(s.holding).toBe(false);
    expect(s.push(null, 800)).toBeNull();
    expect(s.holding).toBe(false);
  });
});

// Simulatie: een geplukte A2 die uitklinkt, frame voor frame zoals de listener het doet.
describe('uitklinkende snaar (simulatie)', () => {
  const SR = 48000;
  const N = 4096;
  const F0 = 110;
  const FRAME_MS = 1000 / 60;

  function rng(seed: number): () => number {
    let x = seed >>> 0;
    return () => {
      x = (x * 1664525 + 1013904223) >>> 0;
      return x / 0x100000000 - 0.5;
    };
  }

  // Pluk: amplitude 0.3, uitdoving tau 0.9 s, hogere harmonischen doven sneller uit,
  // plus vaste ruisvloer (ongeveer -60 dBFS, zoals een telefoonmicrofoon in een stille kamer).
  function block(startSample: number, rand: () => number): Float32Array {
    const buf = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = (startSample + i) / SR;
      let v = 0;
      for (let h = 1; h <= 6; h++) {
        const amp = (0.3 / h) * Math.exp(-t * (1 / 0.9) * (1 + 0.4 * (h - 1)));
        v += amp * Math.sin(2 * Math.PI * F0 * h * t + h);
      }
      buf[i] = v + 0.002 * rand();
    }
    return buf;
  }

  function lastShownMs(useGate: boolean): number {
    const rand = rng(7);
    const gate = new PitchGate();
    const smoother = new PitchSmoother({ holdMs: useGate ? 2000 : 400 });
    let lastShown = 0;
    let maxErr = 0;
    for (let frame = 0; frame * FRAME_MS < 8000; frame++) {
      const ms = frame * FRAME_MS;
      const buf = block(Math.round((ms / 1000) * SR), rand);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / N);
      let freq: number | null = null;
      if (useGate) {
        if (rms >= gate.loosestRms) {
          const r = detectPitch(buf, SR, { threshold: 1 - gate.loosestClarity });
          if (r && gate.accept(r.freq, r.clarity, rms, ms)) freq = r.freq;
        }
      } else if (rms >= 0.005) {
        // Oude gedrag: vaste drempels clarity 0.8 en rms 0.005.
        const r = detectPitch(buf, SR, { threshold: 0.2 });
        if (r && r.clarity >= 0.8) freq = r.freq;
      }
      const shown = smoother.push(freq, ms);
      if (shown !== null) {
        lastShown = ms;
        maxErr = Math.max(maxErr, Math.abs(1200 * Math.log2(shown / F0)));
      }
    }
    expect(maxErr).toBeLessThan(3);
    return lastShown;
  }

  it('houdt de snaar duidelijk langer vast dan met de oude vaste drempels', { timeout: 30000 }, () => {
    const before = lastShownMs(false);
    const after = lastShownMs(true);
    console.log(`naald zichtbaar tot: oud ${Math.round(before)} ms, nieuw ${Math.round(after)} ms`);
    expect(after).toBeGreaterThan(before + 1500);
  });
});
