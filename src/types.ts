// Gedeelde contracten tussen data, muziektheorie, audio en UI.
// Wijzig dit bestand alleen in overleg: alle modules leunen erop.

/**
 * Een toon in wetenschappelijke notatie: noot + octaaf, bijvoorbeeld 'E2', 'F#3', 'Bb1'.
 * In de stemmingsdata gebruiken we alleen kruizen ('C#', niet 'Db'); parseNote accepteert beide.
 * A4 = 440 Hz (instelbaar), C4 = centrale C, MIDI 60.
 */
export type ScientificNote = string;

export type InstrumentCategory =
  | 'gitaar'
  | 'bas'
  | 'ukelele'
  | 'strijk'
  | 'banjo'
  | 'mandoline'
  | 'volks'
  | 'overig';

export interface Tuning {
  /** Uniek binnen het instrument, kebab-case, bijvoorbeeld 'standaard', 'drop-d'. */
  id: string;
  /** Weergavenaam in het Nederlands, bijvoorbeeld 'Standaard (EADGBE)'. */
  name: string;
  /**
   * Eén toon per snaar of koor, van de laagste snaar (dikste, boven bij gitaar) naar de hoogste.
   * Bij instrumenten met re-entrant stemming (ukelele GCEA, banjo met 5e snaar) volgt de
   * fysieke snaarvolgorde zoals je ze bovenaan de hals ziet, niet de toonhoogte.
   */
  strings: ScientificNote[];
  /** Optionele uitleg, bijvoorbeeld 'koren in octaven' of 'veel gebruikt in metal'. */
  description?: string;
}

export interface Instrument {
  /** Uniek, kebab-case, bijvoorbeeld 'gitaar-6', 'bas-5', 'viool'. */
  id: string;
  /** Weergavenaam in het Nederlands. */
  name: string;
  category: InstrumentCategory;
  /** De eerste stemming is de standaardstemming. Minstens één. */
  tunings: Tuning[];
}

/** Resultaat van de toonhoogtedetectie op één audioblok. */
export interface PitchResult {
  /** Grondfrequentie in Hz. */
  freq: number;
  /** Betrouwbaarheid 0..1 (1 = zuiver periodiek). */
  clarity: number;
}

/** Wat de microfoonluisteraar per frame doorgeeft aan de UI. */
export interface PitchReading extends PitchResult {
  /** RMS-niveau van het blok, 0..1. */
  rms: number;
  /** performance.now() van het blok. */
  time: number;
}

/** Een frequentie geduid als dichtstbijzijnde gelijkzwevende noot. */
export interface NoteInfo {
  /** Wetenschappelijke notatie met kruis, bijvoorbeeld 'F#3'. */
  note: ScientificNote;
  /** Alleen de nootnaam, bijvoorbeeld 'F#'. */
  name: string;
  octave: number;
  /** MIDI-nummer (A4 = 69). */
  midi: number;
  /** Afwijking van de doelnoot in cent, -50..+50. Positief = te hoog. */
  cents: number;
  /** Frequentie van de doelnoot bij de gebruikte A4. */
  targetFreq: number;
}
