// StemJoris-interface: bouwt de DOM één keer op en koppelt de microfoonluisteraar, de smoother,
// de meter, de snaarknoppen, de onderbalk en de referentietoon aan elkaar. Alle teksten komen uit
// src/i18n; bij een taalwissel worden ze ter plekke bijgewerkt, zonder herladen.

import { resumeAudio } from '../audio/context';
import { PitchListener } from '../audio/listener';
import { PitchSmoother } from '../audio/smoothing';
import { ReferenceTone } from '../audio/tone';
import { DEFAULT_INSTRUMENT_ID, INSTRUMENTS, getInstrument, getTuning } from '../data/instruments';
import { getLang, initLang, onLangChange, setLang, t, type MessageKey } from '../i18n';
import { categoryLabel, instrumentName, tuningDescription, tuningName } from '../i18n/data';
import { DEFAULT_A4, centsBetween, closestString, freqToNote, noteToFreq, parseNote } from '../music/notes';
import type { Instrument, InstrumentCategory, PitchReading, Tuning } from '../types';
import { PortraitLibrary } from './brand';
import { el, fromMarkup, LiveText, setData } from './dom';
import { formatHz, prettyNoteName, spokenNote } from './format';
import { ICON_GEAR, ICON_MIC, ICON_NEXT, ICON_PREV, ICON_STOP } from './icons';
import { Meter, type MeterStatus } from './meter';
import { SettingsDialog } from './settings-dialog';
import {
  clampA4,
  isTunerMode,
  loadSettings,
  migrateLegacyStorage,
  saveSettings,
  type StoredSettings,
  type TunerMode,
} from './settings-store';
import { StringsPanel } from './strings-panel';
import { ScreenWakeLock } from './wake-lock';

/** Binnen deze afwijking (cent) telt een snaar als gestemd… */
const TUNED_CENTS = 3;
/** …mits dat zo lang aanhoudt (ms). */
const TUNED_HOLD_MS = 400;
/** Eenmaal gestemd blijft de status staan tot de afwijking groter wordt dan dit (hysterese). */
const TUNED_RELEASE_CENTS = 5;
/** Na een referentietoon nog even niet luisteren (galm van de speaker). */
const TONE_GUARD_MS = 250;
/** Zo lang blijft de naald op de laatste goede meting staan terwijl de snaar uitklinkt. */
const HOLD_MS = 2000;
/** Duur van een referentietoon. */
const TONE_MS = 2500;
/** Chromatisch bereik. */
const CHROMATIC_RANGE: [number, number] = [27, 1500];

/** Sneltoets: Joris' eigen instrument. */
const JORIS_INSTRUMENT = 'contrabas';
const JORIS_TUNING = 'standaard';

const MODE_KEYS: Record<TunerMode, MessageKey> = {
  auto: 'modeAuto',
  fixed: 'modeFixed',
  chromatic: 'modeChromatic',
};

/** Foutmeldingen uit de audiolaag (Nederlands) terugvertalen naar een sleutel. */
const ERROR_KEYS: MessageKey[] = ['errInsecure', 'errUnsupported', 'errDenied', 'errNotFound', 'errBusy', 'errGeneric', 'errNoWebAudio'];

function errorText(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  const key = ERROR_KEYS.find((k) => t(k, undefined, 'nl') === message);
  if (key) return t(key);
  return message || t('errAudio');
}

interface Target {
  name: string;
  octave: number;
  cents: number;
  targetFreq: number;
  /** Index van de snaar in de stemming, -1 in chromatische modus. */
  stringIndex: number;
  /** Sleutel om te zien of het doel veranderde (voor de gestemd-timer). */
  key: string;
}

class TunerApp {
  private readonly listener = new PitchListener();
  private readonly smoother = new PitchSmoother({ holdMs: HOLD_MS });
  private readonly tone = new ReferenceTone();
  private readonly wakeLock = new ScreenWakeLock();
  private readonly portraits = new PortraitLibrary();

  private settings: StoredSettings;
  private instrument: Instrument;
  private tuning: Tuning;
  private fixedIndex = 0;
  /** Snaar die in automatische modus nu gemeten wordt (-1: geen). */
  private activeString = -1;
  /** Laatst herkende noot in chromatische modus, voor de onderbalk. */
  private chromaticNote = '';

  private listening = false;
  private starting = false;
  private resumeOnVisible = false;
  private lastReadingAt = 0;
  private watchdog = 0;

  private toneGuardUntil = 0;
  private toneIndex = -1;
  private tonePoll = 0;

  private inTuneSince: number | null = null;
  private tuned = false;
  private tunedKey = '';
  private readonly tunedStrings = new Set<number>();

  private announcedText = '';
  private announcedAt = 0;
  private noteCandidate = '';
  private noteCandidateSince = 0;
  private announcedNote = '';

  private lastError: unknown = null;
  /** Vaste teksten die bij een taalwissel opnieuw gezet worden. */
  private readonly texts: Array<[LiveText, MessageKey]> = [];

  // DOM
  private readonly meter: Meter;
  private readonly strings: StringsPanel;
  private readonly dialog: SettingsDialog;
  private readonly instrumentSelect: HTMLSelectElement;
  private readonly tuningSelect: HTMLSelectElement;
  private readonly tuningInfo: LiveText;
  private readonly jorisChip: HTMLButtonElement;
  private readonly modeInputs: Record<TunerMode, HTMLInputElement>;
  private readonly modeLabels: Record<TunerMode, LiveText>;
  private readonly toneSwitch: HTMLInputElement;
  private readonly hint: LiveText;
  private readonly startButton: HTMLButtonElement;
  private readonly startIcon: HTMLElement;
  private readonly startLabel: LiveText;
  private readonly barLabel: LiveText;
  private readonly prevButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly tuningSwitch: HTMLButtonElement;
  private readonly notice: HTMLElement;
  private readonly noticeTitle: LiveText;
  private readonly noticeBody: LiveText;
  private readonly live: HTMLElement;
  private readonly a4Badge: LiveText;
  private readonly settingsButton: HTMLButtonElement;
  private readonly langButton: HTMLButtonElement;
  private readonly pickers: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    const text = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string>, key: MessageKey): HTMLElementTagNameMap[K] => {
      const node = el(tag, attrs);
      this.texts.push([new LiveText(node, t(key)), key]);
      return node;
    };

    // --- Instellingen herstellen en valideren ---
    const stored = loadSettings();
    const instrument = (stored.instrumentId && getInstrument(stored.instrumentId)) || getInstrument(DEFAULT_INSTRUMENT_ID) || INSTRUMENTS[0];
    if (!instrument) throw new Error('Geen instrumenten gevonden');
    const tuning = (stored.tuningId && getTuning(instrument.id, stored.tuningId)) || instrument.tunings[0];
    if (!tuning) throw new Error(`Instrument ${instrument.id} heeft geen stemmingen`);
    this.instrument = instrument;
    this.tuning = tuning;
    this.settings = {
      instrumentId: instrument.id,
      tuningId: tuning.id,
      mode: isTunerMode(stored.mode) ? stored.mode : 'auto',
      a4: clampA4(stored.a4 ?? DEFAULT_A4),
      toneEnabled: stored.toneEnabled ?? false,
    };

    // --- Kop: logo, taalknop, instellingen ---
    this.a4Badge = new LiveText(el('span', { class: 'a4-badge' }));
    this.settingsButton = el('button', { type: 'button', class: 'icon-btn settings-btn', 'aria-haspopup': 'dialog' }, [
      fromMarkup('span', { class: 'icon' }, ICON_GEAR),
      this.a4Badge.node,
    ]);
    this.langButton = el('button', { type: 'button', class: 'icon-btn lang-btn' });
    this.langButton.addEventListener('click', () => setLang(getLang() === 'nl' ? 'en' : 'nl'));
    const header = el('header', { class: 'topbar' }, [
      el('h1', { class: 'brand' }, [
        text('span', { class: 'brand-name' }, 'appName'),
        text('span', { class: 'brand-sub' }, 'brandSub'),
      ]),
      el('div', { class: 'topbar-actions' }, [this.langButton, this.settingsButton]),
    ]);

    // --- Meterpaneel met onderbalk ---
    this.meter = new Meter(this.portraits);
    this.startIcon = fromMarkup('span', { class: 'icon' }, ICON_MIC);
    this.startLabel = new LiveText(el('span', { class: 'start-label' }), t('start'));
    this.startButton = el('button', { type: 'button', class: 'start-btn' }, [this.startIcon, this.startLabel.node]);
    this.startButton.addEventListener('click', () => this.toggleListening());
    this.meter.slot.append(this.startButton);

    this.barLabel = new LiveText(el('span', { class: 'bar-label', 'aria-live': 'off' }));
    this.prevButton = fromMarkup('button', { type: 'button', class: 'round-btn' }, ICON_PREV);
    this.nextButton = fromMarkup('button', { type: 'button', class: 'round-btn' }, ICON_NEXT);
    this.prevButton.addEventListener('click', () => this.stepString(-1));
    this.nextButton.addEventListener('click', () => this.stepString(1));
    this.tuningSwitch = el('button', { type: 'button', role: 'switch', class: 'tuning-switch', 'aria-checked': 'false' }, [
      text('span', { class: 'tuning-switch-label', 'aria-hidden': 'true' }, 'tuningSwitch'),
      el('span', { class: 'tuning-switch-track', 'aria-hidden': 'true' }, [el('span', { class: 'tuning-switch-thumb' })]),
    ]);
    this.tuningSwitch.addEventListener('click', () => this.toggleListening());
    const bar = el('div', { class: 'panel-bar' }, [
      this.barLabel.node,
      el('div', { class: 'bar-arrows' }, [this.prevButton, this.nextButton]),
      this.tuningSwitch,
    ]);
    const panel = el('div', { class: 'panel' }, [this.meter.element, bar]);

    this.noticeTitle = new LiveText(el('strong', { class: 'notice-title' }));
    this.noticeBody = new LiveText(el('span', { class: 'notice-body' }));
    this.notice = el('div', { class: 'notice', role: 'alert', hidden: true }, [this.noticeTitle.node, this.noticeBody.node]);

    // --- Instrument en stemming ---
    this.instrumentSelect = el('select', { id: 'instrument', class: 'select' });
    this.tuningSelect = el('select', { id: 'tuning', class: 'select', 'aria-describedby': 'tuning-info' });
    this.tuningInfo = new LiveText(el('p', { id: 'tuning-info', class: 'tuning-info' }));
    this.jorisChip = el('button', { type: 'button', class: 'chip joris-chip' }, [
      el('span', { class: 'joris-star', 'aria-hidden': 'true', text: '★' }),
      text('span', {}, 'jorisChip'),
    ]);
    this.jorisChip.addEventListener('click', () => this.pickJoris());
    this.pickers = el('section', { class: 'pickers' }, [
      el('div', { class: 'field' }, [text('label', { for: 'instrument', class: 'field-label' }, 'instrumentLabel'), this.instrumentSelect]),
      el('div', { class: 'field' }, [text('label', { for: 'tuning', class: 'field-label' }, 'tuningLabel'), this.tuningSelect]),
      this.tuningInfo.node,
      this.jorisChip,
    ]);

    // --- Modus (segmented control op basis van echte radioknoppen) ---
    const modeInputs = {} as Record<TunerMode, HTMLInputElement>;
    const modeLabels = {} as Record<TunerMode, LiveText>;
    const modeOptions = (Object.keys(MODE_KEYS) as TunerMode[]).map((mode) => {
      const input = el('input', { type: 'radio', name: 'mode', value: mode, id: `mode-${mode}`, class: 'segment-input' });
      input.addEventListener('change', () => {
        if (input.checked) this.setMode(mode);
      });
      modeInputs[mode] = input;
      modeLabels[mode] = new LiveText(el('span'), t(MODE_KEYS[mode]));
      return el('label', { class: 'segment', for: `mode-${mode}` }, [input, modeLabels[mode].node]);
    });
    this.modeInputs = modeInputs;
    this.modeLabels = modeLabels;
    const modes = el('fieldset', { class: 'segmented' }, [text('legend', { class: 'sr-only' }, 'modeLegend'), ...modeOptions]);

    // --- Snaren ---
    this.strings = new StringsPanel((i) => this.onStringTap(i));
    this.toneSwitch = el('input', { type: 'checkbox', role: 'switch', id: 'tone-switch', class: 'switch-input' });
    this.toneSwitch.addEventListener('change', () => this.setToneEnabled(this.toneSwitch.checked));
    this.hint = new LiveText(el('p', { class: 'strings-hint', id: 'strings-hint' }));
    const stringsSection = el('section', { class: 'strings-section', 'aria-labelledby': 'strings-title' }, [
      el('div', { class: 'strings-head' }, [
        text('h2', { id: 'strings-title', class: 'section-title' }, 'stringsTitle'),
        el('label', { class: 'switch', for: 'tone-switch' }, [
          this.toneSwitch,
          el('span', { class: 'switch-track', 'aria-hidden': 'true' }, [el('span', { class: 'switch-thumb' })]),
          text('span', { class: 'switch-label' }, 'playTone'),
        ]),
      ]),
      this.strings.element,
      this.hint.node,
    ]);
    this.strings.element.setAttribute('aria-describedby', 'strings-hint');

    this.live = el('p', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });

    // --- Instellingen ---
    this.dialog = new SettingsDialog(this.settings.a4, (a4) => this.setA4(a4));
    this.settingsButton.addEventListener('click', () => this.dialog.open());

    const controls = el('div', { class: 'controls' }, [this.pickers, modes, stringsSection]);
    const main = el('main', { class: 'main' }, [panel, this.notice, controls]);
    this.root.replaceChildren(el('div', { class: 'app' }, [header, main, this.live, this.dialog.element]));

    // --- Gebeurtenissen ---
    this.instrumentSelect.addEventListener('change', () => this.setInstrument(this.instrumentSelect.value));
    this.tuningSelect.addEventListener('change', () => this.setTuning(this.tuningSelect.value));
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', () => {
      this.tone.stop();
      if (this.listening) this.stop(false);
    });
    onLangChange(() => this.relabel());

    // --- Begintoestand ---
    this.modeInputs[this.settings.mode].checked = true;
    this.toneSwitch.checked = this.settings.toneEnabled;
    this.root.dataset.mode = this.settings.mode;
    this.renderInstrumentOptions();
    this.renderTuningOptions();
    this.renderStrings();
    this.relabelStatic();
    this.updateStartButton();
    this.showIdle();
  }

  // ------------------------------------------------------------------ luisteren

  private toggleListening(): void {
    if (this.listening) this.stop(true);
    else void this.start();
  }

  private async start(): Promise<void> {
    if (this.starting || this.listening) return;
    this.starting = true;
    this.hideNotice();
    this.updateStartButton();
    try {
      // Binnen het gebruikersgebaar: AudioContext hervatten, dan de microfoon openen.
      void resumeAudio().catch(() => undefined);
      this.applyRange();
      await this.listener.start(this.onReading);
      this.listening = true;
      this.resumeOnVisible = false;
      this.smoother.reset();
      this.resetTunedState();
      this.lastReadingAt = performance.now();
      this.watchdog = window.setInterval(this.checkSilence, 250);
      void this.wakeLock.acquire();
      this.showWaiting();
      this.announce(t('announceStarted'));
    } catch (err) {
      this.listening = false;
      this.showNotice(err);
    } finally {
      this.starting = false;
      this.updateStartButton();
    }
  }

  /** @param byUser true als de gebruiker op Stop tikte (dan niet automatisch hervatten). */
  private stop(byUser: boolean): void {
    this.listener.stop();
    this.listening = false;
    if (byUser) this.resumeOnVisible = false;
    window.clearInterval(this.watchdog);
    this.watchdog = 0;
    this.wakeLock.release();
    this.smoother.reset();
    this.resetTunedState();
    this.setActiveString(-1);
    this.updateStartButton();
    this.showIdle();
    this.meter.resetFace();
    if (byUser) this.announce(t('announceStopped'));
  }

  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
      this.stopTone();
      if (this.listening) {
        this.stop(false);
        this.resumeOnVisible = true;
      }
    } else if (this.resumeOnVisible) {
      this.resumeOnVisible = false;
      void this.start();
    } else if (this.listening) {
      void this.wakeLock.refresh();
    }
  };

  private applyRange(): void {
    if (this.settings.mode === 'chromatic') {
      this.listener.setRange(CHROMATIC_RANGE[0], CHROMATIC_RANGE[1]);
      return;
    }
    const freqs = this.tuning.strings.map((n) => noteToFreq(n, this.settings.a4));
    const lo = Math.max(20, Math.min(...freqs) * 0.7);
    const hi = Math.min(4000, Math.max(...freqs) * 2.2);
    this.listener.setRange(lo, hi);
  }

  private readonly checkSilence = (): void => {
    // Vangnet als de luisteraar een tijd niets doorgeeft: naald terug naar het midden.
    if (this.listening && performance.now() - this.lastReadingAt > 700) {
      this.smoother.reset();
      this.showWaiting();
    }
  };

  private readonly onReading = (r: PitchReading | null): void => {
    if (!this.listening) return;
    const now = r?.time ?? performance.now();
    this.lastReadingAt = performance.now();

    // Tijdens (en vlak na) een referentietoon meten we onszelf: negeren.
    if (this.tone.playing) this.toneGuardUntil = now + TONE_GUARD_MS;
    if (now < this.toneGuardUntil) {
      this.smoother.reset();
      return;
    }

    const freq = this.smoother.push(r ? r.freq : null, now);
    if (freq === null) {
      this.showWaiting();
      return;
    }
    this.evaluate(freq, now, this.smoother.holding);
  };

  private targetFor(freq: number): Target {
    const a4 = this.settings.a4;
    const strings = this.tuning.strings;
    if (this.settings.mode === 'chromatic') {
      const n = freqToNote(freq, a4);
      return { name: n.name, octave: n.octave, cents: n.cents, targetFreq: n.targetFreq, stringIndex: -1, key: n.note };
    }
    if (this.settings.mode === 'auto') {
      const c = closestString(freq, strings, a4);
      const p = parseNote(c.note);
      return { name: p.name, octave: p.octave, cents: c.cents, targetFreq: c.targetFreq, stringIndex: c.index, key: `s${c.index}` };
    }
    const index = Math.min(this.fixedIndex, strings.length - 1);
    const note = strings[index] ?? strings[0] ?? 'A4';
    const p = parseNote(note);
    const targetFreq = noteToFreq(note, a4);
    return { name: p.name, octave: p.octave, cents: centsBetween(freq, targetFreq), targetFreq, stringIndex: index, key: `s${index}` };
  }

  private evaluate(freq: number, now: number, held = false): void {
    const target = this.targetFor(freq);
    const abs = Math.abs(target.cents);
    this.meter.setHeld(held);

    // Gestemd-detectie met houdtijd en hysterese, per doel. Een vastgehouden waarde is geen
    // nieuwe meting en telt daarom niet mee.
    if (held) {
      this.inTuneSince = null;
    } else {
      if (target.key !== this.tunedKey) {
        this.tunedKey = target.key;
        this.tuned = false;
        this.inTuneSince = null;
      }
      if (this.tuned) {
        if (abs > TUNED_RELEASE_CENTS) {
          this.tuned = false;
          this.inTuneSince = null;
        }
      } else if (abs <= TUNED_CENTS) {
        if (this.inTuneSince === null) this.inTuneSince = now;
        if (now - this.inTuneSince >= TUNED_HOLD_MS) this.onTuned(target);
      } else {
        this.inTuneSince = null;
      }
    }

    let status: MeterStatus;
    if (this.tuned) status = 'tuned';
    else if (target.cents < -50) status = 'far-low';
    else if (target.cents > 50) status = 'far-high';
    else if (abs <= TUNED_CENTS) status = 'near';
    else status = target.cents < 0 ? 'low' : 'high';

    this.meter.showReading({
      name: target.name,
      octave: target.octave,
      cents: target.cents,
      freq,
      targetFreq: target.targetFreq,
      status,
      approved: this.instrument.id.startsWith(JORIS_INSTRUMENT),
    });
    this.setActiveString(this.settings.mode === 'auto' ? target.stringIndex : -1);
    if (this.settings.mode === 'chromatic') {
      const note = `${prettyNoteName(target.name)}${target.octave}`;
      if (note !== this.chromaticNote) {
        this.chromaticNote = note;
        this.updateBar();
      }
    }
    this.maybeAnnounceNote(target, status, now);
  }

  private onTuned(target: Target): void {
    this.tuned = true;
    try {
      // Alleen na een echte tik (anders blokkeert de browser het met een consolewaarschuwing).
      const activated = navigator.userActivation?.hasBeenActive ?? true;
      if (activated && 'vibrate' in navigator) navigator.vibrate(30);
    } catch {
      // geen trilfunctie
    }
    if (target.stringIndex >= 0 && !this.tunedStrings.has(target.stringIndex)) {
      this.tunedStrings.add(target.stringIndex);
      this.strings.markTuned(target.stringIndex, true);
    }
    this.announce(t('announceTuned', { note: spokenNote(target.name, target.octave) }), true);
  }

  private resetTunedState(): void {
    this.tuned = false;
    this.tunedKey = '';
    this.inTuneSince = null;
    this.noteCandidate = '';
    this.announcedNote = '';
  }

  // ------------------------------------------------------------------ meterberichten

  private showIdle(): void {
    if (this.lastError !== null && !this.notice.hidden) {
      this.meter.showMessage(t('msgNoMic'), t('msgNoMicHint'), 'error');
    } else {
      this.meter.showMessage(t('msgIdle'), t('msgIdleHint'), 'idle');
    }
    this.showFixedTarget();
  }

  private showWaiting(): void {
    if (this.toneIndex >= 0) return;
    const what = this.settings.mode === 'chromatic' ? t('msgWaitTone') : t('msgWaitString');
    this.meter.showMessage(what, t('msgWaitHint'), 'listen');
    this.setActiveString(-1);
    this.inTuneSince = null;
  }

  /** In vaste-snaarmodus het doel al tonen voordat er gemeten wordt. */
  private showFixedTarget(): void {
    if (this.settings.mode !== 'fixed') {
      this.meter.clearNote();
      return;
    }
    const note = this.tuning.strings[this.fixedIndex];
    if (!note) return;
    const p = parseNote(note);
    this.meter.showTarget(p.name, p.octave, noteToFreq(note, this.settings.a4));
  }

  // ------------------------------------------------------------------ snaren en toon

  private onStringTap(index: number): void {
    if (this.settings.toneEnabled) {
      if (this.settings.mode === 'fixed') this.setFixedIndex(index);
      this.toggleTone(index);
      return;
    }
    this.lockString(index);
  }

  /** Zet een snaar vast als doel (schakelt zo nodig naar 'Vaste snaar'). */
  private lockString(index: number): void {
    if (this.settings.mode !== 'fixed') {
      this.fixedIndex = index;
      this.modeInputs.fixed.checked = true;
      this.setMode('fixed');
    } else {
      this.setFixedIndex(index);
    }
  }

  /** Pijlknoppen in de onderbalk: naar de lagere (−1) of hogere (+1) snaar, rondlopend. */
  private stepString(delta: -1 | 1): void {
    const n = this.tuning.strings.length;
    if (n === 0) return;
    const base = this.settings.mode === 'fixed' ? this.fixedIndex : this.activeString >= 0 ? this.activeString : this.fixedIndex;
    this.lockString((((base + delta) % n) + n) % n);
  }

  private setFixedIndex(index: number): void {
    this.fixedIndex = index;
    this.strings.setPressed(this.settings.mode === 'fixed' ? index : -1);
    this.resetTunedState();
    this.showFixedTarget();
    this.updateBar();
    const note = this.tuning.strings[index];
    if (note) {
      const p = parseNote(note);
      this.announce(t('announceTarget', { note: spokenNote(p.name, p.octave) }));
    }
  }

  private setActiveString(index: number): void {
    this.strings.setActive(index);
    if (index === this.activeString) return;
    this.activeString = index;
    this.updateBar();
  }

  private toggleTone(index: number): void {
    if (this.toneIndex === index && this.tone.playing) {
      this.stopTone();
      return;
    }
    const note = this.tuning.strings[index];
    if (!note) return;
    const freq = noteToFreq(note, this.settings.a4);
    try {
      // Synchroon binnen het tikgebaar spelen (iOS); ReferenceTone hervat de AudioContext zelf.
      this.tone.play(freq, { durationMs: TONE_MS });
    } catch (err) {
      this.showNotice(err);
      return;
    }
    this.toneIndex = index;
    this.toneGuardUntil = performance.now() + TONE_MS + TONE_GUARD_MS;
    this.strings.setSounding(index);
    this.showToneMessage();
    window.clearInterval(this.tonePoll);
    this.tonePoll = window.setInterval(() => {
      if (!this.tone.playing) this.onToneEnded();
    }, 100);
  }

  private showToneMessage(): void {
    const note = this.tuning.strings[this.toneIndex];
    if (!note) return;
    const freq = noteToFreq(note, this.settings.a4);
    const p = parseNote(note);
    this.meter.showTarget(p.name, p.octave, freq);
    this.meter.showMessage(t('msgTone'), t('msgToneHint', { note: `${prettyNoteName(p.name)}${p.octave}`, hz: formatHz(freq, 2) }), 'tone');
  }

  private stopTone(): void {
    this.tone.stop();
    this.onToneEnded();
  }

  private onToneEnded(): void {
    if (this.toneIndex < 0) return;
    window.clearInterval(this.tonePoll);
    this.tonePoll = 0;
    this.toneIndex = -1;
    this.toneGuardUntil = performance.now() + TONE_GUARD_MS;
    this.strings.setSounding(-1);
    this.smoother.reset();
    if (this.listening) this.showWaiting();
    else this.showIdle();
  }

  // ------------------------------------------------------------------ instellingen

  private setInstrument(id: string): void {
    const inst = getInstrument(id);
    if (!inst || inst === this.instrument) return;
    this.instrument = inst;
    const first = inst.tunings[0];
    if (!first) return;
    this.tuning = first;
    this.settings.instrumentId = inst.id;
    this.settings.tuningId = first.id;
    this.renderTuningOptions();
    this.onTuningChanged();
  }

  private setTuning(id: string): void {
    const tn = getTuning(this.instrument.id, id);
    if (!tn || tn === this.tuning) return;
    this.tuning = tn;
    this.settings.tuningId = tn.id;
    this.tuningSelect.value = tn.id;
    this.onTuningChanged();
  }

  /** Sneltoets 'Joris' contrabas': contrabas in orkeststemming. */
  private pickJoris(): void {
    this.instrumentSelect.value = JORIS_INSTRUMENT;
    this.setInstrument(JORIS_INSTRUMENT);
    this.setTuning(JORIS_TUNING);
  }

  private onTuningChanged(): void {
    this.fixedIndex = Math.min(this.fixedIndex, this.tuning.strings.length - 1);
    this.stopTone();
    this.tunedStrings.clear();
    this.renderTuningInfo();
    this.renderStrings();
    this.applyRange();
    this.smoother.reset();
    this.resetTunedState();
    if (this.listening) this.showWaiting();
    else this.showIdle();
    this.updateJorisChip();
    this.updateBar();
    this.persist();
  }

  private setMode(mode: TunerMode): void {
    if (mode === this.settings.mode) return;
    this.settings.mode = mode;
    this.root.dataset.mode = mode;
    this.strings.setPressed(mode === 'fixed' ? this.fixedIndex : -1);
    this.setActiveString(-1);
    this.chromaticNote = '';
    this.applyRange();
    this.smoother.reset();
    this.resetTunedState();
    this.updateHint();
    if (this.listening) this.showWaiting();
    else this.showIdle();
    this.showFixedTarget();
    this.updateBar();
    this.announce(t('announceMode', { mode: t(MODE_KEYS[mode]) }));
    this.persist();
  }

  private setToneEnabled(on: boolean): void {
    this.settings.toneEnabled = on;
    if (!on) this.stopTone();
    this.strings.setAction(on ? 'tone' : 'fix');
    this.updateHint();
    this.persist();
  }

  private setA4(a4: number): void {
    this.settings.a4 = a4;
    this.renderA4();
    this.applyRange();
    this.smoother.reset();
    this.resetTunedState();
    if (!this.listening && this.toneIndex < 0) this.showFixedTarget();
    this.persist();
  }

  private persist(): void {
    saveSettings({ ...this.settings });
  }

  // ------------------------------------------------------------------ weergave

  private renderInstrumentOptions(): void {
    const groups = new Map<InstrumentCategory, HTMLOptGroupElement>();
    const nodes: HTMLOptGroupElement[] = [];
    for (const inst of INSTRUMENTS) {
      let group = groups.get(inst.category);
      if (!group) {
        group = el('optgroup', { label: categoryLabel(inst.category) });
        groups.set(inst.category, group);
        nodes.push(group);
      }
      group.append(el('option', { value: inst.id, text: instrumentName(inst) }));
    }
    this.instrumentSelect.replaceChildren(...nodes);
    this.instrumentSelect.value = this.instrument.id;
  }

  private renderTuningOptions(): void {
    this.tuningSelect.replaceChildren(
      ...this.instrument.tunings.map((tn) => el('option', { value: tn.id, text: tuningName(this.instrument.id, tn) })),
    );
    this.tuningSelect.value = this.tuning.id;
    this.renderTuningInfo();
  }

  private renderTuningInfo(): void {
    const notes = this.tuning.strings.map((n) => {
      const p = parseNote(n);
      return `${prettyNoteName(p.name)}${p.octave}`;
    });
    const description = tuningDescription(this.instrument.id, this.tuning);
    const desc = description ? ` · ${description}` : '';
    this.tuningInfo.set(`${notes.join(' ')}${desc}`);
  }

  private renderStrings(): void {
    this.strings.setStrings(
      this.tuning.strings.map((note) => {
        const p = parseNote(note);
        return { note, name: p.name, octave: p.octave };
      }),
    );
    this.strings.setAction(this.settings.toneEnabled ? 'tone' : 'fix');
    this.strings.setPressed(this.settings.mode === 'fixed' ? this.fixedIndex : -1);
    this.activeString = -1;
  }

  private renderA4(): void {
    this.a4Badge.set(`A4 ${this.settings.a4}`);
    this.settingsButton.setAttribute('aria-label', t('settingsLabel', { a4: this.settings.a4 }));
  }

  private updateHint(): void {
    let key: MessageKey;
    if (this.settings.toneEnabled) key = 'hintTone';
    else if (this.settings.mode === 'auto') key = 'hintAuto';
    else if (this.settings.mode === 'fixed') key = 'hintFixed';
    else key = 'hintChromatic';
    this.hint.set(t(key));
  }

  private updateJorisChip(): void {
    const on = this.instrument.id === JORIS_INSTRUMENT && this.tuning.id === JORIS_TUNING;
    this.jorisChip.setAttribute('aria-pressed', String(on));
  }

  /** Onderbalk: 'SNAAR: 6 (E2)', 'SNAAR: AUTO' of in chromatische modus de laatste noot. */
  private updateBar(): void {
    const strings = this.tuning.strings;
    const label = (index: number): string => {
      const note = strings[index];
      if (!note) return t('barAuto');
      const p = parseNote(note);
      return t('barString', { n: strings.length - index, note: `${prettyNoteName(p.name)}${p.octave}` });
    };
    let text: string;
    if (this.settings.mode === 'fixed') text = label(this.fixedIndex);
    else if (this.settings.mode === 'auto') text = this.activeString >= 0 ? label(this.activeString) : t('barAuto');
    else text = this.chromaticNote ? t('barNote', { note: this.chromaticNote }) : t('barChromatic');
    this.barLabel.set(text);
  }

  private updateStartButton(): void {
    const b = this.startButton;
    b.disabled = this.starting;
    b.hidden = this.listening;
    b.dataset.state = this.listening ? 'on' : 'off';
    this.startIcon.innerHTML = this.listening ? ICON_STOP : ICON_MIC;
    this.startLabel.set(this.starting ? t('opening') : this.listening ? t('stop') : t('start'));
    b.setAttribute('aria-label', this.listening ? t('stopAria') : t('startAria'));
    const sw = this.tuningSwitch;
    sw.disabled = this.starting;
    sw.setAttribute('aria-checked', String(this.listening));
    sw.setAttribute('aria-label', t('tuningSwitchAria'));
    setData(this.root, 'listening', this.listening ? 'true' : 'false');
  }

  private showNotice(err: unknown): void {
    this.lastError = err;
    this.noticeTitle.set(errorText(err));
    this.noticeBody.set(window.isSecureContext ? t('helpPermission') : t('helpInsecure'));
    this.notice.hidden = false;
    this.meter.showMessage(t('msgNoMic'), t('msgNoMicHint'), 'error');
  }

  private hideNotice(): void {
    this.notice.hidden = true;
    this.lastError = null;
  }

  // ------------------------------------------------------------------ taalwissel

  /** Teksten die niet van de toestand afhangen. */
  private relabelStatic(): void {
    for (const [node, key] of this.texts) node.set(t(key));
    for (const mode of Object.keys(MODE_KEYS) as TunerMode[]) this.modeLabels[mode].set(t(MODE_KEYS[mode]));
    this.langButton.textContent = t('langSwitchShort');
    this.langButton.setAttribute('aria-label', t('langSwitchLabel'));
    this.langButton.setAttribute('lang', t('langSwitchTarget'));
    this.pickers.setAttribute('aria-label', t('pickersLabel'));
    this.jorisChip.setAttribute('title', t('jorisChipLabel'));
    this.prevButton.setAttribute('aria-label', t('prevString'));
    this.nextButton.setAttribute('aria-label', t('nextString'));
    this.renderA4();
    this.updateHint();
    this.updateJorisChip();
    this.updateBar();
  }

  /** Alles opnieuw in de nieuwe taal, inclusief de huidige meterboodschap. */
  private relabel(): void {
    this.relabelStatic();
    this.renderInstrumentOptions();
    this.renderTuningOptions();
    this.strings.relabel();
    this.meter.relabel();
    this.updateStartButton();
    if (this.lastError !== null && !this.notice.hidden) {
      this.noticeTitle.set(errorText(this.lastError));
      this.noticeBody.set(window.isSecureContext ? t('helpPermission') : t('helpInsecure'));
    }
    if (this.toneIndex >= 0) this.showToneMessage();
    else if (!this.listening) this.showIdle();
    else if (this.meter.element.dataset.state === 'idle') this.showWaiting();
  }

  // ------------------------------------------------------------------ schermlezers

  /** Kondig rustig aan: geen herhaling binnen 4 s, behalve als `force`. */
  private announce(text: string, force = false): void {
    const now = performance.now();
    if (!force && text === this.announcedText && now - this.announcedAt < 4000) return;
    this.announcedText = text;
    this.announcedAt = now;
    this.live.textContent = text;
  }

  /** Een nieuwe noot aankondigen als die ~0,8 s stabiel is, hooguit eens per 2 s. */
  private maybeAnnounceNote(target: Target, status: MeterStatus, now: number): void {
    if (status === 'tuned') return;
    const key = `${target.name}${target.octave}`;
    if (key !== this.noteCandidate) {
      this.noteCandidate = key;
      this.noteCandidateSince = now;
      return;
    }
    if (key === this.announcedNote || now - this.noteCandidateSince < 800 || now - this.announcedAt < 2000) return;
    this.announcedNote = key;
    const note = spokenNote(target.name, target.octave);
    const word: MessageKey =
      status === 'low' || status === 'far-low' ? 'announceLow' : status === 'high' || status === 'far-high' ? 'announceHigh' : 'announceNear';
    this.announce(t(word, { note }));
  }
}

/** De theme-color van de browserbalk gelijk houden aan de achtergrond (altijd donker). */
function syncThemeColor(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) meta.content = bg;
}

export function mountApp(root: HTMLElement): void {
  migrateLegacyStorage();
  initLang();
  try {
    new TunerApp(root);
    syncThemeColor();
  } catch (err) {
    console.error(err);
    root.textContent = t('fatal');
  }
}
