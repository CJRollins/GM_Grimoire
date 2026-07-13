import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const archiveDir = path.join(root, 'Eberron');
const contentDir = path.join(root, 'src', 'content', 'chapters');
const provenanceDir = path.join(root, 'src', 'data', 'provenance');
const publicArchiveDir = path.join(root, 'public', 'archive', 'eberron');
const starlightContentDir = path.join(root, 'prototypes', 'starlight', 'src', 'content', 'docs');

const sourcebook = 'Eberron: Forge of the Artificer';
const edition = '2024 rules';
const extractionVersion = 1;

const chapterManifest = [
  ['Eberron- Forge of the Artificer.html', 'forge-of-the-artificer', 0],
  ['Credits.html', 'credits', 1],
  ['Chapter 1.html', 'introduction', 2],
  ['Artificer.html', 'the-artificer', 3],
  ['Chapter 2.html', 'character-options', 4],
  ['Chapter 3.html', 'bastions-in-khorvaire', 5],
  ['Chapter 4.html', 'eberron-gazetteer', 6],
  ['Chapter 5.html', 'dragonmarks', 7],
  ['Chapter 6.html', 'friends-and-foes', 8],
  ['Chapter 7.html', 'magic-items', 9],
  ['Chapter 8.html', 'new-spells', 10],
  ['Appendix_Art.html', 'art-of-eberron', 11],
];

const localRoutes = new Map(
  chapterManifest.map(([file, slug]) => [decodeURIComponent(file).toLowerCase(), `/chapters/${slug}/`]),
);

const locationNames = [
  'Aundair', 'Breland', 'Cyre', 'Darguun', 'Droaam', 'Eberron', 'Karrnath',
  'Khorvaire', 'Lhazaar', 'Mournland', 'Q’barra', 'Q\'barra', 'Sharn', 'Talenta',
  'Thrane', 'Xen’drik', 'Xen\'drik', 'Zilargo',
];

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(cleanText).filter(Boolean) ?? [];
}

function excerpt(sentence) {
  return sentence.length > 300 ? `${sentence.slice(0, 297)}…` : sentence;
}

function detectAnomalies($content) {
  const flags = [];
  const limits = new Map();
  let currentHeading = { id: '', text: 'Opening passage' };

  const add = (type, sentence, confidence, reason) => {
    const key = `${type}|${sentence}`;
    if (flags.some((flag) => `${flag.type}|${flag.passage}` === key)) return;
    const count = limits.get(type) ?? 0;
    if (count >= 10) return;
    limits.set(type, count + 1);
    flags.push({
      type,
      passage: excerpt(sentence),
      location: currentHeading.text,
      anchor: currentHeading.id,
      confidence,
      reason,
    });
  };

  $content.find('h1, h2, h3, h4, p, li, td, blockquote').each((_, element) => {
    const $element = $content.find(element);
    const tag = element.tagName.toLowerCase();
    const text = cleanText($element.text());
    if (!text) return;

    if (/^h[1-4]$/.test(tag)) {
      currentHeading = { id: $element.attr('id') ?? '', text };
      return;
    }

    for (const sentence of splitSentences(text)) {
      if (/\b(you|your|yours|yourself)\b/i.test(sentence)) {
        add('reader-address', sentence, 0.55, 'The sentence directly addresses the reader; review against nearby narrative voice.');
      }
      if (/\b(?:is|are|was|were|be|been|being)\s+(?:opened|given|paid|chosen|created|destroyed|removed|revealed|determined|rolled|made)\b/i.test(sentence)) {
        add('hidden-actor', sentence, 0.68, 'A passive construction may conceal who performs the action.');
      }
      if (/\b(?:if|when)\s+(?:no one|nobody|no creature)\s+(?:can\s+)?(?:see|hear|observe|witness)|\bunobserved\b/i.test(sentence)) {
        add('observation-dependent-rule', sentence, 0.82, 'The outcome appears to depend on whether anyone observes it.');
      }
      if (/\bwill\b/i.test(sentence) && /\b(?:can|may|must)\b/i.test(sentence)) {
        add('tense-shift', sentence, 0.42, 'The sentence mixes “will” with modal rules language; compare the intended force.');
      }
      const ritualTerms = sentence.match(/\b(?:prepare|preparation|boundary|invite|invitation|offer|offering|declare|declaration|consequence|dismiss|dismissal)\w*\b/gi) ?? [];
      if (new Set(ritualTerms.map((term) => term.toLowerCase())).size >= 3) {
        add('ritual-sequence', sentence, 0.61, 'Several preparation, invitation, declaration, consequence, or dismissal terms occur together.');
      }
    }
  });

  return flags;
}

function collectTags($content) {
  const creatures = new Set();
  const spells = new Set();
  const locations = new Set();
  const text = cleanText($content.text());

  $content.find('a[href]').each((_, anchor) => {
    const href = $content.find(anchor).attr('href') ?? '';
    const label = cleanText($content.find(anchor).text());
    if (!label) return;
    if (/\/monsters?\//i.test(href)) creatures.add(label);
    if (/\/spells?\//i.test(href)) spells.add(label);
  });

  for (const name of locationNames) {
    const canonical = name.replace("'", '’');
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(text)) locations.add(canonical);
  }

  return {
    creatures: [...creatures].sort(),
    spells: [...spells].sort(),
    locations: [...locations].sort(),
  };
}

function sanitizeContent($, $content) {
  $content.find('script, style, form, iframe, noscript, #comp-next-nav, .local-book-navigation, .visually-hidden').remove();
  $content.find('h1 > a[aria-hidden="true"], h2 > a[aria-hidden="true"], h3 > a[aria-hidden="true"], h4 > a[aria-hidden="true"]').remove();

  $content.find('*').each((_, element) => {
    const $element = $(element);
    for (const attribute of Object.keys(element.attribs ?? {})) {
      if (attribute.startsWith('on') || attribute === 'data-content-chunk-id') $element.removeAttr(attribute);
    }
  });

  $content.find('img').each((_, image) => {
    $(image).attr('loading', 'lazy').attr('decoding', 'async');
  });

  $content.find('a[href]').each((_, anchor) => {
    const $anchor = $(anchor);
    const href = $anchor.attr('href');
    if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(href)) return;
    const [filePart, hash = ''] = href.split('#');
    let decoded;
    try {
      decoded = decodeURIComponent(filePart).replace(/^\.\//, '').toLowerCase();
    } catch {
      return;
    }
    const route = localRoutes.get(decoded);
    if (route) {
      $anchor.attr('href', `${route}${hash ? `#${hash}` : ''}`);
    } else {
      try {
        $anchor.attr('href', new URL(href, 'https://www.dndbeyond.com/sources/dnd/efota/').href);
      } catch {
        // Leave malformed source links untouched so provenance remains inspectable.
      }
    }
  });

  $content.find('img[src], source[src]').each((_, media) => {
    const $media = $(media);
    const src = $media.attr('src');
    if (src?.startsWith('/')) $media.attr('src', `https://www.dndbeyond.com${src}`);
  });

  return $content.html()?.trim() ?? '';
}

async function readPriorExtractionDate(slug, hash) {
  try {
    const previous = JSON.parse(await readFile(path.join(provenanceDir, `${slug}.json`), 'utf8'));
    if (previous.sourceHash === hash && previous.extractionDate) return previous.extractionDate;
  } catch {
    // A missing or obsolete record receives a fresh extraction date.
  }
  return new Date().toISOString();
}

await Promise.all([contentDir, provenanceDir, publicArchiveDir, starlightContentDir].map((directory) => mkdir(directory, { recursive: true })));

const archiveFiles = await readdir(archiveDir, { withFileTypes: true });
await Promise.all(
  archiveFiles
    .filter((entry) => entry.isFile())
    .map((entry) => copyFile(path.join(archiveDir, entry.name), path.join(publicArchiveDir, entry.name))),
);

const records = [];
for (const [fileName, slug, order] of chapterManifest) {
  const originalPath = path.posix.join('Eberron', fileName);
  const sourceBuffer = await readFile(path.join(archiveDir, fileName));
  const sourceHash = sha256(sourceBuffer);
  const extractionDate = await readPriorExtractionDate(slug, sourceHash);
  const $ = load(sourceBuffer.toString('utf8'), { decodeEntities: false });
  const $content = $('.p-article-content').first();
  if (!$content.length) throw new Error(`No .p-article-content extraction boundary in ${originalPath}`);

  const title = cleanText($content.find('h1[id]').first().text())
    || cleanText($('.p-article-title').first().text())
    || fileName.replace(/\.html$/i, '');
  const chapter = cleanText($('.p-article-title').first().text()) || title;
  const headings = $content.find('h1, h2, h3, h4').map((_, heading) => ({
    depth: Number(heading.tagName.slice(1)),
    id: $(heading).attr('id') ?? '',
    text: cleanText($(heading).text()),
  })).get().filter((heading) => heading.text);
  const originalAnchors = $content.find('[id]').map((_, element) => ({
    id: $(element).attr('id'),
    text: cleanText($(element).is('img') ? ($(element).attr('alt') ?? '') : $(element).text()).slice(0, 160),
    element: element.tagName.toLowerCase(),
  })).get();
  const tags = collectTags($content);
  const anomalyFlags = detectAnomalies($content);
  const contentHtml = sanitizeContent($, $content);
  const rawUrl = `/archive/eberron/${encodeURIComponent(fileName)}`;

  const record = {
    title,
    sourcebook,
    edition,
    chapter,
    order,
    slug,
    originalPath,
    rawUrl,
    originalAnchors,
    sourceHash,
    extractionDate,
    extractionVersion,
    headings,
    tags,
    anomalyFlags,
    contentHtml,
  };
  records.push(record);

  await writeFile(path.join(contentDir, `${slug}.json`), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  await writeFile(path.join(provenanceDir, `${slug}.json`), `${JSON.stringify({
    title,
    originalPath,
    rawUrl,
    sourceHash,
    extractionDate,
    extractionVersion,
    originalAnchors,
    transformations: [
      'Selected the first .p-article-content element.',
      'Removed scripts, styles, forms, iframes, hidden duplicate labels, and injected local navigation.',
      'Removed event handlers and D&D Beyond content-chunk identifiers.',
      'Rewrote links between archived chapters to generated reader routes.',
      'Added lazy image loading and asynchronous decoding hints.',
      'Preserved heading IDs and all source wording; no encoding substitutions were applied.',
    ],
  }, null, 2)}\n`, 'utf8');
}

await writeFile(path.join(provenanceDir, 'manifest.json'), `${JSON.stringify({
  sourcebook,
  edition,
  generatedAt: records.map((record) => record.extractionDate).sort().at(-1),
  chapters: records.map(({ slug, title, originalPath, sourceHash, extractionDate }) => ({ slug, title, originalPath, sourceHash, extractionDate })),
}, null, 2)}\n`, 'utf8');

const control = records.find((record) => record.slug === 'character-options');
if (!control) throw new Error('The Starlight control record (character-options) was not generated.');
await writeFile(path.join(starlightContentDir, 'character-options.md'), `---
title: ${JSON.stringify(control.title)}
description: ${JSON.stringify(`Navigation and accessibility control for ${control.chapter}.`)}
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

<div class="starlight-control-source">
${control.contentHtml}
</div>
`, 'utf8');

console.log(`Extracted ${records.length} reader records and copied ${archiveFiles.filter((entry) => entry.isFile()).length} immutable archive files.`);
