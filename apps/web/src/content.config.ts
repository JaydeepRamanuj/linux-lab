import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SEVERITY_LEVELS } from '@shellgyan/core/severity';
import { MODULE_IDS } from './data/modules';
import { COMMAND_CATEGORY_IDS } from './data/commandCategories';

const severity = z.enum(SEVERITY_LEVELS);

const zones = z.object({
  kind: z.literal('zones'),
  title: z.string().optional(),
  caption: z.string().optional(),
  zones: z.array(
    z.object({
      title: z.string(),
      empty: z.string().optional(),
      items: z.array(
        z.object({
          text: z.string(),
          tone: z.enum(['base', 'good', 'bad', 'focus', 'caution', 'ghost']).optional(),
          note: z.string().optional()
        })
      )
    })
  )
});

const step = z.object({
  title: z.string(),
  kind: severity.optional(),
  command: z.string().optional(),
  note: z.string().optional(),
  output: z.string().optional(),
  editor: z.object({ file: z.string(), content: z.string() }).optional()
});

// One scenario per file: src/content/scenarios/<slug>.md. The Markdown body holds
// "## The situation" and "## How it works".
const scenarios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/scenarios' }),
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    quote: z.string(),
    module: z.enum(MODULE_IDS),
    severity,
    primaryCommand: z.string(),
    symptoms: z.array(z.string()).default([]),
    before: zones,
    after: zones,
    /** Labels for the two state panels when they aren't a before/after pair. */
    stateLabels: z.tuple([z.string(), z.string()]).optional(),
    steps: z.array(step).min(1),
    replay: z
      .object({
        context: z.string(),
        commands: z.array(z.object({ line: z.string(), type: z.enum(['input', 'output']) }))
      })
      .optional(),
    cautions: z.array(z.object({ type: z.enum(['caution', 'danger']), text: z.string() })).default([]),
    avoid: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    /** Extra anatomy notes for tokens in this scenario's commands, e.g. { "<PID>": "The number from step 1." }. */
    anatomy: z.record(z.string(), z.string()).default({}),
    draft: z.boolean().default(false)
  })
});

// One command per file: src/content/commands/<name>.yaml.
const commands = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/commands' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    category: z.enum(COMMAND_CATEGORY_IDS),
    level: z.enum(['everyday', 'intermediate', 'advanced']),
    summary: z.string(),
    syntax: z.string(),
    flags: z.array(z.object({ flag: z.string(), meaning: z.string() })).default([]),
    examples: z.array(z.object({ command: z.string(), explain: z.string(), severity })).default([]),
    gotchas: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    scenarios: z.array(z.string()).default([]),
    distros: z
      .object({ apt: z.string().optional(), dnf: z.string().optional(), pacman: z.string().optional() })
      .optional()
  })
});

export const collections = { scenarios, commands };
