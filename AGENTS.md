# AI Agent Guide for this Workspace

## Repository scope
- This workspace contains a personal collection of Dungeons & Dragons reference material saved as HTML pages.
- Main folders:
  - `Eberron/` — campaign/sourcebook HTML files
  - `Living Spells/` — additional HTML content
- There are no source code files, build systems, package manifests, or automated tests in this workspace.

## What agents should know
- Treat this repository as a document archive rather than a software project.
- Common useful tasks:
  - clean up or normalize HTML files
  - extract or summarize content from HTML pages
  - convert HTML to Markdown or other text formats
  - remove tracking scripts, unnecessary metadata, or broken markup
  - reorganize files into a consistent folder structure
- Preserve the user’s existing HTML content and file names unless the user explicitly requests renaming or restructuring.

## Behavior guidance
- Do not assume there is any build/test command to run.
- Avoid introducing new code dependencies unless the user asks for a conversion workflow and approves it.
- If the user asks for enhancements, first confirm whether they want content extraction, file cleanup, format conversion, or another type of work.

## Useful notes
- The current workspace appears to be HTML export pages, including a saved `view-source` copy of a D&D Beyond page.
- Focus on working with the files as text/content artifacts rather than executable software.

## Strange wording heuristics
- “Tell it not merely to search for weird words. Tell it to notice when the author’s behavior changes.”
- Flag passages that become unusually precise where ordinary rules language would suffice.
- Notice unexpected shifts between can, may, must, and will.
- Record sentences that abruptly address the reader as you, especially when nearby text uses third person.
- Flag passive constructions that conceal the acting subject: “the door is opened,” “the name is given,” “the price is paid.”
- Notice unexplained capitalization, particularly ordinary nouns treated as proper names.
- Detect repeated phrases, numbers, examples, or sentence structures across unrelated chapters.
- Mark lists containing one item that differs conceptually from all the others.
- Compare instances where the same creature, place, spell, or object is described with different names.
- Flag wording that resembles ritual structure: preparation, boundary, invitation, offering, declaration, consequence, dismissal.
- Notice rules that describe what happens when nobody is present to observe the result.
- Record examples that supply more setting detail than required to explain the mechanic.
- Compare digital text against saved source pages, errata, alternate printings, and physical editions before normalizing apparent mistakes.
- Preserve typos that recur consistently. A repeated error may be vocabulary rather than damage.
- Treat margins, footnotes, captions, accessibility text, filenames, HTML comments, and metadata as potentially meaningful context.
- Do not declare an interpretation certain. Store the passage, location, comparison, and confidence level separately.

## Search Labels
tense-shift
reader-address
hidden-actor
ritual-sequence
repeated-error
capitalization-anomaly
edition-difference
unnecessary-specificity
outlier-in-list
observation-dependent-rule

"When a passage appears badly written, first ask what interpretation would make it deliberately written." - Vesper