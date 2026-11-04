import { hit } from './types';
import type { Hit, Rule, SourceRule } from './types';

const kill: Rule = {
  id: 'kill',
  check(c) {
    const p = c.program;
    if (p === 'killall5') return hit('destructive', '`killall5` signals every process on the system.');
    if (p === 'kill') {
      const values = c.argv.map((w) => w.value);
      // Skip the signal spec: -9, -KILL, -SIGTERM, -s KILL, -n 9.
      let i = 0;
      if (values[0] === '-s' || values[0] === '-n') i = 2;
      else if (values[0]?.startsWith('-')) i = 1;
      const pids = values.slice(i);
      const force = /^-(9|KILL|SIGKILL)$/i.test(values[0] ?? '') || /^(9|KILL|SIGKILL)$/i.test(values[1] ?? '');
      if (pids.includes('-1')) return hit('destructive', '`kill -1` targets every process you own: your desktop session, editors and terminals all go down.');
      if (pids.includes('0')) return hit('elevated', 'PID `0` means every process in the current process group, including this terminal.');
      return hit('modifies', force ? 'Force-kills the process (SIGKILL): it gets no chance to save or clean up.' : 'Asks the process to stop (SIGTERM).');
    }
    if (p === 'pkill' || p === 'killall') {
      // `-u USER` takes a value, which the flag parser leaves among the operands.
      const byUser = c.short.has('u') || c.short.has('U');
      const patterns = c.operands.map((w) => w.value).slice(byUser ? 1 : 0);
      if (patterns.length === 0 || patterns.some((v) => /^(\.|\.\*|\^\.\*\$?|\*)$/.test(v))) {
        return hit('destructive', `\`${p}\` with no specific target matches every process${byUser ? ' of that user' : ''}.`);
      }
      return hit('modifies', `Stops every process whose name matches ${patterns.map((v) => `\`${v}\``).join(', ')}.`);
    }
    return null;
  }
};

const CORE_SERVICES = /^(ssh|sshd|networkmanager|network|networking|systemd-networkd|systemd-resolved|wpa_supplicant|gdm3?|lightdm|sddm|display-manager|dbus|systemd-logind|polkit|accounts-daemon)(\.service)?$/i;

const services: Rule = {
  id: 'services',
  check(c) {
    const p = c.program;
    if (/^(shutdown|reboot|poweroff|halt)$/.test(p ?? '') || (p === 'init' && /^[06]$/.test(c.operands[0]?.value ?? ''))) {
      return hit('elevated', 'Shuts down or restarts the machine. Unsaved work in other apps is lost.');
    }
    let action: string | undefined;
    let units: string[] = [];
    if (p === 'systemctl') {
      [action, ...units] = c.operands.map((w) => w.value);
      if (/^(reboot|poweroff|halt|suspend|hibernate)$/.test(action ?? '')) return hit('elevated', `\`systemctl ${action}\` changes the power state of the machine.`);
    } else if (p === 'service') {
      const [unit, act] = c.operands.map((w) => w.value);
      action = act;
      units = unit ? [unit] : [];
    } else {
      return null;
    }
    if (!action || /^(status|show|cat|list-.*|is-.*|help|--version)$/.test(action)) return hit('readonly', 'Only shows service status.');
    if (/^(stop|disable|mask|kill)$/.test(action) && units.some((u) => CORE_SERVICES.test(u))) {
      return hit('elevated', `Stopping ${units.join(', ')} can cut off your network, SSH access or login screen.`);
    }
    return hit(c.long.has('user') ? 'modifies' : 'elevated', `Runs \`${action}\` on the service${units.length > 1 ? 's' : ''} ${units.join(', ')}.`);
  }
};

const CORE_PACKAGES =
  /^(python3(\.\d+)?|python3-minimal|systemd|libc6|libc-bin|sudo|apt|dpkg|bash|coreutils|util-linux|network-manager|gnome-shell|ubuntu-desktop|ubuntu-minimal|xorg|xserver-xorg.*|linux-image.*|linux-generic.*|grub.*|openssh-server|glibc|base|filesystem|pacman|dnf|rpm|kernel.*)$/;

const packages: Rule = {
  id: 'packages',
  check(c) {
    const p = c.program;
    if (!p) return null;
    const ops = c.operands.map((w) => w.value);
    let action = '';
    let names: string[] = [];
    if (/^(apt|apt-get|aptitude|dnf|yum|zypper|snap|flatpak|brew)$/.test(p)) {
      [action = '', ...names] = ops;
    } else if (p === 'pacman' || p === 'yay' || p === 'paru') {
      action = c.short.has('R') ? 'remove' : c.short.has('S') && !c.short.has('s') && !c.short.has('i') ? 'install' : c.short.has('U') ? 'install' : 'query';
      names = ops;
    } else if (p === 'dpkg') {
      action = c.short.has('i') || c.long.has('install') ? 'install' : c.short.has('r') || c.short.has('P') || c.long.has('purge') ? 'remove' : c.long.has('configure') ? 'configure' : 'query';
      names = ops;
    } else if (p === 'apt-cache' || p === 'apt-file' || p === 'dpkg-query' || p === 'rpm' && c.short.has('q')) {
      return hit('readonly', 'Only looks up package information.');
    } else {
      return null;
    }

    if (/^(list|search|show|info|policy|query|find|depends|rdepends|madison|changelog|-.*)$/.test(action) || action === '') {
      return hit('readonly', 'Only looks up package information.');
    }
    if (/^(remove|purge|erase|autoremove|uninstall|rm)$/.test(action)) {
      const core = names.filter((n) => CORE_PACKAGES.test(n));
      if (core.length) {
        return hit('elevated', `Removing ${core.join(', ')} can take the desktop, networking or the package manager itself down with it. Read the list of packages it will remove before confirming.`);
      }
      if (action === 'autoremove' && (c.long.has('purge') || ops.includes('--purge'))) {
        return hit('elevated', '`autoremove --purge` removes every package apt thinks is unused, including their config files.');
      }
      return hit('elevated', `Removes ${names.join(', ') || 'packages'} from the system.`);
    }
    if (/^(install|reinstall|upgrade|full-upgrade|dist-upgrade|update|refresh|configure|-.*)$/.test(action) || action === 'install') {
      return hit('elevated', `${action === 'update' ? 'Refreshes the package lists' : `Installs or upgrades ${names.join(', ') || 'software'}`} system-wide.`, {
        effects: { network: true, installsSoftware: action !== 'update' }
      });
    }
    return hit('elevated', `Runs \`${p} ${action}\`, which changes installed packages.`);
  }
};

const git: Rule = {
  id: 'git',
  check(c) {
    if (c.program !== 'git') return null;
    // Skip global options: git -C dir -c k=v <sub> …
    const values = c.argv.map((w) => w.value);
    let i = 0;
    while (i < values.length && values[i]!.startsWith('-')) i += /^-(C|c)$/.test(values[i]!) ? 2 : 1;
    const sub = values[i] ?? '';
    const rest = values.slice(i + 1);
    const has = (...flags: string[]) => rest.some((v) => flags.includes(v) || (v.startsWith('-') && !v.startsWith('--') && flags.some((f) => f.length === 2 && v.includes(f[1]!))));

    if (sub === 'push') {
      const lease = rest.some((v) => v.startsWith('--force-with-lease') || v === '--force-if-includes');
      if (!lease && (has('--force', '-f') || rest.some((v) => /^\+/.test(v)))) {
        return hit('elevated', 'Force-push overwrites the remote branch. Commits others pushed since your last fetch are lost. Prefer `--force-with-lease`.', {
          effects: { network: true }
        });
      }
      if (rest.includes('--delete') || rest.some((v) => /^:/.test(v))) return hit('elevated', 'Deletes a branch on the remote.', { effects: { network: true } });
      return hit('modifies', 'Uploads your commits to the remote.', { effects: { network: true } });
    }
    if (sub === 'reset' && rest.includes('--hard')) {
      return hit('elevated', '`reset --hard` throws away all uncommitted changes in tracked files. They are not in the reflog.');
    }
    if (sub === 'clean' && has('-f', '--force')) {
      const what = has('-x') ? 'untracked and ignored files (including .env and build output)' : 'untracked files';
      return hit('elevated', `Permanently deletes ${what}${has('-d') ? ' and folders' : ''}. Run \`git clean -n\` first to preview.`);
    }
    if ((sub === 'checkout' && rest.includes('--') ) || (sub === 'restore' && !rest.includes('--staged'))) {
      return hit('modifies', 'Discards uncommitted edits in those files.');
    }
    if (sub === 'branch' && has('-D')) return hit('modifies', 'Force-deletes a local branch, even if it has unmerged commits.');
    if (sub === 'stash' && /^(drop|clear)$/.test(rest[0] ?? '')) return hit('elevated', `\`stash ${rest[0]}\` deletes stashed work.`);
    if ((sub === 'reflog' && rest[0] === 'expire') || (sub === 'gc' && rest.some((v) => v.startsWith('--prune')))) {
      return hit('elevated', 'Removes the safety net that lets you recover lost commits.');
    }
    if (sub === 'filter-branch' || sub === 'filter-repo') return hit('elevated', 'Rewrites the whole history of the repository.');
    if (/^(status|log|diff|show|blame|shortlog|describe|rev-parse|ls-files|ls-remote|grep|reflog|whatchanged|cat-file|help|version|--version)$/.test(sub)) {
      return hit('readonly', `\`git ${sub}\` only reads the repository.`);
    }
    if ((sub === 'branch' || sub === 'tag' || sub === 'remote' || sub === 'stash' && rest[0] === 'list' || sub === 'config' && (has('--get', '-l', '--list'))) && rest.every((v) => /^(-v|-vv|-a|-r|--list|-l|--get|list|--show-current)$/.test(v))) {
      return hit('readonly', `\`git ${sub}\` here only lists.`);
    }
    if (/^(clone|fetch|pull)$/.test(sub)) return hit('modifies', `\`git ${sub}\` downloads from the remote.`, { effects: { network: true } });
    return hit('modifies', `\`git ${sub}\` changes the repository.`);
  }
};

// JS package managers: a few subcommands only report on the project.
const NODE_PM_READONLY = /^(ls|list|ll|la|outdated|view|info|show|why|explain|root|prefix|bin|help|search|-v|--version|-h|--help)$/;

const nodePackages: Rule = {
  id: 'node-packages',
  check(c) {
    const p = c.program;
    if (!p || !/^(npm|pnpm|yarn|bun)$/.test(p)) return null;
    const values = c.argv.map((w) => w.value);
    const sub = values[0] ?? '';
    if (NODE_PM_READONLY.test(sub)) return hit('readonly', `\`${p} ${sub}\` only reports on installed packages.`);
    if (sub === 'audit' && !values.includes('fix')) return hit('readonly', `\`${p} audit\` only reports known vulnerabilities.`);
    if (sub === 'config' && /^(get|list|ls)$/.test(values[1] ?? '')) return hit('readonly', 'Only reads the configuration.');
    return null;
  }
};

const DESTRUCTIVE_SQL = /\b(drop\s+(database|schema|table)|truncate(\s+table)?\s+\w|delete\s+from\s+[\w."]+\s*(;|$)(?![\s\S]*\bwhere\b))/i;

const sql: Rule = {
  id: 'sql',
  check(c) {
    const p = c.program;
    if (!p) return null;
    if (p === 'dropdb') return hit('destructive', '`dropdb` deletes a whole PostgreSQL database.');
    if (/^(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh|mongo|clickhouse-client)$/.test(p)) {
      const text = c.argv.map((w) => w.value).join(' ');
      if (DESTRUCTIVE_SQL.test(text) || /dropDatabase\(\)|\.drop\(\)/.test(text)) {
        return hit('destructive', 'Runs SQL that deletes a database, a table or all its rows.');
      }
      return hit('modifies', `Runs \`${p}\` against a database.`);
    }
    if (p === 'redis-cli' && c.operands.some((w) => /^flush(all|db)$/i.test(w.value))) {
      return hit('destructive', 'Deletes every key in Redis.');
    }
    return null;
  }
};

const infra: Rule = {
  id: 'infra',
  check(c) {
    const p = c.program;
    const ops = c.operands.map((w) => w.value);
    if ((p === 'docker' || p === 'podman') && (ops[1] === 'prune' || (ops[0] === 'volume' && /^(rm|prune)$/.test(ops[1] ?? '')))) {
      return hit('elevated', `\`${p} ${ops.slice(0, 2).join(' ')}\` deletes containers, images or volumes (and the data in them).`);
    }
    if (p === 'kubectl' && ops[0] === 'delete') return hit('elevated', '`kubectl delete` removes resources from the cluster.');
    if (p === 'terraform' && ops[0] === 'destroy') return hit('elevated', '`terraform destroy` deletes all infrastructure in this state.');
    if (p === 'aws' && ops[0] === 's3' && ops[1] === 'rm' && c.long.has('recursive')) return hit('elevated', 'Deletes every object under that S3 path.');
    if (p === 'crontab' && c.short.has('r')) return hit('elevated', '`crontab -r` deletes all your scheduled jobs without asking.');
    if (p === 'crontab' && (c.short.has('e') || c.operands.length)) return hit('elevated', 'Changes your scheduled (cron) jobs.');
    if (p && /^(useradd|userdel|usermod|passwd|chsh|visudo|groupadd|groupdel)$/.test(p)) return hit('elevated', `\`${p}\` changes user accounts or login settings.`);
    if (p && /^(ufw|iptables|ip6tables|nft|firewall-cmd)$/.test(p) && !/^(status|-L|--list.*|list)$/.test(ops[0] ?? c.argv[0]?.value ?? '')) {
      return hit('elevated', `\`${p}\` changes firewall rules; a wrong rule can lock you out.`);
    }
    if (p && /^(mount|umount|swapoff|swapon)$/.test(p) && c.argv.length) return hit('elevated', `\`${p}\` changes what is mounted.`);
    return null;
  }
};

const forkBomb: SourceRule = {
  id: 'fork-bomb',
  check(source) {
    const s = source.replace(/\s+/g, '');
    const m = /([\w:.]+)\(\)\{\1\|\1&\};?\1/.exec(s);
    return m ? hit('destructive', 'This is a fork bomb: it copies itself until the machine runs out of processes and freezes.') : null;
  }
};

export const systemRules: Rule[] = [kill, services, packages, git, nodePackages, sql, infra];
export const sourceRules: SourceRule[] = [forkBomb];
export type { Hit };
