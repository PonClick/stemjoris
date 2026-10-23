// Weergave van noten, cent en hertz in het Nederlands.

const hz1 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hz2 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 'F#' → 'F♯', 'Bb' → 'B♭'. */
export function prettyNoteName(name: string): string {
  if (name.length < 2) return name;
  return name[0] + name.slice(1).replace('#', '♯').replace('b', '♭');
}

/** Voor schermlezers: 'F#' → 'F kruis', 'Bb' → 'B mol'. */
export function spokenNote(name: string, octave?: number | null): string {
  const base = name.length < 2 ? name : name[0] + name.slice(1).replace('#', ' kruis').replace('b', ' mol');
  return octave === undefined || octave === null ? base : `${base} ${octave}`;
}

/** Cent met teken en echt minteken: '+12', '−7', '0'. */
export function formatCents(cents: number): string {
  const r = Math.round(cents);
  if (r === 0) return '0';
  return r > 0 ? `+${r}` : `−${Math.abs(r)}`;
}

export function formatHz(freq: number, digits: 1 | 2 = 1): string {
  return (digits === 2 ? hz2 : hz1).format(freq);
}
