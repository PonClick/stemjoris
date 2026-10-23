---
agent:
  name: stemjoris
  owner: max
  status: actief
  kant: prive
  purpose: "StemJoris – Guitar Tuner: open-source stemapparaat-PWA voor gitaar en andere snaarinstrumenten, cadeau voor Joris en zijn muzikantenvrienden"
  working_on: "Live op GitHub Pages met cartoon-Joris (23-10-2026); wacht op een test met een echte microfoon"
  parent: null
  contact:
    orchestrator: CLAUDE.md
    ask_via: ORCHESTRATIE.md
  updated: 2026-10-23
---

<!-- agentdraad:begin werkwijze=v1 hash=4bb4e0 -->
> [!info] AgentDraad · werkwijze v1
> Dit project is projectagent **stemjoris** in AgentDraad (eigenaar Max, kant prive). Het kaartje staat als `agent:` in de frontmatter van `AGENTS.md`.
> Werkwijze: skill `agentdraad`. Vragen aan andere agents en acties op afstand via AgentDraad (`agent.ask`, `action.request`) zodra de hub die heeft, tot dan via Max.
> Status bijwerken: skill `projectagent`. Ouder: geen. Sub-agents: geen.
<!-- agentdraad:end -->

# AGENTS.md: StemJoris

StemJoris – Guitar Tuner: stemapparaat voor gitaar en andere snaarinstrumenten, als web-app/PWA. Open source (MIT), publieke repo `PonClick/stemjoris`, live via GitHub Pages. Tot 23-10-2026 heette het project TurkeyTuna. Eigenaar: Max. Notities en besluiten: `ObsidianVault/Ai-projecten/StemJoris/`.

## Stack

- Vite + TypeScript (strict), geen UI-framework. Web Audio API voor microfoon en referentietonen.
- Tests: Vitest (`tests/**/*.test.ts`, omgeving `node`). Audio-DSP wordt getest met synthetische signalen.
- PWA: `public/manifest.webmanifest` en `public/sw.js` (handgeschreven, geen plugin).
- Talen: Nederlands en Engels in `src/i18n/`; instrumentnamen in het Engels via `src/i18n/data-en.ts`.
- Deploy: elke push naar `main` → `.github/workflows/pages.yml` (test, build, GitHub Pages).

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
| `src/i18n/` | Teksten NL/EN en taalkeuze. |
| `src/main.ts` | Bootstrap en registratie van de service worker. |

## Regels

- UI-teksten en instrumentnamen in het Nederlands; code en identifiers in het Engels.
- Stemmingsdata: wetenschappelijke notatie, alleen kruizen, snaren van laag naar hoog (fysieke volgorde).
- Geen tracking, geen externe requests: de app werkt offline. Microfoonaudio verlaat het apparaat nooit.
- De repo is publiek: geen interne hostnamen, tailnet-adressen, IP's of paden naar Max' vaults in code of docs. Interne zaken staan in de vaults.
- **Nooit echte foto's van Joris** in deze repo (besluit Max 23-10-2026; `.gitignore` blokkeert `public/joris*.jpg/png/webp`). Joris is een getekende cartoon in `public/cartoon/` (MIT). De foto's die er even in stonden zijn op 23-10-2026 uit de hele git-geschiedenis gewist.
- Geen nieuwe dependencies zonder reden; runtime-dependencies liever helemaal niet.
- Commit alleen in opdracht van Max.
