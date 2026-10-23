# ORCHESTRATIE: StemJoris

> [!info] 23-10-2026: TurkeyTuna heet nu StemJoris – Guitar Tuner en gaat open source. Fase 1 (TurkeyTuna) staat hieronder als geschiedenis; fase 2 (rebrand) bovenaan.

Hoofdsessie (Claude, Opus 5.5) orkestreert en integreert. Gestart 23-10-2026.

## Fase 2: rebrand naar StemJoris (23-10-2026)

| Agent | Model | Bezit | Status |
|---|---|---|---|
| D · rebrand + NL/EN | opus | `src/ui/**`, `src/style.css`, `public/**`, `src/i18n/**`, `index.html`, `src/main.ts`, `tests/i18n.test.ts` | loopt. ~~verkiezingsthema (rood potlood, stembiljetvakje)~~ koerswijziging 23-10-2026: hardwarepaneel met LED-boog, westernletter, Joris in de naald (mockup Max); `public/fonts/**` erbij. Verder: portretplek voor Joris (`public/joris.jpg`), NL/EN met Engelse instrumentnamen, Joris' contrabas-sneltoets |

Hoofdsessie: repo en map hernoemd (`PonClick/stemjoris`), `LICENSE` (MIT, portret uitgezonderd), `README.md` (EN/NL), `.github/workflows/pages.yml`, `package.json`, `AGENTS.md` en het kaartje, manifest, vault en Infra.

Wacht op Max: foto van Joris (vierkant, `public/joris.jpg`) en akkoord dat die publiek mag; eventueel het domein stemjoris.nl kopen.

## Fase 1: TurkeyTuna

### Agents

| Agent | Model | Bezit (alleen deze bestanden) | Status |
|---|---|---|---|
| A · data | sonnet | `src/data/instruments.ts`, `tests/instruments.test.ts` | klaar 23-10-2026: 40 instrumenten, 95 stemmingen, 6/6 tests groen; gereviewd |
| B · audio | opus | `src/music/notes.ts`, `src/audio/pitch.ts`, `src/audio/context.ts`, `src/audio/listener.ts`, `src/audio/tone.ts`, `src/audio/smoothing.ts`, `tests/notes.test.ts`, `tests/pitch.test.ts`, `tests/smoothing.test.ts` | klaar 23-10-2026: YIN via FFT met octaafcorrectie, ≤0,3 cent op schone signalen, 0 octaaffouten in een stresstest van 700 gevallen, ~0,4 ms per blok; 49/49 tests groen; listener gereviewd. Extra export `minBlockSize` |
| C · UI + PWA | opus | `src/ui/**`, `src/style.css`, `public/**` | klaar 23-10-2026: stemscherm met kalkoen-tonijn-mascotte (7 stemmingen), naald als veer, oceaan- en kalkoenpalet, 3 modi, referentietonen, A4, wake lock, PWA met offline-cache; getest met een oscillator in headless Chrome |

Van de hoofdsessie: `src/types.ts` (contract), `src/main.ts`, `index.html`, configuratie, `AGENTS.md`, `README.md`, dit bestand, het manifest en de vault.

### Klaar

- Skelet: Vite 8, TypeScript 7, Vitest 5, `git init` (nog geen commit), contracten in `src/types.ts`.

### Geïntegreerd

- Data (A), plus de domra (E4 A4 D5) door de hoofdsessie toegevoegd.
- Audio (B): conform contract.
- UI (C): `index.html` aangepast (theme-color `#0a1a2b`, `mobile-web-app-capable`). Build 56 kB JS (19 kB gzip), 55/55 tests groen.

### Nog niet getest

- Echte microfoon en speaker, iOS Safari (AudioContext, wake lock, hervatten na tabwissel), trillen op een telefoon. Weggelaten omdat de agent er niet zeker van was: saz/bağlama, Turkse oud, sitar, harp.

### Wacht op Max

- (niets)

### Volgende stappen

1. ~~Agents terug → review, tests, build, browser~~ klaar 23-10-2026.
2. ~~Eerste commit, privé repo aanmaken en pushen~~ klaar 23-10-2026: `156a070`, github.com/PonClick/turkeytuna (privé; sinds 23-10-2026 `PonClick/stemjoris`).
3. ~~Manifest en vaultnotitie~~ klaar 23-10-2026.
4. ~~Hosting en projectagentkaartje~~ klaar 23-10-2026: live via Max' tailnet (adres: Infra-vault, dienst TurkeyTuna); kaartje in `AGENTS.md`.
5. Max test met een echte microfoon op Mac en telefoon.
