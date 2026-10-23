// Inline SVG-iconen (eigen tekeningen, geen externe bestanden). Decoratief: aria-hidden.

const svg = (body: string, viewBox = '0 0 24 24'): string =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

/** Het merkje: een tonijn als stemnaald boven een schaal. */
export const LOGO_MARK = svg(
  `<path d="M7.2 23.4a12 12 0 0 1 17.6 0" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M16 3.2c2.6 1.3 3.5 5 3.1 8.1-.3 2.3-1.6 4-2.4 5h-1.4c-.8-1-2.1-2.7-2.4-5-.4-3.1.5-6.8 3.1-8.1z" fill="var(--brand)"/>
   <path d="M16 15.6l3.4 5.4-3.4-1.4-3.4 1.4z" fill="var(--brand)"/>
   <circle cx="14.9" cy="6.3" r=".75" fill="var(--bg)"/><circle cx="17.1" cy="6.3" r=".75" fill="var(--bg)"/>`,
  '0 0 32 26',
);

export const ICON_GEAR = svg(
  `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M10.3 3.2h3.4l.5 2.4 1.6.9 2.3-.8 1.7 2.9-1.8 1.6v1.8l1.8 1.6-1.7 2.9-2.3-.8-1.6.9-.5 2.4h-3.4l-.5-2.4-1.6-.9-2.3.8-1.7-2.9 1.8-1.6v-1.8L4.2 8.6l1.7-2.9 2.3.8 1.6-.9z"/>
   <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
);

export const ICON_MIC = svg(
  `<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/>
   <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
);

export const ICON_STOP = svg(`<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/>`);

export const ICON_SPEAKER = svg(
  `<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>
   <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
);

export const ICON_CLOSE = svg(
  `<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
);

export const ICON_CHECK = svg(
  `<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
);
