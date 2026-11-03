import { createParser } from './parse';
import type { ParserSources, ShellParser } from './parse';
import { normalize } from './normalize';
import type { NormalizedCommand } from './normalize';
import { RULES, sourceRules, baseSeverity, SHELLS } from './rules';
import type { Basis, Hit } from './rules';
import { maxSeverity, rank } from './severity';
import type { Severity } from './severity';
import type { Effects, Finding, SimpleCommand } from './types';

export interface AnalyzedCommand extends NormalizedCommand {
  severity: Severity;
  /** Why the command got its level when no rule had more to say. */
  basis: Basis;
  findings: Finding[];
}

export interface Analysis {
  source: string;
  commands: AnalyzedCommand[];
  /** All findings, most severe first. */
  findings: Finding[];
  /** The verdict: the most severe level of any command or finding. */
  severity: Severity;
  /** Something runs that can't be inspected (remote script, decoded payload, eval). */
  cantVerify: boolean;
  effects: Effects;
  /** The parser hit a syntax error, so the breakdown may be incomplete. */
  parseError: boolean;
}

export interface Analyzer {
  analyze(source: string): Analysis;
}

const MAX_NESTING = 5;
const NETWORK = /^(curl|wget|ssh|scp|sftp|rsync|ftp|nc|ncat|telnet|http|xh|aria2c)$/;

export async function createAnalyzer(sources: ParserSources): Promise<Analyzer> {
  const parser = await createParser(sources);
  return { analyze: (source) => analyze(parser, source) };
}

function analyze(parser: ShellParser, source: string): Analysis {
  const parsed = parser.parse(source);
  const normalized: NormalizedCommand[] = [];
  const queue: { cmd: SimpleCommand; sudo: boolean }[] = parsed.commands.map((cmd) => ({ cmd, sudo: false }));
  let nextIndex = parsed.commands.length;
  let parseError = parsed.hasError;

  // Normalise, and open up `bash -c "…"`, `su -c "…"` and literal `eval …` so their contents are checked too.
  for (let i = 0; i < queue.length; i++) {
    const { cmd, sudo } = queue[i]!;
    const n = normalize(cmd, sudo);
    normalized.push(n);
    if (cmd.depth >= MAX_NESTING) continue;

    let script: string | null = null;
    let origin: 'shell-c' | 'eval' = 'shell-c';
    if (n.program && (SHELLS.has(n.program) || n.program === 'su') && n.short.has('c')) {
      const body = n.operands[0];
      if (body && !body.substitution) script = body.value;
    } else if (n.program === 'eval' && n.argv.length && n.argv.every((w) => !w.substitution && !w.vars.length)) {
      script = n.argv.map((w) => w.value).join(' ');
      origin = 'eval';
    }
    if (script === null) continue;

    const inner = parser.parse(script, { startIndex: nextIndex, depth: cmd.depth + 1, origin, parent: cmd.index });
    nextIndex += inner.commands.length;
    parseError ||= inner.hasError;
    const asRoot = n.sudo || n.program === 'su';
    queue.push(...inner.commands.map((c) => ({ cmd: c, sudo: asRoot })));
  }

  const ctx = { all: normalized };
  const effects: Effects = { needsSudo: false, network: false, installsSoftware: false, modifiesShellConfig: false, filesTouched: [] };
  const touched = new Set<string>();
  const allFindings: Finding[] = [];

  const toFinding = (ruleId: string, h: Hit, commandIndex: number | null): Finding => {
    Object.assign(effects, Object.fromEntries(Object.entries(h.effects ?? {}).filter(([, v]) => v)));
    h.touches?.forEach((t) => touched.add(t));
    return { ruleId, severity: h.severity, message: h.message, commandIndex, ...(h.cantVerify ? { cantVerify: true } : {}) };
  };

  const commands: AnalyzedCommand[] = normalized.map((n) => {
    let basis = baseSeverity(n);
    const findings: Finding[] = [];
    for (const rule of RULES) {
      const result = rule.check(n, ctx);
      const hits = result ? (Array.isArray(result) ? result : [result]) : [];
      for (const h of hits) {
        // A read-only verdict from a specific rule (`git status`, `systemctl status`) refines the basis, it isn't a warning.
        if (h.severity === 'readonly') basis = { severity: 'readonly', reason: h.message };
        else findings.push(toFinding(rule.id, h, n.cmd.index));
      }
    }
    if (n.sudo) effects.needsSudo = true;
    if (n.program && NETWORK.test(n.program)) effects.network = true;
    const severity = findings.length ? maxSeverity(...findings.map((f) => f.severity)) : basis.severity;
    allFindings.push(...findings);
    return { ...n, severity, basis, findings };
  });

  for (const rule of sourceRules) {
    const h = rule.check(source);
    if (h) allFindings.push(toFinding(rule.id, h, null));
  }
  if (parseError) {
    allFindings.push({
      ruleId: 'parse-error',
      severity: 'elevated',
      message: "Part of this couldn't be parsed as shell, so ShellGyan can't be sure what runs.",
      commandIndex: null,
      cantVerify: true
    });
  }

  effects.filesTouched = [...touched];
  allFindings.sort((a, b) => rank(b.severity) - rank(a.severity));

  return {
    source,
    commands,
    findings: allFindings,
    severity: maxSeverity(...commands.map((c) => c.severity), ...allFindings.map((f) => f.severity)),
    cantVerify: allFindings.some((f) => f.cantVerify),
    effects,
    parseError
  };
}
