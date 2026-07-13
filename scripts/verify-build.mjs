import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];

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

const sourceFiles = (await readdir(path.join(root, 'Eberron'), { withFileTypes: true })).filter((entry) => entry.isFile());
for (const entry of sourceFiles) {
  const source = await readFile(path.join(root, 'Eberron', entry.name));
  const builtPath = path.join(dist, 'archive', 'eberron', entry.name);
  if (!(await exists(builtPath))) {
    failures.push(`Missing preserved archive file: ${entry.name}`);
    continue;
  }
  const built = await readFile(builtPath);
  if (digest(source) !== digest(built)) failures.push(`Archive hash mismatch: ${entry.name}`);
}

const htmlFiles = (await walk(dist)).filter((file) =>
  file.endsWith('.html') && !file.includes(`${path.sep}archive${path.sep}`),
);
const chapterFiles = htmlFiles.filter((file) => file.includes(`${path.sep}chapters${path.sep}`));
if (chapterFiles.length !== 12) failures.push(`Expected 12 generated chapter pages; found ${chapterFiles.length}.`);

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
  console.log(`Verified ${sourceFiles.length} byte-identical archive files, ${chapterFiles.length} chapter pages, internal links, anchors, normalized markup, and the Pagefind bundle.`);
}
