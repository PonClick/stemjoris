import { describe, expect, it } from 'vitest';
import {
  CATEGORY_LABELS,
  DEFAULT_INSTRUMENT_ID,
  INSTRUMENTS,
  getInstrument,
  getTuning,
} from '../src/data/instruments';

const NOTE_RE = /^[A-G]#?-?\d$/;
const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function freq(note: string): number {
  const m = /^([A-G])(#?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Ongeldige toon: ${note}`);
  const midi = 12 * (Number(m[3]) + 1) + SEMITONES[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

describe('instrumentendatabase', () => {
  it('heeft unieke instrument-ids', () => {
    const ids = INSTRUMENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('heeft per instrument unieke stemming-ids, een standaardstemming eerst en gelijk aantal snaren', () => {
    for (const inst of INSTRUMENTS) {
      expect(inst.tunings.length, inst.id).toBeGreaterThanOrEqual(1);
      expect(inst.tunings[0].id, inst.id).toBe('standaard');
      const ids = inst.tunings.map((x) => x.id);
      expect(new Set(ids).size, inst.id).toBe(ids.length);
      const n = inst.tunings[0].strings.length;
      for (const tn of inst.tunings) {
        expect(tn.strings.length, `${inst.id}/${tn.id}`).toBe(n);
        expect(tn.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });

  it('gebruikt geldige tonen met alleen kruizen', () => {
    for (const inst of INSTRUMENTS) {
      for (const tn of inst.tunings) {
        for (const s of tn.strings) {
          expect(s, `${inst.id}/${tn.id}`).toMatch(NOTE_RE);
        }
      }
    }
  });

  it('houdt alle frequenties tussen 25 en 1400 Hz', () => {
    for (const inst of INSTRUMENTS) {
      for (const tn of inst.tunings) {
        for (const s of tn.strings) {
          const f = freq(s);
          expect(f, `${inst.id}/${tn.id}/${s}`).toBeGreaterThan(25);
          expect(f, `${inst.id}/${tn.id}/${s}`).toBeLessThan(1400);
        }
      }
    }
  });

  it('heeft labels voor alle categorieen en instrumenten voor alle labels', () => {
    const used = new Set(INSTRUMENTS.map((i) => i.category));
    for (const c of used) expect(CATEGORY_LABELS[c], c).toBeTruthy();
    for (const c of Object.keys(CATEGORY_LABELS)) expect(used.has(c as never), c).toBe(true);
  });

  it('klopt op spot-checks', () => {
    expect(INSTRUMENTS[0].id).toBe('gitaar-6');
    expect(getInstrument(DEFAULT_INSTRUMENT_ID)).toBeDefined();
    expect(getTuning('gitaar-6', 'standaard')?.strings).toEqual(['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
    expect(getTuning('viool', 'standaard')?.strings).toEqual(['G3', 'D4', 'A4', 'E5']);
    expect(getTuning('ukelele', 'standaard')?.strings).toEqual(['G4', 'C4', 'E4', 'A4']);
    expect(getTuning('bas-5', 'standaard')?.strings).toEqual(['B0', 'E1', 'A1', 'D2', 'G2']);
    expect(getTuning('gitaar-6', 'bestaat-niet')).toBeUndefined();
    expect(getTuning('bestaat-niet', 'standaard')).toBeUndefined();
    expect(getInstrument('bestaat-niet')).toBeUndefined();
  });
});
