// De stemmeter: grote nootnaam, naald van -50 tot +50 cent, cent- en hertzwaarde en een status.
// De DOM wordt één keer opgebouwd; per frame veranderen alleen teksten, data-attributen en de
// rotatie van de naald (geanimeerd met requestAnimationFrame, onafhankelijk van de meetsnelheid).

import { el, fromMarkup, LiveText, setData } from './dom';
import { formatCents, formatHz, prettyNoteName } from './format';
import { Mascot, type MascotMood } from './mascot';

/** Hoe ver de meting van het doel zit. */
export type MeterStatus = 'tuned' | 'near' | 'low' | 'high' | 'far-low' | 'far-high';

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
}

const SCALE_CENTS = 50;
const SWEEP_DEG = 56; // ±50 cent beslaat ±56 graden
const CX = 160;
const CY = 178;
const R = 148;

const STATUS_TEXT: Record<MeterStatus, { label: string; hint: string; arrow: string }> = {
  tuned: { label: 'Gobble! Gestemd', hint: 'tuna-perfect, binnen 3 cent', arrow: '✓' },
  near: { label: 'Bijna gestemd', hint: 'even laten doorklinken…', arrow: '≈' },
  low: { label: 'Te laag', hint: 'snaar spannen (hoger draaien)', arrow: '▲' },
  high: { label: 'Te hoog', hint: 'snaar vieren (lager draaien)', arrow: '▼' },
  'far-low': { label: 'Veel te laag', hint: 'flink spannen, buiten de schaal', arrow: '▲' },
  'far-high': { label: 'Veel te hoog', hint: 'flink vieren, buiten de schaal', arrow: '▼' },
};

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

const fmt = (n: number): string => n.toFixed(2);

function arcPath(r: number, fromDeg: number, toDeg: number): string {
  const [x1, y1] = polar(r, fromDeg);
  const [x2, y2] = polar(r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M${fmt(x1)} ${fmt(y1)}A${r} ${r} 0 ${large} 1 ${fmt(x2)} ${fmt(y2)}`;
}

const centsToDeg = (c: number): number => (c / SCALE_CENTS) * SWEEP_DEG;

function dialMarkup(): string {
  const ticks: string[] = [];
  for (let c = -50; c <= 50; c += 5) {
    const deg = centsToDeg(c);
    const major = c % 10 === 0;
    const len = c === 0 ? 20 : major ? 13 : 7;
    const [x1, y1] = polar(R - 4, deg);
    const [x2, y2] = polar(R - 4 - len, deg);
    ticks.push(
      `<line class="tick${major ? ' tick-major' : ''}${c === 0 ? ' tick-zero' : ''}" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}"/>`,
    );
  }
  const label = (c: number, text: string): string => {
    const [x, y] = polar(R - 40, centsToDeg(c));
    return `<text class="dial-label" x="${fmt(x)}" y="${fmt(y)}">${text}</text>`;
  };
  const edge = (side: -1 | 1): string => {
    const deg = side * (SWEEP_DEG + 7);
    const [x, y] = polar(R + 2, deg);
    // Driehoekje dat naar buiten wijst: zichtbaar als de meting buiten de schaal valt.
    const [ax, ay] = polar(R + 2, deg + side * 7);
    const [bx, by] = polar(R - 9, deg - side * 1);
    const [cx, cy] = polar(R + 13, deg - side * 1);
    return `<path class="edge edge-${side < 0 ? 'low' : 'high'}" d="M${fmt(ax)} ${fmt(ay)}L${fmt(bx)} ${fmt(by)}L${fmt(cx)} ${fmt(cy)}Z" data-x="${fmt(x)}" data-y="${fmt(y)}"/>`;
  };
  // Naald als veer: schacht vanaf de naaf, vaan naar de punt, scherpe punt voor het aflezen.
  const tipY = CY - (R - 8);
  const vaneTop = tipY + 6;
  const vaneBottom = CY - 46;
  const vane = `M${CX} ${vaneTop}C${CX + 9} ${vaneTop + 22} ${CX + 10} ${vaneBottom - 26} ${CX + 2.5} ${vaneBottom}L${CX - 2.5} ${vaneBottom}C${CX - 10} ${vaneBottom - 26} ${CX - 9} ${vaneTop + 22} ${CX} ${vaneTop}Z`;
  return `<svg class="dial" viewBox="0 0 320 196" aria-hidden="true" focusable="false">
    <path class="dial-track" d="${arcPath(R, -SWEEP_DEG, SWEEP_DEG)}"/>
    <path class="dial-zone-near" d="${arcPath(R, centsToDeg(-10), centsToDeg(10))}"/>
    <path class="dial-zone" d="${arcPath(R, centsToDeg(-3), centsToDeg(3))}"/>
    ${ticks.join('')}
    ${label(-50, '−50')}${label(-25, '−25')}${label(25, '+25')}${label(50, '+50')}
    ${edge(-1)}${edge(1)}
    <g class="needle" transform="rotate(0 ${CX} ${CY})">
      <path class="needle-vane" d="${vane}"/>
      <path class="needle-barbs" d="M${CX} ${vaneTop + 24}l-6 7M${CX} ${vaneTop + 24}l6 7M${CX} ${vaneTop + 44}l-6.5 7M${CX} ${vaneTop + 44}l6.5 7"/>
      <line class="needle-line" x1="${CX}" y1="${CY}" x2="${CX}" y2="${tipY}"/>
    </g>
    <circle class="needle-hub" cx="${CX}" cy="${CY}" r="9"/>
    <circle class="needle-hub-dot" cx="${CX}" cy="${CY}" r="3.2"/>
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
  readonly mascot: Mascot;
  private readonly needle: SVGGElement;
  private readonly noteName: LiveText;
  private readonly noteOctave: LiveText;
  private readonly centsText: LiveText;
  private readonly hzText: LiveText;
  private readonly targetText: LiveText;
  private readonly statusArrow: LiveText;
  private readonly statusLabel: LiveText;
  private readonly statusHint: LiveText;

  private targetDeg = 0;
  private shownDeg = 0;
  private raf = 0;
  private lastFrame = 0;
  private readonly instant = reducedMotion();

  constructor() {
    const name = el('span', { class: 'note-name' });
    const octave = el('span', { class: 'note-octave' });
    const note = el('div', { class: 'meter-note' }, [name, octave]);

    const dial = fromMarkup('div', { class: 'meter-dial' }, dialMarkup());
    const needle = dial.querySelector<SVGGElement>('.needle');
    if (!needle) throw new Error('Naald ontbreekt');
    this.needle = needle;

    const cents = el('span', { class: 'readout-value' });
    const hz = el('span', { class: 'readout-value' });
    const target = el('span', { class: 'readout-target' });
    const readouts = el('div', { class: 'meter-readouts' }, [
      el('div', { class: 'readout readout-cents' }, [cents, el('span', { class: 'readout-unit', text: 'cent' })]),
      el('div', { class: 'readout readout-hz' }, [hz, el('span', { class: 'readout-unit', text: 'Hz' }), target]),
    ]);

    // Cent links en Hz rechts van de naaf, in de onderhoeken van de wijzerplaat.
    dial.append(readouts);

    const arrow = el('span', { class: 'status-arrow', 'aria-hidden': 'true' });
    const label = el('span', { class: 'status-label' });
    const hint = el('span', { class: 'status-hint' });
    const status = el('div', { class: 'meter-status' }, [arrow, el('span', { class: 'status-text' }, [label, hint])]);

    this.mascot = new Mascot('mascot meter-mascot');
    const bubbles = el(
      'div',
      { class: 'meter-bubbles', 'aria-hidden': 'true' },
      Array.from({ length: 7 }, (_, i) => el('span', { class: 'bubble', style: `--i:${i}` })),
    );

    this.element = el('section', { class: 'meter', 'aria-label': 'Stemmeter', 'data-state': 'idle' }, [
      bubbles,
      el('div', { class: 'meter-top' }, [note, this.mascot.element]),
      dial,
      status,
    ]);

    this.noteName = new LiveText(name, '–');
    this.noteOctave = new LiveText(octave, '');
    this.centsText = new LiveText(cents, '–');
    this.hzText = new LiveText(hz, '–');
    this.targetText = new LiveText(target, '');
    this.statusArrow = new LiveText(arrow, '');
    this.statusLabel = new LiveText(label, '');
    this.statusHint = new LiveText(hint, '');
  }

  /** Geen (bruikbare) meting: naald terug naar het midden, alles gedimd, met een korte uitleg. */
  showMessage(message: string, hint = '', mood: MascotMood = 'sleep'): void {
    this.mascot.setMood(mood);
    setData(this.element, 'state', 'idle');
    setData(this.element, 'dir', 'center');
    this.centsText.set('–');
    this.hzText.set('–');
    this.statusArrow.set('');
    this.statusLabel.set(message);
    this.statusHint.set(hint);
    this.setNeedle(0);
  }

  /** Wis de laatst getoonde noot (bij wisselen van stemming of modus). */
  clearNote(): void {
    this.noteName.set('–');
    this.noteOctave.set('');
    this.targetText.set('');
  }

  /** Toon een doel zonder meting, bijvoorbeeld de vastgezette snaar of de referentietoon. */
  showTarget(name: string, octave: number, targetFreq: number): void {
    this.noteName.set(prettyNoteName(name));
    this.noteOctave.set(String(octave));
    this.targetText.set(`doel ${formatHz(targetFreq, 2)}`);
  }

  showReading(r: MeterReading): void {
    const far = r.status === 'far-low' || r.status === 'far-high';
    this.mascot.setMood(r.status === 'far-low' || r.status === 'far-high' ? 'far' : r.status);
    setData(this.element, 'state', r.status === 'tuned' ? 'tuned' : far ? 'far' : r.status === 'near' ? 'near' : 'live');
    setData(this.element, 'dir', r.cents < 0 ? 'low' : r.cents > 0 ? 'high' : 'center');
    this.noteName.set(prettyNoteName(r.name));
    this.noteOctave.set(String(r.octave));
    this.centsText.set(formatCents(r.cents));
    this.hzText.set(formatHz(r.freq));
    this.targetText.set(`doel ${formatHz(r.targetFreq, 2)}`);
    const t = STATUS_TEXT[r.status];
    this.statusArrow.set(t.arrow);
    this.statusLabel.set(t.label);
    this.statusHint.set(far ? `${t.hint} (${formatCents(r.cents)} cent)` : t.hint);
    this.setNeedle(centsToDeg(Math.max(-SCALE_CENTS, Math.min(SCALE_CENTS, r.cents))));
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
    this.needle.setAttribute('transform', `rotate(${this.shownDeg.toFixed(2)} ${CX} ${CY})`);
  }
}
