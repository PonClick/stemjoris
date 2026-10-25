# StemJoris – Guitar Tuner

**Vote Joris! Er… tune your guitar.** StemJoris is a free, open-source tuner that runs in your browser and installs on your phone like an app. No ads, no account, no tracking: the microphone audio never leaves your device, and it works offline.

*"Stem Joris!" is Dutch for "Vote Joris!" — and "stemmen" also means "to tune". It started as a birthday present for a friend called Joris and his musician friends, because most tuner apps are annoying.*

**Use it:** https://ponclick.github.io/stemjoris/

## Music is for everyone

You shouldn't need money, an account or patience with ads to play in tune. A tuner is a basic tool, like a pick or a capo, and it should be free for everyone: the kid with a second-hand guitar, the busker, the band in a sweaty bar, the double bass player at a festival.

So StemJoris will always be:

- **Free**, with no paid version, no "pro" features and no ads
- **Without an account**: open it and play
- **Private**: no tracking, and your microphone never leaves your device
- **Offline**: once opened, it works without internet, in a rehearsal room or a basement
- **Light**: it runs on old and cheap phones in any modern browser
- **Open**: the code is MIT-licensed, so anyone can learn from it, improve it or make their own version

*Muziek is voor iedereen.* Je hoort geen geld, account of geduld met reclame nodig te hebben om zuiver te spelen. Een stemapparaat is basisgereedschap, net als een plectrum of een capo, en dat hoort gratis te zijn voor iedereen: het kind met een tweedehands gitaar, de straatmuzikant, de band in een zweterig café, de contrabassist op een festival. Daarom blijft StemJoris altijd gratis, zonder account, zonder reclame en zonder tracking. Hij werkt offline en op oude telefoons, en hij is open source.

## Features

- Accurate pitch detection (YIN with octave-error correction), down to A0 (27.5 Hz) for 5-string bass and double bass
- Three modes: **auto** (nearest string lights up), **fixed string** (pick a target), **chromatic** (any note)
- 40 string instruments and 95 tunings: guitar (6/7/8/12-string, baritone), bass, ukulele, violin, viola, cello, double bass, banjo, mandolin family, bouzouki, oud, charango, cavaquinho and more — Drop D, DADGAD, Open G, Nashville and many others
- Reference tones per string
- Adjustable A4 (415–466 Hz)
- Dutch and English, follows your phone's language
- Installable PWA, works offline, keeps the screen awake while tuning

## Install on your phone

Open the link above, then use **Add to Home Screen** (iPhone: Share menu in Safari; Android: the browser menu). Allow microphone access when asked.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest
npm run build    # production build in dist/
```

Microphone access requires `localhost` or HTTPS. Every push to `main` is tested, built and deployed to GitHub Pages by `.github/workflows/pages.yml`.

| Path | What |
|---|---|
| `src/audio/` | Pitch detection, gate with hysteresis, smoothing, microphone listener, reference tone |
| `src/music/notes.ts` | Note ↔ frequency, cents, adjustable A4 |
| `src/data/instruments.ts` | All instruments and tunings |
| `src/i18n/` | Dutch and English texts |
| `src/ui/` | Interface, starting at `mountApp(root)` |

Contributions are welcome: a missing instrument or tuning, a translation, or a bug report. Please keep the promise above: no trackers, no ads, no accounts and no external requests.

## Nederlands

StemJoris is een gratis stemapparaat voor gitaar, bas, ukelele, viool en nog veel meer snaarinstrumenten. Hij draait in je browser, je kunt hem op je beginscherm zetten, en hij werkt offline. Geen reclame, geen account, en het geluid van je microfoon blijft op je telefoon. De app volgt de taal van je telefoon; je kunt ook zelf wisselen tussen Nederlands en Engels.

## License

MIT, see [LICENSE](LICENSE), including the cartoon artwork in `public/cartoon/`. The bundled fonts are under the SIL Open Font License (see `public/fonts/`).
