// Merk en portretten: een getekende cartoonfiguur in de naald, geen foto's.
//
// Joris is bewust onherkenbaar: de naald toont een karikatuur (kuif, baard, mouwloos werkhemd,
// tattoo-sleeve), geen echte foto. Foto's horen niet in deze openbare repo en worden niet meer
// ondersteund (`.gitignore` blokkeert `public/joris*.jpg/png/webp`). Wie de figuur wil aanpassen,
// vervangt alleen deze handgetekende SVG's in `public/cartoon/` (vierkant, viewBox 0 0 512 512,
// gezicht rond (256, 200), zonder scripts of ingebedde bitmaps):
//
//   cartoon/joris-idle.svg   idle en luisteren: slok uit een bierbekertje, ogen dicht
//   cartoon/joris-tuned.svg  'gestemd': brede grijns en duim omhoog; valt terug op idle
//   cartoon/joris-off.svg    'te laag' of 'te hoog': sceptisch; valt terug op idle
//   cartoon/joris-far.svg    'ver ernaast': grimas en duivelshoorns; valt terug op off, dan idle
//   cartoon/bass-bg.svg      achtergrond achter de meter: getekende contrabas, liggend
//                            (1200×900); gedimd en vervaagd, wisselt niet mee met de stemtoestand
//
// Ontbreekt er toch een bestand, dan volgt de terugval hierboven en daarna een donkere naald met de
// letter J; zonder achtergrond blijft alleen het metaal. De service worker precachet deze SVG's als
// vaste app-assets (verhoog daar VERSION als je ze vervangt). Staat het gezicht niet mooi midden in
// de naald, pas dan PORTRAIT_FOCUS hieronder aan. De figuur komt nooit in het app-icoon of het manifest.

export const PORTRAIT_FILES = {
  idle: './cartoon/joris-idle.svg',
  tuned: './cartoon/joris-tuned.svg',
  off: './cartoon/joris-off.svg',
  far: './cartoon/joris-far.svg',
  bg: './cartoon/bass-bg.svg',
} as const;

export type PortraitFile = keyof typeof PORTRAIT_FILES;

/**
 * Focuspunt per tekening, zodat het gezicht midden in de smalle naald valt: x en y als fractie van
 * de breedte en hoogte (0..1) waar het gezicht zit, en zoom (1 = de hele tekening vult het
 * gezichtsvak van de naald). Alle cartoons delen dezelfde opbouw, dus hetzelfde focuspunt.
 */
export interface Focus {
  x: number;
  y: number;
  zoom: number;
}

const CARTOON_FOCUS: Focus = { x: 0.5, y: 0.41, zoom: 1.4 };
export const PORTRAIT_FOCUS: Partial<Record<PortraitFile, Focus>> = {
  tuned: CARTOON_FOCUS,
  off: CARTOON_FOCUS,
  far: CARTOON_FOCUS,
  idle: CARTOON_FOCUS,
};
const DEFAULT_FOCUS: Focus = CARTOON_FOCUS;

/** Achtergrond: CSS background-position (de contrabas in beeld houden). */
export const BACKGROUND_POSITION = '50% 40%';

export interface Portrait {
  url: string;
  focus: Focus;
}

/** Welk gezicht de naald toont. */
export type Face = 'idle' | 'off' | 'far' | 'tuned';

const FACE_CHAIN: Record<Face, PortraitFile[]> = {
  tuned: ['tuned', 'idle'],
  off: ['off', 'idle'],
  far: ['far', 'off', 'idle'],
  idle: ['idle'],
};
const BG_CHAIN: PortraitFile[] = ['bg'];

/** Zo lang moet een nieuw gezicht aanhouden voordat de naald wisselt (behalve naar 'gestemd'). */
export const FACE_DEBOUNCE_MS = 250;

/** Laadt alle tekeningen vooraf en houdt bij welke er zijn. */
export class PortraitLibrary {
  private readonly available = new Set<PortraitFile>();
  private readonly listeners = new Set<() => void>();
  private pending = 0;

  constructor() {
    if (typeof Image === 'undefined') return;
    for (const key of Object.keys(PORTRAIT_FILES) as PortraitFile[]) {
      const img = new Image();
      img.decoding = 'async';
      this.pending += 1;
      img.addEventListener('load', () => {
        if (img.naturalWidth > 0) this.available.add(key);
        this.done();
      });
      img.addEventListener('error', () => this.done());
      img.src = PORTRAIT_FILES[key];
    }
  }

  /** URL voor een gezicht, of null als er geen enkele tekening voor is (dan de J-naald). */
  face(face: Face): Portrait | null {
    const hit = FACE_CHAIN[face].find((k) => this.available.has(k));
    return hit ? { url: PORTRAIT_FILES[hit], focus: PORTRAIT_FOCUS[hit] ?? DEFAULT_FOCUS } : null;
  }

  background(): string | null {
    const hit = BG_CHAIN.find((k) => this.available.has(k));
    return hit ? PORTRAIT_FILES[hit] : null;
  }

  /** Seintje telkens als een tekening binnen is (of definitief ontbreekt). */
  onChange(cb: () => void): void {
    this.listeners.add(cb);
  }

  private done(): void {
    this.pending -= 1;
    for (const cb of this.listeners) cb();
  }
}

/**
 * Bepaalt welk gezicht er staat, zonder flikkering: een nieuw gezicht moet FACE_DEBOUNCE_MS
 * aanhouden; 'gestemd' gaat direct (dat heeft al een eigen houdtijd). Tijdens 'held' blijft het
 * huidige gezicht staan.
 */
export class FaceSwitcher {
  private shown: Face = 'idle';
  private pending: Face | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly apply: (face: Face) => void) {}

  get current(): Face {
    return this.shown;
  }

  request(face: Face, held = false): void {
    if (held) {
      this.cancel();
      return;
    }
    if (face === this.shown) {
      this.cancel();
      return;
    }
    if (face === this.pending) return;
    this.cancel();
    if (face === 'tuned') {
      this.show(face);
      return;
    }
    this.pending = face;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.pending = null;
      this.show(face);
    }, FACE_DEBOUNCE_MS);
  }

  /** Direct wisselen (bijvoorbeeld na het stoppen). */
  force(face: Face): void {
    this.cancel();
    this.show(face);
  }

  private show(face: Face): void {
    this.shown = face;
    this.apply(face);
  }

  private cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
  }
}
