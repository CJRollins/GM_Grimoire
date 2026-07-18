# Arcane Grimoire

A static sourcebook reader and evidence-preserving archive for two saved D&D
Beyond collections:

- *Eberron: Forge of the Artificer* in `Eberron/`
- *Strixhaven: A Curriculum of Chaos* in `Arcavios/Stixhaven/`

The original folder name `Stixhaven` is intentionally preserved. Source file
names and source HTML are never renamed or edited by the extraction workflow.

## What it provides

The Grimoire turns the saved pages into a shared library with book and chapter
navigation, clean/source/comparison reading modes, in-page tables of contents,
source citations, print styles, and full-text Pagefind search.

The Strixhaven collection also gains focused study and session aids:

- a study desk organized by reference material and academic year
- a session desk with links to read-aloud text, encounters, locations, rules,
  tables, stat blocks, and 25 player-version Strixhaven maps
- a filterable directory of the eighteen recurring student NPCs
- local reading progress and a session tray for keeping useful passages close

These aids are derived views. They do not rewrite the archived books or assert
that heuristic anomaly notes are certain interpretations.

## Evidence-preserving design

The two source directories are the immutable evidence layer. The extractor
produces:

- `src/content/chapters/` - 32 schema-validated reader records
- `src/data/students.json` - 18 structured Strixhaven student records
- `src/data/provenance/` - source hashes, original anchors, extraction dates,
  and logged transformations
- `public/archive/eberron/` - byte-for-byte Eberron source copies (gitignored)
- `public/archive/strixhaven/` - byte-for-byte Strixhaven source copies
  (gitignored)
- `prototypes/starlight/` - a disposable Eberron information-architecture
  control

Root-relative D&D Beyond references in normalized reader content become
explicit external links. Intra-book links become generated Grimoire routes.
Known broken links may be repaired only in the derived reader content; the
original wording, files, and heading IDs remain unchanged.

Every chapter record includes its sourcebook, world, edition, chapter and
navigation group, original path and anchors, SHA-256 source hash, extraction
date, headings, entity tags, session anchors, and anomaly flags. Anomaly records
keep the passage, location, comparison reason, and confidence separate.

## Commands

On Windows, use `npm.cmd` because PowerShell script execution may be disabled.
The package scripts call Astro through `scripts/run-astro.mjs`, which also avoids
problems caused by the ampersand in this workspace path.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run check
npm.cmd run verify
npm.cmd run prototype:build
```

`npm.cmd run build` extracts both archives, builds the static site into `dist/`,
and indexes every reader chapter with Pagefind. `npm.cmd run verify` checks all
34 archive copies byte-for-byte, confirms the 32 reader records and 18-student
directory, tests generated internal links and anchors, rejects executable source
markup in normalized content, and confirms the search bundle exists.

Search is generated after the Astro build, so use the built preview rather than
the development server when testing Pagefind:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Starlight control

The Starlight prototype consumes the same generated Eberron `Character Options`
content as the custom shell. It exists only to compare navigation,
table-of-contents, keyboard, typography, and accessibility baselines. It is not
connected to the production routes or visual design.
