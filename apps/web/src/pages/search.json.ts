import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { SearchItem } from '../lib/searchTypes';
import { trackById } from '../data/tracks';
import { TIMELINE, formatEventDate } from '../data/timeline';
import { personById } from '../data/people';
import { LORE } from '../data/lore';

/** The text of a chapter's "## The short version" section. */
const shortVersion = (body: string) => /^## The short version\s*$([\s\S]*?)^## /m.exec(body)?.[1] ?? '';
/** Markdown to plain words: drops link targets, code ticks and emphasis. */
const plainText = (md: string) => md.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_>#|]/g, '').replace(/\s+/g, ' ').trim();

// Prerendered to /search.json at build time; the search bar fetches it on first focus.
export const GET: APIRoute = async () => {
  const scenarios = await getCollection('scenarios', (s) => !s.data.draft);
  const commands = await getCollection('commands');
  const guides = await getCollection('guides', (g) => !g.data.draft);
  const chapters = await getCollection('origins', (c) => !c.data.draft);

  const items: SearchItem[] = [
    ...scenarios.map((s) => ({
      type: 'scenario' as const,
      title: s.data.title,
      url: `/s/${s.id}`,
      badge: String(s.data.number).padStart(2, '0'),
      subtitle: s.data.quote,
      command: s.data.primaryCommand,
      tags: [...s.data.symptoms, ...s.data.steps.flatMap((st) => (st.command ? [st.command] : []))],
      severity: s.data.severity
    })),
    ...commands.map((c) => ({
      type: 'command' as const,
      title: c.data.title,
      url: `/c/${c.id}`,
      badge: c.data.name,
      subtitle: c.data.summary,
      command: c.data.syntax,
      tags: [c.data.name, ...c.data.flags.map((f) => f.flag), ...c.data.examples.map((e) => e.command)]
    })),
    ...guides.map((g) => ({
      type: 'guide' as const,
      title: g.data.title,
      url: `/g/${g.id}`,
      badge: trackById(g.data.track)?.name ?? g.data.track,
      subtitle: g.data.summary,
      command: '',
      tags: [...g.data.misconceptions.flatMap((m) => [m.myth, m.reality]), ...g.data.observe.map((o) => o.command)]
    })),
    ...chapters.map((c) => ({
      type: 'chapter' as const,
      title: c.data.title,
      url: `/o/${c.id}`,
      badge: `Ch ${String(c.data.order).padStart(2, '0')}`,
      subtitle: c.data.summary,
      command: '',
      tags: [
        ...c.data.keyFacts.map((f) => `${f.label} ${f.value}`),
        ...c.data.people.map((id) => personById(id)?.name ?? id),
        ...[...(c.body ?? '').matchAll(/^###? +(.+)$/gm)].map((m) => m[1]!),
        // Bold terms (the chapter's vocabulary) and the short version, so "copyleft" or "Hurd" finds the chapter.
        ...[...(c.body ?? '').matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]!),
        plainText(shortVersion(c.body ?? ''))
      ]
    })),
    ...TIMELINE.map((e) => ({
      type: 'event' as const,
      title: e.title,
      url: `/origins/timeline#${e.id}`,
      badge: e.date.slice(0, 4),
      subtitle: `${formatEventDate(e.date)}: ${e.why}`,
      command: '',
      tags: [e.why]
    })),
    ...LORE.map((l) => ({
      type: 'lore' as const,
      title: l.term,
      url: `/origins/lore#${l.id}`,
      badge: l.kind === 'name-origin' ? 'name' : 'jargon',
      subtitle: plainText(l.explanation),
      command: '',
      tags: [l.command ?? '', l.term]
    }))
  ];

  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
