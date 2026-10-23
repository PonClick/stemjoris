// Instellingen onthouden in localStorage. Alles in try/catch: de app werkt ook zonder opslag
// (privévenster, geblokkeerde sitegegevens, Safari met volle opslag).

export type TunerMode = 'auto' | 'fixed' | 'chromatic';

export const TUNER_MODES: readonly TunerMode[] = ['auto', 'fixed', 'chromatic'];
export const A4_MIN = 415;
export const A4_MAX = 466;

export interface StoredSettings {
  instrumentId: string;
  tuningId: string;
  mode: TunerMode;
  a4: number;
  toneEnabled: boolean;
}

const KEY = 'stemjoris.settings.v1';
/** Oude naam van de app; sleutels met dit voorvoegsel worden eenmalig overgezet. */
const LEGACY_PREFIX = 'turkeytuna';
const PREFIX = 'stemjoris';

/**
 * Eenmalige migratie van de oude sleutels (`turkeytuna.*` → `stemjoris.*`), zodat bestaande
 * instellingen behouden blijven. Een bestaande nieuwe sleutel wint; de oude wordt daarna gewist.
 */
export function migrateLegacyStorage(): void {
  try {
    const storage = window.localStorage;
    const legacy: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) legacy.push(k);
    }
    for (const oldKey of legacy) {
      const newKey = PREFIX + oldKey.slice(LEGACY_PREFIX.length);
      const value = storage.getItem(oldKey);
      if (value !== null && storage.getItem(newKey) === null) storage.setItem(newKey, value);
      storage.removeItem(oldKey);
    }
  } catch {
    // Geen opslag of geen schrijfrechten: niets te migreren.
  }
}

export function isTunerMode(value: unknown): value is TunerMode {
  return typeof value === 'string' && (TUNER_MODES as readonly string[]).includes(value);
}

export function clampA4(value: number): number {
  if (!Number.isFinite(value)) return 440;
  return Math.min(A4_MAX, Math.max(A4_MIN, Math.round(value)));
}

/** Lees wat er bewaard is; ongeldige of ontbrekende velden worden weggelaten. */
export function loadSettings(): Partial<StoredSettings> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return {};
  }
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return {};
    const d = data as Record<string, unknown>;
    const out: Partial<StoredSettings> = {};
    if (typeof d.instrumentId === 'string') out.instrumentId = d.instrumentId;
    if (typeof d.tuningId === 'string') out.tuningId = d.tuningId;
    if (isTunerMode(d.mode)) out.mode = d.mode;
    if (typeof d.a4 === 'number' && d.a4 >= A4_MIN && d.a4 <= A4_MAX) out.a4 = Math.round(d.a4);
    if (typeof d.toneEnabled === 'boolean') out.toneEnabled = d.toneEnabled;
    return out;
  } catch {
    return {};
  }
}

export function saveSettings(settings: StoredSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Opslag niet beschikbaar: stil negeren, de app blijft werken.
  }
}
