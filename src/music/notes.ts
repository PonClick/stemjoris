// Muziektheorie: noot <-> frequentie, cent en de dichtstbijzijnde snaar.
// Puur, zonder DOM. Gelijkzwevende stemming, A4 = MIDI 69, C4 = MIDI 60.

import type { NoteInfo, ScientificNote } from '../types';

export const DEFAULT_A4 = 440;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** Halve tonen boven C voor de stamtonen. */
const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Letter (hoofd- of kleine letter), optioneel kruis of mol, octaaf (mag negatief). */
const NOTE_RE = /^([A-Ga-g])(#|b|♯|♭)?(-?\d+)$/;

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/**
 * Ontleedt een toon in wetenschappelijke notatie. Accepteert kruizen en mollen ('F#3', 'Bb1'),
 * normaliseert de naam naar een kruis en houdt rekening met de octaafgrens
 * (B#3 = C4, Cb4 = B3, E#4 = F4, Fb4 = E4). Gooit een Error bij ongeldige invoer.
 */
export function parseNote(note: ScientificNote): { name: string; octave: number; midi: number } {
  const m = typeof note === 'string' ? NOTE_RE.exec(note.trim()) : null;
  if (!m) throw new Error(`Ongeldige noot: '${String(note)}'`);
  const letter = m[1]!.toUpperCase();
  const acc = m[2];
  const writtenOctave = Number.parseInt(m[3]!, 10);
  const shift = acc === '#' || acc === '♯' ? 1 : acc === 'b' || acc === '♭' ? -1 : 0;
  const midi = 12 * (writtenOctave + 1) + LETTER_SEMITONES[letter]! + shift;
  return { name: NOTE_NAMES[mod12(midi)], octave: Math.floor(midi / 12) - 1, midi };
}

export function midiToFreq(midi: number, a4: number = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Fractioneel MIDI-nummer van een frequentie. */
export function freqToMidi(freq: number, a4: number = DEFAULT_A4): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export function noteToFreq(note: ScientificNote, a4: number = DEFAULT_A4): number {
  return midiToFreq(parseNote(note).midi, a4);
}

/** Geheel MIDI-nummer naar wetenschappelijke notatie met kruis, bijvoorbeeld 54 -> 'F#3'. */
export function midiToNote(midi: number): ScientificNote {
  const m = Math.round(midi);
  return `${NOTE_NAMES[mod12(m)]}${Math.floor(m / 12) - 1}`;
}

/** Afwijking in cent van freq ten opzichte van targetFreq. Positief = te hoog. */
export function centsBetween(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}

/**
 * De dichtstbijzijnde gelijkzwevende noot. cents ligt in [-50, +50); precies halverwege
 * valt op de hogere noot (met -50 cent).
 */
export function freqToNote(freq: number, a4: number = DEFAULT_A4): NoteInfo {
  if (!(freq > 0) || !Number.isFinite(freq)) throw new RangeError(`Ongeldige frequentie: ${freq}`);
  const exact = freqToMidi(freq, a4);
  const midi = Math.round(exact);
  const targetFreq = midiToFreq(midi, a4);
  return {
    note: midiToNote(midi),
    name: NOTE_NAMES[mod12(midi)],
    octave: Math.floor(midi / 12) - 1,
    midi,
    cents: centsBetween(freq, targetFreq),
    targetFreq,
  };
}

/** De snaar waarvan de grondtoon het dichtst (kleinste |cents|) bij freq ligt. */
export function closestString(
  freq: number,
  strings: ScientificNote[],
  a4: number = DEFAULT_A4,
): { index: number; note: ScientificNote; targetFreq: number; cents: number } {
  if (strings.length === 0) throw new Error('Geen snaren opgegeven');
  let best = { index: -1, note: '', targetFreq: 0, cents: Number.POSITIVE_INFINITY };
  strings.forEach((note, index) => {
    const targetFreq = noteToFreq(note, a4);
    const cents = centsBetween(freq, targetFreq);
    if (Math.abs(cents) < Math.abs(best.cents)) best = { index, note, targetFreq, cents };
  });
  return best;
}
