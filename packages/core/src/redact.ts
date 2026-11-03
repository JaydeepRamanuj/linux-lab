// Mask secrets before a command is sent to the AI or saved to history (plan §5.5).
// Only the secret value is replaced, so the command keeps its shape: `curl -H "Authorization: Bearer [REDACTED:bearer]"`.

export interface Masked {
  kind: string;
  /** First few characters, so the user can tell which value was hidden. */
  preview: string;
  start: number;
  end: number;
}

export interface Redaction {
  text: string;
  masked: Masked[];
}

// Each pattern's last capture group is the secret; everything before it stays visible.
const PATTERNS: { kind: string; re: RegExp }[] = [
  { kind: 'bearer', re: /(Authorization:\s*(?:Bearer|Basic|Token|Bot)\s+)([^\s"']+)/gi },
  { kind: 'api-key-header', re: /((?:X-)?(?:Api-?Key|Auth-?Token|Access-?Token|Private-?Token)\s*:\s*)([^\s"']+)/gi },
  { kind: 'anthropic-key', re: /()(sk-ant-[\w-]{10,})/g },
  { kind: 'openai-key', re: /()(sk-(?!ant-)(?:proj-|svcacct-)?[\w-]{20,})/g },
  { kind: 'github-token', re: /()((?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_\w{20,})/g },
  { kind: 'slack-token', re: /()(xox[abprs]-[\w-]{10,})/g },
  { kind: 'aws-access-key', re: /()((?:AKIA|ASIA)[0-9A-Z]{16})/g },
  { kind: 'google-api-key', re: /()(AIza[\w-]{35})/g },
  { kind: 'gitlab-token', re: /()(glpat-[\w-]{20,})/g },
  { kind: 'npm-token', re: /()(npm_[A-Za-z0-9]{36})/g },
  { kind: 'jwt', re: /()(eyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,})/g },
  {
    kind: 'secret-variable',
    re: /((?<![-\w])[A-Za-z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|_KEY)[A-Za-z0-9_]*=)("[^"]*"|'[^']*'|[^\s;&|"']+)/gi
  },
  { kind: 'password-flag', re: /(--(?:password|passwd|pass|token|api-key|apikey|secret|auth-token)(?:=|\s+))("[^"]*"|'[^']*'|[^\s;&|]+)/gi },
  { kind: 'url-credentials', re: /(\b[a-z][a-z0-9+.-]*:\/\/[^:/\s@]+:)([^@\s/]+)(?=@)/gi }
];

const HIGH_ENTROPY_CANDIDATE = /[A-Za-z0-9+_=-]{32,}/g;

function entropy(s: string): number {
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let e = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    e -= p * Math.log2(p);
  }
  return e;
}

function looksLikeSecret(s: string): boolean {
  if (/^[0-9a-f]+$/i.test(s)) return false; // git SHAs and checksums
  if (!/\d/.test(s) || !/[A-Za-z]/.test(s)) return false;
  if (/^[a-z-]+$/i.test(s.replace(/\d/g, ''))) return entropy(s) > 4.5; // mostly words-with-dashes
  return entropy(s) >= 4.0;
}

export function redact(text: string): Redaction {
  const found: Masked[] = [];
  const overlaps = (start: number, end: number) => found.some((m) => start < m.end && end > m.start);

  for (const { kind, re } of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const secret = m[2];
      if (!secret || /^\[REDACTED/.test(secret) || /^\$/.test(secret.replace(/^["']/, ''))) continue; // `TOKEN=$TOKEN` hides nothing
      const start = m.index + m[0].indexOf(secret, m[1]?.length ?? 0);
      const end = start + secret.length;
      if (!overlaps(start, end)) found.push({ kind, preview: preview(secret), start, end });
    }
  }
  for (const m of text.matchAll(HIGH_ENTROPY_CANDIDATE)) {
    const start = m.index;
    const end = start + m[0].length;
    if (!overlaps(start, end) && looksLikeSecret(m[0])) found.push({ kind: 'high-entropy', preview: preview(m[0]), start, end });
  }

  found.sort((a, b) => a.start - b.start);
  let out = '';
  let pos = 0;
  for (const m of found) {
    out += text.slice(pos, m.start) + `[REDACTED:${m.kind}]`;
    pos = m.end;
  }
  out += text.slice(pos);
  return { text: out, masked: found };
}

const preview = (s: string) => `${s.replace(/^["']/, '').slice(0, 4)}…`;
