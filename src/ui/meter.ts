// De stemmeter in hardwarestijl: een boog van 31 LED-segmenten (−50 … +50 cent), een ruitvormige
// naald met Joris' gezicht erin (dat rechtop blijft staan), een grote nootletter met ♭ links en ♯
// rechts, cent- en hertzwaarde en een functionele statusregel.
// De DOM wordt één keer opgebouwd; per frame veranderen alleen teksten, data-attributen, de
// verlichte LED's en de rotatie van de naald (geanimeerd met requestAnimationFrame).

import { t } from '../i18n';
import { BACKGROUND_POSITION, FaceSwitcher, PortraitLibrary, type Face, type Portrait } from './brand';
import { el, fromMarkup, LiveText, setData, toggleClass } from './dom';
import { formatCents, formatHz, prettyNoteName } from './format';

/** Hoe ver de meting van het doel zit. */
export type MeterStatus = 'tuned' | 'near' | 'low' | 'high' | 'far-low' | 'far-high';

/** Soort bericht zonder meting (bepaalt alleen het gezicht en de stijl). */
export type MessageKind = 'idle' | 'listen' | 'tone' | 'error';

export interface MeterReading {
  /** Nootnaam zonder octaaf, bijvoorbeeld 'F#'. */
  name: string;
  octave: number;
  /** Afwijking t.o.v. het doel; mag buiten -50..+50 liggen (vaste snaar). */
  cents: number;
  /** Gemeten frequentie. */
  freq: number;
  /** Frequentie van het doel. */
  targetFreq: number;
  status: MeterStatus;
  /** Gestemd op Joris' eigen instrument: een andere grap bij 'gestemd'. */
  approved?: boolean;
}

const SCALE_CENTS = 50;
const SWEEP_DEG = 56; // ±50 cent beslaat ±56 graden
const CX = 160;
const CY = 236;
const R = 170; // middellijn van de LED's
const LED_COUNT = 31;
const LED_STEP = (2 * SCALE_CENTS) / (LED_COUNT - 1);
const GREEN_CENTS = 10;
const AMBER_CENTS = 30;
/** Middelpunt van het gezicht in de naald (t.o.v. de naaf). */
const FACE_DY = -84;
const FACE_SIZE = 136;

type Zone = 'green' | 'amber' | 'red';

const STATUS: Record<MeterStatus, { label: Parameters<typeof t>[0]; hint: Parameters<typeof t>[0]; arrow: string }> = {
  tuned: { label: 'tunedLabel', hint: 'tunedHint', arrow: '✓' },
  near: { label: 'nearLabel', hint: 'nearHint', arrow: '≈' },
  low: { label: 'lowLabel', hint: 'lowHint', arrow: '▲' },
  high: { label: 'highLabel', hint: 'highHint', arrow: '▼' },
  'far-low': { label: 'farLowLabel', hint: 'farLowHint', arrow: '▲' },
  'far-high': { label: 'farHighLabel', hint: 'farHighHint', arrow: '▼' },
};

const fmt = (n: number): string => n.toFixed(2);
const centsToDeg = (c: number): number => (c / SCALE_CENTS) * SWEEP_DEG;

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arcPath(r: number, fromDeg: number, toDeg: number): string {
  const [x1, y1] = polar(r, fromDeg);
  const [x2, y2] = polar(r, toDeg);
  return `M${fmt(x1)} ${fmt(y1)}A${r} ${r} 0 0 1 ${fmt(x2)} ${fmt(y2)}`;
}

export function ledCents(i: number): number {
  return -SCALE_CENTS + i * LED_STEP;
}

function ledZone(i: number): Zone {
  const c = Math.abs(ledCents(i));
  if (c <= GREEN_CENTS + 0.01) return 'green';
  if (c <= AMBER_CENTS + 0.01) return 'amber';
  return 'red';
}

/** Welke LED's branden bij deze afwijking: het dichtstbijzijnde segment plus één buur. */
export function litLeds(cents: number): number[] {
  const c = Math.max(-SCALE_CENTS, Math.min(SCALE_CENTS, cents));
  const pos = (c + SCALE_CENTS) / LED_STEP;
  const i = Math.round(pos);
  const j = pos >= i ? i + 1 : i - 1;
  return j >= 0 && j < LED_COUNT ? [i, j] : [i];
}

function ledRect(i: number, cls: string, grow = 0): string {
  const deg = centsToDeg(ledCents(i));
  const w = 7.6 + grow;
  const h = 20 + grow;
  return `<rect class="${cls} led-${ledZone(i)}" data-i="${i}" x="${fmt(CX - w / 2)}" y="${fmt(CY - R - h / 2)}" width="${fmt(w)}" height="${fmt(h)}" rx="2.2" transform="rotate(${fmt(deg)} ${CX} ${CY})"/>`;
}

function dialMarkup(): string {
  const leds: string[] = [];
  const glows: string[] = [];
  for (let i = 0; i < LED_COUNT; i++) {
    leds.push(ledRect(i, 'led'));
    glows.push(ledRect(i, 'led-glow', 4));
  }
  // Ruitvormige naald, coördinaten t.o.v. de naaf; punt omhoog.
  const p = (dx: number, dy: number): string => `${fmt(CX + dx)} ${fmt(CY + dy)}`;
  const needle = `M${p(0, -152)}L${p(44, -86)}L${p(17, 10)}L${p(0, 42)}L${p(-17, 10)}L${p(-44, -86)}Z`;
  const fx = CX;
  const fy = CY + FACE_DY;
  const img = (layer: string): string =>
    `<image class="face-img face-${layer}" mask="url(#sj-face-mask)" x="${fx - FACE_SIZE / 2}" y="${fy - FACE_SIZE / 2}" width="${FACE_SIZE}" height="${FACE_SIZE}" preserveAspectRatio="xMidYMid slice"/>`;
  return `<svg class="dial" viewBox="0 46 320 238" aria-hidden="true" focusable="false">
    <defs>
      <filter id="sj-led-glow" x="-200%" y="-100%" width="500%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
      <clipPath id="sj-needle-clip"><path d="${needle}"/></clipPath>
      <linearGradient id="sj-needle-fill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#1b1c20"/><stop offset=".5" stop-color="#2c2e34"/><stop offset="1" stop-color="#141518"/>
      </linearGradient>
      <linearGradient id="sj-needle-gloss" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="sj-face-fade" cx=".5" cy=".5" r=".5">
        <stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
      </radialGradient>
      <mask id="sj-face-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#sj-face-fade)"/></mask>
      <radialGradient id="sj-hub" cx=".4" cy=".35" r=".75">
        <stop offset="0" stop-color="#3a3c43"/><stop offset=".7" stop-color="#17181b"/><stop offset="1" stop-color="#0c0c0e"/>
      </radialGradient>
    </defs>
    <path class="dial-housing" d="${arcPath(R, -SWEEP_DEG - 3, SWEEP_DEG + 3)}"/>
    <path class="dial-housing-inner" d="${arcPath(R, -SWEEP_DEG - 3, SWEEP_DEG + 3)}"/>
    <g class="led-glows" filter="url(#sj-led-glow)">${glows.join('')}</g>
    <g class="leds">${leds.join('')}</g>
    <circle class="hub" cx="${CX}" cy="${CY}" r="36" fill="url(#sj-hub)"/>
    <circle class="hub-ring" cx="${CX}" cy="${CY}" r="36"/>
    <g class="needle" transform="rotate(0 ${CX} ${CY})">
      <path class="needle-shadow" d="${needle}" transform="translate(0 3)"/>
      <path class="needle-body" d="${needle}" fill="url(#sj-needle-fill)"/>
      <g clip-path="url(#sj-needle-clip)">
        <g class="needle-face" transform="rotate(0 ${fx} ${fy})">
          <text class="face-fallback" x="${fx}" y="${fy + 4}">J</text>
          ${img('a')}${img('b')}
        </g>
        <path class="needle-gloss" d="${needle}" fill="url(#sj-needle-gloss)"/>
      </g>
      <path class="needle-edge" d="${needle}"/>
    </g>
  </svg>`;
}

const reducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export class Meter {
  readonly element: HTMLElement;
  /** Plek onder de statusregel voor extra bediening (de startknop). */
  readonly slot: HTMLElement;
  private readonly needle: SVGGElement;
  private readonly face: SVGGElement;
  private readonly faceLayers: [SVGImageElement, SVGImageElement];
  private readonly leds: SVGRectElement[];
  private readonly glows: SVGRectElement[];
  private readonly background: HTMLElement;
  private readonly noteName: LiveText;
  private readonly noteAcc: LiveText;
  private readonly noteOctave: LiveText;
  private readonly centsText: LiveText;
  private readonly centsUnit: LiveText;
  private readonly hzText: LiveText;
  private readonly targetText: LiveText;
  private readonly statusArrow: LiveText;
  private readonly statusLabel: LiveText;
  private readonly statusHint: LiveText;
  private readonly sideFlat: LiveText;
  private readonly sideSharp: LiveText;
  private readonly signFlat: HTMLElement;
  private readonly signSharp: HTMLElement;

  private readonly faces: FaceSwitcher;
  private activeLayer = 0;
  private faceUrl: string | null = null;
  private lit = new Set<number>();
  private lastReading: MeterReading | null = null;
  private lastTarget: number | null = null;
  private held = false;

  private targetDeg = 0;
  private shownDeg = 0;
  private raf = 0;
  private lastFrame = 0;
  private readonly instant = reducedMotion();

  constructor(private readonly portraits: PortraitLibrary) {
    // --- Kop: zijlabels en de grote nootletter met ♭ links en ♯ rechts ---
    const name = el('span', { class: 'note-name' });
    const acc = el('span', { class: 'note-acc' });
    const octave = el('span', { class: 'note-octave' });
    this.signFlat = el('span', { class: 'sign sign-flat', 'aria-hidden': 'true', text: '♭' });
    this.signSharp = el('span', { class: 'sign sign-sharp', 'aria-hidden': 'true', text: '♯' });
    const note = el('div', { class: 'meter-note' }, [
      this.signFlat,
      el('span', { class: 'note-main' }, [name, acc, octave]),
      this.signSharp,
    ]);
    const flat = el('span', { class: 'meter-side meter-side-flat', 'aria-hidden': 'true' });
    const sharp = el('span', { class: 'meter-side meter-side-sharp', 'aria-hidden': 'true' });
    const head = el('div', { class: 'meter-head' }, [flat, note, sharp]);

    // --- Wijzerplaat ---
    const dial = fromMarkup('div', { class: 'meter-dial' }, dialMarkup());
    const q = <T extends Element>(sel: string): T => {
      const n = dial.querySelector<T>(sel);
      if (!n) throw new Error(`Meteronderdeel ontbreekt: ${sel}`);
      return n;
    };
    this.needle = q<SVGGElement>('.needle');
    this.face = q<SVGGElement>('.needle-face');
    this.faceLayers = [q<SVGImageElement>('.face-a'), q<SVGImageElement>('.face-b')];
    this.leds = Array.from(dial.querySelectorAll<SVGRectElement>('.led'));
    this.glows = Array.from(dial.querySelectorAll<SVGRectElement>('.led-glow'));

    const cents = el('span', { class: 'readout-value' });
    const centsUnit = el('span', { class: 'readout-unit' });
    const hz = el('span', { class: 'readout-value' });
    const target = el('span', { class: 'readout-target' });
    dial.append(
      el('div', { class: 'meter-readouts' }, [
        el('div', { class: 'readout readout-cents' }, [cents, centsUnit]),
        el('div', { class: 'readout readout-hz' }, [hz, el('span', { class: 'readout-unit', text: 'Hz' }), target]),
      ]),
    );

    // --- Status ---
    const arrow = el('span', { class: 'status-arrow', 'aria-hidden': 'true' });
    const label = el('span', { class: 'status-label' });
    const hint = el('span', { class: 'status-hint' });
    const status = el('div', { class: 'meter-status' }, [arrow, el('span', { class: 'status-text' }, [label, hint])]);

    this.background = el('div', { class: 'meter-bg', 'aria-hidden': 'true' });
    this.slot = el('div', { class: 'meter-slot' });

    this.element = el('section', { class: 'meter', 'data-state': 'idle', 'data-photo': 'false', 'data-bg': 'false' }, [
      this.background,
      head,
      dial,
      status,
      this.slot,
    ]);

    this.noteName = new LiveText(name, '–');
    this.noteAcc = new LiveText(acc, '');
    this.noteOctave = new LiveText(octave, '');
    this.centsText = new LiveText(cents, '–');
    this.centsUnit = new LiveText(centsUnit, '');
    this.hzText = new LiveText(hz, '–');
    this.targetText = new LiveText(target, '');
    this.statusArrow = new LiveText(arrow, '');
    this.statusLabel = new LiveText(label, '');
    this.statusHint = new LiveText(hint, '');
    this.sideFlat = new LiveText(flat, '');
    this.sideSharp = new LiveText(sharp, '');

    this.faces = new FaceSwitcher((f) => this.applyFace(f));
    this.portraits.onChange(() => {
      this.applyFace(this.faces.current);
      this.applyBackground();
    });
    this.relabel();
  }

  /** Teksten opnieuw zetten na een taalwissel (inclusief de laatste meting). */
  relabel(): void {
    this.element.setAttribute('aria-label', t('meterLabel'));
    this.sideFlat.set(t('labelFlat'));
    this.sideSharp.set(t('labelSharp'));
    this.centsUnit.set(t('unitCent'));
    if (this.lastTarget !== null) this.targetText.set(t('targetHz', { hz: formatHz(this.lastTarget, 2) }));
    if (this.lastReading && this.element.dataset.state !== 'idle') this.showReading(this.lastReading);
  }

  /** Geen (bruikbare) meting: naald terug naar het midden, LED's uit, met een korte uitleg. */
  showMessage(message: string, hint = '', kind: MessageKind = 'idle'): void {
    this.lastReading = null;
    setData(this.element, 'state', 'idle');
    setData(this.element, 'msg', kind);
    setData(this.element, 'dir', 'center');
    setData(this.element, 'held', 'false');
    this.held = false;
    this.centsText.set('–');
    this.hzText.set('–');
    this.statusArrow.set('');
    this.statusLabel.set(message);
    this.statusHint.set(hint);
    this.setLeds(null, false);
    this.setNeedle(0);
    this.faces.request(kind === 'error' ? 'off' : 'idle');
  }

  /** Wis de laatst getoonde noot (bij wisselen van stemming of modus). */
  clearNote(): void {
    this.setNote('–', null);
    this.lastTarget = null;
    this.targetText.set('');
  }

  /** Toon een doel zonder meting, bijvoorbeeld de vastgezette snaar of de referentietoon. */
  showTarget(name: string, octave: number, targetFreq: number): void {
    this.setNote(name, octave);
    this.lastTarget = targetFreq;
    this.targetText.set(t('targetHz', { hz: formatHz(targetFreq, 2) }));
  }

  /** Vastgehouden waarde (de snaar klinkt uit): naald blijft staan, licht gedimd, gezicht blijft. */
  setHeld(held: boolean): void {
    this.held = held;
    setData(this.element, 'held', held ? 'true' : 'false');
  }

  /** Na stoppen direct terug naar het rustgezicht. */
  resetFace(): void {
    this.faces.force('idle');
  }

  showReading(r: MeterReading): void {
    this.lastReading = r;
    const far = r.status === 'far-low' || r.status === 'far-high';
    setData(this.element, 'state', r.status === 'tuned' ? 'tuned' : far ? 'far' : r.status === 'near' ? 'near' : 'live');
    setData(this.element, 'dir', r.cents < 0 ? 'low' : r.cents > 0 ? 'high' : 'center');
    this.setNote(r.name, r.octave);
    this.centsText.set(formatCents(r.cents));
    this.hzText.set(formatHz(r.freq));
    this.lastTarget = r.targetFreq;
    this.targetText.set(t('targetHz', { hz: formatHz(r.targetFreq, 2) }));
    const s = STATUS[r.status];
    this.statusArrow.set(s.arrow);
    this.statusLabel.set(t(s.label));
    const hintKey = r.status === 'tuned' && r.approved ? 'tunedHintApproved' : s.hint;
    this.statusHint.set(t(hintKey, { cents: formatCents(r.cents) }));
    this.setLeds(r.cents, r.status === 'tuned');
    this.setNeedle(centsToDeg(Math.max(-SCALE_CENTS, Math.min(SCALE_CENTS, r.cents))));
    const face: Face = r.status === 'tuned' ? 'tuned' : far ? 'far' : r.status === 'near' ? 'idle' : 'off';
    this.faces.request(face, this.held);
  }

  // ------------------------------------------------------------------ intern

  private setNote(name: string, octave: number | null): void {
    const pretty = prettyNoteName(name);
    this.noteName.set(pretty.slice(0, 1));
    this.noteAcc.set(pretty.slice(1));
    this.noteOctave.set(octave === null ? '' : String(octave));
  }

  private setLeds(cents: number | null, tuned: boolean): void {
    const next = new Set<number>();
    if (cents !== null) {
      if (tuned) {
        for (let i = 0; i < LED_COUNT; i++) if (ledZone(i) === 'green') next.add(i);
      } else {
        for (const i of litLeds(cents)) next.add(i);
      }
    }
    for (const i of this.lit) {
      if (!next.has(i)) {
        toggleClass(this.leds[i] as Element, 'is-on', false);
        toggleClass(this.glows[i] as Element, 'is-on', false);
      }
    }
    for (const i of next) {
      if (!this.lit.has(i)) {
        toggleClass(this.leds[i] as Element, 'is-on', true);
        toggleClass(this.glows[i] as Element, 'is-on', true);
      }
    }
    this.lit = next;
  }

  private applyFace(face: Face): void {
    setData(this.element, 'face', face);
    const portrait = this.portraits.face(face);
    const url = portrait?.url ?? null;
    if (url === this.faceUrl) return;
    this.faceUrl = url;
    const [a, b] = this.faceLayers;
    if (url === null) {
      a.classList.remove('is-shown');
      b.classList.remove('is-shown');
      setData(this.element, 'photo', 'false');
      return;
    }
    // Crossfade: de verborgen laag krijgt de nieuwe foto en komt boven, de andere vervaagt.
    const next = this.activeLayer === 0 ? b : a;
    const prev = this.activeLayer === 0 ? a : b;
    // Focuspunt en zoom: het gezicht komt op het middelpunt van het gezichtsvak.
    const { x, y, zoom } = (portrait as Portrait).focus;
    const size = FACE_SIZE * zoom;
    next.setAttribute('width', fmt(size));
    next.setAttribute('height', fmt(size));
    next.setAttribute('x', fmt(CX - x * size));
    next.setAttribute('y', fmt(CY + FACE_DY - y * size));
    next.setAttribute('href', url);
    next.classList.add('is-shown');
    prev.classList.remove('is-shown');
    next.parentNode?.appendChild(next);
    this.activeLayer = this.activeLayer === 0 ? 1 : 0;
    setData(this.element, 'photo', 'true');
  }

  private applyBackground(): void {
    const url = this.portraits.background();
    const value = url ? `url("${url}")` : '';
    if (this.background.style.backgroundImage !== value) {
      this.background.style.backgroundImage = value;
      this.background.style.backgroundPosition = BACKGROUND_POSITION;
    }
    setData(this.element, 'bg', url ? 'true' : 'false');
  }

  private setNeedle(deg: number): void {
    this.targetDeg = deg;
    if (this.instant) {
      this.shownDeg = deg;
      this.applyNeedle();
      return;
    }
    if (!this.raf && this.shownDeg !== this.targetDeg) {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(100, Math.max(0, now - this.lastFrame));
    this.lastFrame = now;
    // Kritisch gedempte benadering: tijdconstante ~70 ms, onafhankelijk van de framerate.
    const k = 1 - Math.exp(-dt / 70);
    this.shownDeg += (this.targetDeg - this.shownDeg) * k;
    if (Math.abs(this.targetDeg - this.shownDeg) < 0.03) this.shownDeg = this.targetDeg;
    this.applyNeedle();
    this.raf = this.shownDeg === this.targetDeg ? 0 : requestAnimationFrame(this.tick);
  };

  private applyNeedle(): void {
    const d = this.shownDeg.toFixed(2);
    this.needle.setAttribute('transform', `rotate(${d} ${CX} ${CY})`);
    // Het gezicht draait tegengesteld mee, zodat het rechtop blijft.
    this.face.setAttribute('transform', `rotate(${(-this.shownDeg).toFixed(2)} ${CX} ${CY + FACE_DY})`);
  }
}
