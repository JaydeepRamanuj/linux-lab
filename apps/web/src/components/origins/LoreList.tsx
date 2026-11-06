// Names & lore (docs/origins-plan.md §5.3): a filter box and kind tabs over the lore entries. Rendered on the
// server with everything shown; once hydrated, typing filters by term and explanation. Each entry has an id,
// so /origins/lore#grep links straight to it.
import { useMemo, useState } from 'react';
import { Search, ExternalLink, BookOpen, GraduationCap, Landmark } from 'lucide-react';
import { Prose } from '../ui/ui';
import { LORE_KIND_LABEL } from '../../data/lore';
import type { LoreEntry, LoreKind } from '../../data/lore';

export interface ResolvedLore extends LoreEntry {
  guideTitle?: string;
  chapterTitle?: string;
}

const host = (url: string) => {
  if (url.startsWith('/')) return 'this site';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
};

export default function LoreList({ entries }: { entries: ResolvedLore[] }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<LoreKind | 'all'>('all');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) => (kind === 'all' || e.kind === kind) && (!q || e.term.toLowerCase().includes(q) || e.explanation.toLowerCase().includes(q))
    );
  }, [entries, query, kind]);

  const tabs: { id: LoreKind | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: entries.length },
    ...(Object.keys(LORE_KIND_LABEL) as LoreKind[]).map((k) => ({ id: k, label: LORE_KIND_LABEL[k], count: entries.filter((e) => e.kind === k).length }))
  ];

  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Filter names and jargon</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter: grep, daemon, upstream…"
            className="w-full bg-surface-low border border-white/8 rounded-lg pl-9 pr-3 h-9 text-[13px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container/60"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kind">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={kind === t.id}
              onClick={() => setKind(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${
                kind === t.id ? 'bg-surface-high border-primary-container/50 text-on-surface font-semibold' : 'bg-surface-low border-white/8 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
              <span className="font-mono text-[11px] text-outline">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="card p-6 text-center text-sm text-on-surface-variant">Nothing matches “{query}”.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shown.map((e) => (
            <li key={e.id} id={e.id} className="lore-entry card p-4 space-y-2 scroll-mt-28 min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-mono text-[15px] font-semibold text-tertiary">{e.term}</h2>
                <span className="label-caps text-outline">{e.kind === 'name-origin' ? 'Name' : 'Jargon'}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                <Prose text={e.explanation} />
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[12px]">
                {e.command && (
                  <a href={`/c/${e.command}`} className="inline-flex items-center gap-1.5 text-tertiary hover:underline underline-offset-3">
                    <BookOpen className="h-3.5 w-3.5" />
                    <code className="font-mono">{e.command}</code>
                  </a>
                )}
                {e.guide && e.guideTitle && (
                  <a href={`/g/${e.guide}`} className="inline-flex items-center gap-1.5 text-secondary hover:underline underline-offset-3">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {e.guideTitle}
                  </a>
                )}
                {e.chapter && e.chapterTitle && (
                  <a href={`/o/${e.chapter}`} className="inline-flex items-center gap-1.5 text-caution hover:underline underline-offset-3">
                    <Landmark className="h-3.5 w-3.5" />
                    {e.chapterTitle}
                  </a>
                )}
                {!e.source.startsWith('/') && (
                  <a href={e.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-outline hover:text-tertiary">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Source: {host(e.source)}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
