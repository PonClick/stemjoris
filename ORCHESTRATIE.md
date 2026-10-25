# ORCHESTRATIE: StemJoris

> [!info] 23-10-2026: TurkeyTuna heet nu StemJoris – Guitar Tuner en gaat open source. Fase 1 (TurkeyTuna) staat hieronder als geschiedenis; fase 2 (rebrand) bovenaan.

Hoofdsessie (Claude, Opus 5.5) orkestreert en integreert. Gestart 23-10-2026.

## Fase 2: rebrand naar StemJoris (23-10-2026)

| Agent | Model | Bezit | Status |
|---|---|---|---|
| D · rebrand + NL/EN | opus | `src/ui/**`, `src/style.css`, `public/**`, `src/i18n/**`, `index.html`, `src/main.ts`, `tests/i18n.test.ts` | klaar 23-10-2026: 75 tests groen, build 84 kB JS (27 kB gzip), screenshots NL/EN met en zonder foto's gereviewd. ~~verkiezingsthema (rood potlood, stembiljetvakje)~~ koerswijziging 23-10-2026: hardwarepaneel met LED-boog, westernletter, Joris in de naald (mockup Max); `public/fonts/**` erbij. Verder: portretplek voor Joris (`public/joris.jpg`), NL/EN met Engelse instrumentnamen, Joris' contrabas-sneltoets |

Hoofdsessie: repo en map hernoemd (`PonClick/stemjoris`), `LICENSE` (MIT, portret uitgezonderd), `README.md` (EN/NL), `.github/workflows/pages.yml`, `package.json`, `AGENTS.md` en het kaartje, manifest, vault en Infra.

Gepubliceerd 23-10-2026: commit `bd9b246`, repo publiek, live op https://ponclick.github.io/stemjoris/ (GitHub Pages, workflow groen).

| E · cartoon-Joris | opus | `public/cartoon/**`, `src/ui/brand.ts`, `src/ui/meter.ts` (koppeling), `src/style.css` (cartoon), `public/sw.js`, `tests/brand.test.ts` | klaar 23-10-2026: vier SVG-uitdrukkingen (bier, sceptisch, grimas met duivelshoorns, duim op) + contrabas-achtergrond, elk < 25 kB; 82 tests groen; goedgekeurd door Max |

23-10-2026: op verzoek van Max zijn de echte foto's van Joris uit de hele git-geschiedenis gewist (`git filter-branch`, force-push `bea898f`), en de oude Actions-runs met artefacten zijn verwijderd. De live site geeft 404 op de foto's. Lokale backup van vóór het wissen: git-bundel in de sessie-scratchpad (privé).

23-10-2026: Max testte met een echte gitaar op iPhone en Mac: werkt goed.

~~Wacht op Max: een echte sceptische foto (vervangt de mockup-uitsnede `joris-off.jpg`); eventueel stemjoris.nl kopen; akkoord om de oude tailnet-versie op te ruimen; test met een echte microfoon.

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
