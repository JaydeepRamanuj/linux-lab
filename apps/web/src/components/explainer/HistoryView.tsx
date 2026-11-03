import { useEffect, useMemo, useState } from 'react';
import { Download, EyeOff, KeyRound, Search, Trash2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { CommandText, Prose, SeverityBadge } from '../ui/ui';
import { clearHistory, deleteEntry, exportHistory, loadHistory } from '../../lib/history';
import type { HistoryEntry } from '../../lib/history';

const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Every command explained in this browser: searchable, deletable, exportable as JSON.
export default function HistoryView() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => setEntries(loadHistory()), []);

  const fuse = useMemo(() => new Fuse(entries ?? [], { keys: ['command', 'summary'], threshold: 0.35, ignoreLocation: true }), [entries]);
  const shown = !entries ? [] : query.trim() ? fuse.search(query).map((r) => r.item) : entries;

  if (entries === null) return null;
  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center flex flex-col items-center gap-3">
        <p className="text-on-surface-variant">Nothing here yet. Commands you explain are saved in this browser.</p>
        <a href="/explain" className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
          Explain a command
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="flex-1 flex items-center gap-2 rounded-lg bg-surface-low border border-white/8 px-3 py-2 focus-within:border-primary-container/60">
          <Search className="h-4 w-4 text-outline shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your history"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none focus-visible:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportHistory(entries)} className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs">
            <Download className="h-3.5 w-3.5 text-tertiary" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete all ${entries.length} entries from this browser?`)) {
                clearHistory();
                setEntries([]);
              }
            }}
            className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      </div>

      <p className="text-xs text-outline">
        {shown.length === entries.length ? `${entries.length} commands` : `${shown.length} of ${entries.length} commands`} · stored in this
        browser only, with secrets masked.
      </p>

      <ul className="flex flex-col gap-3">
        {shown.map((e) => (
          <li key={e.id} className="card card-hover p-4 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <a href={`/explain?h=${e.id}`} className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="overflow-x-auto no-scrollbar text-[13px]">
                  <CommandText command={e.command} className="whitespace-pre" />
                </div>
                <p className="text-sm text-on-surface-variant">
                  <Prose text={e.summary} />
                </p>
              </a>
              <button
                type="button"
                onClick={() => setEntries(deleteEntry(e.id))}
                aria-label="Delete from history"
                className="p-1.5 rounded-md text-outline hover:text-danger hover:bg-white/5 transition shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-outline">
              <SeverityBadge severity={e.severity} />
              {e.cantVerify && (
                <span className="inline-flex items-center gap-1 text-elevated">
                  <EyeOff className="h-3 w-3" /> can't verify
                </span>
              )}
              {e.masked > 0 && (
                <span className="inline-flex items-center gap-1 text-caution">
                  <KeyRound className="h-3 w-3" /> {e.masked} masked
                </span>
              )}
              <span>{when(e.lastSeen)}</span>
              {e.count > 1 && <span>explained {e.count}×</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
