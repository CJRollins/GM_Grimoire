import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const heading = z.object({
  depth: z.number().int().min(1).max(6),
  id: z.string(),
  text: z.string(),
});

const anomaly = z.object({
  type: z.string(),
  passage: z.string(),
  location: z.string(),
  anchor: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

const sessionBlock = z.object({
  id: z.string(),
  label: z.string(),
  excerpt: z.string(),
});

const sessionMap = z.object({
  id: z.string(),
  label: z.string(),
  dmUrl: z.string(),
  playerUrl: z.string(),
});

const quickLink = heading.extend({ type: z.string() });

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    sourcebook: z.string(),
    bookSlug: z.string(),
    world: z.string(),
    edition: z.string(),
    chapter: z.string(),
    chapterNumber: z.number().int().nullable(),
    order: z.number().int(),
    navGroup: z.string(),
    kind: z.string(),
    audience: z.enum(['both', 'gm', 'player']),
    slug: z.string(),
    chapterSlug: z.string(),
    summary: z.string(),
    wordCount: z.number().int().nonnegative(),
    originalPath: z.string(),
    rawUrl: z.string(),
    originalAnchors: z.array(z.object({
      id: z.string(),
      text: z.string(),
      element: z.string(),
    })),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    extractionDate: z.iso.datetime(),
    extractionVersion: z.number().int(),
    headings: z.array(heading),
    tags: z.object({
      creatures: z.array(z.string()),
      spells: z.array(z.string()),
      items: z.array(z.string()),
      locations: z.array(z.string()),
      npcs: z.array(z.string()),
      topics: z.array(z.string()),
    }),
    session: z.object({
      readAloud: z.array(sessionBlock),
      rules: z.array(sessionBlock),
      tables: z.array(sessionBlock),
      statBlocks: z.array(sessionBlock),
      maps: z.array(sessionMap),
      quickLinks: z.array(quickLink),
    }),
    anomalyFlags: z.array(anomaly),
    contentHtml: z.string(),
  }),
});

export const collections = { chapters };
