import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Prose } from '../ui/ui';
import { SEVERITY } from '../../lib/theme';
import type { AnatomyToken } from '../../lib/anatomyTokens';

const KIND_CLASS: Record<AnatomyToken['kind'], string> = {
  wrapper: 'text-elevated',
  program: 'text-tertiary font-semibold',
  flag: 'text-primary',
  operand: 'text-on-surface',
  operator: 'text-secondary',
  redirect: 'text-caution',
  assignment: 'text-outline'
};

const KIND_LABEL: Record<AnatomyToken['kind'], string> = {
  wrapper: 'wrapper',
  program: 'program',
  flag: 'option',
  operand: 'argument',
  operator: 'operator',
  redirect: 'redirect',
  assignment: 'variable'
};

// Hover or tap each part of a command to see what it does. Tokens come from lib/anatomyTokens.ts (at build time, or in the browser on /explain).
export default function Anatomy({ tokens }: { tokens: AnatomyToken[] }) {
  const [active, setActive] = useState<number | null>(null);
  const tok = active !== null ? tokens[active] : undefined;

  return (
    <div className="well p-4 space-y-3">
      <div className="flex flex-wrap gap-1.5 font-mono text-[13px]">
        {tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className={`relative px-2.5 py-1.5 rounded-md border transition ${
              active === i ? 'bg-primary-deep/25 border-primary/60' : 'bg-surface-container border-white/5 hover:border-white/15'
            } ${KIND_CLASS[t.kind]}`}
          >
            {t.text}
            {t.severity && t.severity !== 'readonly' && (
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${SEVERITY[t.severity].dot}`} aria-label={SEVERITY[t.severity].label} />
            )}
          </button>
        ))}
      </div>
      <div className="min-h-12 rounded-md bg-surface-container/60 px-3 py-2.5 text-[13px]" aria-live="polite">
        {tok ? (
          <div className="animate-fade-in space-y-1" key={active}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-primary">{tok.text}</span>
              <span className="label-caps text-outline">{KIND_LABEL[tok.kind]}</span>
              {tok.severity && <span className={`label-caps ${SEVERITY[tok.severity].text}`}>{SEVERITY[tok.severity].label}</span>}
            </div>
            <div className="text-on-surface-variant">
              <Prose text={tok.note} />
              {tok.href && (
                <a href={tok.href} className="ml-2 inline-flex items-center gap-1 text-tertiary hover:text-primary text-xs">
                  Library <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <span className="text-outline italic">Hover or tap a part of the command to see what it does.</span>
        )}
      </div>
    </div>
  );
}
