// The Origins timeline (docs/origins-plan.md §5.1): events grouped by era, with filter chips by category.
// Rendered on the server with every event visible, so it works without JavaScript; once hydrated, the chips
// filter it and the choice is kept in the URL hash (#filter=kernel) so a filtered view can be linked.
// Each event has an id, so /origins/timeline#linux-announced jumps to it.
import { useEffect, useState } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { Prose } from '../ui/ui';
import { ACCENTS } from '../../lib/theme';
import type { Accent } from '../../lib/theme';
import { CATEGORY_LABEL, TIMELINE_CATEGORIES, formatEventDate } from '../../data/timeline';
import type { Era, TimelineCategory } from '../../data/timeline';
import type { ResolvedEvent } from '../../lib/origins';

export const CATEGORY_ACCENT: Record<TimelineCategory, Accent> = {
  unix: 'indigo',
  gnu: 'emerald',
  kernel: 'cyan',
  distros: 'orange',
  ecosystem: 'purple'
};

type Filter = TimelineCategory | 'all';
const HASH_PREFIX = '#filter=';

function filterFromHash(hash: string): Filter | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const value = hash.slice(HASH_PREFIX.length);
  return (TIMELINE_CATEGORIES as readonly string[]).includes(value) ? (value as TimelineCategory) : null;
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
};

export default function Timeline({ events, eras }: { events: ResolvedEvent[]; eras: Era[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const sync = () => setFilter(filterFromHash(window.location.hash) ?? 'all');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const choose = (f: Filter) => {
    setFilter(f);
    const url = f === 'all' ? window.location.pathname + window.location.search : `${HASH_PREFIX}${f}`;
    window.history.replaceState(null, '', url);
  };

  const counts = new Map<TimelineCategory, number>();
  for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  const categories = TIMELINE_CATEGORIES.filter((c) => counts.has(c));
  const visible = filter === 'all' ? events : events.filter((e) => e.category === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter events by category">
        <FilterChip label="All" count={events.length} active={filter === 'all'} onClick={() => choose('all')} />
        {categories.map((c) => (
          <FilterChip
            key={c}
            label={CATEGORY_LABEL[c]}
            count={counts.get(c)!}
            accent={CATEGORY_ACCENT[c]}
            active={filter === c}
            onClick={() => choose(c)}
          />
        ))}
      </div>

      {eras.map((era) => {
        const inEra = visible.filter((e) => e.era === era.id);
        if (inEra.length === 0) return null;
        return (
          <section key={era.id} aria-labelledby={`era-${era.id}`} className="space-y-5">
            <header className="card p-4 sm:p-5 space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 id={`era-${era.id}`} className="text-lg sm:text-xl font-semibold text-on-surface">
                  {era.name}
                </h2>
                <span className="font-mono text-[12px] text-tertiary">
                  {era.from}–{era.to ?? 'now'}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{era.summary}</p>
            </header>

            <ol className="relative space-y-4 md:space-y-0">
              <span aria-hidden="true" className="absolute top-2 bottom-2 left-[calc(0.625rem-1px)] md:left-[calc(50%-1px)] w-0.5 bg-white/8" />
              {inEra.map((e, i) => (
                <EventRow key={e.id} event={e} side={i % 2 === 0 ? 'left' : 'right'} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function FilterChip({ label, count, active, accent, onClick }: { label: string; count: number; active: boolean; accent?: Accent; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${
        active ? 'bg-surface-high border-primary-container/50 text-on-surface font-semibold' : 'bg-surface-low border-white/8 text-on-surface-variant hover:text-on-surface hover:border-white/15'
      }`}
    >
      {accent && <span className={`w-2 h-2 rounded-full ${ACCENTS[accent].dot}`} aria-hidden="true" />}
      {label}
      <span className="font-mono text-[11px] text-outline">{count}</span>
    </button>
  );
}

function EventRow({ event: e, side }: { event: ResolvedEvent; side: 'left' | 'right' }) {
  const accent = ACCENTS[CATEGORY_ACCENT[e.category]];
  return (
    <li id={e.id} className="timeline-event relative grid grid-cols-[1.25rem_1fr] md:grid-cols-[1fr_3rem_1fr] gap-x-3 md:gap-x-0 scroll-mt-28 md:py-2">
      <div className="col-start-1 md:col-start-2 row-start-1 flex justify-center pt-4" aria-hidden="true">
        <span className={`relative z-10 w-3 h-3 rounded-full ring-4 ring-surface ${accent.dot}`} />
      </div>
      <article
        className={`col-start-2 row-start-1 min-w-0 card p-4 space-y-2 ${side === 'left' ? 'md:col-start-1 md:mr-1' : 'md:col-start-3 md:ml-1'}`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <time dateTime={e.date} className="font-mono text-[12px] text-tertiary">
            {formatEventDate(e.date)}
          </time>
          <span className={`label-caps ${accent.text}`}>{CATEGORY_LABEL[e.category]}</span>
        </div>
        <h3 className="font-display text-[16px] font-semibold text-on-surface leading-snug">
          <Prose text={e.title} />
        </h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          <Prose text={e.why} />
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[12px]">
          {e.chapter && e.chapterTitle && (
            <a href={`/o/${e.chapter}`} className="inline-flex items-center gap-1.5 text-secondary hover:underline underline-offset-3">
              <BookOpen className="h-3.5 w-3.5" />
              {e.chapterTitle}
            </a>
          )}
          <a href={e.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-outline hover:text-tertiary">
            <ExternalLink className="h-3.5 w-3.5" />
            Source: {host(e.source)}
          </a>
        </div>
      </article>
    </li>
  );
}
