import { Parser, Language } from 'web-tree-sitter';
import type { Node } from 'web-tree-sitter';
import type { Connector, Origin, Redirect, SimpleCommand, Word } from './types';

export interface ParserSources {
  /** tree-sitter-bash.wasm: a path (Node), a URL (browser) or the bytes. */
  bashWasm: string | URL | Uint8Array;
  /** Passed to `Parser.init`, e.g. `{ locateFile: () => '/wasm/web-tree-sitter.wasm' }` in the browser. */
  parserInit?: Parameters<typeof Parser.init>[0];
}

export interface ShellParser {
  parse(source: string, base?: Partial<WalkContext> & { startIndex?: number }): ParseResult;
}

export interface ParseResult {
  commands: SimpleCommand[];
  hasError: boolean;
}

export async function createParser(sources: ParserSources): Promise<ShellParser> {
  await Parser.init(sources.parserInit);
  const bash = await Language.load(sources.bashWasm);
  const parser = new Parser();
  parser.setLanguage(bash);

  return {
    parse(source, base = {}) {
      const tree = parser.parse(source);
      if (!tree) return { commands: [], hasError: true };
      const state: WalkState = { commands: [], nextIndex: base.startIndex ?? 0, nextPipeline: 0 };
      walk(tree.rootNode, state, {
        connector: null,
        pipeline: null,
        redirects: [],
        depth: base.depth ?? 0,
        origin: base.origin ?? 'top',
        parent: base.parent ?? null
      });
      const hasError = tree.rootNode.hasError;
      tree.delete();
      return { commands: state.commands, hasError };
    }
  };
}

// ---------- AST → simple commands ----------

interface WalkState {
  commands: SimpleCommand[];
  nextIndex: number;
  nextPipeline: number;
}

export interface WalkContext {
  connector: Connector;
  pipeline: SimpleCommand['pipeline'];
  redirects: Redirect[];
  depth: number;
  origin: Origin;
  parent: number | null;
}

const ARG_TYPES = new Set([
  'word',
  'number',
  'string',
  'raw_string',
  'ansi_c_string',
  'translated_string',
  'concatenation',
  'simple_expansion',
  'expansion',
  'command_substitution',
  'process_substitution',
  'arithmetic_expansion'
]);

const REDIRECT_TYPES = new Set(['file_redirect', 'heredoc_redirect', 'herestring_redirect']);

function walk(node: Node, state: WalkState, ctx: WalkContext): void {
  switch (node.type) {
    case 'comment':
      return;

    case 'list': {
      // a && b || c : the operator before each side decides when it runs.
      // tree-sitter hangs `a && b > f` off the whole list, but bash binds the redirect to `b` only.
      let connector = ctx.connector;
      const last = node.namedChildren.filter((c) => c.type !== 'comment').at(-1);
      for (const child of node.children) {
        if (!child.isNamed) {
          if (child.type === '&&' || child.type === '||') connector = child.type;
          continue;
        }
        walk(child, state, { ...ctx, connector, redirects: child.id === last?.id ? ctx.redirects : [] });
      }
      return;
    }

    case 'pipeline': {
      const parts = node.namedChildren.filter((c) => c.type !== 'comment');
      const id = state.nextPipeline++;
      parts.forEach((child, i) => {
        walk(child, state, {
          ...ctx,
          connector: i === 0 ? ctx.connector : '|',
          pipeline: { id, index: i, length: parts.length },
          // Same as lists: `a | b > f` redirects b's output only.
          redirects: i === parts.length - 1 ? ctx.redirects : []
        });
      });
      return;
    }

    case 'redirected_statement': {
      const redirects: Redirect[] = [];
      let body: Node | null = null;
      for (const child of node.namedChildren) {
        if (REDIRECT_TYPES.has(child.type)) redirects.push(...toRedirects(child));
        else if (child.type !== 'comment' && !body) body = child;
      }
      if (body) {
        walk(body, state, { ...ctx, redirects: [...ctx.redirects, ...redirects] });
      } else {
        // A bare redirect such as `> /etc/hosts` still writes (truncates) the file.
        pushCommand(state, ctx, { text: node.text, name: null, args: [], assignments: [], redirects });
      }
      // Heredoc redirects can carry a pipeline (`cat <<EOF | sh`).
      for (const child of node.namedChildren) {
        if (child.type === 'heredoc_redirect') {
          for (const inner of child.namedChildren) {
            if (inner.type === 'pipeline' || inner.type === 'list') walk(inner, state, { ...ctx, redirects: [] });
          }
        }
      }
      return;
    }

    case 'command':
      walkCommand(node, state, ctx);
      return;

    case 'declaration_command':
    case 'unset_command': {
      // export / local / declare / readonly / unset: a command named by its keyword.
      const keyword = node.children[0];
      const args = node.namedChildren.map(toWord);
      const index = pushCommand(state, ctx, {
        text: node.text,
        name: keyword ? plainWord(keyword.text) : null,
        args,
        assignments: [],
        redirects: ctx.redirects
      });
      walkNested(node.namedChildren, state, ctx, index);
      return;
    }

    case 'command_substitution':
    case 'process_substitution':
      walkSequence(node, state, {
        ...ctx,
        connector: null,
        pipeline: null,
        redirects: [],
        depth: ctx.depth + 1,
        origin: node.type === 'command_substitution' ? 'substitution' : 'process-substitution'
      });
      return;

    case 'subshell':
      // `( a; b ) > f` sends every command's output to f.
      walkSequence(node, state, { ...ctx, origin: 'subshell' });
      return;

    case 'compound_statement':
      walkSequence(node, state, ctx);
      return;

    default:
      // program, compound_statement, if/for/while/case, function bodies, variable assignments, …
      walkSequence(node, state, { ...ctx, redirects: [] });
  }
}

/** Statements in a row: the first keeps the incoming connector, the rest follow `;` or `&`. */
function walkSequence(node: Node, state: WalkState, ctx: WalkContext) {
  let connector = ctx.connector;
  for (const child of node.children) {
    if (!child.isNamed) {
      if (child.type === ';' || child.type === '&') connector = child.type;
      continue;
    }
    if (child.type === 'comment') continue;
    walk(child, state, { ...ctx, connector });
    connector = ';';
  }
}

function walkCommand(node: Node, state: WalkState, ctx: WalkContext) {
  let name: Word | null = null;
  const args: Word[] = [];
  const assignments: string[] = [];
  const redirects: Redirect[] = [...ctx.redirects];
  const nested: Node[] = [];

  for (const child of node.namedChildren) {
    if (child.type === 'command_name') {
      const inner = child.firstNamedChild ?? child;
      name = toWord(inner);
      nested.push(inner);
    } else if (child.type === 'variable_assignment') {
      assignments.push(child.text);
      nested.push(child);
    } else if (REDIRECT_TYPES.has(child.type)) {
      redirects.push(...toRedirects(child));
      nested.push(child);
    } else if (ARG_TYPES.has(child.type)) {
      args.push(toWord(child));
      nested.push(child);
    }
  }

  const index = pushCommand(state, ctx, { text: commandText(node), name, args, assignments, redirects });
  walkNested(nested, state, ctx, index);
}

/** Collect commands inside `$(…)` / `<(…)` found in a command's words. */
function walkNested(nodes: Node[], state: WalkState, ctx: WalkContext, parent: number) {
  const visit = (n: Node) => {
    if (n.type === 'command_substitution' || n.type === 'process_substitution') {
      walk(n, state, { ...ctx, parent });
      return;
    }
    for (const c of n.namedChildren) visit(c);
  };
  nodes.forEach(visit);
}

function commandText(node: Node): string {
  // Drop redirects that tree-sitter attaches inside the command node, keep the words.
  return node.namedChildren
    .filter((c) => !REDIRECT_TYPES.has(c.type))
    .map((c) => c.text)
    .join(' ');
}

function pushCommand(
  state: WalkState,
  ctx: WalkContext,
  cmd: Pick<SimpleCommand, 'text' | 'name' | 'args' | 'assignments' | 'redirects'>
): number {
  const index = state.nextIndex++;
  state.commands.push({
    index,
    ...cmd,
    connector: ctx.connector,
    pipeline: ctx.pipeline,
    depth: ctx.depth,
    origin: ctx.origin,
    parent: ctx.parent
  });
  return index;
}

function toRedirects(node: Node): Redirect[] {
  if (node.type === 'heredoc_redirect') {
    // `cat <<'EOF' > file`: the heredoc plus any file redirects nested in it.
    const out: Redirect[] = [{ op: '<<', fd: null, target: null }];
    for (const c of node.namedChildren) if (c.type === 'file_redirect') out.push(...toRedirects(c));
    return out;
  }
  let fd: string | null = null;
  let op = '';
  let target: Word | null = null;
  for (const c of node.children) {
    if (c.type === 'file_descriptor') fd = c.text;
    else if (!c.isNamed) op += c.text;
    else if (!target) target = toWord(c);
  }
  return [{ op: op || (node.type === 'herestring_redirect' ? '<<<' : ''), fd, target }];
}

// ---------- Words ----------

export function plainWord(text: string): Word {
  return {
    raw: text,
    value: text,
    quoted: false,
    vars: [],
    unquotedVar: false,
    guardedVar: false,
    substitution: false,
    startsWithExpansion: false
  };
}

export function toWord(node: Node): Word {
  const w: Word = { ...plainWord(node.text), value: '' };
  buildWord(node, w, false);
  return w;
}

function buildWord(n: Node, w: Word, inDoubleQuotes: boolean): void {
  switch (n.type) {
    case 'word':
    case 'number':
      // `\rm` and `r\m` both run rm.
      w.value += n.text.replace(/\\(.)/gs, '$1');
      return;
    case 'raw_string':
      w.quoted = true;
      w.value += n.text.slice(1, -1);
      return;
    case 'ansi_c_string':
      w.quoted = true;
      w.value += n.text.slice(2, -1);
      return;
    case 'string':
    case 'translated_string':
      w.quoted = true;
      for (const c of n.namedChildren) {
        if (c.type === 'string_content') w.value += c.text;
        else buildWord(c, w, true);
      }
      // Empty string `""` has no named children.
      return;
    case 'concatenation':
      for (const c of n.namedChildren) buildWord(c, w, inDoubleQuotes);
      return;
    case 'simple_expansion':
    case 'expansion': {
      const name = n.descendantsOfType(['variable_name', 'special_variable_name'])[0]?.text;
      if (name) w.vars.push(name);
      if (w.value === '') w.startsWithExpansion = true;
      if (!inDoubleQuotes) w.unquotedVar = true;
      if (/^\$\{\w+:?\?/.test(n.text)) w.guardedVar = true;
      w.value += n.text;
      return;
    }
    case 'command_substitution':
    case 'process_substitution':
      if (w.value === '') w.startsWithExpansion = true;
      w.substitution = true;
      w.value += n.text;
      return;
    default:
      w.value += n.text;
  }
}
