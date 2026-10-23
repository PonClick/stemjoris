// Poort met hysterese tussen toonhoogtedetectie en UI. Puur, zonder DOM.
//
// Een geplukte snaar begint luid en zuiver en klinkt daarna uit: volume en betrouwbaarheid zakken,
// terwijl de toon nog prima te meten is. Daarom twee drempels:
//  - aanslag: een nieuwe toon moet duidelijk zijn (minClarity, minRms);
//  - uitklinken: zolang er net een toon was, telt ook een zwakker blok mee, mits het bij dezelfde
//    noot blijft (binnen sustainCents van de vorige geaccepteerde meting).

export interface GateOptions {
  /** Betrouwbaarheid voor een nieuwe toon (standaard 0.8). */
  minClarity?: number;
  /** RMS voor een nieuwe toon (standaard 0.005). */
  minRms?: number;
  /** Betrouwbaarheid tijdens het uitklinken (standaard 0.5). */
  sustainClarity?: number;
  /** RMS tijdens het uitklinken (standaard 0.0012). */
  sustainRms?: number;
  /** Maximale afwijking van de vorige meting tijdens het uitklinken (standaard 60 cent). */
  sustainCents?: number;
  /** Zo lang na de laatste geaccepteerde meting geldt de uitklinkdrempel nog (standaard 300 ms). */
  sustainGapMs?: number;
}

export class PitchGate {
  readonly minClarity: number;
  readonly minRms: number;
  readonly sustainClarity: number;
  readonly sustainRms: number;
  private readonly sustainCents: number;
  private readonly sustainGapMs: number;
  private lastFreq = 0;
  private lastTime = Number.NEGATIVE_INFINITY;

  constructor(opts: GateOptions = {}) {
    this.minClarity = opts.minClarity ?? 0.8;
    this.minRms = opts.minRms ?? 0.005;
    this.sustainClarity = Math.min(opts.sustainClarity ?? 0.5, this.minClarity);
    this.sustainRms = Math.min(opts.sustainRms ?? 0.0012, this.minRms);
    this.sustainCents = opts.sustainCents ?? 60;
    this.sustainGapMs = opts.sustainGapMs ?? 300;
  }

  /** Laagste betrouwbaarheid die ooit door de poort kan; geef die als drempel aan detectPitch. */
  get loosestClarity(): number {
    return this.sustainClarity;
  }

  /** Laagste RMS die ooit door de poort kan; daaronder hoeft detectPitch niet te draaien. */
  get loosestRms(): number {
    return this.sustainRms;
  }

  /** true als de meting doorgaat naar de UI. freq/clarity mogen null zijn bij geen detectie. */
  accept(freq: number | null, clarity: number, rms: number, time: number): boolean {
    let ok = false;
    if (freq !== null && freq > 0) {
      if (clarity >= this.minClarity && rms >= this.minRms) {
        ok = true;
      } else if (
        time - this.lastTime <= this.sustainGapMs &&
        clarity >= this.sustainClarity &&
        rms >= this.sustainRms &&
        Math.abs(1200 * Math.log2(freq / this.lastFreq)) <= this.sustainCents
      ) {
        ok = true;
      }
    }
    if (ok) {
      this.lastFreq = freq!;
      this.lastTime = time;
    }
    return ok;
  }

  reset(): void {
    this.lastFreq = 0;
    this.lastTime = Number.NEGATIVE_INFINITY;
  }
}
