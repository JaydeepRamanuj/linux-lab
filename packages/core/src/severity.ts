// The four severity levels from the plan (§5.3). Order matters: later = more severe.
export const SEVERITY_LEVELS = ['readonly', 'modifies', 'elevated', 'destructive'] as const;
export type Severity = (typeof SEVERITY_LEVELS)[number];

export const rank = (s: Severity): number => SEVERITY_LEVELS.indexOf(s);

export function maxSeverity(...levels: Severity[]): Severity {
  return levels.reduce<Severity>((a, b) => (rank(b) > rank(a) ? b : a), 'readonly');
}

export const SEVERITY_EMOJI: Record<Severity, string> = {
  readonly: '🟢',
  modifies: '🟡',
  elevated: '🟠',
  destructive: '🔴'
};

/** What the Claude Code hook does at each level. */
export const HOOK_DECISION: Record<Severity, 'allow' | 'ask' | 'deny'> = {
  readonly: 'allow',
  modifies: 'allow',
  elevated: 'ask',
  destructive: 'deny'
};
