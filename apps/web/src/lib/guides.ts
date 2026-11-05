// Shared helpers for the guides pillar: published guides in track order, and the cross-links between guides,
// scenarios and commands. A link can be declared on either side (a guide's `scenarios`/`commands`, or a
// scenario's/command's `concepts`); pages show the union, so both ends always see it.
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { TRACKS } from '../data/tracks';

export type Guide = CollectionEntry<'guides'>;

export const LEVEL_LABEL = { essentials: 'Essentials', deeper: 'Deeper' } as const;

const trackIndex = (id: string) => TRACKS.findIndex((t) => t.id === id);

/** Published guides, ordered by track then by `order`. */
export async function publishedGuides(): Promise<Guide[]> {
  const guides = await getCollection('guides', (g) => !g.data.draft);
  return guides.sort((a, b) => trackIndex(a.data.track) - trackIndex(b.data.track) || a.data.order - b.data.order);
}

/** Guides that explain a scenario: its `concepts`, plus guides that list it under `scenarios`. */
export async function guidesForScenario(scenario: CollectionEntry<'scenarios'>): Promise<Guide[]> {
  const guides = await publishedGuides();
  return guides.filter((g) => scenario.data.concepts.includes(g.id) || g.data.scenarios.includes(scenario.id));
}

/** Guides behind a command: its `concepts`, plus guides that list it under `commands`. */
export async function guidesForCommand(command: CollectionEntry<'commands'>): Promise<Guide[]> {
  const guides = await publishedGuides();
  return guides.filter((g) => command.data.concepts.includes(g.id) || g.data.commands.includes(command.data.name));
}
