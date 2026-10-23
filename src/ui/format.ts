// Weergave van noten, cent en hertz in de huidige taal (decimaalteken volgt de taal).

import { getLang, NUMBER_LOCALE, t, type Lang } from '../i18n';

const formatters = new Map<string, Intl.NumberFormat>();

function numberFormat(lang: Lang, digits: 1 | 2): Intl.NumberFormat {
  const key = `${lang}${digits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(NUMBER_LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(key, f);
  }
  return f;
}

/** 'F#' → 'F♯', 'Bb' → 'B♭'. */
export function prettyNoteName(name: string): string {
  if (name.length < 2) return name;
  return name[0] + name.slice(1).replace('#', '♯').replace('b', '♭');
}

/** Voor schermlezers: 'F#' → 'F kruis' / 'F sharp', 'Bb' → 'B mol' / 'B flat'. */
export function spokenNote(name: string, octave?: number | null): string {
  const base = name.length < 2 ? name : name[0] + name.slice(1).replace('#', t('noteSharp')).replace('b', t('noteFlat'));
  return octave === undefined || octave === null ? base : `${base} ${octave}`;
}

/** Cent met teken en echt minteken: '+12', '−7', '0'. */
export function formatCents(cents: number): string {
  const r = Math.round(cents);
  if (r === 0) return '0';
  return r > 0 ? `+${r}` : `−${Math.abs(r)}`;
}

export function formatHz(freq: number, digits: 1 | 2 = 1): string {
  return numberFormat(getLang(), digits).format(freq);
}
