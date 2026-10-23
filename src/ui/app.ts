// TurkeyTuna-interface: bouwt de DOM één keer op en koppelt de microfoonluisteraar, de smoother,
// de meter, de snaarknoppen en de referentietoon aan elkaar.

import { resumeAudio } from '../audio/context';
import { PitchListener } from '../audio/listener';
import { PitchSmoother } from '../audio/smoothing';
import { ReferenceTone } from '../audio/tone';
import { CATEGORY_LABELS, DEFAULT_INSTRUMENT_ID, INSTRUMENTS, getInstrument, getTuning } from '../data/instruments';
import { DEFAULT_A4, centsBetween, closestString, freqToNote, noteToFreq, parseNote } from '../music/notes';
import type { Instrument, InstrumentCategory, PitchReading, Tuning } from '../types';
import { el, fromMarkup, LiveText } from './dom';
import { formatHz, prettyNoteName, spokenNote } from './format';
import { ICON_GEAR, ICON_MIC, ICON_STOP } from './icons';
import { mascotMarkup } from './mascot';
import { Meter, type MeterStatus } from './meter';
import { SettingsDialog } from './settings-dialog';
import { clampA4, isTunerMode, loadSettings, saveSettings, type StoredSettings, type TunerMode } from './settings-store';
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
/** Duur van een referentietoon. */
const TONE_MS = 2500;
/** Chromatisch bereik. */
const CHROMATIC_RANGE: [number, number] = [27, 1500];

const MODE_LABELS: Record<TunerMode, string> = {
  auto: 'Automatisch',
  fixed: 'Vaste snaar',
  chromatic: 'Chromatisch',
};

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
  private readonly smoother = new PitchSmoother();
  private readonly tone = new ReferenceTone();
  private readonly wakeLock = new ScreenWakeLock();

  private settings: StoredSettings;
  private instrument: Instrument;
  private tuning: Tuning;
  private fixedIndex = 0;

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

  // DOM
  private readonly meter = new Meter();
  private readonly strings: StringsPanel;
  private readonly dialog: SettingsDialog;
  private readonly instrumentSelect: HTMLSelectElement;
  private readonly tuningSelect: HTMLSelectElement;
  private readonly tuningInfo: LiveText;
  private readonly modeInputs: Record<TunerMode, HTMLInputElement>;
  private readonly toneSwitch: HTMLInputElement;
  private readonly hint: LiveText;
  private readonly startButton: HTMLButtonElement;
  private readonly startIcon: HTMLElement;
  private readonly startLabel: LiveText;
  private readonly notice: HTMLElement;
  private readonly noticeTitle: LiveText;
  private readonly noticeBody: LiveText;
  private readonly live: HTMLElement;
  private readonly a4Badge: LiveText;
  private readonly settingsButton: HTMLButtonElement;

  constructor(private readonly root: HTMLElement) {
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

    // --- Kop ---
    this.a4Badge = new LiveText(el('span', { class: 'a4-badge' }));
    this.settingsButton = el('button', { type: 'button', class: 'icon-btn settings-btn', 'aria-haspopup': 'dialog' }, [
      fromMarkup('span', { class: 'icon' }, ICON_GEAR),
      this.a4Badge.node,
    ]);
    const header = el('header', { class: 'topbar' }, [
      el('div', { class: 'brand' }, [
        fromMarkup('span', { class: 'brand-mark', 'data-mood': 'near', 'aria-hidden': 'true' }, mascotMarkup('tt-logo')),
        el('h1', { class: 'brand-name' }, [el('span', { class: 'brand-turkey', text: 'Turkey' }), el('span', { class: 'brand-tuna', text: 'Tuna' })]),
      ]),
      this.settingsButton,
    ]);

    // --- Instrument en stemming ---
    this.instrumentSelect = el('select', { id: 'instrument', class: 'select' });
    const groups = new Map<InstrumentCategory, HTMLOptGroupElement>();
    for (const inst of INSTRUMENTS) {
      let group = groups.get(inst.category);
      if (!group) {
        group = el('optgroup', { label: CATEGORY_LABELS[inst.category] ?? inst.category });
        groups.set(inst.category, group);
        this.instrumentSelect.append(group);
      }
      group.append(el('option', { value: inst.id, text: inst.name }));
    }
    this.tuningSelect = el('select', { id: 'tuning', class: 'select', 'aria-describedby': 'tuning-info' });
    this.tuningInfo = new LiveText(el('p', { id: 'tuning-info', class: 'tuning-info' }));
    const pickers = el('section', { class: 'pickers', 'aria-label': 'Instrument en stemming' }, [
      el('div', { class: 'field' }, [el('label', { for: 'instrument', class: 'field-label', text: 'Instrument' }), this.instrumentSelect]),
      el('div', { class: 'field' }, [el('label', { for: 'tuning', class: 'field-label', text: 'Stemming' }), this.tuningSelect]),
      this.tuningInfo.node,
    ]);

    // --- Modus (segmented control op basis van echte radioknoppen) ---
    const modeInputs = {} as Record<TunerMode, HTMLInputElement>;
    const modeOptions = (Object.keys(MODE_LABELS) as TunerMode[]).map((mode) => {
      const input = el('input', { type: 'radio', name: 'mode', value: mode, id: `mode-${mode}`, class: 'segment-input' });
      input.addEventListener('change', () => {
        if (input.checked) this.setMode(mode);
      });
      modeInputs[mode] = input;
      return el('label', { class: 'segment', for: `mode-${mode}` }, [input, el('span', { text: MODE_LABELS[mode] })]);
    });
    this.modeInputs = modeInputs;
    const modes = el('fieldset', { class: 'segmented' }, [el('legend', { class: 'sr-only', text: 'Modus' }), ...modeOptions]);

    // --- Snaren ---
    this.strings = new StringsPanel((i) => this.onStringTap(i));
    this.toneSwitch = el('input', { type: 'checkbox', role: 'switch', id: 'tone-switch', class: 'switch-input' });
    this.toneSwitch.addEventListener('change', () => this.setToneEnabled(this.toneSwitch.checked));
    this.hint = new LiveText(el('p', { class: 'strings-hint', id: 'strings-hint' }));
    const stringsSection = el('section', { class: 'strings-section', 'aria-labelledby': 'strings-title' }, [
      el('div', { class: 'strings-head' }, [
        el('h2', { id: 'strings-title', class: 'section-title', text: 'Snaren' }),
        el('label', { class: 'switch', for: 'tone-switch' }, [
          this.toneSwitch,
          el('span', { class: 'switch-track', 'aria-hidden': 'true' }, [el('span', { class: 'switch-thumb' })]),
          el('span', { class: 'switch-label', text: 'Toon afspelen' }),
        ]),
      ]),
      this.strings.element,
      this.hint.node,
    ]);
    this.strings.element.setAttribute('aria-describedby', 'strings-hint');

    // --- Actiebalk onderaan (duimbereik) ---
    this.startIcon = fromMarkup('span', { class: 'icon' }, ICON_MIC);
    this.startLabel = new LiveText(el('span', { class: 'start-label' }), 'Start stemmen');
    this.startButton = el('button', { type: 'button', class: 'start-btn' }, [this.startIcon, this.startLabel.node]);
    this.startButton.addEventListener('click', () => {
      if (this.listening) this.stop(true);
      else void this.start();
    });
    this.noticeTitle = new LiveText(el('strong', { class: 'notice-title' }));
    this.noticeBody = new LiveText(el('span', { class: 'notice-body' }));
    this.notice = el('div', { class: 'notice', role: 'alert', hidden: true }, [this.noticeTitle.node, this.noticeBody.node]);
    const actionbar = el('footer', { class: 'actionbar' }, [this.notice, this.startButton]);

    this.live = el('p', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });

    // --- Instellingen ---
    this.dialog = new SettingsDialog(this.settings.a4, (a4) => this.setA4(a4));
    this.settingsButton.addEventListener('click', () => this.dialog.open());

    const main = el('main', { class: 'main' }, [pickers, modes, this.meter.element, stringsSection]);
    this.root.replaceChildren(el('div', { class: 'app' }, [header, main, actionbar, this.live, this.dialog.element]));

    // --- Gebeurtenissen ---
    this.instrumentSelect.addEventListener('change', () => this.setInstrument(this.instrumentSelect.value));
    this.tuningSelect.addEventListener('change', () => this.setTuning(this.tuningSelect.value));
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', () => {
      this.tone.stop();
      if (this.listening) this.stop(false);
    });

    // --- Begintoestand ---
    this.instrumentSelect.value = this.instrument.id;
    this.modeInputs[this.settings.mode].checked = true;
    this.toneSwitch.checked = this.settings.toneEnabled;
    this.root.dataset.mode = this.settings.mode;
    this.renderTuningOptions();
    this.renderStrings();
    this.renderA4();
    this.updateHint();
    this.updateStartButton();
    this.showIdle();
  }

  // ------------------------------------------------------------------ luisteren

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
      this.announce('Luisteren gestart');
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
    this.strings.setActive(-1);
    this.updateStartButton();
    this.showIdle();
    if (byUser) this.announce('Luisteren gestopt');
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
    this.evaluate(freq, now);
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

  private evaluate(freq: number, now: number): void {
    const t = this.targetFor(freq);
    const abs = Math.abs(t.cents);

    // Gestemd-detectie met houdtijd en hysterese, per doel.
    if (t.key !== this.tunedKey) {
      this.tunedKey = t.key;
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
      if (now - this.inTuneSince >= TUNED_HOLD_MS) this.onTuned(t);
    } else {
      this.inTuneSince = null;
    }

    let status: MeterStatus;
    if (this.tuned) status = 'tuned';
    else if (t.cents < -50) status = 'far-low';
    else if (t.cents > 50) status = 'far-high';
    else if (abs <= TUNED_CENTS) status = 'near';
    else status = t.cents < 0 ? 'low' : 'high';

    this.meter.showReading({ name: t.name, octave: t.octave, cents: t.cents, freq, targetFreq: t.targetFreq, status });
    this.strings.setActive(this.settings.mode === 'auto' ? t.stringIndex : -1);
    this.maybeAnnounceNote(t, status, now);
  }

  private onTuned(t: Target): void {
    this.tuned = true;
    try {
      // Alleen na een echte tik (anders blokkeert de browser het met een consolewaarschuwing).
      const activated = navigator.userActivation?.hasBeenActive ?? true;
      if (activated && 'vibrate' in navigator) navigator.vibrate(30);
    } catch {
      // geen trilfunctie
    }
    if (t.stringIndex >= 0 && !this.tunedStrings.has(t.stringIndex)) {
      this.tunedStrings.add(t.stringIndex);
      this.strings.markTuned(t.stringIndex, true);
    }
    this.announce(`${spokenNote(t.name, t.octave)} gestemd`, true);
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
    this.meter.showMessage('Zzz… tik op Start stemmen', 'de tonijn wacht op je eerste snaar', 'sleep');
    this.showFixedTarget();
  }

  private showWaiting(): void {
    if (this.toneIndex >= 0) return;
    const what = this.settings.mode === 'chromatic' ? 'een toon' : 'een snaar';
    this.meter.showMessage(`Speel ${what}…`, 'ik luister met mijn vinnen gespitst', 'listen');
    this.strings.setActive(-1);
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
    if (this.settings.mode !== 'fixed') {
      this.fixedIndex = index;
      this.modeInputs.fixed.checked = true;
      this.setMode('fixed');
    } else {
      this.setFixedIndex(index);
    }
  }

  private setFixedIndex(index: number): void {
    this.fixedIndex = index;
    this.strings.setPressed(this.settings.mode === 'fixed' ? index : -1);
    this.resetTunedState();
    this.showFixedTarget();
    const note = this.tuning.strings[index];
    if (note) {
      const p = parseNote(note);
      this.announce(`Doel ${spokenNote(p.name, p.octave)}`);
    }
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
    const p = parseNote(note);
    this.meter.showTarget(p.name, p.octave, freq);
    this.meter.showMessage('Referentietoon', `${prettyNoteName(p.name)}${p.octave} · ${formatHz(freq, 2)} Hz · microfoon even doof`, 'near');
    window.clearInterval(this.tonePoll);
    this.tonePoll = window.setInterval(() => {
      if (!this.tone.playing) this.onToneEnded();
    }, 100);
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
    this.onTuningChanged();
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
    this.persist();
  }

  private setMode(mode: TunerMode): void {
    if (mode === this.settings.mode) return;
    this.settings.mode = mode;
    this.root.dataset.mode = mode;
    this.strings.setPressed(mode === 'fixed' ? this.fixedIndex : -1);
    this.strings.setActive(-1);
    this.applyRange();
    this.smoother.reset();
    this.resetTunedState();
    this.updateHint();
    if (this.listening) this.showWaiting();
    else this.showIdle();
    this.showFixedTarget();
    this.announce(`Modus ${MODE_LABELS[mode]}`);
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

  private renderTuningOptions(): void {
    this.tuningSelect.replaceChildren(...this.instrument.tunings.map((tn) => el('option', { value: tn.id, text: tn.name })));
    this.tuningSelect.value = this.tuning.id;
    this.renderTuningInfo();
  }

  private renderTuningInfo(): void {
    const notes = this.tuning.strings.map((n) => {
      const p = parseNote(n);
      return `${prettyNoteName(p.name)}${p.octave}`;
    });
    const desc = this.tuning.description ? ` · ${this.tuning.description}` : '';
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
  }

  private renderA4(): void {
    this.a4Badge.set(`A4 ${this.settings.a4}`);
    this.settingsButton.setAttribute('aria-label', `Instellingen, A4 is ${this.settings.a4} hertz`);
  }

  private updateHint(): void {
    let text: string;
    if (this.settings.toneEnabled) text = 'Tik op een snaar voor de referentietoon. De microfoon luistert dan even niet mee.';
    else if (this.settings.mode === 'auto') text = 'Speel een snaar: de dichtstbijzijnde licht op. Tik op een snaar om die vast te zetten.';
    else if (this.settings.mode === 'fixed') text = 'Tik op de snaar die je wilt stemmen; de meter meet alleen daartegen.';
    else text = 'Chromatisch: elke noot wordt herkend. Tik op een snaar om die vast te zetten.';
    this.hint.set(text);
  }

  private updateStartButton(): void {
    const b = this.startButton;
    b.disabled = this.starting;
    b.dataset.state = this.listening ? 'on' : 'off';
    this.startIcon.innerHTML = this.listening ? ICON_STOP : ICON_MIC;
    this.startLabel.set(this.starting ? 'Microfoon openen…' : this.listening ? 'Stop' : 'Start stemmen');
    b.setAttribute('aria-label', this.listening ? 'Stop met luisteren' : 'Start stemmen: microfoon aanzetten');
  }

  private showNotice(err: unknown): void {
    const message = err instanceof Error && err.message ? err.message : 'Er ging iets mis met de audio.';
    let help: string;
    if (!window.isSecureContext) help = 'De microfoon werkt alleen via een beveiligde verbinding (https) of op localhost.';
    else
      help =
        'Sta microfoongebruik toe via het slotje of het instellingen-icoon in de adresbalk en tik opnieuw op Start stemmen. ' +
        'Op iPhone of iPad: Instellingen › Safari › Microfoon.';
    this.noticeTitle.set(message);
    this.noticeBody.set(help);
    this.notice.hidden = false;
    this.meter.showMessage('Geen microfoon', 'de tonijn hoort even niks', 'far');
  }

  private hideNotice(): void {
    this.notice.hidden = true;
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
  private maybeAnnounceNote(t: Target, status: MeterStatus, now: number): void {
    if (status === 'tuned') return;
    const key = `${t.name}${t.octave}`;
    if (key !== this.noteCandidate) {
      this.noteCandidate = key;
      this.noteCandidateSince = now;
      return;
    }
    if (key === this.announcedNote || now - this.noteCandidateSince < 800 || now - this.announcedAt < 2000) return;
    this.announcedNote = key;
    const word = status === 'low' || status === 'far-low' ? 'te laag' : status === 'high' || status === 'far-high' ? 'te hoog' : 'bijna';
    this.announce(`${spokenNote(t.name, t.octave)}, ${word}`);
  }
}

/** De theme-color van de browserbalk laten meekleuren met het actieve thema. */
function syncThemeColor(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  const apply = (): void => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) meta.content = bg;
  };
  apply();
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', apply);
  } catch {
    // oude browser: niet erg
  }
}

export function mountApp(root: HTMLElement): void {
  try {
    new TunerApp(root);
    syncThemeColor();
  } catch (err) {
    console.error(err);
    root.textContent = 'TurkeyTuna kon niet starten. Herlaad de pagina.';
  }
}
