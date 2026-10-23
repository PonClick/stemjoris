// Inline SVG-iconen (eigen tekeningen, geen externe bestanden). Decoratief: aria-hidden.

const svg = (body: string, viewBox = '0 0 24 24'): string =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

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

export const ICON_PREV = svg(`<path d="M15.5 5.5v13L6.5 12z" fill="currentColor"/>`);

export const ICON_NEXT = svg(`<path d="M8.5 5.5v13l9-6.5z" fill="currentColor"/>`);
