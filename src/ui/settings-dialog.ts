// Instellingenpaneel: A4-referentie (415–466 Hz) met snelknoppen, plus een korte privacy-uitleg.

import { el, fromMarkup } from './dom';
import { ICON_CLOSE } from './icons';
import { A4_MAX, A4_MIN, clampA4 } from './settings-store';

const PRESETS = [432, 440, 442];

export class SettingsDialog {
  readonly element: HTMLDialogElement;
  private readonly range: HTMLInputElement;
  private readonly number: HTMLInputElement;
  private readonly presetButtons: HTMLButtonElement[];
  private value: number;

  constructor(initialA4: number, private readonly onA4: (a4: number) => void) {
    this.value = initialA4;

    this.range = el('input', {
      type: 'range',
      id: 'a4-range',
      min: A4_MIN,
      max: A4_MAX,
      step: 1,
      value: initialA4,
      'aria-describedby': 'a4-help',
    });
    this.number = el('input', {
      type: 'number',
      id: 'a4-number',
      class: 'a4-number',
      min: A4_MIN,
      max: A4_MAX,
      step: 1,
      value: initialA4,
      inputmode: 'numeric',
      'aria-label': 'A4 in hertz',
    });
    this.presetButtons = PRESETS.map((p) => {
      const b = el('button', { type: 'button', class: 'chip', 'aria-label': `A4 op ${p} hertz`, text: `${p} Hz` });
      b.addEventListener('click', () => this.set(p, true));
      return b;
    });

    this.range.addEventListener('input', () => this.set(Number(this.range.value), true));
    this.number.addEventListener('change', () => this.set(Number(this.number.value), true));

    const close = fromMarkup('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Instellingen sluiten' }, ICON_CLOSE);

    const form = el('form', { method: 'dialog', class: 'sheet' }, [
      el('header', { class: 'sheet-head' }, [el('h2', { id: 'settings-title', text: 'Instellingen' }), close]),
      el('div', { class: 'sheet-section' }, [
        el('div', { class: 'a4-row' }, [
          el('label', { for: 'a4-range', class: 'field-label', text: 'Referentietoon A4' }),
          el('span', { class: 'a4-value' }, [this.number, el('span', { class: 'unit', text: 'Hz' })]),
        ]),
        this.range,
        el('div', { class: 'range-scale', 'aria-hidden': 'true' }, [
          el('span', { text: `${A4_MIN}` }),
          el('span', { text: `${A4_MAX}` }),
        ]),
        el('div', { class: 'chips', role: 'group', 'aria-label': 'Snelkeuze A4' }, this.presetButtons),
        el('p', {
          id: 'a4-help',
          class: 'help',
          text: '440 Hz is de standaard. Sommige orkesten stemmen op 442 Hz; 432 Hz is een alternatieve stemming. Alle noten en referentietonen schuiven mee.',
        }),
      ]),
      el('div', { class: 'sheet-section about' }, [
        el('h3', { text: 'Over TurkeyTuna' }),
        el('p', {
          class: 'help',
          text: 'Alles gebeurt op je eigen apparaat: het microfoongeluid gaat nergens naartoe en de app werkt ook offline. Tip: zet hem op je beginscherm.',
        }),
      ]),
    ]);

    this.element = el('dialog', { class: 'settings-dialog', 'aria-labelledby': 'settings-title' }, [form]);
    close.addEventListener('click', () => this.close());
    // Klik op de achtergrond sluit het paneel.
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });
    this.sync();
  }

  open(): void {
    if (this.element.open) return;
    if (typeof this.element.showModal === 'function') this.element.showModal();
    else this.element.setAttribute('open', '');
  }

  close(): void {
    if (typeof this.element.close === 'function') this.element.close();
    else this.element.removeAttribute('open');
  }

  private set(value: number, notify: boolean): void {
    if (!Number.isFinite(value) || value <= 0) {
      this.sync();
      return;
    }
    const v = clampA4(value);
    const changed = v !== this.value;
    this.value = v;
    this.sync();
    if (changed && notify) this.onA4(v);
  }

  private sync(): void {
    const s = String(this.value);
    if (this.range.value !== s) this.range.value = s;
    if (this.number.value !== s) this.number.value = s;
    this.range.setAttribute('aria-valuetext', `${s} hertz`);
    this.presetButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(PRESETS[i] === this.value)));
  }
}
