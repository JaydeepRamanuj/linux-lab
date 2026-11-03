import type { NormalizedCommand } from '../normalize';
import type { Severity } from '../severity';
import type { Effects } from '../types';

export interface Hit {
  severity: Severity;
  message: string;
  cantVerify?: boolean;
  effects?: Partial<Omit<Effects, 'filesTouched'>>;
  /** Paths this command writes, deletes or changes. */
  touches?: string[];
}

export interface RuleContext {
  /** Every command in the input, so pipeline and substitution rules can look at neighbours. */
  all: NormalizedCommand[];
}

export interface Rule {
  id: string;
  check(c: NormalizedCommand, ctx: RuleContext): Hit | Hit[] | null | undefined;
}

/** Rules that look at the raw source rather than one command (fork bombs). */
export interface SourceRule {
  id: string;
  check(source: string): Hit | null;
}

export const hit = (severity: Severity, message: string, extra: Omit<Hit, 'severity' | 'message'> = {}): Hit => ({
  severity,
  message,
  ...extra
});
