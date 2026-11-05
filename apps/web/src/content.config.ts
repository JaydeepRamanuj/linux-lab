import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SEVERITY_LEVELS } from '@shellgyan/core/severity';
import { MODULE_IDS } from './data/modules';
import { COMMAND_CATEGORY_IDS } from './data/commandCategories';
import { TRACK_IDS } from './data/tracks';

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
    /** Guide slugs that explain why this fix works. Shown as "Why this works". */
    concepts: z.array(z.string()).default([]),
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
      .optional(),
    /** Heading for the `distros` section. Default "Install it"; package tools use it for their equivalents on other distros. */
    distrosTitle: z.string().optional(),
    /** Guide slugs that explain what this command works on. Shown as "Concepts behind this command". */
    concepts: z.array(z.string()).default([])
  })
});

// One guide per file: src/content/guides/<slug>.mdx (docs/guides-plan.md §4). The MDX body holds
// "## The mental model" and "## Under the hood"; the page renders the rest from frontmatter.
const guides = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/guides' }),
  schema: z.object({
    track: z.enum(TRACK_IDS),
    /** Position within the track. */
    order: z.number().int().positive(),
    title: z.string(),
    /** One sentence, used on cards and in search. */
    summary: z.string(),
    level: z.enum(['essentials', 'deeper']),
    readingMinutes: z.number().int().positive(),
    /** Guide slugs to read first. */
    prerequisites: z.array(z.string()).default([]),
    /** Read-only commands that make the concept visible. The build fails if one rates above readonly. */
    observe: z
      .array(
        z.object({
          command: z.string(),
          explain: z.string(),
          /** Sample output, trimmed. */
          output: z.string().optional()
        })
      )
      .default([]),
    misconceptions: z.array(z.object({ myth: z.string(), reality: z.string() })).default([]),
    /** Command page names. */
    commands: z.array(z.string()).default([]),
    /** Scenario slugs. */
    scenarios: z.array(z.string()).default([]),
    references: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = { scenarios, commands, guides };
