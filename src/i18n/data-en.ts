// Engelse namen voor de instrumentdata. De bron (src/data/instruments.ts) blijft Nederlands;
// hier staan de vertalingen per instrument-id, per 'instrumentId/tuningId' en per categorie.
// Ontbreekt iets, dan valt de UI terug op het Nederlands (zie data.ts); tests/i18n.test.ts
// controleert dat alles een vertaling heeft.

import type { InstrumentCategory } from '../types';

export const CATEGORY_LABELS_EN: Record<InstrumentCategory, string> = {
  gitaar: 'Guitars',
  bas: 'Bass guitars',
  ukelele: 'Ukuleles',
  strijk: 'Bowed strings',
  banjo: 'Banjos',
  mandoline: 'Mandolin family',
  volks: 'Folk instruments',
  overig: 'Other instruments',
};

export const INSTRUMENT_NAMES_EN: Record<string, string> = {
  'gitaar-6': 'Guitar (6-string)',
  'gitaar-7': 'Guitar (7-string)',
  'gitaar-8': 'Guitar (8-string)',
  'gitaar-12': 'Guitar (12-string)',
  'gitaar-bariton': 'Baritone guitar',
  'gitaar-russisch': 'Russian guitar (7-string)',
  'bas-4': 'Bass guitar (4-string)',
  'bas-5': 'Bass guitar (5-string)',
  'bas-6': 'Bass guitar (6-string)',
  'bas-piccolo': 'Piccolo bass',
  ukelele: 'Ukulele (soprano/concert/tenor)',
  'ukelele-bariton': 'Ukulele (baritone)',
  'ukelele-bas': 'Bass ukulele',
  viool: 'Violin',
  altviool: 'Viola',
  cello: 'Cello',
  contrabas: 'Double bass',
  'contrabas-5': 'Double bass (5-string)',
  'viola-da-gamba': 'Viola da gamba (bass)',
  'banjo-5': 'Banjo (5-string)',
  'banjo-tenor': 'Tenor banjo (4-string)',
  'banjo-plectrum': 'Plectrum banjo (4-string)',
  'banjo-6': 'Banjo (6-string)',
  mandoline: 'Mandolin',
  mandola: 'Mandola',
  'mandoline-octaaf': 'Octave mandolin',
  mandocello: 'Mandocello',
  'bouzouki-iers': 'Bouzouki (Irish)',
  'bouzouki-grieks-4': 'Bouzouki (Greek, 4 courses)',
  'bouzouki-grieks-3': 'Bouzouki (Greek, 3 courses)',
  balalaika: 'Balalaika (prima)',
  'domra-3': 'Domra (3-string, prima)',
  oud: 'Oud (Arabic)',
  charango: 'Charango',
  cavaquinho: 'Cavaquinho',
  'cuatro-venezolano': 'Cuatro (Venezuelan)',
  lapsteel: 'Lap steel/dobro',
  pipa: 'Pipa',
  erhu: 'Erhu',
  shamisen: 'Shamisen',
};

export interface TuningText {
  name: string;
  description?: string;
}

const d = (name: string, description?: string): TuningText => (description === undefined ? { name } : { name, description });

export const TUNINGS_EN: Record<string, TuningText> = {
  // Guitar (6)
  'gitaar-6/standaard': d('Standard (EADGBE)'),
  'gitaar-6/drop-d': d('Drop D (DADGBE)', 'Low E down a whole step; popular in rock and metal'),
  'gitaar-6/double-drop-d': d('Double Drop D (DADGBD)', 'Low and high E down a whole step'),
  'gitaar-6/half-step-down': d('Half step down (D#G#C#F#A#D#)', 'Standard tuning a half step lower (E♭ tuning)'),
  'gitaar-6/whole-step-down': d('Whole step down (DGCFAD)', 'D standard'),
  'gitaar-6/c-standaard': d('C standard (CFA#D#GC)', 'Standard tuning two whole steps lower'),
  'gitaar-6/b-standaard': d('B standard (BEADF#B)', 'Standard tuning five half steps lower'),
  'gitaar-6/drop-c': d('Drop C (CGCFAD)', 'D standard with the low string down another whole step'),
  'gitaar-6/drop-c-sharp': d('Drop C# (C#G#C#F#A#D#)', 'Drop D a half step lower'),
  'gitaar-6/drop-b': d('Drop B (BF#BEG#C#)'),
  'gitaar-6/dadgad': d('DADGAD', 'Popular in Celtic folk and fingerstyle'),
  'gitaar-6/open-d': d('Open D (DADF#AD)', 'Open D major chord'),
  'gitaar-6/open-dm': d('Open Dm (DADFAD)', 'Open D minor chord'),
  'gitaar-6/open-e': d('Open E (EBEG#BE)', 'Open E major chord'),
  'gitaar-6/open-em': d('Open Em (EBEGBE)', 'Open E minor chord'),
  'gitaar-6/open-g': d('Open G (DGDGBD)', 'Open G major chord; slide and blues'),
  'gitaar-6/open-a': d('Open A (EAEAC#E)', 'Open A major chord'),
  'gitaar-6/open-c': d('Open C (CGCGCE)', 'Open C major chord'),
  'gitaar-6/nashville': d('Nashville (high-strung)', 'The four low strings an octave higher, like the high strings of a 12-string guitar'),
  'gitaar-6/new-standard': d('New Standard Tuning (CGDAEG)', 'Robert Fripp: fifths, with a minor third on top'),
  'gitaar-6/all-fourths': d('All fourths (EADGCF)', 'Regular tuning in fourths'),
  'gitaar-6/lute': d('Lute tuning (EADF#BE)', 'Renaissance lute: major third between the 3rd and 4th strings'),

  // Guitar (7)
  'gitaar-7/standaard': d('Standard (BEADGBE)'),
  'gitaar-7/drop-a': d('Drop A (AEADGBE)', 'Lowest string down a whole step'),
  'gitaar-7/a-standaard': d('A standard (ADGCFAD)', 'Standard tuning down a whole step'),

  // Guitar (8)
  'gitaar-8/standaard': d('Standard (F#BEADGBE)'),
  'gitaar-8/drop-e': d('Drop E (EBEADGBE)', 'Lowest string down a half step'),

  // Guitar (12)
  'gitaar-12/standaard': d(
    'Standard (EADGBE)',
    'Courses E–A–D–G in octaves (thin string an octave higher), B–E in unison; shown here is the lowest string of each course',
  ),
  'gitaar-12/whole-step-down': d(
    'Whole step down (DGCFAD)',
    'Common on 12-string guitars to reduce tension; courses D–G–C–F in octaves, A–D in unison',
  ),
  'gitaar-12/drop-d': d('Drop D (DADGBE)', 'Courses D–A–D–G in octaves, B–E in unison'),

  // Baritone guitar
  'gitaar-bariton/standaard': d('B standard (BEADF#B)', 'A fourth below standard'),
  'gitaar-bariton/a-standaard': d('A standard (ADGCEA)', 'A fifth below standard'),

  // Russian guitar
  'gitaar-russisch/standaard': d('Open G (DGBDGBD)', 'Russian tuning: G major chord'),

  // Bass guitars
  'bas-4/standaard': d('Standard (EADG)'),
  'bas-4/drop-d': d('Drop D (DADG)'),
  'bas-4/half-step-down': d('Half step down (D#G#C#F#)'),
  'bas-4/d-standaard': d('D standard (DGCF)', 'Whole step down'),
  'bas-4/drop-c': d('Drop C (CGCF)'),
  'bas-4/bead': d('BEAD', 'Fourths, a fourth below standard; like a 5-string without the high G'),
  'bas-5/standaard': d('Standard (BEADG)'),
  'bas-5/hoge-c': d('High C (EADGC)', 'Standard 4-string with an extra high C'),
  'bas-5/drop-a': d('Drop A (AEADG)'),
  'bas-6/standaard': d('Standard (BEADGC)'),
  'bas-piccolo/standaard': d('Standard (EADG, octave up)', 'An octave above a regular bass guitar'),

  // Ukuleles
  'ukelele/standaard': d('Standard (GCEA)', 'Re-entrant: the 4th string is a high G'),
  'ukelele/lage-g': d('Low G (GCEA)', 'Linear tuning with a low G; mostly on tenor'),
  'ukelele/d-stemming': d('D tuning (ADF#B)', 'Standard a whole step higher, re-entrant; Canadian tuning'),
  'ukelele-bariton/standaard': d('Standard (DGBE)', 'Same as the top four strings of a guitar'),
  'ukelele-bas/standaard': d('Standard (EADG)'),

  // Bowed strings
  'viool/standaard': d('Standard (GDAE)'),
  'viool/aeae': d('Cross-tuning AEAE', 'Folk (e.g. American old-time)'),
  'viool/gdgd': d('Cross-tuning GDGD', 'Folk: the A and E strings tuned down'),
  'viool/adae': d('ADAE', 'Folk scordatura: G string up a whole step'),
  'viool/aeac': d('AEAC# (Calico)', 'Folk (old-time): open A chord'),
  'altviool/standaard': d('Standard (CGDA)'),
  'cello/standaard': d('Standard (CGDA)'),
  'cello/bach-suite-5': d('Scordatura Bach Suite No. 5 (CGDG)', 'A string down a whole step, for Bach’s fifth cello suite'),
  'contrabas/standaard': d('Orchestral tuning (EADG)'),
  'contrabas/solo': d('Solo tuning (F#BEA)', 'A whole step above orchestral tuning'),
  'contrabas-5/standaard': d('Low B (BEADG)'),
  'contrabas-5/lage-c': d('Low C (CEADG)', 'Fifth string as C; an alternative to the low B'),
  'viola-da-gamba/standaard': d('Standard (DGCEAD)', 'Fourths with a major third between the 3rd and 4th strings'),

  // Banjos
  'banjo-5/standaard': d('Open G (gDGBD)', 'Short 5th string first; standard for bluegrass'),
  'banjo-5/double-c': d('Double C (gCGCD)', 'Short 5th string first'),
  'banjo-5/open-d': d('Open D (aDF#AD)', 'Short 5th string first'),
  'banjo-5/sawmill': d('G modal / Sawmill (gDGCD)', 'Short 5th string first; old-time'),
  'banjo-5/standard-c': d('Standard C (gCGBD)', 'Short 5th string first; also called C tuning'),
  'banjo-tenor/standaard': d('Standard (CGDA)', 'Like a viola; Dixieland and jazz'),
  'banjo-tenor/iers': d('Irish (GDAE)', 'Like a violin, an octave lower; Irish music'),
  'banjo-tenor/chicago': d('Chicago (DGBE)', 'Like the top four guitar strings'),
  'banjo-plectrum/standaard': d('Standard (CGBD)'),
  'banjo-6/standaard': d('Guitar tuning (EADGBE)', 'Banjitar: tuned like a guitar'),

  // Mandolin family
  'mandoline/standaard': d('Standard (GDAE)', 'Eight strings in four courses, each in unison (like a violin)'),
  'mandola/standaard': d('Standard (CGDA)', 'Four courses in unison; tuned like a viola'),
  'mandoline-octaaf/standaard': d('Standard (GDAE, octave down)', 'An octave below the mandolin; courses in unison or in octaves (G and D)'),
  'mandocello/standaard': d('Standard (CGDA)', 'Four courses, tuned like a cello'),

  // Folk instruments
  'bouzouki-iers/standaard': d('Standard (GDAD)', 'Courses G–D in octaves, A–D in unison; shown here is the lowest string of each course'),
  'bouzouki-iers/adad': d('ADAD', 'A whole step higher; courses A–D in octaves, A–D in unison'),
  'bouzouki-iers/gdae': d('GDAE', 'Violin tuning an octave lower; courses G–D in octaves'),
  'bouzouki-grieks-4/standaard': d('Tetrachordo (CFAD)', 'Courses C–F in octaves, A–D in unison; shown here is the lowest string of each course'),
  'bouzouki-grieks-3/standaard': d('Trichordo (DAD)', 'Courses D–A in octaves, D in unison; shown here is the lowest string of each course'),
  'balalaika/standaard': d('Standard (EEA)', 'Two E strings in unison (steel or gut), then A'),
  'domra-3/standaard': d('Standard (EAD)', 'Russian three-string domra, in fourths'),
  'oud/standaard': d(
    'Arabic (CFADGC)',
    'Six courses, each two strings in unison; the lowest is often a single string. Tuning varies by region and school.',
  ),
  'charango/standaard': d('Standard (GCEAE)', 'Re-entrant, five courses of two strings; physical order'),
  'cavaquinho/standaard': d('Standard (DGBD)', 'Brazilian tuning'),
  'cuatro-venezolano/standaard': d('Standard (ADF#B)', 'Re-entrant: the 1st string (B) is lower than the 2nd (F#)'),

  // Other
  'lapsteel/standaard': d('Open G (GBDGBD)', 'Dobro tuning, high variant'),
  'lapsteel/c6': d('C6 (CEGACE)', 'Common in Hawaiian and western swing lap steel'),
  'lapsteel/open-e': d('Open E (EBEG#BE)'),
  'pipa/standaard': d('Standard (ADEA)', 'Chinese lute'),
  'erhu/standaard': d('Standard (DA)', 'Two strings, a fifth apart'),
  'shamisen/standaard': d(
    'Honchoshi (CFC)',
    'Relative tuning: the absolute pitch is adjusted to the singer; here with the lowest string on C',
  ),
  'shamisen/niagari': d('Niagari (CGC)', 'Middle string up a whole step'),
  'shamisen/sansagari': d('Sansagari (CFA#)', 'Top string down a whole step'),
};
