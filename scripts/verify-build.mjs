import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const archives = [
  { source: path.join(root, 'Eberron'), built: path.join(dist, 'archive', 'eberron'), label: 'Eberron' },
  {
    source: path.join(root, 'Arcavios', 'Stixhaven'),
    built: path.join(dist, 'archive', 'strixhaven'),
    label: 'Strixhaven',
  },
];

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : fullPath;
  }));
  return files.flat();
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

let sourceFileCount = 0;
for (const archive of archives) {
  const sourceFiles = (await readdir(archive.source, { withFileTypes: true }))
    .filter((entry) => entry.isFile());
  sourceFileCount += sourceFiles.length;

  for (const entry of sourceFiles) {
    const source = await readFile(path.join(archive.source, entry.name));
    const builtPath = path.join(archive.built, entry.name);
    if (!(await exists(builtPath))) {
      failures.push(`Missing preserved ${archive.label} archive file: ${entry.name}`);
      continue;
    }
    const built = await readFile(builtPath);
    if (digest(source) !== digest(built)) {
      failures.push(`${archive.label} archive hash mismatch: ${entry.name}`);
    }
  }
}

const studentsPath = path.join(root, 'src', 'data', 'students.json');
if (!(await exists(studentsPath))) {
  failures.push('Generated Strixhaven student dataset is missing.');
} else {
  try {
    const students = JSON.parse(await readFile(studentsPath, 'utf8'));
    if (!Array.isArray(students) || students.length !== 18) {
      failures.push(`Expected 18 Strixhaven student records; found ${Array.isArray(students) ? students.length : 'a non-array value'}.`);
    }
  } catch {
    failures.push('Generated Strixhaven student dataset is not valid JSON.');
  }
}

const recordsPath = path.join(root, 'src', 'content', 'chapters');
const readerRecords = (await readdir(recordsPath, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
if (readerRecords.length !== 32) {
  failures.push(`Expected 32 generated reader records; found ${readerRecords.length}.`);
}

const htmlFiles = (await walk(dist)).filter((file) =>
  file.endsWith('.html') && !file.includes(`${path.sep}archive${path.sep}`),
);
const chapterFiles = htmlFiles.filter((file) => file.includes(`${path.sep}chapters${path.sep}`));
if (chapterFiles.length !== 32) failures.push(`Expected 32 generated chapter pages; found ${chapterFiles.length}.`);

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  if ($('.sourcebook-content script, .sourcebook-content iframe, .sourcebook-content form').length) {
    failures.push(`Executable or interactive source markup leaked into ${path.relative(dist, file)}.`);
  }

  for (const anchor of $('a[href]').toArray()) {
    const href = $(anchor).attr('href');
    if (!href?.startsWith('/') || href.startsWith('//')) continue;
    const [pathname, hash = ''] = href.split('#');
    let decodedPath;
    try { decodedPath = decodeURIComponent(pathname); } catch { continue; }
    const targetPath = decodedPath.endsWith('/')
      ? path.join(dist, decodedPath, 'index.html')
      : path.join(dist, decodedPath);
    if (!(await exists(targetPath))) {
      failures.push(`Broken internal link in ${path.relative(dist, file)}: ${href}`);
      continue;
    }
    if (hash && targetPath.endsWith('.html')) {
      const target = load(await readFile(targetPath, 'utf8'));
      const hasAnchor = target('[id]').toArray().some((element) => target(element).attr('id') === hash);
      if (!hasAnchor) failures.push(`Missing anchor target in ${path.relative(dist, file)}: ${href}`);
    }
  }
}

if (!(await exists(path.join(dist, 'pagefind', 'pagefind.js')))) failures.push('Pagefind JavaScript bundle is missing.');

if (failures.length) {
  console.error(`Verification failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Verified ${sourceFileCount} byte-identical files across 2 source archives, ${readerRecords.length} reader records, ${chapterFiles.length} chapter pages, 18 Strixhaven student records, internal links, anchors, normalized markup, and the Pagefind bundle.`);
}
