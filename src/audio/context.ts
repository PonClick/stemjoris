// Eén gedeelde AudioContext voor microfoon en referentietoon, lui aangemaakt.

type AudioContextCtor = typeof AudioContext;

let shared: AudioContext | null = null;

function createContext(): AudioContext {
  const g = globalThis as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  if (g.AudioContext) return new g.AudioContext({ latencyHint: 'interactive' });
  // Oude Safari: alleen het voorvoegsel, en de constructor kent geen opties.
  if (g.webkitAudioContext) return new g.webkitAudioContext();
  throw new Error('Je browser ondersteunt geen Web Audio. Gebruik een recente browser.');
}

/** De gedeelde AudioContext; wordt bij de eerste aanroep aangemaakt (ook na een close()). */
export function getAudioContext(): AudioContext {
  if (!shared || shared.state === 'closed') {
    shared = createContext();
  }
  return shared;
}

/**
 * Hervat de AudioContext. Roep dit aan vanuit een gebruikersgebaar (klik/tik): browsers starten
 * audio pas na interactie. Synchroon aanroepen vóór de eerste await, anders telt het gebaar niet.
 */
export async function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state !== 'running') await ctx.resume();
}
