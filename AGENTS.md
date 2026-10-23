# AGENTS.md: TurkeyTuna

Stemapparaat voor gitaar en andere snaarinstrumenten, als web-app/PWA. Eigenaar: Max. Notities en besluiten: `ObsidianVault/Ai-projecten/TurkeyTuna/`.

## Stack

- Vite + TypeScript (strict), geen UI-framework. Web Audio API voor microfoon en referentietonen.
- Tests: Vitest (`tests/**/*.test.ts`, omgeving `node`). Audio-DSP wordt getest met synthetische signalen.
- PWA: `public/manifest.webmanifest` en `public/sw.js` (handgeschreven, geen plugin).

## Commando's

```bash
npm run dev        # ontwikkelserver
npm test           # vitest run
npm run build      # typecheck + productiebuild naar dist/
```

## Indeling

| Pad | Wat |
|---|---|
| `src/types.ts` | Gedeelde contracten (Instrument, Tuning, PitchReading, NoteInfo). Niet zomaar wijzigen. |
| `src/data/instruments.ts` | Alle instrumenten en stemmingen (alleen data). |
| `src/music/notes.ts` | Noot ↔ frequentie, cent, instelbare A4. Puur, zonder DOM. |
| `src/audio/` | Toonhoogtedetectie (puur), microfoonluisteraar, referentietoon, gedeelde AudioContext. |
| `src/ui/` | Interface; `mountApp(root)` is het startpunt. |
| `src/main.ts` | Bootstrap en registratie van de service worker. |

## Regels

- UI-teksten en instrumentnamen in het Nederlands; code en identifiers in het Engels.
- Stemmingsdata: wetenschappelijke notatie, alleen kruizen, snaren van laag naar hoog (fysieke volgorde).
- Geen tracking, geen externe requests: de app werkt offline. Microfoonaudio verlaat het apparaat nooit.
- Geen nieuwe dependencies zonder reden; runtime-dependencies liever helemaal niet.
- Commit alleen in opdracht van Max.
