// Shared helpers for the Origins section (docs/origins-plan.md): chapters in reading order, and the timeline
// events with their chapter titles resolved, ready to hand to the Timeline widget.
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { TIMELINE, sortedTimeline } from '../data/timeline';
import type { TimelineEvent } from '../data/timeline';

export type Chapter = CollectionEntry<'origins'>;

/** A timeline event plus the title of the chapter it links to (if that chapter is published). */
export type ResolvedEvent = TimelineEvent & { chapterTitle?: string };

/** Published chapters in reading order. */
export async function publishedChapters(): Promise<Chapter[]> {
  const chapters = await getCollection('origins', (c) => !c.data.draft);
  return chapters.sort((a, b) => a.data.order - b.data.order);
}

/** "Chapter 01". */
export const chapterLabel = (order: number) => `Chapter ${String(order).padStart(2, '0')}`;

/** '2026-11-06' → 'November 2026'. */
export function formatAsOf(iso: string): string {
  const [y, m] = iso.split('-');
  const month = new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  return `${month} ${y}`;
}

/** Events (all, or the given ids in date order) with chapter titles filled in. */
export async function resolvedEvents(ids?: string[]): Promise<ResolvedEvent[]> {
  const chapters = await publishedChapters();
  const titles = new Map(chapters.map((c) => [c.id, c.data.title]));
  const events = ids ? TIMELINE.filter((e) => ids.includes(e.id)) : TIMELINE;
  return sortedTimeline(events).map((e) => ({ ...e, chapterTitle: e.chapter ? titles.get(e.chapter) : undefined }));
}
