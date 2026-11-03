import { useState, useEffect, useRef, useMemo } from 'react';
import { Search as SearchIcon, CornerDownLeft, X, Terminal } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import { CATEGORIES } from '../data/categories';
import { SeverityBadge } from './ui';
import { ACCENTS } from '../lib/theme';
import { navigate, paths } from '../lib/router';

const MAX_RESULTS = 8;

function searchScenarios(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored = SCENARIOS.map((s) => {
    const title = s.title.toLowerCase();
    const haystack = [s.title, s.tagline, s.primaryCommand, s.situation, ...s.steps.map((st) => st.command ?? '')]
      .join(' ')
      .toLowerCase();
    if (!words.every((w) => haystack.includes(w))) return null;
    const score = words.reduce((acc, w) => acc + (title.includes(w) ? 3 : 0) + (s.primaryCommand.includes(w) ? 2 : 0), 0);
    return { s, score };
  }).filter(Boolean);
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.s);
}

export default function SearchBar({ variant = 'header', hotkey = false }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => searchScenarios(query), [query]);

  // Results in display order (grouped by category) so arrow keys follow what is on screen.
  const groups = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      items: results.filter((r) => r.category === category.id)
    })).filter((g) => g.items.length > 0);
  }, [results]);
  const ordered = groups.flatMap((g) => g.items);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!hotkey) return;
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey]);

  const handleSelect = (scenario) => {
    navigate(paths.scenario(scenario.id));
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
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
      handleSelect(ordered[Math.min(selectedIndex, ordered.length - 1)]);
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
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search scenarios"
          placeholder={
            hero
              ? "Describe your problem: 'committed to main', 'undo push', 'merge conflict'…"
              : 'Search scenarios…'
          }
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
          {ordered.length === 0 ? (
            <div className="p-5 text-center text-sm text-on-surface-variant">
              No scenarios match “{query}”. Try a command name like <code className="font-mono text-tertiary">reset</code> or{' '}
              <code className="font-mono text-tertiary">stash</code>.
            </div>
          ) : (
            <div className="max-h-104 overflow-y-auto p-2" role="listbox">
              {groups.map(({ category, items }) => (
                <div key={category.id} className="py-1">
                  <div className={`px-3 py-1.5 label-caps ${ACCENTS[category.color]?.text ?? 'text-outline'}`}>
                    {category.name}
                  </div>
                  {items.map((scenario) => {
                    const idx = ordered.indexOf(scenario);
                    const active = idx === selectedIndex;
                    return (
                      <button
                        key={scenario.id}
                        role="option"
                        aria-selected={active}
                        onClick={() => handleSelect(scenario)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition ${
                          active ? 'bg-surface-high' : 'hover:bg-surface-container'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-tertiary bg-surface-lowest px-1.5 py-0.5 rounded shrink-0">
                          {scenario.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-on-surface truncate">{scenario.title}</div>
                          <div className="text-xs text-outline truncate font-mono mt-0.5">{scenario.primaryCommand}</div>
                        </div>
                        {active ? (
                          <CornerDownLeft className="h-3.5 w-3.5 text-outline shrink-0" />
                        ) : (
                          <span className="hidden sm:block shrink-0 scale-90 origin-right">
                            <SeverityBadge severity={scenario.severity} />
                          </span>
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
