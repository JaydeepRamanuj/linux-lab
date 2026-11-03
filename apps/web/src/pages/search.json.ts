import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { SearchItem } from '../lib/searchTypes';

// Prerendered to /search.json at build time; the search bar fetches it on first focus.
export const GET: APIRoute = async () => {
  const scenarios = await getCollection('scenarios', (s) => !s.data.draft);
  const commands = await getCollection('commands');

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
    }))
  ];

  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
