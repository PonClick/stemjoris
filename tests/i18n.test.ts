import { describe, expect, it } from 'vitest';
import { CATEGORY_LABELS, INSTRUMENTS } from '../src/data/instruments';
import { categoryLabel, instrumentName, tuningDescription, tuningName } from '../src/i18n/data';
import { CATEGORY_LABELS_EN, INSTRUMENT_NAMES_EN, TUNINGS_EN } from '../src/i18n/data-en';
import { en } from '../src/i18n/en';
import { DICTIONARIES, detectLang, format, t } from '../src/i18n/index';
import { nl } from '../src/i18n/nl';

describe('woordenlijsten', () => {
  it('nl en en hebben exact dezelfde sleutels', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(nl).sort());
  });

  it('bevatten geen lege strings', () => {
    for (const [lang, dict] of Object.entries(DICTIONARIES)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect(value.trim().length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('gebruiken in beide talen dezelfde plaatshouders', () => {
    const holes = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(nl) as (keyof typeof nl)[]) {
      expect(holes(en[key]), key).toEqual(holes(nl[key]));
    }
  });

  it('bevatten geen restanten van de oude naam', () => {
    for (const dict of Object.values(DICTIONARIES)) {
      for (const value of Object.values(dict)) expect(value).not.toMatch(/turkey|tuna|gobble|tonijn|kalkoen/i);
    }
  });

  it('vult plaatshouders in', () => {
    expect(format('{note} gestemd', { note: 'E 2' })).toBe('E 2 gestemd');
    expect(t('announceTuned', { note: 'A 2' }, 'en')).toBe('A 2 in tune');
    expect(t('targetHz', { hz: '41,20' }, 'nl')).toBe('doel 41,20');
  });
});

describe('instrumentdata in het Engels', () => {
  it('heeft een vertaling voor elk instrument', () => {
    for (const inst of INSTRUMENTS) {
      expect(INSTRUMENT_NAMES_EN[inst.id], inst.id).toBeTruthy();
      expect(instrumentName(inst, 'en')).toBe(INSTRUMENT_NAMES_EN[inst.id]);
      expect(instrumentName(inst, 'nl')).toBe(inst.name);
    }
  });

  it('heeft een naam (en waar nodig een beschrijving) voor elke stemming', () => {
    for (const inst of INSTRUMENTS) {
      for (const tn of inst.tunings) {
        const key = `${inst.id}/${tn.id}`;
        const tr = TUNINGS_EN[key];
        expect(tr?.name, key).toBeTruthy();
        expect(tuningName(inst.id, tn, 'en')).toBe(tr?.name);
        if (tn.description) expect(tr?.description, `${key} description`).toBeTruthy();
        else expect(tr?.description, `${key} heeft geen NL-beschrijving`).toBeUndefined();
        expect(tuningDescription(inst.id, tn, 'nl')).toBe(tn.description);
      }
    }
  });

  it('heeft geen vertalingen voor onbekende ids', () => {
    const instIds = new Set(INSTRUMENTS.map((i) => i.id));
    const tuningIds = new Set(INSTRUMENTS.flatMap((i) => i.tunings.map((tn) => `${i.id}/${tn.id}`)));
    for (const id of Object.keys(INSTRUMENT_NAMES_EN)) expect(instIds.has(id), id).toBe(true);
    for (const id of Object.keys(TUNINGS_EN)) expect(tuningIds.has(id), id).toBe(true);
  });

  it('heeft een vertaling voor elke categorie', () => {
    for (const cat of Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]) {
      expect(CATEGORY_LABELS_EN[cat], cat).toBeTruthy();
      expect(categoryLabel(cat, 'en')).toBe(CATEGORY_LABELS_EN[cat]);
      expect(categoryLabel(cat, 'nl')).toBe(CATEGORY_LABELS[cat]);
    }
    for (const inst of INSTRUMENTS) expect(CATEGORY_LABELS_EN[inst.category], inst.id).toBeTruthy();
  });

  it('vertaalt muzikaal correct', () => {
    const name = (id: string): string | undefined => INSTRUMENT_NAMES_EN[id];
    expect(name('altviool')).toBe('Viola');
    expect(name('contrabas')).toBe('Double bass');
    expect(name('ukelele')).toMatch(/^Ukulele/);
    expect(TUNINGS_EN['gitaar-6/half-step-down']?.name).toMatch(/^Half step down/);
    expect(TUNINGS_EN['gitaar-6/whole-step-down']?.name).toMatch(/^Whole step down/);
    expect(TUNINGS_EN['gitaar-6/lute']?.name).toMatch(/^Lute tuning/);
    expect(TUNINGS_EN['contrabas/standaard']?.name).toMatch(/^Orchestral tuning/);
    expect(TUNINGS_EN['contrabas/solo']?.name).toMatch(/^Solo tuning/);
  });
});

describe('taaldetectie', () => {
  it('kiest Nederlands voor nl-varianten', () => {
    expect(detectLang(['nl-NL'])).toBe('nl');
    expect(detectLang(['nl'])).toBe('nl');
    expect(detectLang(['nl-BE', 'fr-BE'])).toBe('nl');
    expect(detectLang(['NL_nl'])).toBe('nl');
  });

  it('kiest Engels voor andere talen', () => {
    expect(detectLang(['de-DE'])).toBe('en');
    expect(detectLang(['en-US'])).toBe('en');
    expect(detectLang(['fr-FR', 'es'])).toBe('en');
    expect(detectLang([])).toBe('en');
    expect(detectLang(undefined)).toBe('en');
  });

  it('volgt de voorkeursvolgorde', () => {
    expect(detectLang(['de-DE', 'nl-NL', 'en'])).toBe('nl');
    expect(detectLang(['en-GB', 'nl-NL'])).toBe('en');
  });
});
