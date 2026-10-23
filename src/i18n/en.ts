// English texts. Same keys as nl.ts (enforced by the `Messages` type).

import type { Messages } from './nl';

export const en: Messages = {
  // Brand
  appName: 'StemJoris',
  fullName: 'StemJoris – Guitar Tuner',
  brandSlogan: 'Stem Joris!',
  brandSub: 'Guitar Tuner',
  fatal: 'StemJoris could not start. Please reload the page.',

  // Header
  langSwitchShort: 'NL',
  langSwitchLabel: 'Schakel naar Nederlands',
  langSwitchTarget: 'nl',
  settingsLabel: 'Settings, A4 is {a4} hertz',

  // Instrument, tuning, mode
  pickersLabel: 'Instrument and tuning',
  instrumentLabel: 'Instrument',
  tuningLabel: 'Tuning',
  jorisChip: 'Joris’ double bass',
  jorisChipLabel: 'Quick pick: double bass in orchestral tuning, just like Joris',
  modeLegend: 'Mode',
  modeAuto: 'Auto',
  modeFixed: 'Fixed string',
  modeChromatic: 'Chromatic',

  // Strings
  stringsTitle: 'Strings',
  playTone: 'Play tone',
  hintTone: 'Tap a string to hear its reference tone. The microphone pauses while it plays.',
  hintAuto: 'Play a string: the closest one lights up. Tap a string to lock it as the target.',
  hintFixed: 'Tap the string you want to tune; the meter only measures against that one.',
  hintChromatic: 'Chromatic: every note is recognised. Tap a string to lock it as the target.',
  stringTone: 'String {n}, {note}: play tone{done}',
  stringFix: 'String {n}, {note}: tune this string{done}',
  stringDone: ', in tune',
  noteSharp: ' sharp',
  noteFlat: ' flat',

  // Start button
  start: 'Start tuning',
  stop: 'Stop',
  opening: 'Opening microphone…',
  startAria: 'Start tuning: turn on the microphone',
  stopAria: 'Stop listening',

  // Screen reader announcements
  announceStarted: 'Listening started',
  announceStopped: 'Listening stopped',
  announceTuned: '{note} in tune',
  announceTarget: 'Target {note}',
  announceMode: 'Mode {mode}',
  announceLow: '{note}, too low',
  announceHigh: '{note}, too high',
  announceNear: '{note}, almost',

  // Meter messages
  msgIdle: 'Stem Joris!',
  msgIdleHint: 'Running for the low E · tap Start tuning',
  msgWaitString: 'Play a string…',
  msgWaitTone: 'Play a note…',
  msgWaitHint: 'Joris is taking a quick sip',
  msgTone: 'Reference tone',
  msgToneHint: '{note} · {hz} Hz · microphone paused',
  msgNoMic: 'No microphone',
  msgNoMicHint: 'Joris can’t hear a thing',

  // Meter
  meterLabel: 'Tuning meter',
  unitCent: 'cents',
  targetHz: 'target {hz}',
  tunedLabel: 'Elected! In tune',
  tunedHint: 'Joris takes this string · within 3 cents',
  tunedHintApproved: 'Joris approved · within 3 cents',
  nearLabel: 'Almost in tune',
  nearHint: 'let it ring…',
  lowLabel: 'Too low',
  lowHint: 'tighten the string (tune up)',
  highLabel: 'Too high',
  highHint: 'loosen the string (tune down)',
  farLowLabel: 'Way too low',
  farLowHint: 'tighten a lot, off the scale ({cents} cents)',
  farHighLabel: 'Way too high',
  farHighHint: 'loosen a lot, off the scale ({cents} cents)',
  labelFlat: '♭ Flat',
  labelSharp: 'Sharp ♯',
  flatSign: 'flat, too low',
  sharpSign: 'sharp, too high',

  // Bottom bar
  barString: 'String: {n} ({note})',
  barAuto: 'String: auto',
  barNote: 'Note: {note}',
  barChromatic: 'Chromatic',
  prevString: 'Lower string',
  nextString: 'Higher string',
  tuningSwitch: 'Tuning',
  tuningSwitchAria: 'Tuning, microphone on or off',

  // Microphone errors
  errInsecure: 'The microphone only works over a secure connection (https). Open the app via https.',
  errUnsupported: 'Your browser does not support microphone access. Use a recent version of Chrome, Safari or Firefox.',
  errDenied: 'No access to the microphone. Allow microphone access in your browser.',
  errNotFound: 'No microphone found. Connect a microphone or check your settings.',
  errBusy: 'The microphone could not be started. Another app may be using it; close that app and try again.',
  errGeneric: 'The microphone could not be started. Please try again.',
  errNoWebAudio: 'Your browser does not support Web Audio. Use a recent browser.',
  errAudio: 'Something went wrong with the audio.',
  helpInsecure: 'The microphone only works over a secure connection (https) or on localhost.',
  helpPermission:
    'Allow microphone access via the padlock or settings icon in the address bar, then tap Start tuning again. On iPhone or iPad: Settings › Safari › Microphone.',

  // Settings
  settingsTitle: 'Settings',
  settingsClose: 'Close settings',
  a4Label: 'Reference pitch A4',
  a4Aria: 'A4 in hertz',
  a4Preset: 'A4 at {hz} hertz',
  a4Presets: 'A4 presets',
  a4ValueText: '{hz} hertz',
  a4Help:
    '440 Hz is the standard. Some orchestras tune to 442 Hz; 432 Hz is an alternative tuning. All notes and reference tones shift along.',
  langTitle: 'Language',
  aboutTitle: 'About StemJoris',
  aboutMadeFor: 'Made for Joris (double bass, Tio Gringo) and every musician who finds tuner apps annoying.',
  aboutPrivacy:
    'No ads, no account, no tracking. Everything happens on your own device: the microphone audio goes nowhere and the app also works offline. Tip: add it to your home screen.',
  aboutEaster: 'Works on anything with strings. Not on jerrycans or pots and pans.',
};
