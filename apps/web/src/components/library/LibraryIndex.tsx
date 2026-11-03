import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Search, ChevronRight } from 'lucide-react';
import { COMMAND_CATEGORIES, LEVELS } from '../../data/commandCategories';
import type { CommandCategoryId } from '../../data/commandCategories';

export interface LibraryEntry {
  slug: string;
  name: string;
  title: string;
  summary: string;
  category: CommandCategoryId;
  level: keyof typeof LEVELS;
  flags: string[];
}

type Filter<T extends string> = T | 'all';

export default function LibraryIndex({ entries }: { entries: LibraryEntry[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Filter<CommandCategoryId>>('all');
  const [level, setLevel] = useState<Filter<LibraryEntry['level']>>('all');

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: 'name', weight: 3 },
          { name: 'title', weight: 2 },
          { name: 'summary', weight: 1 },
          { name: 'flags', weight: 1 }
        ],
        threshold: 0.35,
        ignoreLocation: true
      }),
    [entries]
  );

  const visible = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : [...entries].sort((a, b) => a.name.localeCompare(b.name));
    return base.filter((e) => (category === 'all' || e.category === category) && (level === 'all' || e.level === level));
  }, [fuse, entries, query, category, level]);

  const usedCategories = (Object.keys(COMMAND_CATEGORIES) as CommandCategoryId[]).filter((c) => entries.some((e) => e.category === c));

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs transition ${active ? 'bg-surface-high text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`;

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, flag or what it does…"
            aria-label="Filter commands"
            className="w-full bg-surface-low border border-white/8 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container/60 rounded-lg pl-9 pr-3 h-10 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="label-caps text-outline mr-2">Category</span>
          <button type="button" className={chip(category === 'all')} onClick={() => setCategory('all')}>
            All
          </button>
          {usedCategories.map((c) => (
            <button key={c} type="button" className={chip(category === c)} onClick={() => setCategory(c)}>
              {COMMAND_CATEGORIES[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="label-caps text-outline mr-2">Level</span>
          {(['all', ...Object.keys(LEVELS)] as Filter<LibraryEntry['level']>[]).map((l) => (
            <button key={l} type="button" className={chip(level === l)} onClick={() => setLevel(l)}>
              {l === 'all' ? 'All' : LEVELS[l]}
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-[11px] text-outline">
        {visible.length} of {entries.length} commands
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((e) => (
          <a key={e.slug} href={`/c/${e.slug}`} className="group card card-hover p-5 flex items-start gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-tertiary">{e.name}</span>
                <span className="label-caps text-outline-variant">{COMMAND_CATEGORIES[e.category]}</span>
              </div>
              <div className="text-sm font-medium text-on-surface">{e.title}</div>
              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{e.summary}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </div>
  );
}
