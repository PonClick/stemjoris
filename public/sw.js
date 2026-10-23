// TurkeyTuna service worker: eenvoudige offline-cache, handgeschreven (geen plugin).
// - install: app-shell cachen, plus de (gehashte) scripts en stylesheets waar index.html naar wijst;
// - fetch (same-origin GET): network-first voor navigaties met cache-terugval,
//   cache-first voor overige bestanden (Vite hasht ze, dus ze veranderen nooit onder dezelfde naam);
// - activate: oude caches opruimen.
// Verhoog VERSION bij een wijziging in dit bestand of de shell-lijst.

const VERSION = 'v1';
const CACHE = `turkeytuna-${VERSION}`;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

const scopeUrl = (path) => new URL(path, self.registration.scope).href;

/** Haal de lokale asset-URL's (script/stylesheet/modulepreload) uit index.html. */
async function assetsFromIndex(cache) {
  try {
    const res = await cache.match(scopeUrl('./index.html'));
    if (!res) return [];
    const html = await res.text();
    const urls = new Set();
    for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = new URL(m[1], scopeUrl('./index.html'));
      if (url.origin === self.location.origin && /\.(?:js|css|svg|png|webp|woff2?)$/.test(url.pathname)) {
        urls.add(url.href);
      }
    }
    return [...urls];
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL.map(scopeUrl));
      const assets = await assetsFromIndex(cache);
      // Losse fouten bij assets mogen de installatie niet blokkeren.
      await Promise.all(assets.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('turkeytuna-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function cacheable(response) {
  return response && response.ok && response.type === 'basic';
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (cacheable(response)) cache.put(request, response.clone()).catch(() => undefined);
    return response;
  } catch (err) {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(scopeUrl('./index.html'))) ||
      (await cache.match(scopeUrl('./')));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) cache.put(request, response.clone()).catch(() => undefined);
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
