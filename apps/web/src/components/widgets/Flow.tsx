// "Flow": ordered stages (pressing Enter, the boot sequence, an SSH handshake). Every stage and its detail
// is visible by default, which is also what renders without JavaScript. "Step through" focuses one stage at a
// time with Prev/Next; clicking a stage jumps to it. Guides plan §5.
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Footprints, ListOrdered } from 'lucide-react';
import { Prose, CommandText } from '../ui/ui';

export interface FlowSpec {
  title?: string;
  caption?: string;
  stages: {
    title: string;
    detail: string;
    /** Optional code or command for this stage, shown in mono. */
    code?: string;
    /** Short tag on the right, e.g. "shell", "kernel". */
    tag?: string;
  }[];
}

export default function Flow({ spec }: { spec: FlowSpec }) {
  const [active, setActive] = useState<number | null>(null);
  const n = spec.stages.length;
  const stepping = active !== null;

  return (
    <figure className="not-prose well p-4 sm:p-5 my-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {spec.title ? <figcaption className="label-mono text-outline">{spec.title}</figcaption> : <span />}
        <div className="flex items-center gap-1.5">
          {stepping ? (
            <>
              <button
                type="button"
                onClick={() => setActive((a) => Math.max(0, (a ?? 0) - 1))}
                disabled={active === 0}
                aria-label="Previous stage"
                className="btn-ghost p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-default"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-[11px] text-on-surface-variant tabular-nums px-1" aria-live="polite">
                {(active ?? 0) + 1} / {n}
              </span>
              <button
                type="button"
                onClick={() => setActive((a) => Math.min(n - 1, (a ?? 0) + 1))}
                disabled={active === n - 1}
                aria-label="Next stage"
                className="btn-ghost p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-default"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setActive(null)} className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs">
                <ListOrdered className="h-3.5 w-3.5" />
                Show all
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setActive(0)} className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs">
              <Footprints className="h-3.5 w-3.5 text-tertiary" />
              Step through
            </button>
          )}
        </div>
      </div>

      <ol className="relative">
        {spec.stages.map((stage, i) => {
          const isActive = active === i;
          const done = stepping && i < (active ?? 0);
          const dim = stepping && !isActive;
          return (
            <li key={stage.title} className="grid grid-cols-[1.75rem_1fr] gap-x-3" aria-current={isActive ? 'step' : undefined}>
              <div className="relative flex justify-center" aria-hidden="true">
                {i < n - 1 && <span className={`absolute top-7 bottom-0 w-0.5 ${done || isActive ? 'bg-tertiary/50' : 'bg-outline-variant/60'}`} />}
                <span
                  className={`relative z-10 mt-0.5 w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[11px] transition ${
                    isActive
                      ? 'bg-tertiary text-surface-lowest border-tertiary shadow-[0_0_14px_rgba(76,215,246,0.55)]'
                      : done
                        ? 'bg-tertiary/15 text-tertiary border-tertiary/40'
                        : 'bg-surface-high text-on-surface-variant border-white/10'
                  }`}
                >
                  {i + 1}
                </span>
              </div>
              <div className={`pb-5 min-w-0 transition-opacity ${dim ? 'opacity-50' : ''}`}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`text-left w-full flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 font-display font-semibold text-[15px] hover:text-primary transition ${
                    isActive ? 'text-on-surface' : 'text-on-surface'
                  }`}
                >
                  <span>{stage.title}</span>
                  {stage.tag && (
                    <span className="label-caps text-[10px]! px-1.5 py-0.5 rounded bg-surface-lowest border border-white/6 text-outline">{stage.tag}</span>
                  )}
                </button>
                {(!stepping || isActive) && (
                  <div className="mt-1.5 space-y-2 animate-fade-in">
                    <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                      <Prose text={stage.detail} />
                    </p>
                    {stage.code && (
                      <div className="rounded-lg bg-surface-lowest border border-white/5 px-3 py-2 text-[12px] overflow-x-auto">
                        <CommandText command={stage.code} className="whitespace-pre" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {spec.caption && (
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <Prose text={spec.caption} />
        </p>
      )}
    </figure>
  );
}
