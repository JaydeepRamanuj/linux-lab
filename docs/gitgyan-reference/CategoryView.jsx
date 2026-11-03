import { useState } from 'react';
import { ArrowLeft, ChevronRight, House, ListFilter, SquareTerminal, Braces } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { SCENARIOS } from '../data/scenarios';
import { paths } from '../lib/router';
import { CategoryIcon, SeverityBadge, CommandText, CopyButton } from './ui';
import { ACCENTS, SEVERITY } from '../lib/theme';
import { useCopy } from '../lib/useCopy';

const GRAPH_CMD = 'git log --oneline --graph --decorate --all -20';
const FILTERS = ['all', 'safe', 'caution', 'destructive', 'emergency'];

export function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 font-mono text-[12px] text-outline" aria-label="Breadcrumb">
      <a href={paths.home()} className="flex items-center gap-1 hover:text-primary transition">
        <House className="h-3.5 w-3.5" />
        Home
      </a>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 min-w-0">
          <span className="text-outline-variant">/</span>
          {item.href ? (
            <a href={item.href} className="hover:text-primary transition">
              {item.label}
            </a>
          ) : (
            <span className="text-tertiary truncate max-w-[60vw] sm:max-w-none">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function BackLink({ href, label }) {
  return (
    <a href={href} className="btn-ghost inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs shrink-0">
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function ScenarioCard({ scenario, index }) {
  const destructive = scenario.severity === 'destructive' || scenario.severity === 'emergency';
  return (
    <div
      className="group card card-hover p-5 sm:p-6 flex flex-col gap-4 relative animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <a href={paths.scenario(scenario.id)} className="absolute inset-0 rounded-2xl" aria-label={scenario.title} />
      <div className="flex items-center justify-between gap-3">
        <span className="px-2.5 py-1 rounded-md bg-surface-high label-caps text-on-surface-variant">
          Scenario {scenario.number}
        </span>
        <SeverityBadge severity={scenario.severity} />
      </div>
      <div className="space-y-1.5 flex-1">
        <h3 className="text-lg font-semibold text-on-surface group-hover:text-white transition">{scenario.title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{scenario.tagline}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between label-caps">
          <span className={destructive ? 'text-danger' : 'text-outline'}>
            {destructive ? 'Destructive action' : 'Primary command'}
          </span>
          <span className="text-outline normal-case tracking-normal font-sans text-[11px]">
            {scenario.steps.length} steps
          </span>
        </div>
        <div className="well flex items-center gap-2 pl-4 pr-2 py-2.5 relative">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto no-scrollbar text-[13px]">
            <span className="font-mono text-secondary">$</span>
            <CommandText command={scenario.primaryCommand} className="whitespace-nowrap" />
          </div>
          <CopyButton text={scenario.primaryCommand} compact className="relative z-10" />
          <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default function CategoryView({ categoryId }) {
  const [filter, setFilter] = useState('all');
  const [text, setText] = useState('');
  const [copied, copy] = useCopy();

  const index = CATEGORIES.findIndex((c) => c.id === categoryId);
  const category = CATEGORIES[index];
  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 text-center space-y-4">
        <p className="text-on-surface-variant">That category does not exist.</p>
        <BackLink href={paths.home()} label="Back to home" />
      </div>
    );
  }

  const accent = ACCENTS[category.color] ?? ACCENTS.indigo;
  const scenarios = SCENARIOS.filter((s) => s.category === categoryId);
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === 'all' ? scenarios.length : scenarios.filter((s) => s.severity === f).length]));
  const q = text.trim().toLowerCase();
  const visible = scenarios.filter(
    (s) =>
      (filter === 'all' || s.severity === filter) &&
      (!q || `${s.title} ${s.tagline} ${s.primaryCommand}`.toLowerCase().includes(q))
  );
  const safeShare = Math.round((counts.safe / scenarios.length) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumbs items={[{ label: category.name }]} />
        <BackLink href={paths.home()} label="All categories" />
      </div>

      {/* Category hero */}
      <section className="card relative overflow-hidden p-6 sm:p-10 animate-fade-in">
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
          <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${accent.bg} ${accent.ring}`}>
            <CategoryIcon name={category.icon} className={`h-7 w-7 ${accent.text}`} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold">{category.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-tertiary-container/20 border border-tertiary/25 font-mono text-[11px] text-tertiary">
                Module 0{index + 1}
              </span>
            </div>
            <p className="text-base text-on-surface-variant max-w-2xl leading-relaxed">{category.description}</p>
          </div>
          <div className="well px-6 py-4 text-center shrink-0 self-start">
            <div className="text-4xl font-display font-bold text-primary leading-none">{scenarios.length}</div>
            <div className="label-caps text-outline mt-2">Scenarios</div>
          </div>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-on-surface-variant">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safe" />
            Non-destructive: <b className="text-on-surface">{safeShare}%</b>
          </span>
          {counts.caution > 0 && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-caution" />
              Rewrites history / needs care: <b className="text-on-surface">{counts.caution}</b>
            </span>
          )}
          {counts.destructive + counts.emergency > 0 && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger" />
              Can lose data: <b className="text-on-surface">{counts.destructive + counts.emergency}</b>
            </span>
          )}
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-low border border-white/5 overflow-x-auto no-scrollbar">
          {FILTERS.filter((f) => f === 'all' || counts[f] > 0).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                filter === f ? 'bg-surface-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f === 'all' ? 'All' : SEVERITY[f].label} ({counts[f]})
            </button>
          ))}
        </div>
        <label className="relative sm:w-72">
          <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Filter by title or command…"
            className="w-full pl-9 pr-3 h-9 rounded-lg bg-surface-low border border-white/6 text-[13px] placeholder:text-outline focus:outline-none focus:border-primary-container/60"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-sm text-on-surface-variant">No scenarios match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visible.map((s, i) => (
            <ScenarioCard key={s.id} scenario={s} index={i} />
          ))}
        </div>
      )}

      {/* Help CTA */}
      <section className="card p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-11 h-11 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
          <SquareTerminal className="h-5 w-5 text-on-surface-variant" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Not sure which situation you are in?</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Look before you act. This read-only command draws your branches, HEAD and remote refs in the terminal.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => copy(GRAPH_CMD)}
            className="btn-ghost inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono"
          >
            <Braces className="h-3.5 w-3.5 text-tertiary" />
            {copied ? 'Copied!' : 'Copy graph command'}
          </button>
          <a href={paths.basics()} className="btn-primary inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold">
            Open sandbox
          </a>
        </div>
      </section>
    </div>
  );
}
