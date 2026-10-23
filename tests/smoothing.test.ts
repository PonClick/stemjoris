import { describe, expect, it } from 'vitest';
import { PitchSmoother } from '../src/audio/smoothing';

const FRAME = 1000 / 60;

function cents(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

describe('PitchSmoother', () => {
  it('convergeert op een stabiel signaal en dempt jitter', () => {
    const s = new PitchSmoother();
    let t = 0;
    let out: number | null = null;
    const outs: number[] = [];
    for (let i = 0; i < 120; i++) {
      // ±3 cent jitter rond 110 Hz
      const jitter = (i % 2 === 0 ? 1 : -1) * 3;
      out = s.push(110 * Math.pow(2, jitter / 1200), (t += FRAME));
      if (i >= 60) outs.push(out!);
    }
    expect(Math.abs(cents(out!, 110))).toBeLessThan(1);
    for (const o of outs) expect(Math.abs(cents(o, 110))).toBeLessThan(1.5);
  });

  it('volgt een langzame verstemming (draaien aan de stemknop)', () => {
    const s = new PitchSmoother();
    let t = 0;
    let out: number | null = null;
    for (let i = 0; i <= 60; i++) out = s.push(110 * Math.pow(2, (-30 + i) / 1200), (t += FRAME));
    expect(Math.abs(cents(out!, 110 * Math.pow(2, 30 / 1200)))).toBeLessThan(5);
  });

  it('negeert een losse octaafspike', () => {
    const s = new PitchSmoother();
    let t = 0;
    for (let i = 0; i < 20; i++) s.push(82.41, (t += FRAME));
    const spike = s.push(164.82, (t += FRAME));
    expect(Math.abs(cents(spike!, 82.41))).toBeLessThan(1);
    const spike2 = s.push(41.2, (t += FRAME));
    expect(Math.abs(cents(spike2!, 82.41))).toBeLessThan(1);
    for (let i = 0; i < 5; i++) {
      const out = s.push(82.41, (t += FRAME));
      expect(Math.abs(cents(out!, 82.41))).toBeLessThan(1);
    }
  });

  it('neemt een aanhoudende nieuwe noot over', () => {
    const s = new PitchSmoother();
    let t = 0;
    for (let i = 0; i < 20; i++) s.push(82.41, (t += FRAME));
    let out: number | null = null;
    for (let i = 0; i < 8; i++) out = s.push(110, (t += FRAME));
    expect(Math.abs(cents(out!, 110))).toBeLessThan(1);
  });

  it('springt naar een nieuwe noot pas na een paar consistente metingen', () => {
    const s = new PitchSmoother();
    let t = 0;
    for (let i = 0; i < 20; i++) s.push(82.41, (t += FRAME));
    const first = s.push(110, (t += FRAME));
    expect(Math.abs(cents(first!, 82.41))).toBeLessThan(1);
  });

  it('houdt de laatste waarde vast na stilte en geeft daarna null', () => {
    const s = new PitchSmoother({ holdMs: 400 });
    let t = 0;
    for (let i = 0; i < 30; i++) s.push(196, (t += FRAME));
    const last = t;
    const held = s.push(null, last + 100);
    expect(held).not.toBeNull();
    expect(Math.abs(cents(held!, 196))).toBeLessThan(1);
    expect(s.push(null, last + 390)).not.toBeNull();
    expect(s.push(null, last + 420)).toBeNull();
    expect(s.push(null, last + 500)).toBeNull();
  });

  it('begint na een reset of na stilte opnieuw zonder sprongweigering', () => {
    const s = new PitchSmoother();
    let t = 0;
    for (let i = 0; i < 10; i++) s.push(82.41, (t += FRAME));
    s.reset();
    expect(s.push(null, (t += FRAME))).toBeNull();
    expect(s.push(330, (t += FRAME))).toBeCloseTo(330, 6);

    for (let i = 0; i < 10; i++) s.push(330, (t += FRAME));
    s.push(null, (t += 1000));
    expect(s.push(110, (t += FRAME))).toBeCloseTo(110, 6);
  });

  it('respecteert windowSize en maxJumpCents', () => {
    const s = new PitchSmoother({ windowSize: 1, maxJumpCents: 2000 });
    let t = 0;
    s.push(100, (t += FRAME));
    // Zonder sprongweigering beweegt de waarde direct richting 200 Hz.
    const out = s.push(200, (t += FRAME));
    expect(out!).toBeGreaterThan(110);
  });
});
