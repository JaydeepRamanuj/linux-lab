import { canonPath, criticalPath, isOutsideProject } from '../normalize';
import type { NormalizedCommand } from '../normalize';
import type { Word } from '../types';
import { hit } from './types';
import type { Hit, Rule } from './types';

const DEVICE = /^\/dev\/(sd|hd|vd|xvd|nvme|mmcblk|disk|md|dm-|loop|mapper\/)/;
const HARMLESS_TARGET = /^(\/dev\/(null|stdout|stderr|tty|fd\/\d+)|&?-|&?\d+)$/;
const SHELL_CONFIG =
  /^(~\/(\.bashrc|\.bash_aliases|\.zshrc|\.profile|\.bash_profile|\.bash_login|\.zprofile|\.zshenv|\.zlogin|\.config\/fish\/config\.fish|\.ssh(\/.*)?)|\/etc\/(profile|bash\.bashrc|environment|zsh\/zshrc))$/;
const PROJECT_REGENERABLE = /(^|\/)(node_modules|dist|build|\.next|\.nuxt|\.astro|\.turbo|\.cache|target|coverage|__pycache__|\.venv|venv)$/;

const where = (kind: 'root' | 'home' | 'system', path: string) =>
  kind === 'root' ? 'the entire filesystem (/)' : kind === 'home' ? `your whole home folder (${path})` : `the system folder ${path}`;

/** How bad it is to write to this path. Shared by `>`, `tee`, `cp`, `mv`, `sed -i`, … */
export function writeTargetHit(target: Word, mode: 'overwrite' | 'append', via: string): Hit | null {
  const v = target.value;
  if (HARMLESS_TARGET.test(v)) return null;
  const p = canonPath(v);
  if (DEVICE.test(p.path)) {
    return hit('destructive', `${via} writes straight onto the disk device ${p.path}, wiping whatever filesystem is on it.`, {
      touches: [p.path]
    });
  }
  // A drop-in apt source, key or pin: adding one is how you add a repo, and a bad one breaks `apt update`, not booting.
  // Replacing the distro's own sources (`sources.list`, `ubuntu.sources`, `debian.sources`) stays destructive below.
  if (
    /^\/etc\/apt\/(sources\.list\.d|preferences\.d|keyrings|trusted\.gpg\.d)\/[^/]+$/.test(p.path) &&
    !/\/(ubuntu|debian)\.sources$/.test(p.path)
  ) {
    return hit('elevated', `${via} writes ${p.path}, which changes where apt installs software from and which signing keys it trusts.`, {
      touches: [p.path]
    });
  }
  if (/^\/(etc|boot)(\/|$)/.test(p.path) && mode === 'overwrite') {
    return hit('destructive', `${via} replaces the system file ${p.path}. A wrong write here can stop the machine from booting or logging in.`, {
      touches: [p.path]
    });
  }
  if (SHELL_CONFIG.test(p.path)) {
    return hit('elevated', `${via} changes ${p.path}, which runs every time you open a terminal (or controls SSH access).`, {
      touches: [p.path],
      effects: { modifiesShellConfig: true }
    });
  }
  if (criticalPath(p) || /^\/(etc|boot|usr|bin|sbin|lib|opt|var)\//.test(p.path)) {
    return hit('elevated', `${via} writes into the system location ${p.path}.`, { touches: [p.path] });
  }
  if (target.startsWithExpansion && !p.path.startsWith('~')) {
    return hit('modifies', `${via} writes to ${v}; where that is depends on the variable.`, { touches: [v] });
  }
  return hit('modifies', `${via} ${mode === 'append' ? 'appends to' : 'overwrites'} ${p.path}.`, { touches: [p.path] });
}

const redirects: Rule = {
  id: 'write-redirect',
  check(c) {
    const hits: Hit[] = [];
    for (const r of c.cmd.redirects) {
      if (!r.target || !/>/.test(r.op) || r.op === '>&' && /^\d+$/.test(r.target.value)) continue;
      const mode = r.op.includes('>>') ? 'append' : 'overwrite';
      const h = writeTargetHit(r.target, mode, `\`${r.op}\``);
      if (h) hits.push(h);
    }
    return hits;
  }
};

/** Deleting one file outside the project that the system or every terminal depends on. Mirrors `writeTargetHit`. */
function systemFileDelete(path: string): Hit | null {
  if (/^\/etc\/apt\/(sources\.list\.d|preferences\.d|keyrings|trusted\.gpg\.d)\/[^/]+$/.test(path) && !/\/(ubuntu|debian)\.sources$/.test(path)) {
    return hit('elevated', `Deletes ${path}, which changes where apt installs software from and which signing keys it trusts.`, { touches: [path] });
  }
  if (/^\/(etc|boot)\//.test(path)) {
    return hit('destructive', `Deletes the system file ${path}. Without it the machine may not boot, log in or reach the network.`, { touches: [path] });
  }
  if (SHELL_CONFIG.test(path)) {
    return hit('elevated', `Deletes ${path}, which runs every time you open a terminal (or controls SSH access).`, { touches: [path] });
  }
  if (/^\/(usr|bin|sbin|lib|lib64|opt|var)\//.test(path)) {
    return hit('elevated', `Deletes ${path} from the system location ${path.split('/').slice(0, 2).join('/')}.`, { touches: [path] });
  }
  return null;
}

const rm: Rule = {
  id: 'rm',
  check(c) {
    if (c.program !== 'rm') return null;
    const recursive = c.short.has('r');
    const hits: Hit[] = [];
    if (c.long.has('no-preserve-root')) {
      hits.push(hit('destructive', '`--no-preserve-root` turns off the one safety check that stops `rm` from deleting `/`.'));
    }
    if (c.viaXargs) {
      hits.push(hit(recursive ? 'elevated' : 'modifies', 'The files to delete come from the previous command through `xargs`, so the list is not visible here.'));
    }
    let sys: Hit | null;
    for (const w of c.operands) {
      const p = canonPath(w.value);
      const critical = criticalPath(p);
      if (critical && (recursive || p.glob)) {
        hits.push(hit('destructive', `Deletes ${p.glob ? 'everything in ' : ''}${where(critical, p.path)}. This cannot be undone.`, { touches: [p.path] }));
      } else if (w.substitution) {
        hits.push(hit('elevated', `The paths to delete come from \`${w.value}\`, which is only known when it runs.`, { cantVerify: true }));
      } else if (w.startsWithExpansion && !p.path.startsWith('~') && !p.path.startsWith('.') && !w.guardedVar) {
        const name = w.vars[0] ?? 'the variable';
        if (/^\$\{?\w+\}?\//.test(w.value) && recursive) {
          hits.push(
            hit('destructive', `If \`$${name}\` is empty or unset, \`${w.value}\` becomes \`${w.value.replace(/^\$\{?\w+\}?/, '')}\` and this deletes from the root of the disk. Use \`\${${name}:?}\` to fail instead.`, {
              touches: [w.value]
            })
          );
        } else if (w.unquotedVar) {
          hits.push(hit('elevated', `\`${w.value}\` is unquoted: if it holds spaces or wildcards, \`rm\` deletes more than you expect. Quote it: \`"${w.value}"\`.`, { touches: [w.value] }));
        } else {
          hits.push(hit('modifies', `Deletes whatever \`${w.value}\` points to.`, { touches: [w.value] }));
        }
      } else if (recursive && (p.path === '.' || p.path === '..' || p.glob)) {
        hits.push(hit('elevated', `Deletes ${p.glob ? 'everything in' : ''} the ${p.path === '..' ? 'parent' : 'current'} folder; what that is depends on where you run it.`, { touches: [w.value] }));
      } else if (recursive && isOutsideProject(p)) {
        hits.push(hit('elevated', `Recursively deletes ${p.path}, outside the current project.`, { touches: [p.path] }));
      } else if (!recursive && (sys = systemFileDelete(p.path))) {
        hits.push(sys);
      } else {
        const regenerable = PROJECT_REGENERABLE.test(p.path);
        hits.push(
          hit('modifies', `Deletes ${p.path}${recursive ? ' and everything inside it' : ''}${regenerable ? ' (build output or dependencies; it can be regenerated)' : ''}.`, {
            touches: [p.path]
          })
        );
      }
    }
    return hits;
  }
};

// Programs that `find -exec` can run without making the command more than readonly: none of them can
// write files whatever their arguments (unlike `sed -i`, `sort -o` or `awk`, which stay modifies).
const FIND_EXEC_READONLY = new Set([
  'ls', 'stat', 'file', 'cat', 'head', 'tail', 'wc', 'grep', 'egrep', 'fgrep', 'rg', 'du', 'echo', 'printf',
  'md5sum', 'sha1sum', 'sha256sum', 'sha512sum', 'cksum', 'basename', 'dirname', 'realpath', 'readlink', 'test', '['
]);

// Expressions that select files. Anything else before `-delete` (`-maxdepth 2`, `-depth`, `-print`, `(`) selects nothing.
const FIND_TEST = /^-(i?name|i?path|i?wholename|i?regex|i?lname|type|xtype|size|empty|[acm](time|min|newer)|newer\w*|user|group|uid|gid|nouser|nogroup|perm|links|inum|samefile|readable|writable|executable|fstype|context|used)$/;

const find: Rule = {
  id: 'find-delete',
  check(c) {
    if (c.program !== 'find') return null;
    const values = c.argv.map((w) => w.value);
    const execProgs = values.flatMap((v, i) => (/^-(exec|execdir|ok|okdir)$/.test(v) && values[i + 1] !== undefined ? [values[i + 1]!] : []));
    const execProg = execProgs.find((p) => !FIND_EXEC_READONLY.has(p)) ?? execProgs[0];
    const deletes = values.includes('-delete') || execProgs.some((p) => /^(rm|shred|unlink)$/.test(p));
    if (!deletes && execProgs.every((p) => FIND_EXEC_READONLY.has(p))) return null;
    const roots = values.slice(0, Math.max(0, values.findIndex((v) => /^[-(!]/.test(v)))).map(canonPath);
    const target = roots.length ? roots : [canonPath('.')];
    if (!deletes) return hit('modifies', `Runs \`${execProg}\` on every file it finds.`);
    const critical = target.map(criticalPath).find(Boolean);
    if (critical) return hit('destructive', `Deletes every matching file under ${where(critical, target[0]!.path)}.`);
    // `find . -delete` or `find . -delete -name x`: no test comes before the delete, so every file under the start folder
    // matches. That's `rm -r` on the start folder, and gets the same verdict as `rm -r .` or `rm -r ~/somewhere`.
    const firstDelete = values.findIndex((v, i) => v === '-delete' || (/^-(exec|execdir|ok|okdir)$/.test(values[i - 1] ?? '') && /^(rm|shred|unlink)$/.test(v)));
    const unfiltered = !values.slice(roots.length, firstDelete).some((v) => FIND_TEST.test(v));
    if (unfiltered) {
      const wide = target.find((t) => t.path === '.' || t.path === '..' || isOutsideProject(t));
      const shown = target.map((t) => t.path).join(', ');
      if (wide) {
        return hit('elevated', `No test comes before the delete, so it deletes everything under ${wide.path === '.' ? 'the current folder' : wide.path === '..' ? 'the parent folder' : wide.path}. Tests like \`-name\` must come before \`-delete\`.`, {
          touches: target.map((t) => t.path)
        });
      }
      return hit('modifies', `No test comes before the delete, so it deletes everything under ${shown}.`, { touches: target.map((t) => t.path) });
    }
    return hit('modifies', `Deletes every matching file under ${target.map((t) => t.path).join(', ')}.`, { touches: target.map((t) => t.path) });
  }
};

const disks: Rule = {
  id: 'disk-wipe',
  check(c) {
    const p = c.program;
    if (!p) return null;
    if (p === 'dd') {
      const of = c.operands.find((w) => w.value.startsWith('of='));
      const dev = of?.value.slice(3);
      if (dev && DEVICE.test(dev)) return hit('destructive', `\`dd\` overwrites the disk ${dev} block by block. Everything on it is gone.`, { touches: [dev] });
      return of ? hit('modifies', `\`dd\` writes to ${dev}.`, { touches: [dev!] }) : null;
    }
    if (/^(mkfs(\..+)?|mke2fs|mkswap|wipefs)$/.test(p)) {
      return hit('destructive', `\`${p}\` erases the filesystem on ${c.operands.at(-1)?.value ?? 'the target device'}.`);
    }
    if (p === 'shred') {
      const dev = c.operands.find((w) => DEVICE.test(w.value));
      if (dev) return hit('destructive', `\`shred\` overwrites the whole device ${dev.value}.`);
      return hit('elevated', `\`shred\` overwrites ${c.operands.map((w) => w.value).join(', ')} so it can never be recovered.`);
    }
    if (/^(fdisk|sfdisk|gdisk|parted|cfdisk)$/.test(p) && !c.short.has('l') && !c.long.has('list')) {
      return hit('elevated', `\`${p}\` edits disk partition tables.`);
    }
    return null;
  }
};

const perms: Rule = {
  id: 'chmod-chown',
  check(c) {
    if (c.program !== 'chmod' && c.program !== 'chown' && c.program !== 'chgrp') return null;
    const recursive = c.short.has('R');
    // The first operand is the mode/owner, unless `--reference=FILE` supplies it.
    const spec = c.long.has('reference') ? undefined : c.operands[0];
    const targets = c.long.has('reference') ? c.operands : c.operands.slice(1);
    for (const w of targets) {
      const p = canonPath(w.value);
      const critical = criticalPath(p);
      if (critical && recursive) {
        return hit('destructive', `Recursively changes ${c.program === 'chmod' ? 'permissions' : 'ownership'} of ${where(critical, p.path)}. Many programs refuse to run (sudo, ssh) once these are wrong, and there is no undo.`, {
          touches: [p.path]
        });
      }
      if (critical || /^~\/\.ssh/.test(p.path)) {
        return hit('elevated', `Changes ${c.program === 'chmod' ? 'permissions' : 'ownership'} of ${p.path}.`, { touches: [p.path] });
      }
    }
    if (c.program === 'chmod' && spec && /^(0?777|a\+rwx|ugo\+rwx|o\+w)$/.test(spec.value)) {
      return hit('elevated', `\`${spec.value}\` lets every user on the machine change ${recursive ? 'everything in ' : ''}these files. Usually \`755\` or \`u+x\` is what you want.`);
    }
    return hit('modifies', `Changes ${c.program === 'chmod' ? 'permissions' : 'ownership'} of ${targets.map((w) => w.value).join(', ') || 'files'}.`, {
      touches: targets.map((w) => w.value)
    });
  }
};

const tee: Rule = {
  id: 'tee',
  check(c) {
    if (c.program !== 'tee') return null;
    const mode = c.short.has('a') ? 'append' : 'overwrite';
    return c.operands.map((w) => writeTargetHit(w, mode, '`tee`')).filter((h): h is Hit => h !== null);
  }
};

const copyMove: Rule = {
  id: 'cp-mv',
  check(c) {
    if (!c.program || !/^(cp|mv|ln|install|rsync)$/.test(c.program)) return null;
    const hits: Hit[] = [];
    if (c.program === 'rsync' && [...c.long].some((f) => f.startsWith('delete'))) {
      hits.push(hit('elevated', '`rsync --delete` removes files in the destination that are not in the source.'));
    }
    const dest = c.operands.at(-1);
    if (dest && c.operands.length >= 2) {
      const h = writeTargetHit(dest, 'overwrite', `\`${c.program}\``);
      // Copying into /etc is a system change, but not the same as truncating a file there.
      if (h) hits.push(h.severity === 'destructive' && !DEVICE.test(dest.value) ? { ...h, severity: 'elevated' } : h);
    }
    if (c.program === 'mv') {
      for (const src of c.operands.slice(0, -1)) {
        const critical = criticalPath(canonPath(src.value));
        if (critical) hits.push(hit('destructive', `Moves ${where(critical, src.value)} away.`));
      }
    }
    return hits;
  }
};

const inPlaceEdit: Rule = {
  id: 'in-place-edit',
  check(c) {
    let files: Word[] = [];
    if (c.program === 'sed' && (c.short.has('i') || c.long.has('in-place'))) {
      const scriptGiven = c.short.has('e') || c.short.has('f');
      files = scriptGiven ? c.operands : c.operands.slice(1);
    } else if (c.program === 'perl' && c.short.has('i')) {
      files = c.operands.slice(c.short.has('e') ? 1 : 0);
    } else {
      return null;
    }
    const hits: Hit[] = [];
    for (const f of files) {
      const p = canonPath(f.value);
      const viaWrite = writeTargetHit(f, 'append', `\`${c.program} -i\``);
      if (viaWrite && viaWrite.severity !== 'modifies') hits.push(viaWrite);
      else if (isOutsideProject(p)) hits.push(hit('elevated', `Edits ${p.path} in place, outside the current project. There is no backup unless you add a suffix like \`-i.bak\`.`, { touches: [p.path] }));
      else hits.push(hit('modifies', `Edits ${p.path} in place.`, { touches: [p.path] }));
    }
    return hits;
  }
};

// `sort -o FILE` writes its output to FILE (often the input itself, to sort in place). `gpg -o FILE` / `--output FILE`
// writes the decrypted, signed or dearmored result there, as install scripts do with `gpg --dearmor -o /usr/share/keyrings/…`.
const OUTPUT_OPTION_PROGRAMS = new Set(['sort', 'gpg', 'gpg2']);
const outputOption: Rule = {
  id: 'output-option',
  check(c) {
    if (!c.program || !OUTPUT_OPTION_PROGRAMS.has(c.program)) return null;
    const via = c.program === 'sort' ? '`sort -o`' : `\`${c.program} -o\``;
    const argv = c.argv.map((w) => w.value);
    const hits: Hit[] = [];
    argv.forEach((v, i) => {
      let target: Word | undefined;
      if (v === '-o' || v === '--output') target = c.argv[i + 1];
      else if (/^-o./.test(v)) target = { ...c.argv[i]!, value: v.slice(2) };
      else if (v.startsWith('--output=')) target = { ...c.argv[i]!, value: v.slice('--output='.length) };
      else if (/^-[a-zA-Z]*o$/.test(v) && !v.startsWith('--')) target = c.argv[i + 1];
      if (!target || target.value === '-') return;
      const h = writeTargetHit(target, 'overwrite', via);
      if (h) hits.push(h);
    });
    return hits;
  }
};

// awk is read-only unless its program writes a file (`print > "out"`), pipes to or runs a shell command
// (`print | "cmd"`, `system(…)`, `"cmd" | getline`), or a script file (`-f`) does who knows what.
const awkWrites: Rule = {
  id: 'awk-writes',
  check(c) {
    if (!c.program || !/^[gmn]?awk$/.test(c.program)) return null;
    if (c.argv.some((w) => w.value === '-f' || w.value.startsWith('--file'))) return hit('modifies', 'Runs an awk script from a file, which can write files or run commands.');
    const hits: Hit[] = [];
    for (const w of c.operands) {
      const prog = w.value;
      // Blank out string contents so `print "a -> b"` isn't read as a redirection; offsets stay the same.
      const code = prog.replace(/"(?:[^"\\]|\\.)*"/g, (m) => `"${'_'.repeat(m.length - 2)}"`);
      // Within one statement, `>` after `print`/`printf` is always a redirection (comparisons there need parentheses).
      const redirect = /\bprintf?\b[^;{}\n]*?(>>?)\s*("[^"]*"|[^\s;{}]+)/.exec(code);
      if (redirect) {
        const start = redirect.index + redirect[0].length - redirect[2]!.length;
        const raw = prog.slice(start, start + redirect[2]!.length);
        const via = `awk's \`print ${redirect[1]}\``;
        const mode = redirect[1] === '>>' ? 'append' : 'overwrite';
        // A quoted name is a fixed file and gets the same verdict as `>` to it; anything else is computed per line.
        const h = /^"[^"]*"$/.test(raw)
          ? writeTargetHit({ ...w, raw, value: raw.slice(1, -1), vars: [], unquotedVar: false, substitution: false, startsWithExpansion: false }, mode, via)
          : hit('modifies', `${via} writes to files named by \`${raw}\`, worked out line by line.`);
        if (h) hits.push(h);
      }
      if (/\bsystem\s*\(/.test(code) || /\bprintf?\b[^;{}\n]*?\|/.test(code) || /\|\s*getline\b/.test(code)) {
        hits.push(hit('modifies', 'The awk program runs shell commands (`system()` or a pipe), which can do anything you can.'));
      }
    }
    return hits;
  }
};

const truncate: Rule = {
  id: 'truncate',
  check(c) {
    if (c.program !== 'truncate') return null;
    return c.operands.map((w) => writeTargetHit(w, 'overwrite', '`truncate`')).filter((h): h is Hit => h !== null);
  }
};

export const fileRules: Rule[] = [redirects, rm, find, disks, perms, tee, copyMove, inPlaceEdit, outputOption, awkWrites, truncate];

export const isWrite = (c: NormalizedCommand) =>
  c.cmd.redirects.some((r) => r.target && />/.test(r.op) && !HARMLESS_TARGET.test(r.target.value));
