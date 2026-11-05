import type { NormalizedCommand } from '../normalize';
import type { Severity } from '../severity';
import { SHELLS } from './remote';

// Programs that only read or inspect. Writes through redirects are caught separately by the rules.
const READONLY = new Set([
  'ls', 'll', 'la', 'dir', 'cat', 'bat', 'batcat', 'less', 'more', 'head', 'tail', 'grep', 'egrep', 'fgrep', 'rg', 'ag', 'ack',
  'find', 'fd', 'fdfind', 'locate', 'which', 'whereis', 'type', 'command', 'file', 'stat', 'wc', 'du', 'df', 'free', 'top', 'htop', 'btop',
  'ps', 'pgrep', 'pidof', 'lsof', 'ss', 'netstat', 'dig', 'nslookup', 'host', 'ping', 'traceroute', 'tracepath', 'whoami', 'id',
  'groups', 'uname', 'uptime', 'date', 'cal', 'pwd', 'echo', 'printf', 'printenv', 'history', 'man', 'tldr', 'help', 'info',
  'diff', 'cmp', 'comm', 'sort', 'uniq', 'cut', 'tr', 'paste', 'join', 'column', 'jq', 'yq', 'xxd', 'od', 'hexdump', 'strings',
  'md5sum', 'sha1sum', 'sha256sum', 'sha512sum', 'cksum', 'basename', 'dirname', 'realpath', 'readlink', 'tree', 'lsblk',
  'blkid', 'findmnt', 'dmesg', 'lscpu', 'lsusb', 'lspci', 'lsmod', 'nproc', 'test', '[', '[[', 'true', 'false', 'sleep', 'wait',
  'jobs', 'cd', 'pushd', 'popd', 'export', 'declare', 'typeset', 'local', 'unset', 'tty', 'alias', 'unalias', 'set', 'shopt', 'umask', 'read', 'tput', 'clear', 'reset', 'env', 'locale',
  'hostnamectl', 'timedatectl', 'journalctl', 'last', 'w', 'who', 'getent', 'nmcli', 'iwconfig', 'ip', 'ifconfig', 'route',
  'awk', 'gawk', 'mawk', 'sed', 'base64', 'gzip', 'zcat', 'nl', 'fold', 'fmt', 'rev', 'tac', 'yes', 'seq', 'expr', 'bc',
  'node', 'python', 'python3', 'xdg-open', 'open', 'code', 'gio', 'nautilus', 'watch', 'tmux', 'screen', 'ssh-add',
  'curl', 'wget', 'gpg', 'ncdu', 'hash', 'exit', 'return', 'pstree', 'lslocks', 'systemd-cgls', 'systemd-cgtop', 'systemd-delta',
  'namei', 'getcap', 'gpgv', 'readelf', 'objdump', 'modinfo', 'lsinitramfs', 'systemd-detect-virt'
]);

// Subcommands of `systemd-analyze` that only report. Others (`set-log-level` and friends) change the running manager.
const SYSTEMD_ANALYZE_READ = /^(time|blame|critical-chain|calendar|timespan|timestamp|verify|cat-config|unit-files|unit-paths|dump|plot|dot|security|condition|syscall-filter|exit-status|capability|filesystems|inspect-elf|malloc)$/;

// Programs that change files in the project or user space, recoverably.
const MODIFIES = new Set([
  'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'ln', 'rm', 'chmod', 'chown', 'chgrp', 'tee', 'tar', 'zip', 'unzip', 'gunzip',
  'npm', 'pnpm', 'yarn', 'bun', 'npx', 'pnpx', 'bunx', 'pip', 'pip3', 'pipx', 'uv', 'poetry', 'cargo', 'go', 'make', 'cmake',
  'docker', 'podman', 'git', 'source', '.', 'kill', 'pkill', 'killall', 'nohup', 'disown', 'bg', 'fg', 'ssh', 'scp', 'rsync',
  'truncate', 'patch', 'install', 'mktemp', 'update-desktop-database', 'nvm', 'fnm', 'corepack', 'xargs', 'dd', 'sqlite3', 'psql', 'mysql'
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
  const net = networkBasis(c);
  if (net) return net;
  if (p === 'journalctl' && [...c.long].some((f) => f.startsWith('vacuum') || f === 'rotate')) {
    return { severity: 'modifies', reason: 'Deletes old system logs.' };
  }
  if (p === 'tar' && (c.short.has('t') || c.long.has('list') || /^[A-Za-z]*t[A-Za-z]*$/.test(c.argv[0]?.value ?? '') && !/[cxrua]/.test(c.argv[0]?.value ?? ''))) return { severity: 'readonly', reason: 'Only lists what is inside the archive.' };
  if (p === 'unzip' && (c.short.has('l') || c.short.has('v') || c.short.has('Z'))) return { severity: 'readonly', reason: 'Only lists what is inside the archive.' };
  if (p === 'tmux' && c.operands.some((w) => /^kill-(session|server|window|pane)$/.test(w.value))) {
    return { severity: 'modifies', reason: 'Closes tmux sessions or windows and ends the programs running in them.' };
  }
  if (p === 'env' && c.operands.length === 0) return { severity: 'readonly', reason: 'Prints environment variables.' };
  if (p === 'crontab' && c.short.has('l') && !c.short.has('e') && !c.short.has('r')) return { severity: 'readonly', reason: 'Prints your scheduled (cron) jobs.' };
  if (p === 'stty' && c.operands.length === 0 && c.argv.every((w) => /^(-a|-g|--all|--save)$/.test(w.value))) {
    return { severity: 'readonly', reason: 'Prints the terminal settings.' };
  }
  if (p === 'trap' && (c.argv.length === 0 || /^-[lp]$/.test(c.argv[0]!.value))) return { severity: 'readonly', reason: 'Lists signals or the traps this shell has set.' };
  if (p === 'ulimit' && c.operands.length === 0) return { severity: 'readonly', reason: 'Prints a resource limit of this shell.' };
  if (p === 'loginctl' && /^(list-.*|show-.*|.*-status)?$/.test(c.operands[0]?.value ?? '')) return { severity: 'readonly', reason: 'Only shows login sessions.' };
  if (p === 'systemd-analyze' && (c.operands.length === 0 || SYSTEMD_ANALYZE_READ.test(c.operands[0]!.value))) {
    return { severity: 'readonly', reason: 'Only reports on systemd and its units.' };
  }

  // `sysctl name` and `sysctl -a` print; `-w`, `name=value`, `-p` and `--system` load or set values.
  if (p === 'sysctl' && !c.argv.some((w) => /=/.test(w.value) || /^-[a-zA-Z]*[wpf]/.test(w.value) || /^--(write|load|system)/.test(w.value))) {
    return { severity: 'readonly', reason: 'Prints kernel settings.' };
  }
  if (p === 'capsh' && c.argv.length > 0 && c.argv.every((w) => /^--(print|decode=\S+|supports=\S+|explain=\S+)$/.test(w.value))) {
    return { severity: 'readonly', reason: 'Prints or decodes capabilities.' };
  }

  // `dmesg` reads the kernel log; a few flags clear it or change what reaches the console.
  if (p === 'dmesg' && (c.short.has('C') || c.short.has('c') || ['clear', 'read-clear'].some((f) => c.long.has(f)))) {
    return { severity: 'elevated', reason: 'Clears the kernel message buffer for everyone. The messages are gone from `dmesg` afterwards (the journal keeps its copy).' };
  }
  if (p === 'dmesg' && (c.short.has('n') || c.short.has('D') || c.short.has('E') || ['console-level', 'console-off', 'console-on'].some((f) => c.long.has(f)))) {
    return { severity: 'elevated', reason: 'Changes which kernel messages are printed to the console.' };
  }

  // Kernel modules: `modprobe -D`, `-c` and `-n` only print; loading or removing a module changes the running kernel.
  if (p === 'modprobe' && (['D', 'c', 'n'].some((f) => c.short.has(f)) || ['show-depends', 'showconfig', 'dry-run'].some((f) => c.long.has(f)))) {
    return { severity: 'readonly', reason: 'Only prints module dependencies or modprobe settings; nothing is loaded.' };
  }
  if (p === 'modprobe' || p === 'insmod' || p === 'rmmod') {
    return { severity: 'elevated', reason: 'Loads or removes a kernel module: code that runs inside the kernel, for the whole machine.' };
  }

  // `ldconfig -p` prints the library cache; plain `ldconfig` (or `-v`) rebuilds it.
  if (p === 'ldconfig' && c.argv.length > 0 && c.argv.every((w) => /^(-p|--print-cache|-V|--version)$/.test(w.value))) {
    return { severity: 'readonly', reason: 'Prints the shared library cache.' };
  }
  if (p === 'ldd') {
    return {
      severity: 'readonly',
      reason: "Lists the shared libraries a program needs. Use it only on programs you trust: for some files ldd runs them to find out. For a file you don't trust, use `readelf -d` or `objdump -p` instead."
    };
  }

  if (SHELLS.has(p) && p !== 'busybox') {
    const shell = shellBasis(c);
    if (shell) return shell;
  }

  if (READONLY.has(p)) return { severity: 'readonly', reason: 'Only reads or inspects.' };
  if (MODIFIES.has(p)) return { severity: 'modifies', reason: 'Changes files in your project or home folder.' };
  return { severity: 'modifies', reason: `\`${p}\` isn't in ShellGyan's list yet, so it's assumed to change things.` };
}

// `ip OBJECT VERB`: iproute2 accepts any prefix of a verb, so `ip r a` is `ip route add` and `ip a s` is `ip addr show`.
const IP_READ_VERBS = ['show', 'list', 'lst', 'get', 'help', 'monitor', 'save', 'showdump', 'identify', 'pids'];
const IP_WRITE_VERBS = ['add', 'append', 'prepend', 'change', 'chg', 'replace', 'delete', 'del', 'set', 'flush', 'restore', 'exec', 'attach', 'detach', 'update'];
const isPrefixOf = (abbr: string, words: string[]) => abbr.length > 0 && words.some((w) => w.startsWith(abbr));

function ipWrites(c: NormalizedCommand): boolean {
  // `-batch FILE` / `-b FILE` runs every command in the file.
  if (c.argv.some((w) => /^--?(b|batch)$/.test(w.value))) return true;
  const [obj, verb] = c.operands.map((w) => w.value);
  if (!obj || !verb) return false;
  // For `link`, a lone `s` means `set`: iproute2 checks `set` before `show` there (and `show` first everywhere else).
  if (/^l(i(nk?)?)?$/.test(obj) && 'set'.startsWith(verb)) return true;
  if (isPrefixOf(verb, IP_READ_VERBS)) return false;
  return isPrefixOf(verb, IP_WRITE_VERBS);
}

// Read-only forms of the firewall front ends. Anything else adds, removes or flushes rules.
export function firewallReadOnly(c: NormalizedCommand): boolean | null {
  const p = c.program;
  const ops = c.operands.map((w) => w.value);
  const args = c.argv.map((w) => w.value);
  if (p === 'ufw') {
    if (args.length === 1 && /^(--version|version|--help|help)$/.test(args[0]!)) return true;
    return ops[0] === 'status' || ops[0] === 'show' || (ops[0] === 'app' && /^(list|info)$/.test(ops[1] ?? ''));
  }
  if (p === 'nft') {
    if (args.length > 0 && args.every((a) => /^(-v|--version|-h|--help)$/.test(a))) return true;
    return /^(list|describe)$/.test(ops[0] ?? '') && !c.short.has('f') && !c.short.has('i');
  }
  if (p === 'iptables' || p === 'ip6tables') {
    // Commands that list: -L, -S, --list, --list-rules, -V. Anything that adds, deletes, flushes or zeroes counters writes.
    const lists = c.short.has('L') || c.short.has('S') || c.short.has('V') || c.long.has('list') || c.long.has('list-rules') || c.long.has('version');
    const writes = ['A', 'C', 'D', 'I', 'R', 'F', 'Z', 'N', 'X', 'P', 'E'].some((f) => c.short.has(f))
      || [...c.long].some((f) => /^(append|check|delete|insert|replace|flush|zero|new-chain|delete-chain|policy|rename-chain)$/.test(f));
    return lists && !writes;
  }
  if (p === 'firewall-cmd') {
    return args.length > 0 && args.every((a) => /^--(state|list-.*|get-.*|query-.*|info-.*|zone=\S+|permanent|version|help)$|^-h$/.test(a));
  }
  return null;
}

/** Network tools: their read and write forms share one program name. */
function networkBasis(c: NormalizedCommand): Basis | null {
  const p = c.program!;
  const ops = c.operands.map((w) => w.value);
  if (p === 'ip') {
    if (ops[0] && 'netns'.startsWith(ops[0]) && ops[0].length > 1 && ops[1] && 'exec'.startsWith(ops[1])) {
      return { severity: 'elevated', reason: 'Runs a command inside another network namespace, as root.' };
    }
    if (ipWrites(c)) return { severity: 'elevated', reason: 'Changes network configuration: addresses, routes or interfaces. A wrong change can cut this machine off the network.' };
    return null;
  }
  if (p === 'ss' && (c.short.has('K') || c.long.has('kill'))) {
    return { severity: 'elevated', reason: '`-K` closes every socket that matches the filter, cutting those connections.' };
  }
  if (p === 'nmcli') {
    // `nmcli`, `nmcli device`, `nmcli connection show`, `nmcli d s`, `nmcli device wifi list`. Verbs may be abbreviated.
    // `s` resolves to `status` or `show`; `se` is `set` and `m`/`mo` is `modify`, so only longer prefixes count.
    const [obj, verb, third] = ops;
    let reads: boolean;
    if (!obj) reads = true;
    else if (/^r/.test(obj)) reads = !third; // `nmcli radio wifi` shows; `nmcli radio wifi off` switches it
    else if (/^n/.test(obj)) reads = !verb || verb === 'connectivity'; // `nmcli networking off` disconnects everything
    else if (!verb) reads = true; // `nmcli device`, `nmcli connection`, `nmcli general`
    else if (/^w(i(fi?)?)?$/.test(verb)) reads = !third || isPrefixOf(third, ['list']); // `nmcli device wifi [list]`
    else {
      reads = verb === 's' || (verb.length >= 2 && isPrefixOf(verb, ['status', 'show']))
        || /^(monitor|permissions|connectivity)$/.test(verb) || (!third && /^(hostname|logging)$/.test(verb));
    }
    if (reads) return { severity: 'readonly', reason: 'Only shows NetworkManager devices and connections.' };
    return { severity: 'elevated', reason: 'Changes NetworkManager connections, devices or radios. A wrong change can drop this machine off the network.' };
  }
  if (p === 'hostnamectl') {
    if (ops.length === 0 || ops[0] === 'status' || (ops.length === 1 && /^(hostname|icon-name|chassis|deployment|location)$/.test(ops[0]!))) {
      return { severity: 'readonly', reason: "Shows the machine's hostname and system details." };
    }
    return { severity: 'elevated', reason: "Changes the machine's hostname or system details." };
  }
  if (p === 'timedatectl') {
    if (ops.length === 0 || /^(status|show|list-timezones|timesync-status|show-timesync)$/.test(ops[0]!)) return { severity: 'readonly', reason: 'Shows the clock, time zone and time sync.' };
    return { severity: 'elevated', reason: 'Changes the system clock, time zone or time sync.' };
  }
  if (p === 'ifconfig' || p === 'iwconfig') {
    if (ops.length <= 1 && c.argv.every((w) => !w.value.startsWith('-') || /^-[asv]$/.test(w.value))) return { severity: 'readonly', reason: 'Shows network interfaces.' };
    return { severity: 'elevated', reason: 'Changes a network interface (address, state or Wi-Fi settings).' };
  }
  if (p === 'route') {
    if (/^(add|del)$/.test(ops[0] ?? '')) return { severity: 'elevated', reason: 'Changes the routing table.' };
    return { severity: 'readonly', reason: 'Shows the routing table.' };
  }
  if (p === 'resolvectl') {
    const linkSettings = /^(dns|domain|default-route|llmnr|mdns|dnssec|dnsovertls|nta)$/;
    if (ops.length === 0 || /^(status|query|service|openpgp|tlsa|statistics|show-cache|show-server-state|monitor|help)$/.test(ops[0]!)
      || (linkSettings.test(ops[0]!) && ops.length <= 2) || (ops[0] === 'log-level' && ops.length === 1)) {
      return { severity: 'readonly', reason: 'Asks systemd-resolved a question: lookups, servers or settings. Changes nothing.' };
    }
    if (/^(flush-caches|reset-statistics|reset-server-features)$/.test(ops[0]!)) return { severity: 'modifies', reason: "Clears systemd-resolved's cache or counters. Nothing is lost; it refills on the next lookups." };
    return { severity: 'elevated', reason: 'Changes which DNS servers or settings this machine uses.' };
  }
  if (p === 'networkctl') {
    if (ops.length === 0 || /^(list|status|lldp|label|cat)$/.test(ops[0]!)) return { severity: 'readonly', reason: 'Only shows network links as systemd-networkd sees them.' };
    return { severity: 'elevated', reason: 'Changes or reconfigures network links managed by systemd-networkd.' };
  }
  if (p === 'ssh' && (c.short.has('G') || c.short.has('V') || c.short.has('Q'))) {
    return { severity: 'readonly', reason: 'Prints configuration or version information and exits; it never connects.' };
  }
  if (p === 'ssh-keyscan') {
    return { severity: 'readonly', reason: "Fetches a server's public host keys. It connects, but sends no username, password or key." };
  }
  if (p === 'ssh-keygen') {
    // -l fingerprint, -F find in known_hosts, -L show a certificate, -B bubblebabble. -f, -E and -v only qualify them.
    const flags = [...c.short];
    const reads = flags.some((f) => /^[lFLB]$/.test(f)) && flags.every((f) => /^[lFLBfEv]$/.test(f) || (f === 'H' && c.short.has('F'))) && c.long.size === 0;
    if (reads) return { severity: 'readonly', reason: 'Prints key fingerprints or looks a host up in known_hosts; nothing is written.' };
    if (c.short.has('R')) return { severity: 'modifies', reason: 'Removes a host from known_hosts (and keeps the old file as known_hosts.old).' };
    return { severity: 'modifies', reason: 'Creates or changes an SSH key or known_hosts file.' };
  }
  if (p === 'ssh-add') {
    if (c.argv.length > 0 && c.argv.every((w) => /^-[lLE]$|^(sha256|md5)$/.test(w.value))) return { severity: 'readonly', reason: 'Lists the keys your SSH agent holds.' };
    return { severity: 'modifies', reason: 'Adds keys to, or removes them from, your SSH agent. The key files themselves are not changed.' };
  }
  const fw = firewallReadOnly(c);
  if (fw) return { severity: 'readonly', reason: 'Only shows firewall rules or status.' };
  return null;
}

/**
 * `bash -c '…'`, `bash -n script`, `bash script`, plain `bash`. What a shell does depends on what it runs, so the shell
 * itself only gets a basis here; `bash -c` bodies are opened up and checked as commands of their own (analyze.ts), and
 * `curl … | bash` is the pipe-to-shell rule's job.
 */
function shellBasis(c: NormalizedCommand): Basis | null {
  const p = c.program!;
  if (c.short.has('c')) {
    const body = c.operands[0];
    if (body && !body.substitution) {
      return { severity: 'readonly', reason: `Runs the quoted text as a command in a new ${p}; that command is checked on its own.` };
    }
    return null;
  }
  const script = c.operands[0];
  const fromFile = c.cmd.redirects.some((r) => r.op === '<' && r.target);
  const piped = !!c.cmd.pipeline && c.cmd.pipeline.index > 0;
  if (c.short.has('n') && (script || fromFile || piped)) {
    return { severity: 'readonly', reason: "Only checks the script's syntax (`-n`); nothing in it runs." };
  }
  if (script && !c.short.has('s')) {
    return { severity: 'modifies', reason: `Runs the script ${script.value}, which can do anything you can. Read it before you run it.` };
  }
  if (fromFile) return { severity: 'modifies', reason: 'Runs the script fed in with `<`, which can do anything you can.' };
  if (!piped) {
    return { severity: 'readonly', reason: `Starts a new interactive ${p}. Type \`exit\` to come back.` };
  }
  return null;
}
