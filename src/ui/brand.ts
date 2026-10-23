// Merk en portretten van Joris.
//
// FOTO'S TOEVOEGEN (Max): zet een of meer van deze bestanden in `public/` (naast index.html in de
// build). Alles is optioneel; wat ontbreekt valt terug zoals hieronder beschreven.
//
// Staat het gezicht niet mooi midden in de naald, pas dan PORTRAIT_FOCUS hieronder aan.
//
//   public/joris.jpg        basisportret, vierkant (ongeveer 512×512), gezicht in het midden
//   public/joris-tuned.jpg  gezicht bij 'gestemd' (intens, zelfverzekerd), vierkant ~512×512
//   public/joris-off.jpg    gezicht bij 'te laag' of 'te hoog' (sceptisch), vierkant ~512×512
//   public/joris-far.jpg    gezicht bij 'ver ernaast'; valt terug op joris-off.jpg
//   public/joris-idle.jpg   gezicht bij idle en luisteren; valt terug op joris.jpg
//   public/joris-bg.jpg     achtergrond achter de meter, liggend (ongeveer 1200×900); gedimd en vervaagd
//
// Elk ontbrekend gezicht valt terug op joris.jpg en daarna op een donkere naald met de letter J.
// De achtergrond gebruikt joris-bg.jpg, anders het idle- of basisportret, anders alleen het metaal,
// en wisselt niet mee met de stemtoestand. De foto's komen nooit in het app-icoon of het manifest.
// Uitsnijden kan met `sips -c <h> <w> --cropOffset <y> <x> in.jpg --out uit.jpg` en
// `sips -z 512 512 uit.jpg`. Een ontbrekend bestand kan in de console één 404-melding geven; dat is
// verwacht.

export const PORTRAIT_FILES = {
  base: './joris.jpg',
  tuned: './joris-tuned.jpg',
  off: './joris-off.jpg',
  far: './joris-far.jpg',
  idle: './joris-idle.jpg',
  bg: './joris-bg.jpg',
} as const;

export type PortraitFile = keyof typeof PORTRAIT_FILES;

/**
 * Focuspunt per foto, zodat het gezicht midden in de smalle naald valt: x en y als fractie van
 * de breedte en hoogte (0..1) waar het gezicht zit (tussen de ogen), en zoom (1 = de hele foto
 * vult het gezichtsvak van de naald). Pas dit aan als Max andere foto's aanlevert.
 */
export interface Focus {
  x: number;
  y: number;
  zoom: number;
}

export const PORTRAIT_FOCUS: Partial<Record<PortraitFile, Focus>> = {
  tuned: { x: 0.585, y: 0.22, zoom: 2.4 },
  off: { x: 0.5, y: 0.47, zoom: 1.15 },
  far: { x: 0.505, y: 0.33, zoom: 2.1 },
  idle: { x: 0.48, y: 0.38, zoom: 1.2 },
};
const DEFAULT_FOCUS: Focus = { x: 0.5, y: 0.45, zoom: 1.2 };

/** Achtergrond: CSS background-position (het gezicht in beeld houden). */
export const BACKGROUND_POSITION = '50% 30%';

export interface Portrait {
  url: string;
  focus: Focus;
}

/** Welk gezicht de naald toont. */
export type Face = 'idle' | 'off' | 'far' | 'tuned';

const FACE_CHAIN: Record<Face, PortraitFile[]> = {
  tuned: ['tuned', 'base'],
  off: ['off', 'base'],
  far: ['far', 'off', 'base'],
  idle: ['idle', 'base'],
};
const BG_CHAIN: PortraitFile[] = ['bg', 'idle', 'base'];

/** Zo lang moet een nieuw gezicht aanhouden voordat de naald wisselt (behalve naar 'gestemd'). */
export const FACE_DEBOUNCE_MS = 250;

/** Laadt alle portretten vooraf en houdt bij welke er zijn. */
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

  /** URL voor een gezicht, of null als er geen enkele foto voor is (dan de J-naald). */
  face(face: Face): Portrait | null {
    const hit = FACE_CHAIN[face].find((k) => this.available.has(k));
    return hit ? { url: PORTRAIT_FILES[hit], focus: PORTRAIT_FOCUS[hit] ?? DEFAULT_FOCUS } : null;
  }

  background(): string | null {
    const hit = BG_CHAIN.find((k) => this.available.has(k));
    return hit ? PORTRAIT_FILES[hit] : null;
  }

  /** Seintje telkens als een foto binnen is (of definitief ontbreekt). */
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
