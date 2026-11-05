import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { SearchItem } from '../lib/searchTypes';
import { trackById } from '../data/tracks';

// Prerendered to /search.json at build time; the search bar fetches it on first focus.
export const GET: APIRoute = async () => {
  const scenarios = await getCollection('scenarios', (s) => !s.data.draft);
  const commands = await getCollection('commands');
  const guides = await getCollection('guides', (g) => !g.data.draft);

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
    }))
  ];

  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
