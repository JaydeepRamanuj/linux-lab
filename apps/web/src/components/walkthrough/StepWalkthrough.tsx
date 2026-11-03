import { useState } from 'react';
import { Route, RotateCcw, ChevronLeft, ArrowRight, Terminal, FileCode2, CheckCircle2, Hand } from 'lucide-react';
import { CommandText, CopyButton, Prose } from '../ui/ui';
import { SEVERITY } from '../../lib/theme';
import type { WalkthroughStep } from '../../lib/types';

const STEP_LABELS = {
  readonly: 'Inspect · read-only',
  modifies: 'Changes your files',
  elevated: 'System · needs care',
  destructive: 'Destructive'
} as const;

// Label a step so the learner can see at a glance whether it only looks, changes things, or can lose work.
// The level comes from the content (`kind`), not from guessing at the command text.
function stepPhase(step: WalkthroughStep) {
  if (step.editor) return { label: 'Edit file', tone: 'text-secondary', dot: 'bg-secondary' };
  if (!step.command) return { label: 'Manual action', tone: 'text-caution', dot: 'bg-caution' };
  if (!step.kind) return { label: 'Action', tone: 'text-primary', dot: 'bg-primary' };
  const s = SEVERITY[step.kind];
  return { label: STEP_LABELS[step.kind], tone: s.text, dot: s.dot };
}

export default function StepWalkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState('next');
  const total = steps.length;
  const isDone = idx === total;
  const step = steps[idx];
  const percent = isDone ? 100 : Math.round((idx / total) * 100);

  const go = (target: number) => {
    setDir(target >= idx ? 'next' : 'prev');
    setIdx(Math.max(0, Math.min(total, target)));
  };

  const phase = step ? stepPhase(step) : null;

  return (
    <section className="card p-5 sm:p-8 space-y-6" id="walkthrough">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-tertiary" />
            <h2 className="text-[22px] font-semibold">Step-by-Step Walkthrough</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Work through the fix one command at a time</p>
        </div>
        <button
          type="button"
          onClick={() => go(0)}
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-outline hover:text-on-surface transition self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
      </div>

      {/* Progress track */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="label-caps text-primary">{isDone ? 'Complete' : `Step ${idx + 1} of ${total}`}</span>
          <span className="font-mono text-[12px] text-outline">{percent}% completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
              aria-current={i === idx ? 'step' : undefined}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                i < idx || isDone
                  ? 'bg-primary-container'
                  : i === idx
                    ? 'bg-linear-to-r from-primary-container to-tertiary shadow-[0_0_10px_rgba(128,131,255,0.5)]'
                    : 'bg-surface-highest hover:bg-surface-bright'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Active step */}
      <div className="rounded-xl bg-surface-low border border-white/5 p-5 sm:p-6 shadow-inner min-h-64 overflow-hidden">
        {!isDone && step && phase ? (
          <div key={idx} className={`space-y-5 ${dir === 'next' ? 'animate-slide-in' : 'animate-slide-in-left'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="px-2.5 py-1 rounded bg-surface-container font-mono text-[11px] text-tertiary">
                Step {idx + 1}
              </span>
              <span className={`flex items-center gap-1.5 font-mono text-[11px] ${phase.tone}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${phase.dot}`} />
                {phase.label}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-on-surface">{step.title}</h3>

            {step.command && (
              <div className="well p-4 space-y-2">
                <div className="flex items-center justify-between label-caps text-outline">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" />
                    Terminal command
                  </span>
                  <CopyButton text={step.command} compact />
                </div>
                <div className="flex items-start gap-2 text-[13px] overflow-x-auto no-scrollbar">
                  <span className="font-mono text-secondary select-none">$</span>
                  <CommandText command={step.command} className="whitespace-pre-wrap break-all sm:break-normal" />
                </div>
              </div>
            )}

            {step.editor && (
              <div className="well overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2 bg-surface-high/40 label-caps text-outline">
                  <FileCode2 className="h-3.5 w-3.5 text-secondary" />
                  <span className="normal-case tracking-normal font-mono text-[12px] text-on-surface-variant">{step.editor.file}</span>
                  <span className="ml-auto">in your editor</span>
                </div>
                <pre className="p-4 font-mono text-[12.5px] leading-relaxed text-on-surface overflow-x-auto">
                  {step.editor.content}
                </pre>
              </div>
            )}

            {!step.command && !step.editor && (
              <div className="flex items-start gap-3 rounded-lg border border-caution/30 bg-caution-surface/60 p-4 text-sm text-caution">
                <Hand className="h-4 w-4 mt-0.5 shrink-0" />
                This step happens outside the terminal. Do it before moving on.
              </div>
            )}

            {step.output && (
              <div className="space-y-1.5">
                <span className="label-caps text-outline">Example output</span>
                <pre className="well p-4 font-mono text-[12px] leading-relaxed text-on-surface-variant whitespace-pre-wrap break-words">
                  {step.output}
                </pre>
              </div>
            )}

            {step.note && (
              <p className="text-sm text-on-surface-variant leading-relaxed">
                <Prose text={step.note} />
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="mx-auto w-14 h-14 rounded-full bg-safe-surface border border-safe-border/60 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-safe" />
            </div>
            <h3 className="text-lg font-semibold">Walkthrough complete</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              You have been through every step. Watch the terminal replay below to see the whole sequence run end to end.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          className="btn-ghost inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        {isDone ? (
          <button type="button" onClick={() => go(0)} className="btn-ghost px-4 py-2 rounded-lg text-sm">
            Run again
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(idx + 1)}
            className="btn-primary inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold"
          >
            {idx === total - 1 ? 'Finish' : 'Next step'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
