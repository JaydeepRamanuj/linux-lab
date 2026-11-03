import { ArrowRight, Zap, Shapes, Info, Copy } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { SCENARIOS } from '../data/scenarios';
import { getScenarioDiagram } from '../data/diagrams';
import { paths } from '../lib/router';
import SearchBar from './SearchBar';
import Diagram from './Diagram';
import { CategoryIcon, SeverityBadge, CommandText, CopyButton } from './ui';
import { ACCENTS } from '../lib/theme';
import { useCopy } from '../lib/useCopy';

const QUICK_PATH_ID = 'scenario-11';

const QUICK_CHIPS = [
  { command: 'git reset --soft HEAD~1', scenarioId: 'scenario-01' },
  { command: 'git revert <hash>', scenarioId: 'scenario-03' },
  { command: 'git commit --amend', scenarioId: 'scenario-05' },
  { command: 'git reflog', scenarioId: 'scenario-06' },
  { command: 'git restore --staged <file>', scenarioId: 'scenario-07' },
  { command: 'git merge --abort', scenarioId: 'scenario-15' },
  { command: 'git rebase -i HEAD~N', scenarioId: 'scenario-17' },
  { command: 'git pull --rebase', scenarioId: 'scenario-18' },
  { command: 'git stash push -u', scenarioId: 'scenario-19' },
  { command: 'git add -p', scenarioId: 'scenario-20' },
  { command: 'git bisect start', scenarioId: 'scenario-22' },
  { command: 'git cherry-pick -x <hash>', scenarioId: 'scenario-25' }
];

function QuickPath() {
  const scenario = SCENARIOS.find((s) => s.id === QUICK_PATH_ID);
  const diagram = getScenarioDiagram(QUICK_PATH_ID);
  const steps = scenario.steps.filter((s) => s.command).slice(1, 4);
  const [copied, copy] = useCopy();

  return (
    <section className="card p-5 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-2 label-caps text-danger">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          Most common incident
        </span>
        <span className="text-outline-variant hidden sm:inline">•</span>
        <a href={paths.scenario(scenario.id)} className="text-sm font-medium text-on-surface hover:text-primary transition">
          Scenario #{scenario.number}: “I committed straight to main”
        </a>
        <span className="sm:ml-auto">
          <SeverityBadge severity={scenario.severity} long />
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 well p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between label-caps text-outline">
            <span>After the fix</span>
            <span className="text-tertiary normal-case tracking-normal font-mono">main → base</span>
          </div>
          <div className="flex-1 flex items-center">
            <Diagram spec={diagram.after} />
          </div>
          <p className="flex items-start gap-2 text-xs text-on-surface-variant">
            <Info className="h-4 w-4 text-tertiary shrink-0" />
            {diagram.after.caption}
          </p>
        </div>

        <div className="lg:col-span-3 rounded-xl bg-surface-lowest border border-white/5 overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.7)]">
          <div className="h-10 px-4 bg-surface-high/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-danger/80" />
              <span className="w-3 h-3 rounded-full bg-caution/80" />
              <span className="w-3 h-3 rounded-full bg-safe/80" />
              <span className="ml-2 font-mono text-[11px] text-outline">move-commits.sh</span>
            </div>
            <button
              type="button"
              onClick={() => copy(steps.map((s) => s.command).join('\n'))}
              className="btn-ghost rounded-md px-2.5 py-1 text-[11px] flex items-center gap-1.5"
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy sequence'}
            </button>
          </div>
          <ol className="p-5 space-y-4">
            {steps.map((step, i) => (
              <li key={step.command} className="animate-fade-in" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="flex items-baseline gap-3 font-mono text-[13px] overflow-x-auto no-scrollbar">
                  <span className="text-outline text-[11px]">0{i + 1}</span>
                  <span className="text-secondary">$</span>
                  <CommandText command={step.command} className="whitespace-nowrap" />
                </div>
                <p className="text-xs text-on-surface-variant mt-1 pl-12">{step.instruction}</p>
              </li>
            ))}
          </ol>
          <div className="px-5 pb-4">
            <a
              href={paths.scenario(scenario.id)}
              className="inline-flex items-center gap-1.5 text-xs text-tertiary hover:text-primary transition"
            >
              Open the full walkthrough <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomeView() {
  const total = SCENARIOS.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-16">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-low border border-white/8 label-caps text-on-surface-variant">
          <Zap className="h-3.5 w-3.5 text-caution" />
          Git rescue & troubleshooting guide
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
        </div>
        <h1 className="text-[2.25rem] sm:text-display font-bold tracking-[-0.02em] leading-[1.1]">
          When Git breaks at 2 AM,
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-secondary via-primary to-tertiary">
            don’t panic. Resolve it.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
          Scenario-based walkthroughs for {total} common Git mishaps. Find your situation, see the repository before and
          after, and step through the fix one command at a time.
        </p>
        <div className="max-w-xl mx-auto pt-2 text-left">
          <SearchBar variant="hero" />
        </div>
      </section>

      {/* Sandbox promo */}
      <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-white/8 bg-linear-to-br from-surface-high via-surface-container to-surface-container shadow-xl">
        <div className="absolute -right-24 -top-24 w-72 h-72 bg-primary-container/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 space-y-2">
            <span className="inline-block px-2 py-0.5 rounded bg-primary-deep/30 border border-primary/20 label-caps text-primary">
              Interactive playground
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold">New to Git? Practice in the sandbox</h2>
            <p className="text-sm text-on-surface-variant max-w-xl leading-relaxed">
              See how files move between the working directory, the staging area, your local commits and the remote, and
              how HEAD and branches actually work, without touching a real repository.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-lowest/80 border border-white/5 font-mono text-[11px] text-on-surface-variant shrink-0">
            <span className="w-2 h-2 rounded-full bg-caution" /> Working
            <ArrowRight className="h-3 w-3 text-outline" />
            <span className="w-2 h-2 rounded-full bg-safe" /> Index
            <ArrowRight className="h-3 w-3 text-outline" />
            <span className="w-2 h-2 rounded-full bg-primary" /> Repo
            <ArrowRight className="h-3 w-3 text-outline" />
            <span className="w-2 h-2 rounded-full bg-secondary" /> Remote
          </div>
          <a
            href={paths.basics()}
            className="btn-primary shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold group"
          >
            Open Git Basics sandbox
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
          </a>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 label-caps text-on-surface">
            <Shapes className="h-4 w-4 text-primary" />
            Troubleshooting categories
          </h2>
          <span className="font-mono text-[11px] text-outline">
            {CATEGORIES.length} modules <span className="text-outline-variant mx-1">•</span>
            <span className="text-tertiary">{total} scenarios</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((category, i) => {
            const accent = ACCENTS[category.color] ?? ACCENTS.indigo;
            const count = SCENARIOS.filter((s) => s.category === category.id).length;
            return (
              <a
                key={category.id}
                href={paths.category(category.id)}
                className={`group card card-hover p-6 flex flex-col hover:-translate-y-0.5 animate-fade-in ${
                  i === CATEGORIES.length - 1 && CATEGORIES.length % 3 === 2 ? 'lg:col-span-2' : ''
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${accent.bg} ${accent.ring}`}>
                    <CategoryIcon name={category.icon} className={`h-5 w-5 ${accent.text}`} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full bg-surface-lowest font-mono text-[11px] ${accent.text}`}>
                    {count} scenarios
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-on-surface">{category.name}</h3>
                <p className="mt-2 text-sm text-on-surface-variant leading-relaxed flex-1">{category.description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-outline group-hover:text-on-surface transition">
                    Explore scenarios
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
                  </span>
                  <span className="label-caps text-outline-variant">Module 0{i + 1}</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <QuickPath />

      {/* Quick reference */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 label-caps text-on-surface">
            <Zap className="h-4 w-4 text-secondary" />
            Quick reference
          </h2>
          <span className="font-mono text-[11px] text-outline hidden sm:block">Click a command to open its scenario</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <div
              key={chip.command}
              className="group flex items-center rounded-lg bg-surface-container border border-white/6 hover:border-primary-container/40 transition"
            >
              <a href={paths.scenario(chip.scenarioId)} className="pl-3 pr-1 py-2 text-[12px]">
                <CommandText command={chip.command} />
              </a>
              <CopyButton text={chip.command} compact className="mr-1" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
