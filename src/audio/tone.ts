// Referentietoon: een geplukte, harmonisch rijke toon die ook op telefoonspeakers hoorbaar is.
// Een zuivere sinus op E1 (41 Hz) hoor je op een telefoon niet; de boventonen (tot ~5 kHz) dragen
// daar de toonhoogte. Een lowpass die langzaam dichtgaat geeft het plukkarakter.

import { getAudioContext, resumeAudio } from './context';

export interface PlayOptions {
  /** Duur in ms bij een pluk (standaard 2500). Genegeerd bij sustain. */
  durationMs?: number;
  /** true: speelt door tot stop(). */
  sustain?: boolean;
}

interface Voice {
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

const PEAK_GAIN = 0.5;
const ATTACK_S = 0.006;
const RELEASE_S = 0.05;

function buildWave(ctx: BaseAudioContext, freq: number): PeriodicWave {
  const nyquist = ctx.sampleRate / 2;
  const top = Math.min(5000, nyquist * 0.9);
  const count = Math.max(1, Math.min(48, Math.floor(top / freq)));
  // Lage tonen: boventonen sterker (meer 'zaag'), hoge tonen: zachter en ronder.
  const slope = freq < 200 ? 1.0 : freq < 500 ? 1.3 : 1.7;
  const real = new Float32Array(count + 1);
  const imag = new Float32Array(count + 1);
  for (let n = 1; n <= count; n++) imag[n] = 1 / Math.pow(n, slope);
  return ctx.createPeriodicWave(real, imag); // genormaliseerd: piek 1
}

export class ReferenceTone {
  private voice: Voice | null = null;

  get playing(): boolean {
    return this.voice !== null;
  }

  /** Speelt een toon; een eventueel spelende toon wordt eerst (kort uitgefaded) gestopt. */
  play(freq: number, opts: PlayOptions = {}): void {
    if (!(freq > 0) || !Number.isFinite(freq)) return;
    this.stop();

    const ctx = getAudioContext();
    void resumeAudio().catch(() => undefined);

    const sustain = opts.sustain ?? false;
    const duration = Math.max(0.2, (opts.durationMs ?? 2500) / 1000);
    const now = ctx.currentTime;
    const nyquist = ctx.sampleRate / 2;

    const osc = ctx.createOscillator();
    osc.setPeriodicWave(buildWave(ctx, freq));
    osc.frequency.setValueAtTime(freq, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    const bright = Math.min(nyquist * 0.9, Math.max(freq * 10, 3000));
    const mellow = Math.min(bright, Math.max(freq * 3, 1200));
    filter.frequency.setValueAtTime(bright, now);
    filter.frequency.setTargetAtTime(mellow, now + ATTACK_S, sustain ? 0.3 : duration * 0.25);

    const gain = ctx.createGain();
    const g = gain.gain;
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(PEAK_GAIN, now + ATTACK_S);
    if (sustain) {
      g.exponentialRampToValueAtTime(PEAK_GAIN * 0.6, now + 0.5);
    } else {
      g.exponentialRampToValueAtTime(0.001, now + duration);
      g.linearRampToValueAtTime(0, now + duration + 0.03);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const voice: Voice = { osc, filter, gain };
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
      if (this.voice === voice) this.voice = null;
    };
    osc.start(now);
    if (!sustain) osc.stop(now + duration + 0.05);
    this.voice = voice;
  }

  /** Stopt de toon met een korte fade-out (geen klik). */
  stop(): void {
    const voice = this.voice;
    if (!voice) return;
    this.voice = null;
    const ctx = voice.osc.context;
    const now = ctx.currentTime;
    const g = voice.gain.gain as AudioParam & { cancelAndHoldAtTime?: (t: number) => AudioParam };
    if (typeof g.cancelAndHoldAtTime === 'function') {
      g.cancelAndHoldAtTime(now);
    } else {
      const current = g.value;
      g.cancelScheduledValues(now);
      g.setValueAtTime(current, now);
    }
    g.linearRampToValueAtTime(0, now + RELEASE_S);
    try {
      voice.osc.stop(now + RELEASE_S + 0.01);
    } catch {
      // al gestopt
    }
  }
}
