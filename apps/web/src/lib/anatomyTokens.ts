// Turns a rule-engine analysis into anatomy tokens, using the notes in the command library.
// Pure and environment-agnostic: lib/anatomy.ts runs it at build time, the Explainer runs it in the browser.
import type { Analysis, AnalyzedCommand, Word } from '@shellgyan/core';
import type { Severity } from '@shellgyan/core/severity';

export interface AnatomyToken {
  text: string;
  kind: 'wrapper' | 'program' | 'flag' | 'operand' | 'operator' | 'redirect' | 'assignment';
  note: string;
  /** Set on program tokens: how risky that command is. */
  severity?: Severity;
  /** Library page for program tokens that have one. */
  href?: string;
}

export interface AnatomyData {
  command: string;
  tokens: AnatomyToken[];
  severity: Severity;
  cantVerify: boolean;
  findings: { severity: Severity; message: string }[];
}

// ---------- Library notes ----------

/** A command entry as the library stores it (the YAML fields anatomy needs). Served to the browser as /commands.json. */
export interface CommandDocEntry {
  name: string;
  summary: string;
  flags: { flag: string; meaning: string }[];
}

interface FlagNote {
  meaning: string;
  takesValue: boolean;
}
interface CommandDoc {
  summary: string;
  flags: Map<string, FlagNote>;
}
export type CommandLibrary = Map<string, CommandDoc>;

export function libraryFromEntries(entries: CommandDocEntry[]): CommandLibrary {
  const map: CommandLibrary = new Map();
  for (const e of entries) {
    const flags = new Map<string, FlagNote>();
    for (const f of e.flags) {
      // "-r, --recursive" and "-i :PORT" style keys: every alias before the value placeholder.
      for (const part of f.flag.split(/,\s*/)) {
        const [key, ...value] = part.trim().split(/\s+/);
        // The first listed form wins (lsof lists `-i :PORT` before `-i TCP`).
        if (key && !flags.has(key)) flags.set(key, { meaning: f.meaning, takesValue: value.length > 0 });
      }
    }
    map.set(e.name, { summary: e.summary, flags });
  }
  return map;
}

// ---------- Generic notes ----------

export const OPERATORS: Record<string, string> = {
  '&&': 'Run the next command only if this one succeeded. If it fails, the chain stops here.',
  '||': 'Run the next command only if this one failed.',
  ';': 'Run the next command no matter how this one ended.',
  '|': 'Pipe: send this command’s output straight into the next command as its input.',
  '&': 'Start the previous command in the background and carry on immediately.'
};

const WRAPPERS: Record<string, string> = {
  sudo: 'Run the rest as root (the superuser). You will be asked for your password.',
  env: 'Run the rest with the environment variables set here.',
  nohup: 'Keep running after the terminal closes (ignore the hang-up signal).',
  nice: 'Run with a lower CPU priority.',
  timeout: 'Stop the command if it runs longer than the given time.',
  xargs: 'Take lines from the input and pass them as arguments to the command that follows.',
  command: 'Run the real program, skipping any alias or function with the same name.',
  time: 'Measure how long the command takes.',
  exec: 'Replace the current shell with this command.'
};

function redirectNote(op: string, fd: string | null, target: string): string {
  if (op === '>&' && fd === '2' && target === '1') return 'Send error messages (stderr) to the same place as normal output.';
  if (op === '&>' || op === '&>>') return `Send both normal output and errors to ${target}.`;
  if (target === '/dev/null') return fd === '2' ? 'Throw away error messages.' : 'Throw the output away.';
  if (op.includes('>>')) return `Append ${fd === '2' ? 'error messages' : 'the output'} to the end of ${target}.`;
  if (op.includes('>')) return `Write ${fd === '2' ? 'error messages' : 'the output'} to ${target}, replacing what was in it.`;
  if (op === '<<<') return 'Feed this text to the command as its input.';
  if (op === '<<') return 'Heredoc: the lines until the end marker become the command’s input.';
  if (op === '<') return `Read the command’s input from ${target}.`;
  return 'Redirects input or output.';
}

// ---------- Placeholders ----------

// `<PID>`-style placeholders aren't valid shell; swap them for words while parsing.
const PLACEHOLDER = /<([A-Za-z][\w-]*)>/g;

export interface Placeheld {
  /** The command with placeholders swapped for parsable words. */
  parsable: string;
  /** Puts the original placeholders back into any text derived from `parsable`. */
  restore: (s: string) => string;
}

export function protectPlaceholders(command: string): Placeheld {
  const placeholders: string[] = [];
  const parsable = command.replace(PLACEHOLDER, (m) => `__ph${placeholders.push(m) - 1}__`);
  return { parsable, restore: (s) => s.replace(/__ph(\d+)__/g, (_, i) => placeholders[Number(i)] ?? '') };
}

// ---------- Tokens ----------

/** Commands shown in the anatomy and the step flow: the top level and subshell bodies, not `$(…)` or `bash -c` contents. */
export const isTopLevel = (c: AnalyzedCommand) => c.cmd.depth === 0 || c.cmd.origin === 'subshell';

/** `analysis` must come from `protectPlaceholders(command).parsable`. */
export function anatomyFromAnalysis(
  command: string,
  analysis: Analysis,
  library: CommandLibrary,
  restore: (s: string) => string,
  overrides: Record<string, string> = {}
): AnatomyData {
  const tokens: AnatomyToken[] = [];
  analysis.commands.filter(isTopLevel).forEach((c, i) => {
    if (i > 0 && c.cmd.connector) tokens.push({ text: c.cmd.connector, kind: 'operator', note: OPERATORS[c.cmd.connector] ?? '' });
    tokens.push(...commandTokens(c, library, restore, overrides));
  });

  return {
    command,
    tokens,
    severity: analysis.severity,
    cantVerify: analysis.cantVerify,
    findings: analysis.findings.map((f) => ({ severity: f.severity, message: restore(f.message) }))
  };
}

export function commandTokens(
  c: AnalyzedCommand,
  library: CommandLibrary,
  restore: (s: string) => string = (s) => s,
  overrides: Record<string, string> = {}
): AnatomyToken[] {
  const out: AnatomyToken[] = [];
  const words: Word[] = c.cmd.name ? [c.cmd.name, ...c.cmd.args] : [];
  const programAt = c.programWord ? words.indexOf(c.programWord) : words.length;
  const doc = c.program ? library.get(c.program) : undefined;
  const operands = new Set(c.operands);
  let valueFor: string | null = null;

  for (const a of c.cmd.assignments) {
    out.push({ text: a, kind: 'assignment', note: `Sets ${a.split('=')[0]} for this command only.` });
  }

  words.forEach((w, i) => {
    const text = restore(w.raw);
    const override = overrides[text];
    if (i < programAt) {
      const wrapperDoc = library.get(w.value);
      const note = WRAPPERS[w.value] ?? wrapperDoc?.summary ?? (w.value.startsWith('-') ? `An option for the command before it.` : 'Runs the command that follows.');
      out.push({ text, kind: 'wrapper', note: override ?? note });
      return;
    }
    if (i === programAt) {
      out.push({
        text,
        kind: 'program',
        note: override ?? doc?.summary ?? c.basis.reason.replace(/^Only reads or inspects\.$/, `Runs \`${c.program}\`. It only reads or inspects.`),
        severity: c.severity,
        ...(doc ? { href: `/c/${c.program}` } : {})
      });
      return;
    }
    if (!operands.has(w)) {
      const key = w.value.split('=')[0]!;
      const exact = doc?.flags.get(w.value) ?? doc?.flags.get(key);
      let note = exact?.meaning;
      if (exact?.takesValue && !w.value.includes('=')) valueFor = key;
      if (!note && /^-[A-Za-z]{2,}$/.test(w.value) && doc) {
        // -rf → notes for -r and -f
        const parts = [...w.value.slice(1)].map((ch) => doc.flags.get(`-${ch}`)?.meaning && `\`-${ch}\`: ${doc.flags.get(`-${ch}`)!.meaning}`);
        if (parts.every(Boolean)) note = parts.join(' ');
      }
      out.push({ text, kind: 'flag', note: override ?? note ?? 'An option that changes how the command behaves.' });
      return;
    }
    const position = c.operands.indexOf(w);
    out.push({ text, kind: 'operand', note: override ?? operandNote(w, text, doc, valueFor, c.program, position) });
    valueFor = null;
  });

  for (const r of c.cmd.redirects) {
    const target = r.target ? restore(r.target.raw) : '';
    const text = r.op === '<<' ? '<<' : `${r.fd ?? ''}${r.op}${r.op === '>&' ? target : ''}`;
    out.push({ text, kind: 'redirect', note: redirectNote(r.op, r.fd, target) });
    if (r.target && r.op !== '>&') out.push({ text: target, kind: 'operand', note: overrides[target] ?? 'The file used by the redirect.' });
  }
  return out;
}

// Programs whose arguments are files or folders.
const PATH_ARGS = new Set(['rm', 'rmdir', 'cp', 'mv', 'mkdir', 'ls', 'cat', 'less', 'head', 'tail', 'touch', 'du', 'cd', 'ln', 'source', '.', 'tee', 'stat', 'file', 'update-desktop-database']);

function operandNote(
  w: Word,
  text: string,
  doc: CommandDoc | undefined,
  valueFor: string | null,
  program: string | null,
  position: number
): string {
  if (valueFor) return `The value for \`${valueFor}\`.`;
  const sub = doc?.flags.get(w.value);
  if (sub) return sub.meaning;
  if ((program === 'chmod' || program === 'chown' || program === 'chgrp') && position === 0) {
    return program === 'chmod' ? 'The new permissions.' : 'The new owner (and group, after the colon).';
  }
  if (program && (PATH_ARGS.has(program) || /^ch(mod|own|grp)$/.test(program)) && !w.substitution && !w.vars.length && !/^<[^>]+>$/.test(text)) {
    return 'A file or folder path.';
  }
  const ph = text.match(/^<([^>]+)>$/);
  if (ph) return `A value you fill in: ${ph[1]!.replace(/-/g, ' ')}.`;
  if (w.substitution) return `Runs the command inside \`$(…)\` first and puts its output here.`;
  if (w.vars.length) {
    return `Replaced by the value of \`$${w.vars[0]}\`${w.unquotedVar ? '. Unquoted, so spaces in the value split it into several arguments.' : '.'}`;
  }
  if (/^(~|\.{0,2}\/|\/)/.test(w.value) || /\.\w{1,5}$/.test(w.value) || w.value.includes('/')) return 'A file or folder path.';
  if (w.quoted) return 'A quoted argument: passed as one piece, spaces and all.';
  return 'An argument passed to the command.';
}
