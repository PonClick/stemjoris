// Instellingenpaneel: A4-referentie (415–466 Hz) met snelknoppen, taalkeuze en een Over-blok.

import { getLang, LANGS, onLangChange, setLang, t, type Lang } from '../i18n';
import { el, fromMarkup, LiveText } from './dom';
import { ICON_CLOSE } from './icons';
import { A4_MAX, A4_MIN, clampA4 } from './settings-store';

const PRESETS = [432, 440, 442];
const LANG_NAMES: Record<Lang, string> = { nl: 'Nederlands', en: 'English' };

export class SettingsDialog {
  readonly element: HTMLDialogElement;
  private readonly range: HTMLInputElement;
  private readonly number: HTMLInputElement;
  private readonly presetButtons: HTMLButtonElement[];
  private readonly presetGroup: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly langInputs: Record<Lang, HTMLInputElement>;
  private readonly langGroup: HTMLFieldSetElement;
  private readonly texts: Array<[LiveText, Parameters<typeof t>[0]]> = [];
  private value: number;

  constructor(initialA4: number, private readonly onA4: (a4: number) => void) {
    this.value = initialA4;
    const text = (tag: 'h2' | 'h3' | 'p' | 'label' | 'legend' | 'span', attrs: Record<string, string>, key: Parameters<typeof t>[0]) => {
      const node = el(tag, attrs);
      this.texts.push([new LiveText(node), key]);
      return node;
    };

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
    });
    this.presetButtons = PRESETS.map((p) => {
      const b = el('button', { type: 'button', class: 'chip', text: `${p} Hz` });
      b.addEventListener('click', () => this.set(p, true));
      return b;
    });

    this.range.addEventListener('input', () => this.set(Number(this.range.value), true));
    this.number.addEventListener('change', () => this.set(Number(this.number.value), true));

    this.closeButton = fromMarkup('button', { type: 'button', class: 'icon-btn' }, ICON_CLOSE);
    this.presetGroup = el('div', { class: 'chips', role: 'group' }, this.presetButtons);

    // Taal: echte radioknoppen in een segmented control.
    const langInputs = {} as Record<Lang, HTMLInputElement>;
    const langOptions = LANGS.map((lang) => {
      const input = el('input', { type: 'radio', name: 'lang', value: lang, id: `lang-${lang}`, class: 'segment-input' });
      input.addEventListener('change', () => {
        if (input.checked) setLang(lang);
      });
      langInputs[lang] = input;
      return el('label', { class: 'segment', for: `lang-${lang}`, lang }, [input, el('span', { text: LANG_NAMES[lang] })]);
    });
    this.langInputs = langInputs;
    this.langGroup = el('fieldset', { class: 'segmented segmented-2' }, [text('legend', { class: 'sr-only' }, 'langTitle'), ...langOptions]);

    const form = el('form', { method: 'dialog', class: 'sheet' }, [
      el('header', { class: 'sheet-head' }, [text('h2', { id: 'settings-title' }, 'settingsTitle'), this.closeButton]),
      el('div', { class: 'sheet-section' }, [
        el('div', { class: 'a4-row' }, [
          text('label', { for: 'a4-range', class: 'field-label' }, 'a4Label'),
          el('span', { class: 'a4-value' }, [this.number, el('span', { class: 'unit', text: 'Hz' })]),
        ]),
        this.range,
        el('div', { class: 'range-scale', 'aria-hidden': 'true' }, [el('span', { text: `${A4_MIN}` }), el('span', { text: `${A4_MAX}` })]),
        this.presetGroup,
        text('p', { id: 'a4-help', class: 'help' }, 'a4Help'),
      ]),
      el('div', { class: 'sheet-section' }, [text('h3', { class: 'field-label' }, 'langTitle'), this.langGroup]),
      el('div', { class: 'sheet-section about' }, [
        text('h3', {}, 'aboutTitle'),
        text('p', { class: 'help about-made' }, 'aboutMadeFor'),
        text('p', { class: 'help' }, 'aboutPrivacy'),
        text('p', { class: 'help about-egg' }, 'aboutEaster'),
      ]),
    ]);

    this.element = el('dialog', { class: 'settings-dialog', 'aria-labelledby': 'settings-title' }, [form]);
    this.closeButton.addEventListener('click', () => this.close());
    // Klik op de achtergrond sluit het paneel.
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });
    onLangChange(() => this.relabel());
    this.relabel();
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

  relabel(): void {
    for (const [node, key] of this.texts) node.set(t(key));
    this.closeButton.setAttribute('aria-label', t('settingsClose'));
    this.number.setAttribute('aria-label', t('a4Aria'));
    this.presetGroup.setAttribute('aria-label', t('a4Presets'));
    this.presetButtons.forEach((b, i) => b.setAttribute('aria-label', t('a4Preset', { hz: PRESETS[i] ?? '' })));
    this.langInputs[getLang()].checked = true;
    this.sync();
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
    this.range.setAttribute('aria-valuetext', t('a4ValueText', { hz: s }));
    this.presetButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(PRESETS[i] === this.value)));
  }
}
