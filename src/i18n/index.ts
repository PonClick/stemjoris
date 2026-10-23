// Klein eigen vertaalsysteem: t(key, params) met {plaatshouders}, taaldetectie, opslag van de
// keuze en een seintje bij wisselen. Raakt bij het importeren de DOM niet aan (testbaar in node).

import { en } from './en';
import { nl, type MessageKey, type Messages } from './nl';

export type Lang = 'nl' | 'en';
export type { MessageKey, Messages };

export const LANGS: readonly Lang[] = ['nl', 'en'];
export const DICTIONARIES: Readonly<Record<Lang, Messages>> = { nl, en };
/** Locale voor getallen (decimaalteken). */
export const NUMBER_LOCALE: Readonly<Record<Lang, string>> = { nl: 'nl-NL', en: 'en-GB' };

export const LANG_STORAGE_KEY = 'stemjoris.lang';

export function isLang(value: unknown): value is Lang {
  return value === 'nl' || value === 'en';
}

/**
 * Kies de taal uit de voorkeurslijst van de browser (navigator.languages): de eerste die
 * Nederlands (nl, nl-NL, nl-BE…) of Engels is, wint. Niets herkend: Engels.
 */
export function detectLang(languages: readonly string[] | null | undefined): Lang {
  for (const raw of languages ?? []) {
    const base = String(raw).trim().toLowerCase().split(/[-_]/)[0];
    if (base === 'nl') return 'nl';
    if (base === 'en') return 'en';
  }
  return 'en';
}

/** Vul {naam}-plaatshouders in. Onbekende plaatshouders blijven staan. */
export function format(template: string, params?: Readonly<Record<string, string | number>>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

let current: Lang = 'nl';
const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return current;
}

/** Vertaal een sleutel in de huidige taal (of een opgegeven taal). */
export function t(key: MessageKey, params?: Readonly<Record<string, string | number>>, lang: Lang = current): string {
  return format(DICTIONARIES[lang][key] ?? DICTIONARIES.nl[key], params);
}

function readStoredLang(): Lang | null {
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

function applyDocumentLang(lang: Lang): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = t('fullName', undefined, lang);
}

/** Bepaal de begintaal: eerst de bewaarde keuze, anders de browser. Zet ook <html lang>. */
export function initLang(): Lang {
  const stored = typeof window !== 'undefined' ? readStoredLang() : null;
  const langs = typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  current = stored ?? detectLang(langs);
  applyDocumentLang(current);
  return current;
}

/** Wissel van taal zonder herladen; bewaart de keuze en seint alle luisteraars. */
export function setLang(lang: Lang): void {
  if (!isLang(lang)) return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Opslag niet beschikbaar: de keuze geldt dan alleen voor deze sessie.
  }
  if (lang === current) return;
  current = lang;
  applyDocumentLang(lang);
  for (const cb of listeners) cb(lang);
}

export function onLangChange(cb: (lang: Lang) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
