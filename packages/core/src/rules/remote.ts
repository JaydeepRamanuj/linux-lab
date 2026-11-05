import type { NormalizedCommand } from '../normalize';
import { hit } from './types';
import type { Hit, Rule, RuleContext } from './types';

export const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'ash', 'busybox']);
const INTERPRETERS = new Set(['python', 'python2', 'python3', 'perl', 'ruby', 'node', 'php', 'deno', 'bun']);
const FETCHERS = new Set(['curl', 'wget', 'fetch', 'aria2c', 'http', 'https', 'xh']);

const isFetch = (c: NormalizedCommand) => c.program !== null && FETCHERS.has(c.program);
const isDecode = (c: NormalizedCommand) =>
  (c.program === 'base64' && (c.short.has('d') || c.long.has('decode') || c.short.has('D'))) ||
  (c.program === 'xxd' && c.short.has('r')) ||
  (c.program === 'openssl' && c.argv.some((w) => w.value === '-d')) ||
  (c.program !== null && /^(gunzip|zcat|bunzip2|xz|unxz)$/.test(c.program));

/** Commands inside this command's `$(…)` / `<(…)`, at any depth (not `bash -c` bodies: those get their own rules). */
function nestedIn(c: NormalizedCommand, ctx: RuleContext): NormalizedCommand[] {
  const out: NormalizedCommand[] = [];
  const parents = new Set([c.cmd.index]);
  for (const o of ctx.all) {
    const viaSubstitution = o.cmd.origin === 'substitution' || o.cmd.origin === 'process-substitution';
    if (o.cmd.parent !== null && parents.has(o.cmd.parent) && viaSubstitution) {
      out.push(o);
      parents.add(o.cmd.index);
    }
  }
  return out;
}

function upstream(c: NormalizedCommand, ctx: RuleContext): NormalizedCommand[] {
  const p = c.cmd.pipeline;
  if (!p || p.index === 0) return [];
  return ctx.all.filter((o) => o.cmd.pipeline?.id === p.id && o.cmd.pipeline.index < p.index && o.cmd.depth === c.cmd.depth);
}

function sourceHit(sources: NormalizedCommand[], c: NormalizedCommand, how: string): Hit | null {
  const root = c.sudo ? ' as root' : '';
  const level = c.sudo ? 'destructive' : 'elevated';
  if (sources.some(isFetch)) {
    return hit(level, `${how} a script downloaded from the internet and runs it${root} without showing it to you. Can't verify contents: download it first and read it.`, {
      cantVerify: true,
      effects: { network: true, installsSoftware: true }
    });
  }
  if (sources.some(isDecode)) {
    return hit(level, `${how} a decoded (hidden) payload and runs it${root}. Can't verify contents: decode it and read it first.`, { cantVerify: true });
  }
  return null;
}

const pipeToShell: Rule = {
  id: 'pipe-to-shell',
  check(c, ctx) {
    if (!c.program || !(SHELLS.has(c.program) || INTERPRETERS.has(c.program))) return null;
    // `bash -n` only parses its input (`curl … | bash -n` is a syntax check), and nothing in it runs.
    if (SHELLS.has(c.program) && c.short.has('n') && !c.short.has('c')) return null;
    const hits: Hit[] = [];

    // curl … | bash
    const up = upstream(c, ctx);
    if (up.length) {
      const scriptFile = c.operands.find((w) => w.value !== '-');
      if (!scriptFile || c.short.has('s')) {
        hits.push(
          sourceHit(up, c, 'Pipes') ??
            hit(c.sudo ? 'destructive' : 'elevated', `Runs whatever the previous command prints as ${c.program} code${c.sudo ? ' as root' : ''}. Can't verify contents.`, {
              cantVerify: true
            })
        );
      }
    }

    // bash <(curl …)   bash -c "$(curl …)"   python3 -c "$(…)"
    const nested = nestedIn(c, ctx);
    if (nested.length) {
      const h = sourceHit(nested, c, 'Takes');
      if (h) hits.push(h);
      else if (c.short.has('c') && c.operands[0]?.substitution) {
        hits.push(hit('elevated', `Runs code produced by \`${c.operands[0].value}\`, which is only known at run time. Can't verify contents.`, { cantVerify: true }));
      }
    }
    return hits;
  }
};

const evalSource: Rule = {
  id: 'eval',
  check(c, ctx) {
    if (c.program !== 'eval' && c.program !== 'source' && c.program !== '.') return null;
    const nested = nestedIn(c, ctx);
    const fromNet = sourceHit(nested, c, c.program === 'eval' ? 'Evaluates' : 'Sources');
    if (fromNet) return fromNet;
    if (c.program === 'eval' && c.argv.some((w) => w.substitution || w.vars.length)) {
      return hit('elevated', '`eval` runs text built at run time as a command. Can\'t verify contents.', { cantVerify: true });
    }
    if (c.program !== 'eval' && c.operands[0]?.substitution) {
      return hit('elevated', `Runs the output of \`${c.operands[0].value}\` in your current shell. Can't verify contents.`, { cantVerify: true });
    }
    return null;
  }
};

const sudo: Rule = {
  id: 'sudo',
  check(c) {
    if (!c.sudo) return null;
    if (!c.program) {
      // `sudo -l` and `sudo -V` only report what sudo allows (or how it was built); nothing runs as root.
      const opts = c.cmd.name && /^(sudo|doas)$/.test(c.cmd.name.value.split('/').pop() ?? '') ? c.cmd.args.map((w) => w.value) : [];
      if (opts.some((v) => /^(-l+|--list|-V|--version)$/.test(v))) return hit('readonly', 'Lists what sudo lets you run, without running anything as root.');
      return hit('elevated', 'Opens a root shell: everything you type next runs as root.', { effects: { needsSudo: true } });
    }
    if (c.program === 'su') {
      return hit('elevated', 'Switches to the root user.', { effects: { needsSudo: true } });
    }
    return hit('elevated', `Runs \`${c.program}\` as root (sudo), so it can change anything on the system.`, { effects: { needsSudo: true } });
  }
};

const variableProgram: Rule = {
  id: 'variable-program',
  check(c) {
    if (!c.programWord?.startsWithExpansion) return null;
    return hit('elevated', `The program to run comes from \`${c.programWord.value}\`, so it's only known at run time. Can't verify contents.`, { cantVerify: true });
  }
};

export const remoteRules: Rule[] = [pipeToShell, evalSource, sudo, variableProgram];
