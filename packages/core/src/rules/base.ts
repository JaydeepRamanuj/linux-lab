import type { NormalizedCommand } from '../normalize';
import type { Severity } from '../severity';

// Programs that only read or inspect. Writes through redirects are caught separately by the rules.
const READONLY = new Set([
  'ls', 'll', 'la', 'dir', 'cat', 'bat', 'batcat', 'less', 'more', 'head', 'tail', 'grep', 'egrep', 'fgrep', 'rg', 'ag', 'ack',
  'find', 'fd', 'fdfind', 'locate', 'which', 'whereis', 'type', 'command', 'file', 'stat', 'wc', 'du', 'df', 'free', 'top', 'htop', 'btop',
  'ps', 'pgrep', 'pidof', 'lsof', 'ss', 'netstat', 'dig', 'nslookup', 'host', 'ping', 'traceroute', 'tracepath', 'whoami', 'id',
  'groups', 'uname', 'uptime', 'date', 'cal', 'pwd', 'echo', 'printf', 'printenv', 'history', 'man', 'tldr', 'help', 'info',
  'diff', 'cmp', 'comm', 'sort', 'uniq', 'cut', 'tr', 'paste', 'join', 'column', 'jq', 'yq', 'xxd', 'od', 'hexdump', 'strings',
  'md5sum', 'sha1sum', 'sha256sum', 'sha512sum', 'cksum', 'basename', 'dirname', 'realpath', 'readlink', 'tree', 'lsblk',
  'blkid', 'findmnt', 'dmesg', 'lscpu', 'lsusb', 'lspci', 'lsmod', 'nproc', 'test', '[', '[[', 'true', 'false', 'sleep', 'wait',
  'jobs', 'cd', 'pushd', 'popd', 'export', 'unset', 'alias', 'set', 'shopt', 'read', 'tput', 'clear', 'reset', 'env', 'locale',
  'hostnamectl', 'timedatectl', 'journalctl', 'last', 'w', 'who', 'getent', 'nmcli', 'iwconfig', 'ip', 'ifconfig', 'route',
  'awk', 'gawk', 'mawk', 'sed', 'base64', 'gzip', 'zcat', 'nl', 'fold', 'fmt', 'rev', 'tac', 'yes', 'seq', 'expr', 'bc',
  'node', 'python', 'python3', 'xdg-open', 'open', 'code', 'gio', 'nautilus', 'watch', 'tmux', 'screen', 'ssh-add',
  'curl', 'wget', 'gpg', 'ncdu', 'hash', 'update-desktop-database'
]);

// Programs that change files in the project or user space, recoverably.
const MODIFIES = new Set([
  'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'ln', 'rm', 'chmod', 'chown', 'chgrp', 'tee', 'tar', 'zip', 'unzip', 'gunzip',
  'npm', 'pnpm', 'yarn', 'bun', 'npx', 'pnpx', 'bunx', 'pip', 'pip3', 'pipx', 'uv', 'poetry', 'cargo', 'go', 'make', 'cmake',
  'docker', 'podman', 'git', 'source', '.', 'kill', 'pkill', 'killall', 'nohup', 'disown', 'bg', 'fg', 'ssh', 'scp', 'rsync',
  'truncate', 'patch', 'install', 'mktemp', 'nvm', 'fnm', 'corepack', 'xargs', 'dd', 'sqlite3', 'psql', 'mysql'
]);

export interface Basis {
  severity: Severity;
  reason: string;
}

/** Severity of a command on its own, before any rule looks at its arguments. */
export function baseSeverity(c: NormalizedCommand): Basis {
  const p = c.program;
  if (!p) return { severity: 'readonly', reason: 'No program runs here.' };

  // Read-only programs with flags that make them write.
  if (p === 'sed' && (c.short.has('i') || c.long.has('in-place'))) return { severity: 'modifies', reason: 'Edits files in place.' };
  if (/^g?awk$/.test(p) && c.argv.some((w) => w.value === 'inplace')) return { severity: 'modifies', reason: 'Edits files in place.' };
  if (p === 'curl' && (c.short.has('o') || c.short.has('O') || c.long.has('output') || c.long.has('remote-name'))) {
    return { severity: 'modifies', reason: 'Downloads to a file.' };
  }
  if (p === 'curl' && (c.short.has('d') || c.short.has('X') || c.short.has('T') || c.short.has('F') || [...c.long].some((f) => /^(data|request|upload-file|form|json)/.test(f)))) {
    return { severity: 'modifies', reason: 'Sends data to a server.' };
  }
  if (p === 'wget' && !c.argv.some((w) => /^-q?O-$|^-$/.test(w.value))) return { severity: 'modifies', reason: 'Downloads a file into the current folder.' };
  if ((p === 'node' || /^python3?$/.test(p)) && (c.operands.length || c.short.has('e') || c.short.has('c'))) {
    return { severity: 'modifies', reason: 'Runs a program, which can do anything you can.' };
  }
  if (p === 'ip' && c.operands.some((w) => /^(add|del|delete|set|flush|change|replace)$/.test(w.value))) {
    return { severity: 'elevated', reason: 'Changes network configuration.' };
  }
  if (p === 'journalctl' && [...c.long].some((f) => f.startsWith('vacuum') || f === 'rotate')) {
    return { severity: 'modifies', reason: 'Deletes old system logs.' };
  }
  if (p === 'env' && c.operands.length === 0) return { severity: 'readonly', reason: 'Prints environment variables.' };

  if (READONLY.has(p)) return { severity: 'readonly', reason: 'Only reads or inspects.' };
  if (MODIFIES.has(p)) return { severity: 'modifies', reason: 'Changes files in your project or home folder.' };
  return { severity: 'modifies', reason: `\`${p}\` isn't in ShellGyan's list yet, so it's assumed to change things.` };
}
