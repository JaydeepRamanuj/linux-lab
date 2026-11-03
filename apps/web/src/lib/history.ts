// Explainer history in localStorage (plan §3.4). Entries are keyed by a hash of the normalised, redacted command,
// so explaining the same command again is a cache hit. M4 stores the AI explanation on the entry (`ai`).
// Storage can be missing or throw (private windows, blocked site data), so every access is wrapped.
import type { Severity } from '@shellgyan/core/severity';

export interface HistoryEntry {
  id: string;
  /** Redacted: secrets are masked before anything is saved. */
  command: string;
  severity: Severity;
  cantVerify: boolean;
  summary: string;
  /** How many values were masked. */
  masked: number;
  createdAt: number;
  lastSeen: number;
  count: number;
  /** The AI explanation, once M4 adds one. */
  ai?: unknown;
}

const KEY = 'shellgyan:history:v1';
const MAX_ENTRIES = 300;

/** Same command, same key: line endings unified, each line trimmed, blank lines dropped. Spacing inside a line is kept, since it can matter in quotes. */
export function normalizeCommand(command: string): string {
  return command
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

// cyrb53: a fast 53-bit string hash. Good enough for cache keys; not for security.
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const historyKey = (redactedCommand: string) => cyrb53(normalizeCommand(redactedCommand));

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]).filter((e) => e && typeof e.id === 'string' && typeof e.command === 'string') : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function getEntry(id: string): HistoryEntry | undefined {
  return loadHistory().find((e) => e.id === id);
}

/** Adds the command, or bumps it if it's already there (a cache hit). Returns the stored entry and whether it was a hit. */
export function recordExplained(entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'lastSeen' | 'count'>): { entry: HistoryEntry; hit: boolean } {
  const now = Date.now();
  const id = historyKey(entry.command);
  const all = loadHistory();
  const existing = all.find((e) => e.id === id);
  // The rule engine can change between releases, so the stored verdict is always refreshed; `ai` is the cached part.
  const next: HistoryEntry = existing
    ? { ...existing, ...entry, lastSeen: now, count: existing.count + 1 }
    : { ...entry, id, createdAt: now, lastSeen: now, count: 1 };
  save([next, ...all.filter((e) => e.id !== id)].slice(0, MAX_ENTRIES));
  return { entry: next, hit: Boolean(existing) };
}

export function deleteEntry(id: string): HistoryEntry[] {
  const rest = loadHistory().filter((e) => e.id !== id);
  save(rest);
  return rest;
}

export function clearHistory(): void {
  save([]);
}

export function exportHistory(entries: HistoryEntry[]): void {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shellgyan-history-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
