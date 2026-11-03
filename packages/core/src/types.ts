import type { Severity } from './severity';

/** One shell word (argument), with what the shell would do to it. */
export interface Word {
  /** Exactly as written, quotes included. */
  raw: string;
  /** Quotes removed and backslash escapes resolved. Expansions are kept as written (`$DIR`, `$(cmd)`). */
  value: string;
  /** Any part was quoted. */
  quoted: boolean;
  /** Variable names referenced (`HOME`, `DIR`). */
  vars: string[];
  /** A variable expansion appears outside double quotes (subject to word splitting and globbing). */
  unquotedVar: boolean;
  /** Uses `${VAR:?}`, which aborts instead of expanding to nothing. */
  guardedVar: boolean;
  /** Contains `$(…)`, backticks or `<(…)`. */
  substitution: boolean;
  /** The value starts with an expansion, so its real prefix is unknown (`$DIR/…`). */
  startsWithExpansion: boolean;
}

export type Connector = '&&' | '||' | ';' | '&' | '|' | null;

export interface Redirect {
  /** `>`, `>>`, `<`, `&>`, `>&`, `<<`, `<<<`, … */
  op: string;
  fd: string | null;
  target: Word | null;
}

export type Origin = 'top' | 'substitution' | 'process-substitution' | 'subshell' | 'shell-c' | 'eval';

/** A simple command found anywhere in the input: top level, inside `$(…)`, inside `bash -c "…"`, etc. */
export interface SimpleCommand {
  index: number;
  /** Source text of the command (without its redirects). */
  text: string;
  /** The command word as written, before unwrapping `sudo`/`env`/…; null for a bare redirect like `> file`. */
  name: Word | null;
  args: Word[];
  /** `FOO=bar` prefixes. */
  assignments: string[];
  redirects: Redirect[];
  /** Operator linking this command to the previous one at the same level. */
  connector: Connector;
  pipeline: { id: number; index: number; length: number } | null;
  /** 0 at top level; +1 for each `$(…)`, `<(…)`, `bash -c` or `eval` it sits inside. */
  depth: number;
  origin: Origin;
  /** Index of the command whose arguments contain this one (for substitutions and `bash -c`). */
  parent: number | null;
}

export interface Effects {
  needsSudo: boolean;
  network: boolean;
  installsSoftware: boolean;
  modifiesShellConfig: boolean;
  filesTouched: string[];
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  /** The command this is about; null for findings about the whole input. */
  commandIndex: number | null;
  /** The engine can't see what will actually run (remote script, decoded payload, eval). */
  cantVerify?: boolean;
}
