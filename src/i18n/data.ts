// Instrumentdata in de juiste taal, met terugval op het Nederlands uit src/data/instruments.ts.

import { CATEGORY_LABELS } from '../data/instruments';
import type { Instrument, InstrumentCategory, Tuning } from '../types';
import { CATEGORY_LABELS_EN, INSTRUMENT_NAMES_EN, TUNINGS_EN } from './data-en';
import { getLang, type Lang } from './index';

export const tuningKey = (instrumentId: string, tuningId: string): string => `${instrumentId}/${tuningId}`;

export function instrumentName(inst: Instrument, lang: Lang = getLang()): string {
  return (lang === 'en' && INSTRUMENT_NAMES_EN[inst.id]) || inst.name;
}

export function tuningName(instrumentId: string, tuning: Tuning, lang: Lang = getLang()): string {
  return (lang === 'en' && TUNINGS_EN[tuningKey(instrumentId, tuning.id)]?.name) || tuning.name;
}

export function tuningDescription(instrumentId: string, tuning: Tuning, lang: Lang = getLang()): string | undefined {
  if (tuning.description === undefined) return undefined;
  return (lang === 'en' && TUNINGS_EN[tuningKey(instrumentId, tuning.id)]?.description) || tuning.description;
}

export function categoryLabel(category: InstrumentCategory, lang: Lang = getLang()): string {
  return (lang === 'en' && CATEGORY_LABELS_EN[category]) || CATEGORY_LABELS[category] || category;
}
