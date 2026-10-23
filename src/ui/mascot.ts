// De mascotte: een tonijn met een kalkoenstaart (waaier van veren), snavel en rode lel.
// Eén inline SVG; de stemming (mood) wordt via een data-attribuut gezet en CSS toont de juiste
// ogen, mond en extraatjes. Animaties staan in style.css en respecteren prefers-reduced-motion.

import { fromMarkup, setData } from './dom';

export type MascotMood = 'sleep' | 'listen' | 'low' | 'high' | 'near' | 'tuned' | 'far';

const FEATHERS = [
  { angle: -150, fill: 'var(--feather-1)' },
  { angle: -120, fill: 'var(--feather-2)' },
  { angle: -90, fill: 'var(--feather-3)' },
  { angle: -60, fill: 'var(--feather-2)' },
  { angle: -30, fill: 'var(--feather-1)' },
];

function feathers(): string {
  return FEATHERS.map(
    (f) => `<g transform="rotate(${f.angle} 40 52)">
      <ellipse cx="40" cy="27" rx="8.5" ry="22" fill="${f.fill}"/>
      <path d="M33 17q7-6 14 0" fill="none" stroke="var(--feather-band)" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M40 48V9" stroke="var(--feather-quill)" stroke-width="1" opacity=".55"/>
    </g>`,
  ).join('');
}

/** SVG-opmaak van de mascotte, ook bruikbaar voor het logo. `idPrefix` houdt gradient-id's uniek. */
export function mascotMarkup(idPrefix: string): string {
  const g = `${idPrefix}-body`;
  return `<svg class="mascot-svg" viewBox="0 0 124 96" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--tuna-back)"/>
        <stop offset=".62" stop-color="var(--tuna-side)"/>
        <stop offset="1" stop-color="var(--tuna-belly)"/>
      </linearGradient>
    </defs>
    <g class="m-tail">${feathers()}</g>
    <g class="m-body">
      <path class="m-fin" d="M60 34 69 16 79 32Z" fill="var(--tuna-back)"/>
      <path d="M40 52C52 30 82 26 100 40c6 5 8 10 4 15-8 13-38 21-56 9-4-4-6-8-8-12Z" fill="url(#${g})" stroke="var(--mascot-line)" stroke-width="1.6"/>
      <path d="M47 41l3-4 1 5zM53 38l3-4 1 5zM59 36l3-4 1 5zM49 64l3 4 1-5zM55 67l3 4 1-5z" fill="var(--finlet)"/>
      <path d="M58 48c10 3 24 3 36-1" fill="none" stroke="var(--tuna-stripe)" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <path class="m-pec" d="M76 54 66 65 82 59Z" fill="var(--tuna-back)" opacity=".9"/>
      <path d="M103.5 48.5 112 51.5l-8.5 3.4z" fill="var(--beak)" stroke="var(--mascot-line)" stroke-width="1" stroke-linejoin="round"/>
      <path class="m-wattle" d="M102 55c-2 6-1 14 3 14s4-8 1.5-14z" fill="var(--wattle)" stroke="var(--mascot-line)" stroke-width="1"/>
      <circle cx="96" cy="53" r="3.2" fill="var(--cheek)" class="m-cheek"/>
    </g>
    <g class="m-face">
      <g class="m-eye m-eye-open"><circle cx="92" cy="43" r="5.2" fill="#fff" stroke="var(--mascot-line)" stroke-width="1.2"/><circle class="m-pupil" cx="93.2" cy="43" r="2.5" fill="#0b1520"/></g>
      <g class="m-eye m-eye-wide"><circle cx="92" cy="42.5" r="6.6" fill="#fff" stroke="var(--mascot-line)" stroke-width="1.2"/><circle cx="92.6" cy="42.5" r="1.6" fill="#0b1520"/></g>
      <path class="m-eye m-eye-happy" d="M87 45q5-7 10 0" fill="none" stroke="#0b1520" stroke-width="2.4" stroke-linecap="round"/>
      <path class="m-eye m-eye-closed" d="M87 43.5q5 4 10 0" fill="none" stroke="#0b1520" stroke-width="2.2" stroke-linecap="round"/>
      <path class="m-mouth m-mouth-smile" d="M97 57q4 3 7-1" fill="none" stroke="#0b1520" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse class="m-mouth m-mouth-o" cx="99.5" cy="58" rx="2" ry="2.6" fill="#0b1520"/>
      <path class="m-mouth m-mouth-flat" d="M97 57.5h6" stroke="#0b1520" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g class="m-extra m-zzz" fill="var(--text-muted)" font-weight="800" font-family="ui-rounded, system-ui, sans-serif">
      <text x="100" y="26" font-size="10">z</text><text x="108" y="16" font-size="13">Z</text>
    </g>
    <path class="m-extra m-sweat" d="M84 26c-3 4-4 7-1 8.5s5-2 1-8.5z" fill="var(--water)" stroke="var(--mascot-line)" stroke-width=".8"/>
    <g class="m-extra m-sparkle" fill="var(--sparkle)">
      <path d="M110 22l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/>
      <path d="M18 12l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/>
      <path d="M118 66l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>
    </g>
  </svg>`;
}

let counter = 0;

export class Mascot {
  readonly element: HTMLElement;
  private mood: MascotMood | '' = '';

  constructor(className = 'mascot') {
    counter += 1;
    this.element = fromMarkup('div', { class: className, 'aria-hidden': 'true' }, mascotMarkup(`tt-m${counter}`));
    this.setMood('sleep');
  }

  setMood(mood: MascotMood): void {
    if (mood === this.mood) return;
    this.mood = mood;
    setData(this.element, 'mood', mood);
  }
}
