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

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    sourcebook: z.string(),
    edition: z.string(),
    chapter: z.string(),
    order: z.number().int(),
    slug: z.string(),
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
      locations: z.array(z.string()),
    }),
    anomalyFlags: z.array(anomaly),
    contentHtml: z.string(),
  }),
});

export const collections = { chapters };
