// Snaarknoppen: nootnaam groot, octaaf klein. Toont de actieve snaar, het vastgezette doel,
// welke snaren deze sessie al gestemd zijn en welke referentietoon klinkt.

import type { ScientificNote } from '../types';
import { el, toggleClass } from './dom';
import { prettyNoteName, spokenNote } from './format';
import { ICON_CHECK, ICON_SPEAKER } from './icons';

export interface StringButtonInfo {
  note: ScientificNote;
  name: string;
  octave: number;
}

export type StringAction = 'fix' | 'tone';

export class StringsPanel {
  readonly element: HTMLElement;
  private buttons: HTMLButtonElement[] = [];
  private infos: StringButtonInfo[] = [];
  private active = -1;
  private sounding = -1;
  private action: StringAction = 'fix';
  private pressedIndex = -1;

  constructor(private readonly onTap: (index: number) => void) {
    this.element = el('div', { class: 'strings', role: 'group', 'aria-label': 'Snaren' });
  }

  setStrings(infos: StringButtonInfo[]): void {
    this.infos = infos;
    this.active = -1;
    this.sounding = -1;
    this.pressedIndex = -1;
    const count = infos.length;
    this.element.style.setProperty('--count', String(count));
    this.element.style.setProperty('--cols', String(count <= 6 ? count : Math.ceil(count / 2)));
    this.element.dataset.count = String(count);
    this.buttons = infos.map((info, i) => {
      const btn = el('button', { type: 'button', class: 'string-btn' }, [
        el('span', { class: 'string-num', text: String(count - i), 'aria-hidden': 'true' }),
        el('span', { class: 'string-note', 'aria-hidden': 'true' }, [
          el('span', { class: 'string-name', text: prettyNoteName(info.name) }),
          el('span', { class: 'string-octave', text: String(info.octave) }),
        ]),
        el('span', { class: 'string-check', 'aria-hidden': 'true' }),
        el('span', { class: 'string-speaker', 'aria-hidden': 'true' }),
      ]);
      (btn.querySelector('.string-check') as HTMLElement).innerHTML = ICON_CHECK;
      (btn.querySelector('.string-speaker') as HTMLElement).innerHTML = ICON_SPEAKER;
      btn.addEventListener('click', () => this.onTap(i));
      return btn;
    });
    this.element.replaceChildren(...this.buttons);
    this.updateLabels();
  }

  /** Wat een tik doet: doel vastzetten of referentietoon spelen (bepaalt labels en icoon). */
  setAction(action: StringAction): void {
    this.action = action;
    this.element.dataset.action = action;
    this.updateLabels();
  }

  /** Snaar die nu gemeten wordt (licht op), -1 voor geen. */
  setActive(index: number): void {
    if (index === this.active) return;
    if (this.buttons[this.active]) toggleClass(this.buttons[this.active], 'is-active', false);
    this.active = index;
    if (this.buttons[index]) toggleClass(this.buttons[index], 'is-active', true);
  }

  /** Vastgezet doel (modus 'Vaste snaar'), -1 voor geen. */
  setPressed(index: number): void {
    if (index === this.pressedIndex) return;
    this.pressedIndex = index;
    this.updateLabels();
  }

  setSounding(index: number): void {
    if (index === this.sounding) return;
    if (this.buttons[this.sounding]) toggleClass(this.buttons[this.sounding], 'is-sounding', false);
    this.sounding = index;
    if (this.buttons[index]) toggleClass(this.buttons[index], 'is-sounding', true);
  }

  markTuned(index: number, tuned: boolean): void {
    const btn = this.buttons[index];
    if (!btn) return;
    toggleClass(btn, 'is-tuned', tuned);
    this.updateLabel(index);
  }

  clearTuned(): void {
    this.buttons.forEach((b, i) => {
      toggleClass(b, 'is-tuned', false);
      this.updateLabel(i);
    });
  }

  private updateLabels(): void {
    this.buttons.forEach((_, i) => this.updateLabel(i));
  }

  private updateLabel(i: number): void {
    const btn = this.buttons[i];
    const info = this.infos[i];
    if (!btn || !info) return;
    const n = this.infos.length - i;
    const spoken = spokenNote(info.name, info.octave);
    const done = btn.classList.contains('is-tuned') ? ', gestemd' : '';
    const label = this.action === 'tone' ? `Snaar ${n}, ${spoken}: toon afspelen${done}` : `Snaar ${n}, ${spoken}: stem op deze snaar${done}`;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', String(i === this.pressedIndex));
  }
}
