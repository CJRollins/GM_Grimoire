# Eberron Grimoire

A static sourcebook reader and evidence-preserving archive for the saved
*Eberron: Forge of the Artificer* HTML pages in `Eberron/`.

## Design

The existing `Eberron/` files are the immutable source layer. The extractor
never edits them. It produces:

- `src/content/chapters/` — schema-validated reader records
- `src/data/provenance/` — source hashes, original anchors, dates, and logged transformations
- `public/archive/eberron/` — build-time byte-for-byte source copies (gitignored)
- `prototypes/starlight/` — a disposable one-chapter information-architecture control

The production interface is a custom Astro shell with a book rail, reading
column, page table of contents, source citations, conservative anomaly notes,
clean/source/comparison modes, native cross-document view transitions, a print
stylesheet, and a post-build Pagefind index.

## Commands

On Windows, use `npm.cmd` because PowerShell script execution may be disabled.
The package scripts call Astro directly through `scripts/run-astro.mjs` so the
ampersand in this workspace path does not break npm's generated command shim.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run check
npm.cmd run verify
npm.cmd run prototype:build
```

`npm.cmd run build` extracts the archive, builds the static site into `dist/`,
and indexes all reader chapters with Pagefind. `npm.cmd run verify` then checks
that every archive copy is byte-identical, generated internal links and anchors
resolve, normalized source text contains no executable markup, and the search
bundle exists.

Search is generated after the Astro build, so use the built preview rather than
the development server when testing Pagefind:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Content records

Every chapter retains the requested core fields: title, sourcebook, edition,
chapter, original path and anchors, SHA-256 source hash, extraction date,
headings, entity tags, and anomaly flags. Anomaly records keep the passage,
location, comparison reason, and confidence separate. They are heuristic leads,
not editorial corrections or claims of certainty.

Root-relative D&D Beyond references in normalized text become explicit external
links. Intra-book links become generated Grimoire routes. Source wording and
heading IDs remain unchanged.

## Starlight control

The Starlight prototype consumes the same generated `Character Options` content
as the custom shell. It exists only to compare navigation, table-of-contents,
keyboard, typography, and accessibility baselines. It is intentionally not
connected to the production routes or visual design.
