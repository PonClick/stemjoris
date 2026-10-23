import { describe, expect, it } from 'vitest';
import {
  DEFAULT_A4,
  NOTE_NAMES,
  centsBetween,
  closestString,
  freqToMidi,
  freqToNote,
  midiToFreq,
  midiToNote,
  noteToFreq,
  parseNote,
} from '../src/music/notes';

const GUITAR = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

describe('noot naar frequentie', () => {
  it('A4 is 440 Hz standaard', () => {
    expect(DEFAULT_A4).toBe(440);
    expect(noteToFreq('A4')).toBeCloseTo(440, 10);
    expect(midiToFreq(69)).toBeCloseTo(440, 10);
  });

  it('A4 = 432 gaat mee', () => {
    expect(noteToFreq('A4', 432)).toBeCloseTo(432, 10);
    expect(noteToFreq('E2', 432)).toBeCloseTo(80.91, 2);
    expect(freqToNote(432, 432)).toMatchObject({ note: 'A4', midi: 69 });
    expect(freqToNote(432, 432).cents).toBeCloseTo(0, 10);
  });

  it('bekende frequenties', () => {
    expect(noteToFreq('E2')).toBeCloseTo(82.41, 2);
    expect(noteToFreq('B0')).toBeCloseTo(30.87, 2);
    expect(noteToFreq('E1')).toBeCloseTo(41.2, 2);
    expect(noteToFreq('E5')).toBeCloseTo(659.26, 2);
    expect(noteToFreq('C4')).toBeCloseTo(261.63, 2);
  });

  it('freqToMidi is de inverse van midiToFreq, fractioneel', () => {
    expect(freqToMidi(440)).toBeCloseTo(69, 10);
    expect(freqToMidi(midiToFreq(40.25))).toBeCloseTo(40.25, 10);
    expect(freqToMidi(880, 440)).toBeCloseTo(81, 10);
  });
});

describe('parseNote', () => {
  it('kruizen en mollen', () => {
    expect(parseNote('F#3')).toEqual({ name: 'F#', octave: 3, midi: 54 });
    expect(parseNote('Gb3')).toEqual({ name: 'F#', octave: 3, midi: 54 });
    expect(parseNote('Bb1')).toEqual({ name: 'A#', octave: 1, midi: 34 });
    expect(parseNote('Eb4')).toEqual({ name: 'D#', octave: 4, midi: 63 });
    expect(parseNote('C4').midi).toBe(60);
    expect(parseNote('A0').midi).toBe(21);
  });

  it('octaafgrens bij B#, Cb, E#, Fb', () => {
    expect(parseNote('B#3')).toEqual({ name: 'C', octave: 4, midi: 60 });
    expect(parseNote('Cb4')).toEqual({ name: 'B', octave: 3, midi: 59 });
    expect(parseNote('E#4')).toEqual({ name: 'F', octave: 4, midi: 65 });
    expect(parseNote('Fb4')).toEqual({ name: 'E', octave: 4, midi: 64 });
    expect(parseNote('Cb1').midi).toBe(parseNote('B0').midi);
  });

  it('octaaf 0 werkt', () => {
    expect(parseNote('B0')).toEqual({ name: 'B', octave: 0, midi: 23 });
    expect(parseNote('C0').midi).toBe(12);
  });

  it('gooit bij ongeldige invoer', () => {
    for (const bad of ['', 'H2', 'E', '#4', 'E##2', 'Ex2', '4E', 'E 2']) {
      expect(() => parseNote(bad), bad).toThrow(Error);
    }
  });
});

describe('midiToNote', () => {
  it('geeft kruizen in wetenschappelijke notatie', () => {
    expect(midiToNote(54)).toBe('F#3');
    expect(midiToNote(60)).toBe('C4');
    expect(midiToNote(59)).toBe('B3');
    expect(midiToNote(23)).toBe('B0');
    expect(midiToNote(69)).toBe('A4');
  });

  it('alle twaalf namen rond', () => {
    expect(NOTE_NAMES).toHaveLength(12);
    for (let m = 12; m < 120; m++) expect(parseNote(midiToNote(m)).midi).toBe(m);
  });
});

describe('freqToNote', () => {
  it('cents-teken: te hoog is positief, te laag negatief', () => {
    const high = freqToNote(440 * Math.pow(2, 10 / 1200));
    expect(high.note).toBe('A4');
    expect(high.cents).toBeCloseTo(10, 6);
    const low = freqToNote(440 * Math.pow(2, -20 / 1200));
    expect(low.note).toBe('A4');
    expect(low.cents).toBeCloseTo(-20, 6);
    expect(low.targetFreq).toBeCloseTo(440, 10);
  });

  it('afronding rond ±50 cent', () => {
    const below = freqToNote(440 * Math.pow(2, 49.9 / 1200));
    expect(below.note).toBe('A4');
    expect(below.cents).toBeCloseTo(49.9, 6);
    const above = freqToNote(440 * Math.pow(2, 50.1 / 1200));
    expect(above.note).toBe('A#4');
    expect(above.cents).toBeCloseTo(-49.9, 6);
    const lowSide = freqToNote(440 * Math.pow(2, -50.1 / 1200));
    expect(lowSide.note).toBe('G#4');
    expect(lowSide.cents).toBeCloseTo(49.9, 6);
    for (let c = -300; c <= 300; c += 7.3) {
      const info = freqToNote(440 * Math.pow(2, c / 1200));
      expect(info.cents).toBeGreaterThanOrEqual(-50);
      expect(info.cents).toBeLessThanOrEqual(50);
    }
  });

  it('vult alle velden', () => {
    expect(freqToNote(82.41)).toMatchObject({ note: 'E2', name: 'E', octave: 2, midi: 40 });
    expect(freqToNote(30.87)).toMatchObject({ note: 'B0', name: 'B', octave: 0, midi: 23 });
  });

  it('gooit bij een ongeldige frequentie', () => {
    expect(() => freqToNote(0)).toThrow();
    expect(() => freqToNote(Number.NaN)).toThrow();
  });
});

describe('centsBetween', () => {
  it('octaaf is 1200 cent, halve toon 100', () => {
    expect(centsBetween(880, 440)).toBeCloseTo(1200, 10);
    expect(centsBetween(220, 440)).toBeCloseTo(-1200, 10);
    expect(centsBetween(noteToFreq('A#4'), 440)).toBeCloseTo(100, 10);
  });
});

describe('closestString', () => {
  it('kiest de juiste gitaarsnaar', () => {
    expect(closestString(82.0, GUITAR)).toMatchObject({ index: 0, note: 'E2' });
    expect(closestString(111, GUITAR)).toMatchObject({ index: 1, note: 'A2' });
    expect(closestString(145, GUITAR)).toMatchObject({ index: 2, note: 'D3' });
    expect(closestString(198, GUITAR)).toMatchObject({ index: 3, note: 'G3' });
    expect(closestString(240, GUITAR)).toMatchObject({ index: 4, note: 'B3' });
    expect(closestString(335, GUITAR)).toMatchObject({ index: 5, note: 'E4' });
  });

  it('geeft cents en doelfrequentie terug', () => {
    const r = closestString(110 * Math.pow(2, -15 / 1200), GUITAR);
    expect(r.index).toBe(1);
    expect(r.targetFreq).toBeCloseTo(110, 6);
    expect(r.cents).toBeCloseTo(-15, 6);
  });

  it('een verstemde snaar gaat naar de dichtstbijzijnde', () => {
    // Drop D: de lage snaar op D2 (73.42 Hz) ligt dichter bij E2 dan bij A2.
    expect(closestString(73.42, GUITAR).index).toBe(0);
  });

  it('volgt A4', () => {
    expect(closestString(432, ['A4', 'E5'], 432)).toMatchObject({ index: 0, cents: 0 });
  });

  it('gooit bij een lege lijst', () => {
    expect(() => closestString(440, [])).toThrow();
  });
});
