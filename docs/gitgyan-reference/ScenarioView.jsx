import { useState } from 'react';
import {
  Zap, AlertTriangle, OctagonAlert, ScanSearch, Network, BrainCircuit, ChevronDown, ShieldCheck, CheckCircle2,
  Link2, ChevronRight, Info
} from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import { CATEGORIES } from '../data/categories';
import { getScenarioDiagram } from '../data/diagrams';
import { getCommandAnatomy } from '../utils/anatomy';
import { paths } from '../lib/router';
import { SeverityBadge, CommandWell, Prose, CategoryIcon } from './ui';
import { ACCENTS, SEVERITY } from '../lib/theme';
import { Breadcrumbs, BackLink } from './CategoryView';
import Diagram from './Diagram';
import StepWalkthrough from './StepWalkthrough';
import TerminalReplay from './TerminalReplay';

function Callout({ warning }) {
  const danger = warning.type === 'danger';
  const Icon = danger ? OctagonAlert : AlertTriangle;
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 flex items-start gap-4 animate-fade-in ${
        danger ? 'bg-danger-surface/70 border-danger-border/50' : 'bg-caution-surface/50 border-caution-border/40'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-danger/15' : 'bg-caution/15'}`}>
        <Icon className={`h-5 w-5 ${danger ? 'text-danger' : 'text-caution'}`} />
      </div>
      <div>
        <div className={`font-display font-semibold ${danger ? 'text-danger' : 'text-caution'}`}>
          {danger ? 'Danger' : 'Caution required'}
        </div>
        <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
          <Prose text={warning.text} />
        </p>
      </div>
    </div>
  );
}

function StatePanel({ spec, which }) {
  const before = which === 'before';
  return (
    <div className="well p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-2 font-mono text-[11px] ${before ? 'text-danger' : 'text-tertiary'}`}>
          <span className={`w-2 h-2 rounded-full ${before ? 'bg-danger' : 'bg-tertiary'}`} />
          {before ? 'BEFORE' : 'AFTER'}
        </span>
        <span className="label-caps text-outline truncate">{spec.title}</span>
      </div>
      <div className="flex-1 flex items-center justify-center rounded-lg bg-surface-container/30 p-2 min-h-32">
        <Diagram spec={spec} />
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">
        <Prose text={spec.caption} />
      </p>
    </div>
  );
}

function HowItWorks({ scenario }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const anatomy = getCommandAnatomy(scenario.primaryCommand);
  const shortCmd = scenario.primaryCommand.split(' ').slice(0, 2).join(' ');

  return (
    <div className="rounded-xl bg-surface-low border border-white/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
      >
        <span className="flex items-center gap-2 font-display font-semibold text-on-surface">
          <BrainCircuit className="h-5 w-5 text-primary" />
          How <code className="font-mono text-[13px] text-primary bg-surface-high px-1.5 py-0.5 rounded">{shortCmd}</code> works
        </span>
        <ChevronDown className={`h-5 w-5 text-outline transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-5 space-y-5">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <Prose text={scenario.howItWorks} />
            </p>
            <div className="space-y-2">
              <div className="label-caps text-outline">Command anatomy</div>
              <div className="well p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5 font-mono text-[13px]">
                  {anatomy.map((tok, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      className={`px-2.5 py-1.5 rounded-md border transition ${
                        active === i
                          ? 'bg-primary-deep/25 border-primary/60 text-primary'
                          : 'bg-surface-container border-white/5 text-tertiary hover:border-white/15'
                      }`}
                    >
                      {tok.text}
                    </button>
                  ))}
                </div>
                <div className="min-h-12 rounded-md bg-surface-container/60 px-3 py-2.5 text-[13px]">
                  {active !== null && anatomy[active] ? (
                    <div className="animate-fade-in" key={active}>
                      <span className="font-mono text-primary mr-2">{anatomy[active].text}</span>
                      <span className="text-on-surface-variant">
                        <Prose text={anatomy[active].explanation} />
                      </span>
                    </div>
                  ) : (
                    <span className="text-outline italic">Hover or tap a part of the command to see what it does.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScenarioView({ scenarioId }) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 text-center space-y-4">
        <p className="text-on-surface-variant">That scenario does not exist.</p>
        <BackLink href={paths.home()} label="Back to home" />
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === scenario.category);
  const accent = ACCENTS[category.color] ?? ACCENTS.indigo;
  const diagram = getScenarioDiagram(scenario.id);
  const related = (scenario.relatedScenarios ?? []).map((id) => SCENARIOS.find((s) => s.id === id)).filter(Boolean);
  const emergency = scenario.severity === 'emergency';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            { label: category.name, href: paths.category(category.id) },
            { label: `#${scenario.number}: ${scenario.title}` }
          ]}
        />
        <BackLink href={paths.category(category.id)} label="Back to category" />
      </div>

      {/* Hero */}
      <section
        className={`card relative overflow-hidden p-6 sm:p-10 space-y-6 animate-fade-in ${
          emergency ? 'border-danger/60! shadow-[0_0_40px_-8px_rgba(251,113,133,0.35)]!' : ''
        }`}
      >
        <div
          className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            emergency ? 'bg-danger/15' : 'bg-primary-container/12'
          }`}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-surface-high label-caps text-primary">Scenario {scenario.number}</span>
            <a
              href={paths.category(category.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-lowest font-mono text-[11px] ${accent.text} hover:brightness-125`}
            >
              <CategoryIcon name={category.icon} className="h-3.5 w-3.5" />
              {category.name}
            </a>
          </div>
          <SeverityBadge severity={scenario.severity} long />
        </div>
        <div className="relative space-y-3">
          <h1 className="text-3xl sm:text-[2.75rem] font-bold leading-[1.15] tracking-[-0.02em]">{scenario.title}</h1>
          <p className="text-base sm:text-lg text-on-surface-variant italic">“{scenario.tagline}”</p>
        </div>
        <div className="relative space-y-2">
          <div className="flex items-center gap-1.5 label-caps text-secondary">
            <Zap className="h-3.5 w-3.5" />
            Primary command
          </div>
          <CommandWell command={scenario.primaryCommand} size="lg" label="Copy" />
        </div>
      </section>

      {scenario.warnings?.length > 0 && (
        <div className="space-y-3">
          {scenario.warnings.map((w) => (
            <Callout key={w.text} warning={w} />
          ))}
        </div>
      )}

      {/* Situation + state diagrams + how it works */}
      <section className="card p-5 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <h2 className="text-[22px] font-semibold">The Situation</h2>
          </div>
          <p className="text-[15px] text-on-surface-variant leading-relaxed max-w-3xl">
            <Prose text={scenario.situation} />
          </p>
        </div>

        {diagram && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 label-caps text-outline">
              <Network className="h-4 w-4 text-tertiary" />
              Repository state
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatePanel spec={diagram.before} which="before" />
              <StatePanel spec={diagram.after} which="after" />
            </div>
          </div>
        )}

        <HowItWorks scenario={scenario} />
      </section>

      <StepWalkthrough steps={scenario.steps} />

      {scenario.fullExample && <TerminalReplay example={scenario.fullExample} />}

      {scenario.avoidTips?.length > 0 && (
        <section className="card p-5 sm:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-safe" />
            <h2 className="text-[22px] font-semibold">How to Avoid This Next Time</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenario.avoidTips.map((tip) => (
              <div key={tip} className="flex items-start gap-3 rounded-xl bg-surface-low border border-white/5 p-4">
                <CheckCircle2 className="h-4 w-4 text-safe shrink-0 mt-0.5" />
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  <Prose text={tip} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 label-caps text-on-surface">
            <Link2 className="h-4 w-4 text-secondary" />
            Related scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {related.map((s) => {
              const cat = CATEGORIES.find((c) => c.id === s.category);
              return (
                <a key={s.id} href={paths.scenario(s.id)} className="group card card-hover p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
                    <CategoryIcon name={cat.icon} className={`h-5 w-5 ${ACCENTS[cat.color]?.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-tertiary">#{s.number}</span>
                      <span className={SEVERITY[s.severity].text}>{SEVERITY[s.severity].label}</span>
                    </div>
                    <div className="font-display font-semibold text-on-surface truncate">{s.title}</div>
                    <div className="text-xs text-outline truncate">{s.tagline}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-outline">
        <Info className="h-3.5 w-3.5 text-tertiary" />
        Commands use modern Git syntax (<code className="font-mono">git switch</code> / <code className="font-mono">git restore</code>, Git
        2.23+). Hashes and output are illustrative.
      </p>
    </div>
  );
}
