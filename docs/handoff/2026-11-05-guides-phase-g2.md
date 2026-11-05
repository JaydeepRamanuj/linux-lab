# Handoff · 2026-11-05 · Guides Phase G2: Processes and Services & Logs

**Task:** Phase G2 of `docs/guides-plan.md`: the rest of the Processes track and the whole Services and logs track (plan §6, tracks 4 and 6). Read `docs/guides-plan.md` first, then the G0 and G1 handoffs, then this file.

**Status:** committed on branch `guides/phase-g0` on top of G1 (599c625) and pushed. Still no PR: the plan is one large PR into `main` once every guide phase is done. Everything below passes:

- **Tests:** 384 pass (`npx vitest run` in `packages/core`), 20 more than G1, all from the rule engine change below.
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** 133 pages (126 plus the 7 guides), no `[content]` warnings.
- **Browser** (dev server at 375px, plus desktop for the link checks):
  - the 7 guides, the 8 scenarios that link to them, `/learn`, `/learn/processes`, `/learn/services`, and the `systemctl` and `lsof` command pages all return 200;
  - no page scrolls sideways at 375px, and every table fits its column (see the signals table fix below);
  - every guide has the six H2s in order, and "Under the hood" is collapsed and opens;
  - Zones, Layers and Flow render; Flow steps through (Step through, then Next → "3 / 5");
  - `search.json` has all 7 guides; no console errors.

## What was added

| Guide | Track, order, level | Widgets | Linked from (scenario `concepts`) | Command pages (guide `commands`) |
|---|---|---|---|---|
| `processes-basics` | Processes 1, E | Zones (one branch of the tree) | `cpu-ram-hog`, `frozen-app`, `port-in-use` | ps, pgrep, top, htop, kill |
| `signals` | Processes 2, E | Flow (a signal arriving), table | `cpu-ram-hog`, `frozen-app`, `stopped-job`, `keep-running` | kill, pkill, pgrep, ps, systemctl |
| `file-descriptors` | Processes 3, D | Layers (descriptor → open file → inode → disk) | `watch-log`, `apt-lock`, `disk-full` | lsof, ls, tail |
| `jobs-sessions` | Processes 5, D | Zones (one terminal tab), table | `stopped-job`, `keep-running` | jobs, nohup, tmux, kill, ps |
| `systemd-units` | Services 1, E | Flow (`enable --now`), table | `system-service`, `keep-running` | systemctl, journalctl |
| `journald-logs` | Services 2, E | Layers (sources → journald → files → rsyslog) | `system-service`, `watch-log`, `disk-full` | journalctl, tail, less, systemctl |
| `scheduled-tasks` | Services 3, D | Flow (how security updates install themselves), table | `apt-lock` | systemctl, journalctl |

`ports-sockets` stays at Processes order 4. Its prerequisite is now `file-descriptors` instead of `standard-streams`, as the G1 handoff suggested.

**Prerequisites:** `processes-basics` needs `pressing-enter`; `signals` needs `processes-basics`; `file-descriptors` needs `processes-basics` and `standard-streams`; `jobs-sessions` needs `signals`; `systemd-units` needs `processes-basics`; `journald-logs` needs `systemd-units`; `scheduled-tasks` needs `systemd-units` and `environment-variables`.

**Beyond the plan's list of scenarios:** `disk-full` links `file-descriptors` (its "deleted but still open" tip) and `journald-logs`, and `port-in-use` adds `processes-basics` (the orphaned `node` child). `keep-running` links `systemd-units`, which its "make it a service" tip points to.

## One rule engine change

Like G1, some plain inspection commands rated above read-only, so they couldn't be observe commands. `packages/core/src/rules/base.ts` and `system.ts` now rate these as read-only:

- `pstree`, `lslocks`, `systemd-cgls`, `systemd-cgtop`, `systemd-delta`;
- `kill -l` and `kill -L` (only lists signals);
- `stty` with no settings, or only `-a`/`-g`;
- `trap` with no arguments or `-p`/`-l`;
- `ulimit` with no value (prints a limit; `ulimit -n 4096` still rates `modifies`);
- `crontab -l` (`-e` and `-r` keep their `elevated` rating);
- `loginctl` `list-*`, `show-*` and `*-status`;
- `systemd-analyze` with a reporting subcommand (`calendar`, `blame`, `verify`, `unit-paths` and so on, an allowlist; `set-log-level` still `modifies`);
- `systemctl get-default` and `show-environment` (`get-default` was `elevated`).

Each has a test in `rules.test.ts`, including the counter-cases. This changes what `/explain` says for these commands.

## Accuracy: checked on Ubuntu 24.04 (WSL), systemd 255, bash 5.2.21

Every observe output comes from that machine, with these edits:

- `/dev/pts/3` became `/dev/pts/0`, as in G1;
- the test shell's command line `bash --norc --noprofile -i` became `bash` in `ps` output;
- the hostname `TOP-IT-354` became `laptop`;
- in `ls -l /proc/$$/fd` and `/proc/self/fd`, a stray `7 -> /dev/ptmx` that WSL's terminal relay leaks into every shell is left out;
- `readlink /proc/$$/cwd` shows `/home/jd/projects` (the test ran from a Windows folder);
- long outputs are trimmed (`kill -l`, `list-timers`, `systemd-delta`, `ls -l /var/log`, `-o verbose`).

What the checks confirmed (scripts ran in a real pty through `script` where a terminal mattered):

- **Processes:**
  - `exec` keeps the PID (`bash 8330` then `sh 8330`).
  - An orphan's new parent was WSL's per-session `/init`, a subreaper. On a desktop it's `systemd --user`; the guide says so.
  - A zombie shows as `Z` / `<defunct>` until `waitpid`, then disappears.
  - Threads appear under `/proc/<PID>/task` with IDs from the PID space.
  - `pid_max` is 4194304.
  - Under WSL, PID 2 is `init-systemd`, not `kthreadd`. The guide describes `kthreadd` for normal installs and notes the WSL difference.
- **Signals:**
  - Exit codes 143 (TERM), 137 (KILL), 130 (INT), 129 (HUP).
  - Python can't set a handler for KILL or STOP (`EINVAL`).
  - A program that catches TERM keeps running after a plain `kill`; `kill -9` ends it.
  - A stopped process with no TERM handler dies on TERM at once. One with a handler keeps it pending: `/bin/kill PID` did nothing visible, and bash's `kill %1` (which also sends CONT) ran the handler.
  - SigIgn for an interactive bash is `384004` (QUIT, TERM, TSTP, TTIN, TTOU). A script's background job ignores INT and QUIT (`6`), and `nohup` adds HUP (`7`).
  - Ctrl+C on `sleep 100 | sleep 101`: `PIPESTATUS` is `130 130`.
  - `stty -a` shows `intr = ^C`, `quit = ^\`, `susp = ^Z`.
  - cron.service: `KillSignal=15`, `TimeoutStopUSec=1min 30s`, `FinalKillSignal=9`.
- **File descriptors:**
  - fd 255 has flags `02000002` (close-on-exec) and doesn't appear in a child's `/proc/self/fd`.
  - Deleting a 50 MB file held open didn't change `df`; killing the holder freed it. `lsof +L1` listed it as `(deleted)`.
  - A shared open file keeps order across processes; two separate `>` opens overwrite.
  - With a limit of 16, Python opened 12 files, then `EMFILE`. Service limits: soft 1024, hard 1048576.
  - `lslocks`: a Python `lockf` shows as POSIX, `flock` as FLOCK. A second locker gets `EAGAIN`. The lock is gone after `kill -9`, and the file stays.
  - **apt holds POSIX (`fcntl`) write locks on both `/var/lib/dpkg/lock` and `lock-frontend`**: `lslocks` during `apt-get check` (run as root).
  - libapt-pkg contains "It is held by process %d" and "removing the lock file is not a solution".
  - `tail -f` after a rename: its fd pointed at `app.log.1` and it printed only the old file's new line.
- **Jobs and sessions:**
  - `ps` shows a pipeline sharing one PGID, SID = the shell, TPGID = the foreground group.
  - A background `cat &` becomes "Stopped (tty input)".
  - **A real hang-up (SIGKILL to `script`, closing the pty master):** plain `&` and a stopped job died; `nohup`, `disown` and `setsid` survived. (A first attempt used SIGTERM on `script`, which only signals bash, and interactive bash ignores TERM, so nothing was hung up.)
  - **Typing `exit`** with a running background job: it survived (`huponexit` is off).
  - `KillUserProcesses` is commented out (`no`) in `/etc/systemd/logind.conf`.
  - The tmux server has its own SID and no terminal.
- **systemd:**
  - `cron.service` file, `KillMode=process`, `Restart=on-failure`, `Type=simple`.
  - The enable symlink in `multi-user.target.wants`; `is-enabled` gives `enabled`, `static`, `enabled`, `masked` for cron, apt-daily.service, apt-daily.timer, sudo.service.
  - `get-default` is `graphical.target`; `runlevel3.target` → `multi-user.target`, `runlevel5.target` → `graphical.target`.
  - Search order from `systemd-analyze unit-paths`: `/etc` before `/run` before `/usr/lib`. `/lib` → `usr/lib`.
  - The cgroup's `cgroup.procs` lists cron's PID.
  - `rsyslog.service` is `TriggeredBy: syslog.socket`.
  - `deb-systemd-helper` and `deb-systemd-invoke` exist.
- **Journal:**
  - `Storage=auto` with `/var/log/journal/<machine-id>/` present, so the journal is persistent; 3 boots listed; 613.8M used.
  - The 10% / 4G / 15% defaults are from `journald.conf(5)` on the machine.
  - **`ForwardToSyslog=yes` comes from `/usr/lib/systemd/journald.conf.d/syslog.conf`, shipped by Ubuntu's systemd package.**
  - rsyslog's rules: `auth.log`, `kern.log`, `mail.log`, and `syslog` gets everything except auth.
  - **The journal ACL gives read access to `adm` only on Ubuntu** (no `wheel`), decoded from the xattr.
  - `_TRANSPORT` values seen: syslog, stdout, journal, driver, kernel. `logger` arrives as `syslog`.
- **Scheduling:**
  - Timers: `apt-daily-upgrade.timer` is `OnCalendar=*-*-* 6:00`, `RandomizedDelaySec=60m`, `Persistent=true`. It ran about two minutes after boot (boot 07:24:43, timer 07:26:56) and took 44 s.
  - `apt.systemd.daily install` runs `unattended-upgrade`.
  - `logrotate.timer` is daily; `/etc/cron.daily/logrotate` exits when systemd is running.
  - `/etc/crontab` uses `test -x /usr/sbin/anacron ||`; anacron isn't installed here.
  - **A real cron job** (a temporary crontab for jd, removed afterwards, which is the state it was found in):
    - `PATH` came from `/etc/environment` via `pam_env`, including `/snap/bin`; cron runs with `-P`.
    - `SHELL=/bin/sh`, `HOME`, `LOGNAME`, `PWD`, `LANG=C.UTF-8`, and nothing else.
    - `echo first%second; cat > /tmp/pct.txt` ran only `echo first` (the journal logged `CMD (echo first)`).
    - Output was dropped: `No MTA installed, discarding output`.

**Not checked on the machine** (from cited docs): `KillUserProcesses=yes` behaviour, Fedora's preset policy and cronie, Arch having no cron, Node raising its own fd limit, and a desktop's `pstree` chain.

**References:** 26 of the new URLs return 200. freedesktop.org (all the systemd man pages) and wiki.debian.org reset the connection from this machine, the same kind of network problem G0 had with kernel.org. They're the canonical locations, but check them once. An Ubuntu Server logging page 404'd under every URL tried, so it was dropped.

## Fixes along the way

- **The signals table** had four columns and ran 12px past its column at 375px. The number now sits next to the name (`TERM (15)`), and every guide table fits.
- **YAML block scalars:** outputs whose first line starts with spaces (`ps`, `kill -l`, `uniq -c`, `systemd-analyze calendar`) need `|2`, like the scenarios use. Without it the build fails with "bad indentation".

## For your review

1. **The rule engine change above.** It's broader than G1's.
2. **`file-descriptors` and `jobs-sessions` are 8 minutes each**, both Deeper. `systemd-units` is also 8 minutes, as Essentials, because unit types, dependencies and the enable Flow all felt necessary. Trim if that's too long.
3. **Tone check on the "measured" paragraphs** in `scheduled-tasks` and `jobs-sessions` ("What a real hang-up did", "cron's environment, measured"). They report the tests above directly. They could be shortened into plain statements if you'd rather the guides not mention tests.

## Environment gotchas (new in G2)

- **Another session's dev server held 4321** (and 4322), so the preview ran on 4323.
- **`wsl -u root`** works without a password; it was used only for `lslocks` during `apt-get check`.
- **`ps` prints `your 131072x1 screen size is bogus`** when run from a script without a terminal. Set `COLUMNS` or ignore it.
- **Don't run `cat > file` without a heredoc** in a Bash tool call: it waits on stdin until the 2-minute timeout.

## Next

1. Fold in any feedback from Jd's review of G1 and G2 on the preview.
2. **G3: Filesystem and Permissions (rest)** (plan §6, tracks 2 and 3): `everything-is-a-file`, `filesystem-layout`, `inodes-links`, `mounts-devices`, `proc-sys`, `users-groups`, `how-sudo-works`, `setuid-capabilities`. Link them from the Files & Permissions scenarios (`disk-full`, `find-files`, `safe-mv-cp`, `symlink-shortcut`, `root-owned-files`, `chmod-numbers`, `extract-archive` and others). `file-descriptors` already covers deleted-but-open files, so `inodes-links` can link to it instead of repeating it.
3. Commit each phase to `guides/phase-g0` and push. Don't open a PR.
