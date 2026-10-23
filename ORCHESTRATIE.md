# ORCHESTRATIE: TurkeyTuna

Hoofdsessie (Claude, Opus 5.5) orkestreert en integreert. Gestart 23-10-2026.

## Agents

| Agent | Model | Bezit (alleen deze bestanden) | Status |
|---|---|---|---|
| A · data | sonnet | `src/data/instruments.ts`, `tests/instruments.test.ts` | klaar 23-10-2026: 40 instrumenten, 95 stemmingen, 6/6 tests groen; gereviewd |
| B · audio | opus | `src/music/notes.ts`, `src/audio/pitch.ts`, `src/audio/context.ts`, `src/audio/listener.ts`, `src/audio/tone.ts`, `src/audio/smoothing.ts`, `tests/notes.test.ts`, `tests/pitch.test.ts`, `tests/smoothing.test.ts` | klaar 23-10-2026: YIN via FFT met octaafcorrectie, ≤0,3 cent op schone signalen, 0 octaaffouten in een stresstest van 700 gevallen, ~0,4 ms per blok; 49/49 tests groen; listener gereviewd. Extra export `minBlockSize` |
| C · UI + PWA | opus | `src/ui/**`, `src/style.css`, `public/**` | klaar 23-10-2026: stemscherm met kalkoen-tonijn-mascotte (7 stemmingen), naald als veer, oceaan- en kalkoenpalet, 3 modi, referentietonen, A4, wake lock, PWA met offline-cache; getest met een oscillator in headless Chrome |

Van de hoofdsessie: `src/types.ts` (contract), `src/main.ts`, `index.html`, configuratie, `AGENTS.md`, `README.md`, dit bestand, het manifest en de vault.

## Klaar

- Skelet: Vite 8, TypeScript 7, Vitest 5, `git init` (nog geen commit), contracten in `src/types.ts`.

## Geïntegreerd

- Data (A), plus de domra (E4 A4 D5) door de hoofdsessie toegevoegd.
- Audio (B): conform contract.
- UI (C): `index.html` aangepast (theme-color `#0a1a2b`, `mobile-web-app-capable`). Build 56 kB JS (19 kB gzip), 55/55 tests groen.

## Nog niet getest

- Echte microfoon en speaker, iOS Safari (AudioContext, wake lock, hervatten na tabwissel), trillen op een telefoon. Weggelaten omdat de agent er niet zeker van was: saz/bağlama, Turkse oud, sitar, harp.

## Wacht op Max

- (niets)

## Volgende stappen

1. ~~Agents terug → review, tests, build, browser~~ klaar 23-10-2026.
2. Eerste commit, privé repo `PonClick/turkeytuna` aanmaken en pushen (akkoord van Max 23-10-2026).
3. Regel in `~/Code/manifest.yaml`, notitie in `ObsidianVault/Ai-projecten/TurkeyTuna/`.
4. Later: hosting (eerst de Infra-vault raadplegen), projectagentkaartje.
