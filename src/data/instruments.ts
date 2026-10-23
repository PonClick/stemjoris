// Instrument- en stemmingsdatabase. Alleen data.
// Tonen in wetenschappelijke notatie, alleen kruizen, A4 = 440 Hz, snaren van laag naar hoog
// in fysieke volgorde (bij re-entrant stemmingen volgt dat niet de toonhoogte).

import type { Instrument, InstrumentCategory, Tuning } from '../types';

function t(id: string, name: string, strings: string[], description?: string): Tuning {
  return description === undefined ? { id, name, strings } : { id, name, strings, description };
}

function inst(id: string, name: string, category: InstrumentCategory, tunings: Tuning[]): Instrument {
  return { id, name, category, tunings };
}

export const INSTRUMENTS: Instrument[] = [
  // ---------- Gitaren ----------
  inst('gitaar-6', 'Gitaar (6 snaren)', 'gitaar', [
    t('standaard', 'Standaard (EADGBE)', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
    t('drop-d', 'Drop D (DADGBE)', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'Lage E een toon omlaag; veel gebruikt in rock en metal'),
    t('double-drop-d', 'Double Drop D (DADGBD)', ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], 'Lage en hoge E een toon omlaag'),
    t('half-step-down', 'Halve toon omlaag (D#G#C#F#A#D#)', ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'], 'Standaardstemming een halve toon lager (Eb-stemming)'),
    t('whole-step-down', 'Hele toon omlaag (DGCFAD)', ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], 'D standaard'),
    t('c-standaard', 'C standaard (CFA#D#GC)', ['C2', 'F2', 'A#2', 'D#3', 'G3', 'C4'], 'Standaardstemming 2 hele tonen lager'),
    t('b-standaard', 'B standaard (BEADF#B)', ['B1', 'E2', 'A2', 'D3', 'F#3', 'B3'], 'Standaardstemming 5 halve tonen lager'),
    t('drop-c', 'Drop C (CGCFAD)', ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'], 'D standaard met lage snaar nog een toon omlaag'),
    t('drop-c-sharp', 'Drop C# (C#G#C#F#A#D#)', ['C#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'], 'Drop D een halve toon lager'),
    t('drop-b', 'Drop B (BF#BEG#C#)', ['B1', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
    t('dadgad', 'DADGAD', ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], 'Veel gebruikt in Keltische folk en fingerstyle'),
    t('open-d', 'Open D (DADF#AD)', ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], 'Open D-majeurakkoord'),
    t('open-dm', 'Open Dm (DADFAD)', ['D2', 'A2', 'D3', 'F3', 'A3', 'D4'], 'Open D-mineurakkoord'),
    t('open-e', 'Open E (EBEG#BE)', ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], 'Open E-majeurakkoord'),
    t('open-em', 'Open Em (EBEGBE)', ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], 'Open E-mineurakkoord'),
    t('open-g', 'Open G (DGDGBD)', ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], 'Open G-majeurakkoord; slide en blues'),
    t('open-a', 'Open A (EAEAC#E)', ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4'], 'Open A-majeurakkoord'),
    t('open-c', 'Open C (CGCGCE)', ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], 'Open C-majeurakkoord'),
    t('nashville', 'Nashville (hoog gestemd)', ['E3', 'A3', 'D4', 'G4', 'B3', 'E4'], 'De vier lage snaren een octaaf hoger, zoals de hoge snaren van een 12-snarige gitaar'),
    t('new-standard', 'New Standard Tuning (CGDAEG)', ['C2', 'G2', 'D3', 'A3', 'E4', 'G4'], 'Robert Fripp: kwinten, met een kleine terts bovenaan'),
    t('all-fourths', 'Alles kwarten (EADGCF)', ['E2', 'A2', 'D3', 'G3', 'C4', 'F4'], 'Regelmatige kwartenstemming'),
    t('lute', 'Luitstemming (EADF#BE)', ['E2', 'A2', 'D3', 'F#3', 'B3', 'E4'], 'Renaissanceluit: grote terts tussen de 3e en 4e snaar'),
  ]),
  inst('gitaar-7', 'Gitaar (7 snaren)', 'gitaar', [
    t('standaard', 'Standaard (BEADGBE)', ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
    t('drop-a', 'Drop A (AEADGBE)', ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'Laagste snaar een toon omlaag'),
    t('a-standaard', 'A standaard (ADGCFAD)', ['A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4'], 'Standaardstemming een hele toon omlaag'),
  ]),
  inst('gitaar-8', 'Gitaar (8 snaren)', 'gitaar', [
    t('standaard', 'Standaard (F#BEADGBE)', ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
    t('drop-e', 'Drop E (EBEADGBE)', ['E1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'Laagste snaar een halve toon omlaag'),
  ]),
  inst('gitaar-12', 'Gitaar (12 snaren)', 'gitaar', [
    t('standaard', 'Standaard (EADGBE)', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'Koren E–A–D–G in octaven (dunne snaar een octaaf hoger), B–E unisono; hier de laagste snaar per koor'),
    t('whole-step-down', 'Hele toon omlaag (DGCFAD)', ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], 'Veel gebruikt op 12-snarige gitaren om de spanning te verlagen; koren D–G–C–F in octaven, A–D unisono'),
    t('drop-d', 'Drop D (DADGBE)', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'Koren D–A–D–G in octaven, B–E unisono'),
  ]),
  inst('gitaar-bariton', 'Baritongitaar', 'gitaar', [
    t('standaard', 'B standaard (BEADF#B)', ['B1', 'E2', 'A2', 'D3', 'F#3', 'B3'], 'Een kwart onder standaard'),
    t('a-standaard', 'A standaard (ADGCEA)', ['A1', 'D2', 'G2', 'C3', 'E3', 'A3'], 'Een kwint onder standaard'),
  ]),
  inst('gitaar-russisch', 'Russische gitaar (7 snaren)', 'gitaar', [
    t('standaard', 'Open G (DGBDGBD)', ['D2', 'G2', 'B2', 'D3', 'G3', 'B3', 'D4'], 'Russische stemming: G-majeurakkoord'),
  ]),

  // ---------- Basgitaren ----------
  inst('bas-4', 'Basgitaar (4 snaren)', 'bas', [
    t('standaard', 'Standaard (EADG)', ['E1', 'A1', 'D2', 'G2']),
    t('drop-d', 'Drop D (DADG)', ['D1', 'A1', 'D2', 'G2']),
    t('half-step-down', 'Halve toon omlaag (D#G#C#F#)', ['D#1', 'G#1', 'C#2', 'F#2']),
    t('d-standaard', 'D standaard (DGCF)', ['D1', 'G1', 'C2', 'F2'], 'Hele toon omlaag'),
    t('drop-c', 'Drop C (CGCF)', ['C1', 'G1', 'C2', 'F2']),
    t('bead', 'BEAD', ['B0', 'E1', 'A1', 'D2'], 'Kwarten, een kwart onder standaard; vergelijkbaar met een 5-snarige zonder hoge G'),
  ]),
  inst('bas-5', 'Basgitaar (5 snaren)', 'bas', [
    t('standaard', 'Standaard (BEADG)', ['B0', 'E1', 'A1', 'D2', 'G2']),
    t('hoge-c', 'Hoge C (EADGC)', ['E1', 'A1', 'D2', 'G2', 'C3'], 'Standaard 4-snarig met extra hoge C'),
    t('drop-a', 'Drop A (AEADG)', ['A0', 'E1', 'A1', 'D2', 'G2']),
  ]),
  inst('bas-6', 'Basgitaar (6 snaren)', 'bas', [
    t('standaard', 'Standaard (BEADGC)', ['B0', 'E1', 'A1', 'D2', 'G2', 'C3']),
  ]),
  inst('bas-piccolo', 'Piccolobas', 'bas', [
    t('standaard', 'Standaard (EADG, octaaf hoger)', ['E2', 'A2', 'D3', 'G3'], 'Een octaaf boven een gewone basgitaar'),
  ]),

  // ---------- Ukeleles ----------
  inst('ukelele', 'Ukelele (sopraan/concert/tenor)', 'ukelele', [
    t('standaard', 'Standaard (GCEA)', ['G4', 'C4', 'E4', 'A4'], 'Re-entrant: de 4e snaar is een hoge G'),
    t('lage-g', 'Lage G (GCEA)', ['G3', 'C4', 'E4', 'A4'], 'Lineaire stemming met lage G; vooral bij tenor'),
    t('d-stemming', 'D-stemming (ADF#B)', ['A4', 'D4', 'F#4', 'B4'], 'Standaard een hele toon hoger, re-entrant; Canadese stemming'),
  ]),
  inst('ukelele-bariton', 'Ukelele (bariton)', 'ukelele', [
    t('standaard', 'Standaard (DGBE)', ['D3', 'G3', 'B3', 'E4'], 'Gelijk aan de hoogste vier snaren van een gitaar'),
  ]),
  inst('ukelele-bas', 'Basukelele', 'ukelele', [
    t('standaard', 'Standaard (EADG)', ['E1', 'A1', 'D2', 'G2']),
  ]),

  // ---------- Strijkinstrumenten ----------
  inst('viool', 'Viool', 'strijk', [
    t('standaard', 'Standaard (GDAE)', ['G3', 'D4', 'A4', 'E5']),
    t('aeae', 'Cross-tuning AEAE', ['A3', 'E4', 'A4', 'E5'], 'Folk (o.a. Amerikaanse old-time)'),
    t('gdgd', 'Cross-tuning GDGD', ['G3', 'D4', 'G4', 'D5'], 'Folk: de A- en E-snaar omlaag'),
    t('adae', 'ADAE', ['A3', 'D4', 'A4', 'E5'], 'Folk-scordatura: G-snaar een hele toon omhoog'),
    t('aeac', 'AEAC# (Calico)', ['A3', 'E4', 'A4', 'C#5'], 'Folk (old-time): open A-akkoord'),
  ]),
  inst('altviool', 'Altviool', 'strijk', [
    t('standaard', 'Standaard (CGDA)', ['C3', 'G3', 'D4', 'A4']),
  ]),
  inst('cello', 'Cello', 'strijk', [
    t('standaard', 'Standaard (CGDA)', ['C2', 'G2', 'D3', 'A3']),
    t('bach-suite-5', 'Scordatura Bach suite 5 (CGDG)', ['C2', 'G2', 'D3', 'G3'], 'A-snaar een hele toon omlaag, voor de vijfde cellosuite van Bach'),
  ]),
  inst('contrabas', 'Contrabas', 'strijk', [
    t('standaard', 'Orkeststemming (EADG)', ['E1', 'A1', 'D2', 'G2']),
    t('solo', 'Solostemming (F#BEA)', ['F#1', 'B1', 'E2', 'A2'], 'Een hele toon hoger dan orkeststemming'),
  ]),
  inst('contrabas-5', 'Contrabas (5 snaren)', 'strijk', [
    t('standaard', 'Lage B (BEADG)', ['B0', 'E1', 'A1', 'D2', 'G2']),
    t('lage-c', 'Lage C (CEADG)', ['C1', 'E1', 'A1', 'D2', 'G2'], 'Vijfde snaar als C; een alternatief voor de lage B'),
  ]),
  inst('viola-da-gamba', 'Viola da gamba (bas)', 'strijk', [
    t('standaard', 'Standaard (DGCEAD)', ['D2', 'G2', 'C3', 'E3', 'A3', 'D4'], 'Kwarten met een grote terts tussen de 3e en 4e snaar'),
  ]),

  // ---------- Banjo ----------
  inst('banjo-5', 'Banjo (5 snaren)', 'banjo', [
    t('standaard', 'Open G (gDGBD)', ['G4', 'D3', 'G3', 'B3', 'D4'], 'Korte 5e snaar eerst; standaard voor bluegrass'),
    t('double-c', 'Double C (gCGCD)', ['G4', 'C3', 'G3', 'C4', 'D4'], 'Korte 5e snaar eerst'),
    t('open-d', 'Open D (aDF#AD)', ['A4', 'D3', 'F#3', 'A3', 'D4'], 'Korte 5e snaar eerst'),
    t('sawmill', 'G modal / Sawmill (gDGCD)', ['G4', 'D3', 'G3', 'C4', 'D4'], 'Korte 5e snaar eerst; old-time'),
    t('standard-c', 'Standaard C (gCGBD)', ['G4', 'C3', 'G3', 'B3', 'D4'], 'Korte 5e snaar eerst; ook wel C-stemming'),
  ]),
  inst('banjo-tenor', 'Tenorbanjo (4 snaren)', 'banjo', [
    t('standaard', 'Standaard (CGDA)', ['C3', 'G3', 'D4', 'A4'], 'Zoals altviool; Dixieland en jazz'),
    t('iers', 'Iers (GDAE)', ['G2', 'D3', 'A3', 'E4'], 'Zoals viool maar een octaaf lager; Ierse muziek'),
    t('chicago', 'Chicago (DGBE)', ['D3', 'G3', 'B3', 'E4'], 'Zoals de hoogste vier gitaarsnaren'),
  ]),
  inst('banjo-plectrum', 'Plectrumbanjo (4 snaren)', 'banjo', [
    t('standaard', 'Standaard (CGBD)', ['C3', 'G3', 'B3', 'D4']),
  ]),
  inst('banjo-6', 'Banjo (6 snaren)', 'banjo', [
    t('standaard', 'Gitaarstemming (EADGBE)', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'Banjitaar: stemming als gitaar'),
  ]),

  // ---------- Mandoline-familie ----------
  inst('mandoline', 'Mandoline', 'mandoline', [
    t('standaard', 'Standaard (GDAE)', ['G3', 'D4', 'A4', 'E5'], 'Acht snaren in vier koren, elk koor unisono (zoals een viool)'),
  ]),
  inst('mandola', 'Mandola', 'mandoline', [
    t('standaard', 'Standaard (CGDA)', ['C3', 'G3', 'D4', 'A4'], 'Vier koren, unisono; stemming als altviool'),
  ]),
  inst('mandoline-octaaf', 'Octaafmandoline', 'mandoline', [
    t('standaard', 'Standaard (GDAE, octaaf lager)', ['G2', 'D3', 'A3', 'E4'], 'Een octaaf onder mandoline; koren unisono of in octaven (G en D)'),
  ]),
  inst('mandocello', 'Mandocello', 'mandoline', [
    t('standaard', 'Standaard (CGDA)', ['C2', 'G2', 'D3', 'A3'], 'Vier koren, stemming als cello'),
  ]),

  // ---------- Volksinstrumenten ----------
  inst('bouzouki-iers', 'Bouzouki (Iers)', 'volks', [
    t('standaard', 'Standaard (GDAD)', ['G2', 'D3', 'A3', 'D4'], 'Koren G–D in octaven, A–D unisono; hier de laagste snaar per koor'),
    t('adad', 'ADAD', ['A2', 'D3', 'A3', 'D4'], 'Een hele toon hoger; koren A–D in octaven, A–D unisono'),
    t('gdae', 'GDAE', ['G2', 'D3', 'A3', 'E4'], 'Vioolstemming een octaaf lager; koren G–D in octaven'),
  ]),
  inst('bouzouki-grieks-4', 'Bouzouki (Grieks, 4 koren)', 'volks', [
    t('standaard', 'Tetrachordo (CFAD)', ['C3', 'F3', 'A3', 'D4'], 'Koren C–F in octaven, A–D unisono; hier de laagste snaar per koor'),
  ]),
  inst('bouzouki-grieks-3', 'Bouzouki (Grieks, 3 koren)', 'volks', [
    t('standaard', 'Trichordo (DAD)', ['D3', 'A3', 'D4'], 'Koren D–A in octaven, D unisono; hier de laagste snaar per koor'),
  ]),
  inst('balalaika', 'Balalaika (prima)', 'volks', [
    t('standaard', 'Standaard (EEA)', ['E4', 'E4', 'A4'], 'Twee E-snaren in unisono (staal of darm), dan A'),
  ]),
  inst('domra-3', 'Domra (3 snaren, prima)', 'volks', [
    t('standaard', 'Standaard (EAD)', ['E4', 'A4', 'D5'], 'Russische drie-snarige domra, in kwarten'),
  ]),
  inst('oud', 'Oud (Arabisch)', 'volks', [
    t('standaard', 'Arabisch (CFADGC)', ['C2', 'F2', 'A2', 'D3', 'G3', 'C4'], 'Zes koren, elk twee snaren unisono; de laagste is vaak één snaar. Stemming verschilt per regio en school.'),
  ]),
  inst('charango', 'Charango', 'volks', [
    t('standaard', 'Standaard (GCEAE)', ['G4', 'C5', 'E5', 'A4', 'E5'], 'Re-entrant, vijf koren van twee snaren; fysieke volgorde'),
  ]),
  inst('cavaquinho', 'Cavaquinho', 'volks', [
    t('standaard', 'Standaard (DGBD)', ['D4', 'G4', 'B4', 'D5'], 'Braziliaanse stemming'),
  ]),
  inst('cuatro-venezolano', 'Cuatro (Venezolaans)', 'volks', [
    t('standaard', 'Standaard (ADF#B)', ['A3', 'D4', 'F#4', 'B3'], 'Re-entrant: de 1e snaar (B) ligt lager dan de 2e (F#)'),
  ]),

  // ---------- Overig ----------
  inst('lapsteel', 'Lapsteel/dobro', 'overig', [
    t('standaard', 'Open G (GBDGBD)', ['G2', 'B2', 'D3', 'G3', 'B3', 'D4'], 'Dobro-stemming, hoge variant'),
    t('c6', 'C6 (CEGACE)', ['C3', 'E3', 'G3', 'A3', 'C4', 'E4'], 'Veel gebruikt in Hawaiiaanse en western swing-lapsteel'),
    t('open-e', 'Open E (EBEG#BE)', ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']),
  ]),
  inst('pipa', 'Pipa', 'overig', [
    t('standaard', 'Standaard (ADEA)', ['A2', 'D3', 'E3', 'A3'], 'Chinese luit'),
  ]),
  inst('erhu', 'Erhu', 'overig', [
    t('standaard', 'Standaard (DA)', ['D4', 'A4'], 'Twee snaren, een kwint uit elkaar'),
  ]),
  inst('shamisen', 'Shamisen', 'overig', [
    t('standaard', 'Honchoshi (CFC)', ['C3', 'F3', 'C4'], 'Relatieve stemming: de absolute toonhoogte past men aan de zanger aan, hier met de laagste snaar op C'),
    t('niagari', 'Niagari (CGC)', ['C3', 'G3', 'C4'], 'Middelste snaar een toon omhoog'),
    t('sansagari', 'Sansagari (CFA#)', ['C3', 'F3', 'A#3'], 'Hoogste snaar een toon omlaag'),
  ]),
];

export const DEFAULT_INSTRUMENT_ID = 'gitaar-6';

export const CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  gitaar: 'Gitaren',
  bas: 'Basgitaren',
  ukelele: 'Ukeleles',
  strijk: 'Strijkinstrumenten',
  banjo: 'Banjo’s',
  mandoline: 'Mandoline-familie',
  volks: 'Volksinstrumenten',
  overig: 'Overige instrumenten',
};

export function getInstrument(id: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.id === id);
}

export function getTuning(instrumentId: string, tuningId: string): Tuning | undefined {
  return getInstrument(instrumentId)?.tunings.find((tn) => tn.id === tuningId);
}
