import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const contentDir = path.join(root, 'src', 'content', 'chapters');
const provenanceDir = path.join(root, 'src', 'data', 'provenance');
const dataDir = path.join(root, 'src', 'data');
const starlightContentDir = path.join(root, 'prototypes', 'starlight', 'src', 'content', 'docs');
const extractionVersion = 3;
const runGeneratedAt = new Date().toISOString();

const page = (file, slug, order, kind, audience, navGroup, chapterNumber = null, aliases = []) => ({
  file, slug, order, kind, audience, navGroup, chapterNumber, aliases,
});

const books = [
  {
    bookSlug: 'eberron-forge-of-the-artificer',
    routePrefix: '',
    sourcebook: 'Eberron: Forge of the Artificer',
    world: 'Eberron',
    edition: '2024 rules',
    sourceDir: 'Eberron',
    archiveSlug: 'eberron',
    canonicalBase: 'https://www.dndbeyond.com/sources/dnd/efota/',
    locationNames: [
      'Aundair', 'Breland', 'Cyre', 'Darguun', 'Droaam', 'Eberron', 'Karrnath',
      'Khorvaire', 'Lhazaar', 'Mournland', 'Q’barra', "Q'barra", 'Sharn', 'Talenta',
      'Thrane', 'Xen’drik', "Xen'drik", 'Zilargo',
    ],
    pages: [
      page('Eberron- Forge of the Artificer.html', 'forge-of-the-artificer', 0, 'overview', 'both', 'Sourcebook'),
      page('Credits.html', 'credits', 1, 'credits', 'both', 'Sourcebook'),
      page('Chapter 1.html', 'introduction', 2, 'lore', 'both', 'Sourcebook', 0, ['forge-of-the-artificer']),
      page('Artificer.html', 'the-artificer', 3, 'character-options', 'both', 'Player Options', 1, ['artificer']),
      page('Chapter 2.html', 'character-options', 4, 'character-options', 'both', 'Player Options', 2),
      page('Chapter 3.html', 'bastions-in-khorvaire', 5, 'rules', 'both', 'Game Master', 3),
      page('Chapter 4.html', 'eberron-gazetteer', 6, 'adventure', 'gm', 'Adventures', 4),
      page('Chapter 5.html', 'dragonmarks', 7, 'adventure', 'gm', 'Adventures', 5),
      page('Chapter 6.html', 'friends-and-foes', 8, 'adventure', 'gm', 'Adventures', 6),
      page('Chapter 7.html', 'magic-items', 9, 'adventure', 'gm', 'Adventures', 7),
      page('Chapter 8.html', 'new-spells', 10, 'items', 'both', 'Appendix', 8),
      page('Appendix_Art.html', 'art-of-eberron', 11, 'art', 'both', 'Sourcebook'),
    ],
  },
  {
    bookSlug: 'strixhaven-a-curriculum-of-chaos',
    routePrefix: 'strixhaven',
    sourcebook: 'Strixhaven: A Curriculum of Chaos',
    world: 'Arcavios',
    edition: '2014 rules',
    sourceDir: path.join('Arcavios', 'Stixhaven'),
    archiveSlug: 'strixhaven',
    canonicalBase: 'https://www.dndbeyond.com/sources/dnd/sacoc/',
    locationNames: [
      'Arcavios', 'Strixhaven', 'Biblioplex', 'Archway Commons', 'Firejolt Café',
      "Bow’s End Tavern", "Bow's End Tavern", 'Strixhaven Stadium', 'Pillardrop',
      'Effigy Row', 'Kollema Hall', 'Prismari Campus', 'Quandrix Campus',
      'Silverquill Campus', 'Witherbloom Campus', 'Sedgemoor', 'Rose Stage',
      'Wiltroot Hall', 'Scriptoria Collections', 'Detention Bog', 'Ruins of Caerdoon',
      'Lorehold', 'Prismari', 'Quandrix', 'Silverquill', 'Witherbloom',
    ],
    pages: [
      page('Campus Map.html', 'campus-map', 0, 'map', 'both', 'Reference', null, ['campus-map']),
      page('Chapter 1 - Welcome to Strixhaven.html', 'welcome-to-strixhaven', 1, 'lore', 'both', 'Reference', 1),
      page('Chapter 2 - Life At Strixhaven.html', 'life-at-strixhaven', 2, 'lore', 'both', 'Reference', 1),
      page('Chapter 3 - Character Options.html', 'character-options', 3, 'character-options', 'both', 'Reference', 2),
      page('Chapter 4 - School Is In Session', 'school-is-in-session', 4, 'rules', 'both', 'Reference', 3),
      page('Chapter 5 - Relationships.html', 'relationships', 5, 'relationships', 'both', 'Reference', 3),
      page('Chapter 6 - Campus Kerfuffle', 'campus-kerfuffle', 6, 'adventure', 'gm', 'Year One', 3),
      page('Chapter 7 - Work Hard, Play Harder.html', 'work-hard-play-harder', 7, 'adventure', 'gm', 'Year One', 3),
      page("Chapter 8 - All The World's A Stage.html", 'all-the-worlds-a-stage', 8, 'adventure', 'gm', 'Year One', 3),
      page('Chapter 9 - Hunt For Mage Tower.html', 'hunt-for-mage-tower', 9, 'adventure', 'gm', 'Year Two', 4),
      page('Chapter 10 - Party at the Rose Stage.html', 'party-at-the-rose-stage', 10, 'adventure', 'gm', 'Year Two', 4),
      page('Chapter 11 - Dangerous Knowledge.html', 'dangerous-knowledge', 11, 'adventure', 'gm', 'Year Two', 4),
      page("Chapter 12 - The Magister's Masquerade.html", 'the-magisters-masquerade', 12, 'adventure', 'gm', 'Year Three', 5),
      page('Chapter 13 - Dressing For Success.html', 'dressing-for-success', 13, 'adventure', 'gm', 'Year Three', 5),
      page('Chapter 14 - A Starlit Night.html', 'a-starlit-night', 14, 'adventure', 'gm', 'Year Three', 5),
      page('Chapter 15 - A Reckoning In Ruin.html', 'a-reckoning-in-ruins', 15, 'adventure', 'gm', 'Year Four', 6),
      page('Chapter 16 - No Time To Lose.html', 'no-time-to-lose', 16, 'adventure', 'gm', 'Year Four', 6),
      page('Chapter 17 - Confronting Murgaxor.html', 'confronting-murgaxor', 17, 'adventure', 'gm', 'Year Four', 6),
      page('Chapter 18 - Friends And Foes.html', 'friends-and-foes', 18, 'bestiary', 'gm', 'Bestiary', 7),
      page('Credits.html', 'credits', 19, 'credits', 'both', 'Appendix', null),
    ],
  },
];

for (const book of books) {
  book.pages = book.pages.map((entry) => ({
    ...entry,
    routeSlug: book.routePrefix ? `${book.routePrefix}-${entry.slug}` : entry.slug,
  }));
  book.routeAliases = new Map();
  for (const entry of book.pages) {
    const fileAliases = [
      entry.file,
      entry.file.replace(/\.html$/i, ''),
      entry.slug,
      ...entry.aliases,
    ];
    for (const alias of fileAliases) book.routeAliases.set(decodeURIComponent(alias).toLowerCase(), `/chapters/${entry.routeSlug}/`);
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function cleanText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(cleanText).filter(Boolean) ?? [];
}

function excerpt(text, length = 300) {
  const cleaned = cleanText(text);
  return cleaned.length > length ? `${cleaned.slice(0, length - 1)}…` : cleaned;
}

function detectAnomalies($, $content) {
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
    const $element = $(element);
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

function classifyHeading(text, depth, pageEntry) {
  if (/\bexam\b|studying phase|testing phase|cheating/i.test(text)) return 'exam';
  if (/relationship|beloved|friend|rival/i.test(text)) return 'relationship';
  if (/^[A-Z]\d+[A-Z]?\.|^[A-Z]\d+[a-z]?\b/.test(text) || /\blocations?\b/i.test(text)) return 'location';
  if (/encounter|battle|attack|duel|challenge|combat|threat|fight|scuffle|stopping the ritual|random encounters?|phase \d/i.test(text)) return 'encounter';
  if (/\brules?\b|using these|running this|benefits|advancement|tracking sheet/i.test(text)) return 'rule';
  if (pageEntry.kind === 'relationships' && depth === 3 && !/Introducing|Relationship Points|College and Year|Stat Blocks/i.test(text)) return 'npc';
  if (pageEntry.kind === 'adventure' && depth === 2) return 'scene';
  return 'reference';
}

function collectTags($, $content, book, pageEntry, title) {
  const creatures = new Set();
  const spells = new Set();
  const items = new Set();
  const locations = new Set();
  const npcs = new Set();
  const topics = new Set([pageEntry.kind]);
  const text = cleanText($content.text());

  $content.find('a[href]').each((_, anchor) => {
    const href = $(anchor).attr('href') ?? '';
    const label = cleanText($(anchor).text());
    if (!label) return;
    if (/\/monsters?\//i.test(href)) creatures.add(label);
    if (/\/spells?\//i.test(href)) spells.add(label);
    if (/\/(?:magic-items?|equipment)\//i.test(href)) items.add(label);
  });

  let currentH2 = '';
  let currentH3 = '';
  $content.find('h2, h3, h4').each((_, heading) => {
    const $heading = $(heading);
    const headingText = cleanText($heading.text());
    const depth = Number(heading.tagName.slice(1));
    if (depth === 2) currentH2 = headingText;
    if (depth === 3) currentH3 = headingText;

    if (/^[A-Z]\d+[A-Z]?\./.test(headingText)) locations.add(headingText.replace(/^[A-Z]\d+[A-Z]?\.\s*/, ''));
    if (depth === 4 && /Locations|Campus|Features/i.test(currentH3) && !/Features/i.test(headingText)) locations.add(headingText.replace(/^[A-Z]\d+[A-Z]?\.\s*/, ''));

    if (book.bookSlug === 'strixhaven-a-curriculum-of-chaos') {
      if (title === 'Relationships' && /^Fellow Students/.test(currentH2) && depth === 3 && $heading.next('.flexible-double-column').length) {
        npcs.add(headingText);
      }
      if (
        title === 'Life at Strixhaven'
        && /^(?:Lorehold|Prismari|Quandrix|Silverquill|Witherbloom) Faculty$/.test(currentH3)
        && depth === 4
      ) {
        npcs.add(headingText.replace(/,.*$/, ''));
      }
    }
  });

  for (const name of book.locationNames) {
    const variants = [name, name.replace(/’/g, "'")];
    if (variants.some((variant) => text.toLocaleLowerCase().includes(variant.toLocaleLowerCase()))) locations.add(name.replace(/'/g, '’'));
  }

  if (/\bexam\b/i.test(text)) topics.add('exams');
  if (/relationship|bond boon|bond bane/i.test(text)) topics.add('relationships');
  if (/campus|college|student/i.test(text)) topics.add('campus-life');
  if ($content.find('.read-aloud-text').length) topics.add('read-aloud');
  if ($content.find('.stat-block-background').length) topics.add('stat-blocks');
  if ($content.find('table').length) topics.add('tables');
  if (pageEntry.audience === 'gm') topics.add('gm-tools');

  const sorted = (set) => [...set].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return {
    creatures: sorted(creatures),
    spells: sorted(spells),
    items: sorted(items),
    locations: sorted(locations),
    npcs: sorted(npcs),
    topics: sorted(topics),
  };
}

function addSessionAnchors($, $content, headings, pageEntry) {
  const captureBlocks = (selector, prefix, getLabel) => $content.find(selector).map((index, element) => {
    const $element = $(element);
    const id = $element.attr('id') || `session-${prefix}-${index + 1}`;
    $element.attr('id', id);
    return { id, label: getLabel($element, index), excerpt: excerpt($element.text(), 180) };
  }).get();

  const readAloud = captureBlocks('.read-aloud-text', 'read-aloud', (_, index) => `Read aloud ${index + 1}`);
  const rules = captureBlocks('.rules-text', 'rule', (_, index) => `Rule box ${index + 1}`);
  const tables = captureBlocks('table', 'table', ($table, index) => cleanText($table.find('caption').first().text()) || `Table ${index + 1}`);
  const statBlocks = captureBlocks('.stat-block-background', 'stat-block', ($block, index) => (
    cleanText($block.find('[class*="Stat-Block-Title"]').first().text()) || `Stat block ${index + 1}`
  ));
  const maps = $content.find('a[href*="-player."]').map((index, anchor) => {
    const $anchor = $(anchor);
    const $figure = $anchor.closest('figure');
    const id = $anchor.attr('id') || `session-player-map-${index + 1}`;
    $anchor.attr('id', id);
    const $caption = $figure.find('figcaption').first().clone();
    $caption.find('a').remove();
    return {
      id,
      label: cleanText($caption.text()) || `Player map ${index + 1}`,
      dmUrl: $figure.find('img[src]').first().attr('src') ?? '',
      playerUrl: $anchor.attr('href') ?? '',
    };
  }).get();
  const statBlockNames = new Set(statBlocks.map((block) => block.label.toLocaleLowerCase()));
  const quickLinks = headings
    .filter((heading) => heading.id && heading.depth >= 2)
    .map((heading) => {
      const type = pageEntry.kind === 'bestiary' && statBlockNames.has(heading.text.toLocaleLowerCase())
        ? 'creature'
        : classifyHeading(heading.text, heading.depth, pageEntry);
      return { ...heading, type };
    });

  return { readAloud, rules, tables, statBlocks, maps, quickLinks };
}

function resolveLocalRoute(href, book) {
  if (!href || href.startsWith('#')) return null;
  let decodedHref;
  try { decodedHref = decodeURIComponent(href); } catch { decodedHref = href; }
  const withoutHash = decodedHref.split('#')[0].replace(/^\.\//, '').replace(/\/$/, '').toLowerCase();
  const direct = book.routeAliases.get(withoutHash);
  if (direct) return direct;
  try {
    const url = new URL(href, book.canonicalBase);
    const canonical = new URL(book.canonicalBase);
    const currentRoot = canonical.pathname.toLowerCase();
    const legacyRoot = currentRoot.replace('/sources/dnd/', '/sources/');
    const pathname = url.pathname.toLowerCase();
    if (url.origin !== canonical.origin || ![currentRoot, legacyRoot].some((rootPath) => pathname.startsWith(rootPath))) {
      return null;
    }
    const lastSegment = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '').toLowerCase();
    return book.routeAliases.get(lastSegment) ?? null;
  } catch {
    return null;
  }
}

function sanitizeContent($, $content, book, pageEntry) {
  $content.find('script, style, form, iframe, noscript, #comp-next-nav, .local-book-navigation, .visually-hidden').remove();
  $content.find('h1 > a[aria-hidden="true"], h2 > a[aria-hidden="true"], h3 > a[aria-hidden="true"], h4 > a[aria-hidden="true"]').remove();

  $content.find('*').each((_, element) => {
    const $element = $(element);
    for (const attribute of Object.keys(element.attribs ?? {})) {
      if (attribute.startsWith('on') || attribute === 'data-content-chunk-id') $element.removeAttr(attribute);
    }
  });

  $content.find('img').each((_, image) => $(image).attr('loading', 'lazy').attr('decoding', 'async'));

  $content.find('a[href]').each((_, anchor) => {
    const $anchor = $(anchor);
    const href = $anchor.attr('href');
    if (!href) {
      if (book.archiveSlug === 'strixhaven' && pageEntry.slug === 'all-the-worlds-a-stage' && /area R3/i.test(cleanText($anchor.text()))) {
        $anchor.attr('href', '#R3MainStage');
      }
      return;
    }
    if (href.startsWith('#') || /^(?:mailto:|tel:)/i.test(href)) return;
    let hash = href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : '';
    const localRoute = resolveLocalRoute(href, book);
    if (localRoute) {
      if (book.archiveSlug === 'strixhaven' && localRoute.endsWith('/strixhaven-work-hard-play-harder/') && hash === '#BowsEndTavern') {
        hash = '#BowsEndTavern1';
      }
      $anchor.attr('href', `${localRoute}${hash}`);
      return;
    }
    if (/^https?:/i.test(href)) return;
    try { $anchor.attr('href', new URL(href, book.canonicalBase).href); } catch { /* Preserve malformed evidence. */ }
  });

  $content.find('img[src], source[src]').each((_, media) => {
    const $media = $(media);
    const src = $media.attr('src');
    if (src?.startsWith('/')) $media.attr('src', `https://www.dndbeyond.com${src}`);
  });

  return $content.html()?.trim() ?? '';
}

async function walkJson(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walkJson(fullPath) : (entry.name.endsWith('.json') ? [fullPath] : []);
    }));
    return files.flat();
  } catch {
    return [];
  }
}

const priorByPath = new Map();
for (const file of await walkJson(provenanceDir)) {
  try {
    const record = JSON.parse(await readFile(file, 'utf8'));
    if (record.originalPath) priorByPath.set(record.originalPath, record);
  } catch { /* Ignore obsolete generated records. */ }
}

async function clearGeneratedJson(directory) {
  for (const file of await walkJson(directory)) await rm(file, { force: true });
}

await Promise.all([contentDir, provenanceDir, dataDir, starlightContentDir].map((directory) => mkdir(directory, { recursive: true })));
await Promise.all([clearGeneratedJson(contentDir), clearGeneratedJson(provenanceDir)]);

const records = [];
const archiveCounts = new Map();

for (const book of books) {
  const sourceDirectory = path.join(root, book.sourceDir);
  const publicArchiveDirectory = path.join(root, 'public', 'archive', book.archiveSlug);
  await mkdir(publicArchiveDirectory, { recursive: true });
  const archiveFiles = (await readdir(sourceDirectory, { withFileTypes: true })).filter((entry) => entry.isFile());
  archiveCounts.set(book.archiveSlug, archiveFiles.length);
  await Promise.all(archiveFiles.map((entry) => copyFile(path.join(sourceDirectory, entry.name), path.join(publicArchiveDirectory, entry.name))));

  const bookProvenanceDir = path.join(provenanceDir, book.bookSlug);
  await mkdir(bookProvenanceDir, { recursive: true });

  for (const pageEntry of book.pages) {
    const originalPath = path.posix.join(...book.sourceDir.split(path.sep), pageEntry.file);
    const sourceBuffer = await readFile(path.join(sourceDirectory, pageEntry.file));
    const sourceHash = sha256(sourceBuffer);
    const prior = priorByPath.get(originalPath);
    const extractionDate = (
      prior?.sourceHash === sourceHash
      && prior.extractionVersion === extractionVersion
      && prior.extractionDate
    ) ? prior.extractionDate : runGeneratedAt;
    const $ = load(sourceBuffer.toString('utf8'), { decodeEntities: false });
    const $content = $('.p-article-content').first();
    if (!$content.length) throw new Error(`No .p-article-content extraction boundary in ${originalPath}`);

    const title = cleanText($content.find('h1[id]').first().text())
      || cleanText($('.p-article-title').first().text())
      || pageEntry.file.replace(/\.html$/i, '');
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
    const summary = excerpt($content.find('p').filter((_, element) => cleanText($(element).text()).length > 80).first().text(), 260);
    const wordCount = cleanText($content.text()).split(/\s+/).filter(Boolean).length;
    const tags = collectTags($, $content, book, pageEntry, title);
    const anomalyFlags = detectAnomalies($, $content);
    const session = addSessionAnchors($, $content, headings, pageEntry);
    const contentHtml = sanitizeContent($, $content, book, pageEntry);
    const rawUrl = `/archive/${book.archiveSlug}/${encodeURIComponent(pageEntry.file)}`;

    const record = {
      title,
      sourcebook: book.sourcebook,
      bookSlug: book.bookSlug,
      world: book.world,
      edition: book.edition,
      chapter,
      chapterNumber: pageEntry.chapterNumber,
      order: pageEntry.order,
      navGroup: pageEntry.navGroup,
      kind: pageEntry.kind,
      audience: pageEntry.audience,
      slug: pageEntry.routeSlug,
      chapterSlug: pageEntry.slug,
      summary,
      wordCount,
      originalPath,
      rawUrl,
      originalAnchors,
      sourceHash,
      extractionDate,
      extractionVersion,
      headings,
      tags,
      session,
      anomalyFlags,
      contentHtml,
    };
    records.push(record);

    const generatedName = `${book.bookSlug}--${pageEntry.slug}.json`;
    await writeFile(path.join(contentDir, generatedName), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    await writeFile(path.join(bookProvenanceDir, `${pageEntry.slug}.json`), `${JSON.stringify({
      title,
      sourcebook: book.sourcebook,
      bookSlug: book.bookSlug,
      originalPath,
      rawUrl,
      sourceHash,
      extractionDate,
      extractionVersion,
      originalAnchors,
      transformations: [
        'Selected the first .p-article-content element.',
        'Removed scripts, styles, forms, iframes, hidden duplicate labels, and source navigation.',
        'Removed event handlers and D&D Beyond content-chunk identifiers.',
        'Rewrote archived sourcebook links to generated reader routes when a local target exists.',
        'Added lazy image loading and asynchronous decoding hints.',
        'Added derived IDs to read-aloud, rules, table, and stat-block elements for session navigation.',
        'Indexed player-version map links as derived session metadata.',
        'Preserved source wording and original heading IDs; derived metadata remains separate.',
      ],
      repairs: book.archiveSlug === 'strixhaven' && pageEntry.slug === 'campus-kerfuffle'
        ? [{
            location: 'Strixhaven Knowledge > Central Campus',
            original: '/sources/sacoc/work-hard-play-harder#BowsEndTavern',
            derivedTarget: '/chapters/strixhaven-work-hard-play-harder/#BowsEndTavern1',
            confidence: 'high',
          }]
        : book.archiveSlug === 'strixhaven' && pageEntry.slug === 'all-the-worlds-a-stage'
          ? [{
              location: 'Rose Stage Locations > Backstage',
              original: 'empty href on “area R3”',
              derivedTarget: '#R3MainStage',
              confidence: 'high',
            }]
          : [],
    }, null, 2)}\n`, 'utf8');
  }
}

function extractStudents() {
  const relationships = records.find((record) => record.bookSlug === 'strixhaven-a-curriculum-of-chaos' && record.chapterSlug === 'relationships');
  if (!relationships) return [];
  const $ = load(relationships.contentHtml, { decodeEntities: false });
  const students = [];
  const alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
  let inStudents = false;

  $('h2, h3').each((_, heading) => {
    const $heading = $(heading);
    const text = cleanText($heading.text());
    if (heading.tagName === 'h2') {
      inStudents = /^Fellow Students/.test(text);
      return;
    }
    if (!inStudents || heading.tagName !== 'h3') return;

    const profile = $heading.next('.flexible-double-column');
    let note = profile.next();
    const extraBiography = [];
    while (note.length && !note.is('h2, h3, .block-torn-paper')) {
      extraBiography.push(cleanText(note.text()));
      note = note.next();
    }
    if (!profile.length || !note.length) return;
    const identity = cleanText(profile.find('p').first().text());
    const alignment = alignments.find((value) => identity.startsWith(`${value} `)) ?? '';
    const identityRest = identity.slice(alignment.length).trim();
    const identityMatch = identityRest.match(/^(.+?)\s+(First|Second|Third|Fourth) Year(?:\s+\(([^)]+)\))?$/i);
    const fields = {};
    note.find('p').each((__, paragraph) => {
      const label = cleanText($(paragraph).find('strong').first().text()).replace(/:$/, '').toLowerCase();
      const value = cleanText($(paragraph).text()).replace(/^.*?:\s*/, '');
      if (label) fields[label] = value;
    });
    students.push({
      id: $heading.attr('id') ?? text.replace(/\W+/g, '-').toLowerCase(),
      name: text,
      alignment,
      species: identityMatch?.[1] ?? identityRest,
      cohort: identityMatch?.[2] ?? '',
      college: identityMatch?.[3] ?? 'Undeclared',
      biography: cleanText([
        ...profile.find('p').slice(1).toArray().map((paragraph) => cleanText($(paragraph).text())),
        ...extraBiography,
      ].join(' ')),
      portrait: profile.find('img').first().attr('src') ?? '',
      extracurriculars: (fields.extracurriculars ?? 'None').split(',').map(cleanText).filter((value) => value && value !== 'None'),
      job: fields.job ?? 'None',
      bondBoon: fields['bond boon'] ?? '',
      bondBane: fields['bond bane'] ?? '',
      sourceUrl: `/chapters/${relationships.slug}/#${$heading.attr('id')}`,
    });
  });
  return students;
}

const students = extractStudents();
await writeFile(path.join(dataDir, 'students.json'), `${JSON.stringify(students, null, 2)}\n`, 'utf8');

await writeFile(path.join(provenanceDir, 'manifest.json'), `${JSON.stringify({
  extractionVersion,
  generatedAt: records.map((record) => record.extractionDate).sort().at(-1),
  generationPolicy: 'Timestamps advance when a source hash or extraction version changes.',
  books: books.map((book) => ({
    bookSlug: book.bookSlug,
    sourcebook: book.sourcebook,
    world: book.world,
    edition: book.edition,
    archiveSlug: book.archiveSlug,
    sourceFileCount: archiveCounts.get(book.archiveSlug),
    chapters: records.filter((record) => record.bookSlug === book.bookSlug).map(({ slug, chapterSlug, title, originalPath, sourceHash, extractionDate }) => ({
      slug, chapterSlug, title, originalPath, sourceHash, extractionDate,
    })),
  })),
}, null, 2)}\n`, 'utf8');

const control = records.find((record) => record.bookSlug === 'eberron-forge-of-the-artificer' && record.chapterSlug === 'character-options');
if (!control) throw new Error('The Starlight control record was not generated.');
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

console.log(`Extracted ${records.length} records from ${books.length} sourcebooks, copied ${[...archiveCounts.values()].reduce((a, b) => a + b, 0)} immutable files, and indexed ${students.length} Strixhaven students.`);
