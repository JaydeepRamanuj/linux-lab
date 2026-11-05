import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Search as SearchIcon, CornerDownLeft, X, Terminal } from 'lucide-react';
import { SeverityBadge, commandPreview } from '../ui/ui';
import type { SearchItem } from '../../lib/searchTypes';

const MAX_RESULTS = 8;

// The index is built at compile time (/search.json) and fetched once, on first focus.
let indexPromise: Promise<Fuse<SearchItem>> | null = null;
function loadIndex() {
  indexPromise ??= fetch('/search.json')
    .then((r) => r.json() as Promise<SearchItem[]>)
    .then(
      (items) =>
        new Fuse(items, {
          keys: [
            { name: 'title', weight: 3 },
            { name: 'tags', weight: 2 },
            { name: 'command', weight: 2 },
            { name: 'subtitle', weight: 1 }
          ],
          threshold: 0.35,
          ignoreLocation: true
        })
    );
  return indexPromise;
}

const GROUPS: { type: SearchItem['type']; label: string; tone: string }[] = [
  { type: 'scenario', label: 'Scenarios', tone: 'text-primary' },
  { type: 'command', label: 'Commands', tone: 'text-tertiary' },
  { type: 'guide', label: 'Guides', tone: 'text-secondary' }
];

export default function SearchBar({ variant = 'header', hotkey = false }: { variant?: 'header' | 'hero'; hotkey?: boolean }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fuse, setFuse] = useState<Fuse<SearchItem> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ensureIndex = () => {
    if (!fuse) loadIndex().then(setFuse).catch(() => {});
  };

  const results = useMemo(
    () => (fuse && query.trim() ? fuse.search(query.trim(), { limit: MAX_RESULTS }).map((r) => r.item) : []),
    [fuse, query]
  );

  // Results in display order (grouped by type) so arrow keys follow what is on screen.
  const groups = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: results.filter((r) => r.type === g.type) })).filter((g) => g.items.length > 0),
    [results]
  );
  const ordered = groups.flatMap((g) => g.items);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!hotkey) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey]);

  const handleSelect = (item: SearchItem) => {
    window.location.href = item.url;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!isOpen || ordered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % ordered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + ordered.length) % ordered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = ordered[Math.min(selectedIndex, ordered.length - 1)];
      if (item) handleSelect(item);
    }
  };

  const hero = variant === 'hero';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        {hero ? (
          <Terminal className="absolute left-4 h-4 w-4 text-outline pointer-events-none" />
        ) : (
          <SearchIcon className="absolute left-3 h-4 w-4 text-outline pointer-events-none" />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => {
            ensureIndex();
            setIsOpen(true);
          }}
          onMouseEnter={ensureIndex}
          onKeyDown={handleKeyDown}
          aria-label="Search scenarios, commands and guides"
          placeholder={hero ? "Describe your problem: 'port already in use', 'permission denied'…" : 'Search…'}
          className={`w-full bg-surface-low border border-white/8 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container/60 focus:ring-2 focus:ring-primary-container/20 transition [&::-webkit-search-cancel-button]:hidden ${
            hero
              ? 'pl-11 pr-12 py-4 rounded-xl text-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]'
              : 'pl-9 pr-14 h-9 rounded-lg text-[13px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]'
          }`}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-md text-outline hover:text-on-surface hover:bg-white/5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          hotkey && (
            <kbd className="absolute right-2.5 hidden sm:inline px-1.5 py-0.5 rounded bg-surface-highest border border-white/10 font-mono text-[10px] text-on-surface-variant pointer-events-none">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          )
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 card bg-surface-low! overflow-hidden z-50 animate-fade-in ${
            hero ? '' : 'sm:min-w-104 sm:left-auto'
          }`}
        >
          {!fuse ? (
            <div className="p-5 text-center text-sm text-outline">Loading…</div>
          ) : ordered.length === 0 ? (
            <div className="p-5 text-center text-sm text-on-surface-variant">
              Nothing matches “{query}”. Try an error message like <code className="font-mono text-tertiary">EADDRINUSE</code> or a
              command like <code className="font-mono text-tertiary">chmod</code>.
            </div>
          ) : (
            <div className="max-h-104 overflow-y-auto p-2" role="listbox">
              {groups.map((group) => (
                <div key={group.type} className="py-1">
                  <div className={`px-3 py-1.5 label-caps ${group.tone}`}>{group.label}</div>
                  {group.items.map((item) => {
                    const idx = ordered.indexOf(item);
                    const active = idx === selectedIndex;
                    return (
                      <button
                        key={item.url}
                        role="option"
                        aria-selected={active}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition ${
                          active ? 'bg-surface-high' : 'hover:bg-surface-container'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-tertiary bg-surface-lowest px-1.5 py-0.5 rounded shrink-0">
                          {item.badge}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-on-surface truncate">{item.title}</div>
                          {item.command ? (
                            <div className="text-xs text-outline truncate font-mono mt-0.5">{commandPreview(item.command)}</div>
                          ) : (
                            <div className="text-xs text-outline truncate mt-0.5">{item.subtitle}</div>
                          )}
                        </div>
                        {active ? (
                          <CornerDownLeft className="h-3.5 w-3.5 text-outline shrink-0" />
                        ) : (
                          item.severity && (
                            <span className="hidden sm:block shrink-0 scale-90 origin-right">
                              <SeverityBadge severity={item.severity} />
                            </span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
