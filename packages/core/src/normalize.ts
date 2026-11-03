import type { SimpleCommand, Word } from './types';

export interface NormalizedCommand {
  cmd: SimpleCommand;
  /** Program actually run after unwrapping, as a basename (`/usr/bin/rm` → `rm`). Null for a bare redirect. */
  program: string | null;
  programWord: Word | null;
  /** Runs as root: its own `sudo`/`doas`, or a parent `sudo bash -c "…"`. */
  sudo: boolean;
  /** Wrappers stripped off, in order (`sudo`, `env`, `nohup`, `xargs`, …). */
  wrappers: string[];
  /** Arguments after the program. */
  argv: Word[];
  /** Single-letter flags, merged across clusters (`-r -f` and `-rf` both give r, f). Long aliases mapped in. */
  short: Set<string>;
  /** Long flags without dashes or values (`--force=x` → `force`). */
  long: Set<string>;
  /** Non-flag arguments (everything after `--` counts as an operand). */
  operands: Word[];
  /** Arguments arrive on stdin through `xargs`, so the real targets are unknown. */
  viaXargs: boolean;
}

// Long flags that mean the same as a short one, per program.
const LONG_ALIASES: Record<string, Record<string, string>> = {
  rm: { recursive: 'r', force: 'f', interactive: 'i', dir: 'd' },
  cp: { recursive: 'r', force: 'f', interactive: 'i', 'no-clobber': 'n' },
  mv: { force: 'f', interactive: 'i', 'no-clobber': 'n' },
  chmod: { recursive: 'R' },
  chown: { recursive: 'R' },
  chgrp: { recursive: 'R' },
  sed: { 'in-place': 'i', expression: 'e', file: 'f' },
  git: { force: 'f', hard: 'hard' },
  kill: { signal: 's' },
  tee: { append: 'a' },
  shred: { remove: 'u' }
};

// Short flags that mean the same thing (`rm -R` = `rm -r`).
const SHORT_ALIASES: Record<string, Record<string, string>> = {
  rm: { R: 'r' },
  cp: { R: 'r' }
};

// Wrapper options that take a separate value (`sudo -u bob …`, `nice -n 10 …`).
const WRAPPER_VALUE_OPTS: Record<string, Set<string>> = {
  sudo: new Set(['-u', '-g', '-h', '-p', '-C', '-D', '-r', '-t', '-U', '-T', '--user', '--group']),
  doas: new Set(['-u', '-C']),
  env: new Set(['-u', '-C', '-S', '--unset', '--chdir']),
  nice: new Set(['-n', '--adjustment']),
  ionice: new Set(['-c', '-n', '-p']),
  timeout: new Set(['-s', '-k', '--signal', '--kill-after']),
  xargs: new Set(['-I', '-n', '-P', '-d', '-L', '-E', '-s', '-a', '--max-args', '--max-procs', '--delimiter']),
  watch: new Set(['-n', '--interval', '-d']),
  stdbuf: new Set(['-i', '-o', '-e']),
  time: new Set(['-f', '-o']),
  nohup: new Set(),
  exec: new Set(['-a']),
  command: new Set(),
  builtin: new Set(),
  busybox: new Set()
};

export const basename = (p: string) => p.replace(/\/+$/, '').split('/').pop() ?? p;

export function normalize(cmd: SimpleCommand, inheritedSudo = false): NormalizedCommand {
  let words: Word[] = cmd.name ? [cmd.name, ...cmd.args] : [];
  const wrappers: string[] = [];
  let sudo = inheritedSudo;
  let viaXargs = false;

  // Peel wrappers until we reach the real program.
  for (;;) {
    const first = words[0];
    if (!first) break;
    const prog = basename(first.value);
    const valueOpts = WRAPPER_VALUE_OPTS[prog];
    if (!valueOpts) break;
    // `command -v x` and `type x` are lookups, not wrappers.
    if (prog === 'command' && words[1] && /^-[vV]$/.test(words[1].value)) break;

    wrappers.push(prog);
    if (prog === 'sudo' || prog === 'doas') sudo = true;
    if (prog === 'xargs') viaXargs = true;

    let i = 1;
    while (i < words.length) {
      const v = words[i]!.value;
      if (v === '--') {
        i++;
        break;
      }
      if (prog === 'env' && /^[A-Za-z_]\w*=/.test(v)) {
        i++;
        continue;
      }
      if (!v.startsWith('-') || v === '-') break;
      i += valueOpts.has(v) ? 2 : 1;
    }
    // `timeout 10 cmd`: the duration comes before the program.
    if (prog === 'timeout' && words[i] && /^\d/.test(words[i]!.value)) i++;
    words = words.slice(i);
  }

  const programWord = words[0] ?? null;
  const program = programWord ? basename(programWord.value) : null;
  const argv = words.slice(1);
  const { short, long, operands } = parseFlags(program ?? '', argv);

  return { cmd, program, programWord, sudo, wrappers, argv, short, long, operands, viaXargs };
}

export function parseFlags(program: string, argv: Word[]) {
  const short = new Set<string>();
  const long = new Set<string>();
  const operands: Word[] = [];
  const longAliases = LONG_ALIASES[program] ?? {};
  const shortAliases = SHORT_ALIASES[program] ?? {};
  let endOfFlags = false;

  for (const w of argv) {
    const v = w.value;
    if (endOfFlags || w.startsWithExpansion) {
      operands.push(w);
    } else if (v === '--') {
      endOfFlags = true;
    } else if (v.startsWith('--') && v.length > 2) {
      const name = v.slice(2).split('=')[0]!;
      long.add(name);
      const alias = longAliases[name];
      if (alias) short.add(alias);
    } else if (v.startsWith('-') && v.length > 1) {
      for (const ch of v.slice(1)) short.add(shortAliases[ch] ?? ch);
    } else {
      operands.push(w);
    }
  }
  return { short, long, operands };
}

// ---------- Paths ----------

export interface CanonicalPath {
  /** `~` for home, absolute paths normalised, `.`-relative otherwise. Variables other than HOME/PWD kept as written. */
  path: string;
  /** Ended in `/*` or was a bare `*`; `path` is the directory being globbed. */
  glob: boolean;
}

export function canonPath(value: string): CanonicalPath {
  let v = value
    .replace(/^(\$HOME|\$\{HOME\})(?=\/|$)/, '~')
    .replace(/^(\$PWD|\$\{PWD\})(?=\/|$)/, '.');
  let glob = false;
  if (v === '*') return { path: '.', glob: true };
  if (/\/\*$/.test(v)) {
    glob = true;
    v = v.slice(0, -2) || '/';
  }
  const absolute = v.startsWith('/');
  const home = v === '~' || v.startsWith('~/');
  const rest = home ? v.slice(1) : v;
  const out: string[] = [];
  for (const seg of rest.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..' && (absolute || home) && out.length) out.pop();
    else if (seg === '..' && (absolute || home)) continue;
    else out.push(seg);
  }
  const joined = out.join('/');
  if (home) return { path: joined ? `~/${joined}` : '~', glob };
  if (absolute) return { path: `/${joined}`, glob };
  return { path: joined || '.', glob };
}

const SYSTEM_DIRS = [
  '/etc', '/usr', '/bin', '/sbin', '/lib', '/lib32', '/lib64', '/boot', '/var', '/opt',
  '/home', '/root', '/sys', '/proc', '/dev', '/srv', '/snap'
];

/** Top-level system directories (and `/`, `~`) whose loss breaks the machine or the user's account. */
export function criticalPath(p: CanonicalPath): 'root' | 'home' | 'system' | null {
  if (p.path === '/') return 'root';
  if (p.path === '~') return 'home';
  if (SYSTEM_DIRS.includes(p.path)) return 'system';
  // `/usr/*` style globs and `/home/<user>` are just as bad.
  if (/^\/home\/[^/]+$/.test(p.path)) return 'home';
  return null;
}

export const isOutsideProject = (p: CanonicalPath) => p.path.startsWith('/') || p.path.startsWith('~');
