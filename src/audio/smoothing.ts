// Gladstrijken van toonhoogtemetingen voor een rustige naald. Puur, zonder DOM.
//
// Werking, alles in het log-domein (cent):
//  - mediaan over de laatste `windowSize` geaccepteerde metingen, daarna een exponentieel gemiddelde;
//  - een meting die meer dan `maxJumpCents` van de huidige waarde afwijkt (octaafspike, andere snaar)
//    wordt genegeerd, tenzij zulke metingen aanhouden en onderling overeenkomen: dan is het een
//    nieuwe noot en springt de smoother er direct heen;
//  - na stilte (null) blijft de laatste waarde nog `holdMs` staan, daarna komt null terug;
//    `holding` zegt of de laatst teruggegeven waarde zo'n vastgehouden waarde was.

export interface SmootherOptions {
  /** Aantal metingen in het mediaanvenster (standaard 5). */
  windowSize?: number;
  /** Grotere sprongen gelden als uitschieter tot ze aanhouden (standaard 80 cent). */
  maxJumpCents?: number;
  /** Hoe lang de laatste waarde blijft staan na stilte (standaard 400 ms). */
  holdMs?: number;
}

/** Zoveel opeenvolgende, onderling consistente uitschieters gelden als een nieuwe noot. */
const CONFIRM_COUNT = 4;
/** Gewicht van een nieuwe mediaan in het exponentiële gemiddelde. */
const EMA_ALPHA = 0.3;

function toCents(freq: number): number {
  return 1200 * Math.log2(freq / 440);
}

function fromCents(cents: number): number {
  return 440 * Math.pow(2, cents / 1200);
}

function median(values: readonly number[], scratch: number[]): number {
  scratch.length = 0;
  for (const v of values) scratch.push(v);
  scratch.sort((a, b) => a - b);
  const mid = scratch.length >> 1;
  return scratch.length % 2 === 1 ? scratch[mid]! : (scratch[mid - 1]! + scratch[mid]!) / 2;
}

export class PitchSmoother {
  private readonly windowSize: number;
  private readonly maxJumpCents: number;
  private readonly holdMs: number;
  private window: number[] = [];
  private candidates: number[] = [];
  private readonly scratch: number[] = [];
  private value: number | null = null;
  private lastTime = Number.NEGATIVE_INFINITY;
  private held = false;

  constructor(opts: SmootherOptions = {}) {
    this.windowSize = Math.max(1, Math.round(opts.windowSize ?? 5));
    this.maxJumpCents = opts.maxJumpCents ?? 80;
    this.holdMs = opts.holdMs ?? 400;
  }

  /** true als de laatste push geen nieuwe meting had en de vorige waarde vasthield. */
  get holding(): boolean {
    return this.held;
  }

  /** Verwerkt één meting (null = stilte) op tijdstip `time` in ms; geeft de gladde frequentie. */
  push(freq: number | null, time: number): number | null {
    if (freq === null || !(freq > 0) || !Number.isFinite(freq)) {
      if (this.value !== null && time - this.lastTime <= this.holdMs) {
        this.held = true;
        return fromCents(this.value);
      }
      this.reset();
      return null;
    }
    this.held = false;

    const cents = toCents(freq);
    this.lastTime = time;

    if (this.value === null) {
      this.window = [cents];
      this.candidates = [];
      this.value = cents;
      return freq;
    }

    if (Math.abs(cents - this.value) > this.maxJumpCents) {
      // Uitschieter: bewaar als kandidaat voor een nieuwe noot.
      if (
        this.candidates.length > 0 &&
        Math.abs(cents - median(this.candidates, this.scratch)) > this.maxJumpCents
      ) {
        this.candidates = [];
      }
      this.candidates.push(cents);
      if (this.candidates.length >= CONFIRM_COUNT) {
        this.window = this.candidates.slice(-this.windowSize);
        this.candidates = [];
        this.value = median(this.window, this.scratch);
      }
      return fromCents(this.value);
    }

    this.candidates = [];
    this.window.push(cents);
    if (this.window.length > this.windowSize) this.window.shift();
    const m = median(this.window, this.scratch);
    this.value += EMA_ALPHA * (m - this.value);
    return fromCents(this.value);
  }

  reset(): void {
    this.window = [];
    this.candidates = [];
    this.value = null;
    this.lastTime = Number.NEGATIVE_INFINITY;
    this.held = false;
  }
}
