// Nederlandse teksten: de bron. `en.ts` moet exact dezelfde sleutels hebben (zie `Messages`).
// Plaatshouders staan tussen accolades: {note}, {hz}, enzovoort. 'Guitar Tuner' blijft in beide
// talen Engels: het hoort bij de naam.

export const nl = {
  // Merk
  appName: 'StemJoris',
  fullName: 'StemJoris – Guitar Tuner',
  brandSlogan: 'Stem Joris!',
  brandSub: 'Guitar Tuner',
  fatal: 'StemJoris kon niet starten. Herlaad de pagina.',

  // Kop
  langSwitchShort: 'EN',
  langSwitchLabel: 'Switch to English',
  langSwitchTarget: 'en',
  settingsLabel: 'Instellingen, A4 is {a4} hertz',

  // Instrument, stemming, modus
  pickersLabel: 'Instrument en stemming',
  instrumentLabel: 'Instrument',
  tuningLabel: 'Stemming',
  jorisChip: 'Joris’ contrabas',
  jorisChipLabel: 'Snelkeuze: contrabas in orkeststemming, net als Joris',
  modeLegend: 'Modus',
  modeAuto: 'Automatisch',
  modeFixed: 'Vaste snaar',
  modeChromatic: 'Chromatisch',

  // Snaren
  stringsTitle: 'Snaren',
  playTone: 'Toon afspelen',
  hintTone: 'Tik op een snaar voor de referentietoon. De microfoon luistert dan even niet mee.',
  hintAuto: 'Speel een snaar: de dichtstbijzijnde licht op. Tik op een snaar om die vast te zetten.',
  hintFixed: 'Tik op de snaar die je wilt stemmen; de meter meet alleen daartegen.',
  hintChromatic: 'Chromatisch: elke noot wordt herkend. Tik op een snaar om die vast te zetten.',
  stringTone: 'Snaar {n}, {note}: toon afspelen{done}',
  stringFix: 'Snaar {n}, {note}: stem op deze snaar{done}',
  stringDone: ', gestemd',
  noteSharp: ' kruis',
  noteFlat: ' mol',

  // Startknop
  start: 'Start stemmen',
  stop: 'Stop',
  opening: 'Microfoon openen…',
  startAria: 'Start stemmen: microfoon aanzetten',
  stopAria: 'Stop met luisteren',

  // Aankondigingen voor schermlezers
  announceStarted: 'Luisteren gestart',
  announceStopped: 'Luisteren gestopt',
  announceTuned: '{note} gestemd',
  announceTarget: 'Doel {note}',
  announceMode: 'Modus {mode}',
  announceLow: '{note}, te laag',
  announceHigh: '{note}, te hoog',
  announceNear: '{note}, bijna',

  // Meterberichten
  msgIdle: 'Stem Joris!',
  msgIdleHint: 'Kandidaat voor de lage E · tik op Start stemmen',
  msgWaitString: 'Speel een snaar…',
  msgWaitTone: 'Speel een toon…',
  msgWaitHint: 'Joris neemt even een slokje',
  msgTone: 'Referentietoon',
  msgToneHint: '{note} · {hz} Hz · microfoon even doof',
  msgNoMic: 'Geen microfoon',
  msgNoMicHint: 'Joris hoort even niks',

  // Meter
  meterLabel: 'Stemmeter',
  unitCent: 'cent',
  targetHz: 'doel {hz}',
  tunedLabel: 'Gekozen! Gestemd',
  tunedHint: 'Joris wint deze snaar · binnen 3 cent',
  tunedHintApproved: 'Joris-goedgekeurd · binnen 3 cent',
  nearLabel: 'Bijna gestemd',
  nearHint: 'even laten doorklinken…',
  lowLabel: 'Te laag',
  lowHint: 'snaar spannen (hoger draaien)',
  highLabel: 'Te hoog',
  highHint: 'snaar vieren (lager draaien)',
  farLowLabel: 'Veel te laag',
  farLowHint: 'flink spannen, buiten de schaal ({cents} cent)',
  farHighLabel: 'Veel te hoog',
  farHighHint: 'flink vieren, buiten de schaal ({cents} cent)',
  labelFlat: '♭ Te laag',
  labelSharp: 'Te hoog ♯',
  flatSign: 'mol, te laag',
  sharpSign: 'kruis, te hoog',

  // Onderbalk
  barString: 'Snaar: {n} ({note})',
  barAuto: 'Snaar: auto',
  barNote: 'Noot: {note}',
  barChromatic: 'Chromatisch',
  prevString: 'Lagere snaar',
  nextString: 'Hogere snaar',
  tuningSwitch: 'Tuning',
  tuningSwitchAria: 'Stemmen, microfoon aan of uit',

  // Microfoonfouten
  errInsecure: 'De microfoon werkt alleen via een beveiligde verbinding (https). Open de app via https.',
  errUnsupported: 'Je browser ondersteunt geen microfoontoegang. Gebruik een recente versie van Chrome, Safari of Firefox.',
  errDenied: 'Geen toegang tot de microfoon. Sta microfoontoegang toe in je browser.',
  errNotFound: 'Geen microfoon gevonden. Sluit een microfoon aan of controleer je instellingen.',
  errBusy: 'De microfoon kan niet worden gestart. Mogelijk gebruikt een andere app hem al; sluit die en probeer het opnieuw.',
  errGeneric: 'De microfoon kon niet worden gestart. Probeer het opnieuw.',
  errNoWebAudio: 'Je browser ondersteunt geen Web Audio. Gebruik een recente browser.',
  errAudio: 'Er ging iets mis met de audio.',
  helpInsecure: 'De microfoon werkt alleen via een beveiligde verbinding (https) of op localhost.',
  helpPermission:
    'Sta microfoongebruik toe via het slotje of het instellingen-icoon in de adresbalk en tik opnieuw op Start stemmen. Op iPhone of iPad: Instellingen › Safari › Microfoon.',

  // Instellingen
  settingsTitle: 'Instellingen',
  settingsClose: 'Instellingen sluiten',
  a4Label: 'Referentietoon A4',
  a4Aria: 'A4 in hertz',
  a4Preset: 'A4 op {hz} hertz',
  a4Presets: 'Snelkeuze A4',
  a4ValueText: '{hz} hertz',
  a4Help:
    '440 Hz is de standaard. Sommige orkesten stemmen op 442 Hz; 432 Hz is een alternatieve stemming. Alle noten en referentietonen schuiven mee.',
  langTitle: 'Taal',
  aboutTitle: 'Over StemJoris',
  aboutMadeFor: 'Gemaakt voor Joris (contrabas, Tio Gringo) en alle muzikanten die stemapps irritant vinden.',
  aboutPrivacy:
    'Geen reclame, geen account, geen tracking. Alles gebeurt op je eigen apparaat: het microfoongeluid gaat nergens naartoe en de app werkt ook offline. Tip: zet hem op je beginscherm.',
  aboutEaster: 'Werkt op alles met snaren. Niet op jerrycans en potten en pannen.',
} as const;

export type MessageKey = keyof typeof nl;
/** Elke taal moet precies deze sleutels hebben. */
export type Messages = { readonly [K in MessageKey]: string };
