# Handoff · 2026-11-05 · Guides Phase G1: the rest of the Shell track

**Task:** Phase G1 of `docs/guides-plan.md`, the six remaining Shell guides. Read `docs/guides-plan.md` first, then `2026-11-05-guides-phase-g0.md`, then this file.

**Status:** committed as 599c625 on branch `guides/phase-g0`, on top of G0 (381b508), and pushed to origin. There's no PR on purpose: the plan is one large PR into `main` once every guide phase is done, so later phases keep committing to this branch. Jd reviews on the Vercel preview, because they can't install pnpm locally. Everything below passes:

- **Tests:** 364 pass (`vitest` in `packages/core`).
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** 126 pages (120 plus the 6 guides), no `[content]` warnings.
- **Browser** (dev server, desktop width and 375px):
  - all 6 guides, plus `/learn/shell`, return 200;
  - none of them scrolls sideways at 375px;
  - each page has the six H2s in order, and "Under the hood" is collapsed;
  - search returns all 9 guides;
  - scenario pages link back to them.

## Decisions

- **Pilots approved as they are.** The anatomy on observe commands stays folded.
- **Slugs:**
  - The guide is `exit-status`, not `exit-codes`, since the scenario already uses `exit-codes`. Its title is "How Exit Status Works".
  - `environment-variables` keeps its slug, but the title is "How Programs Inherit Their Environment", so it's clearly about the concept and doesn't read like the `env-vars` scenario.
  - `docs/guides-plan.md` §6 is updated to match.
- **Shell track order:** 1 `pressing-enter`, 2 `environment-variables`, 3 `path`, 4 `standard-streams`, 5 `quoting-expansion` (D), 6 `shell-startup-files` (D), 7 `exit-status`.
- **Prerequisites:**
  - `path` needs `pressing-enter` and `environment-variables`.
  - `shell-startup-files` needs `environment-variables` and `path`.
  - The others need `pressing-enter`.
  - `ports-sockets` now needs `standard-streams`. That guide introduces file descriptors, which fills the gap the G0 handoff mentioned until `file-descriptors` exists.

## What was added

| Guide | Widgets | Linked from (scenario `concepts`) | Command pages (guide `commands`) |
|---|---|---|---|
| `environment-variables` | Zones (shell vs exported), Flow (login → app) | `env-vars` | env, export, source, sudo |
| `path` | Zones (first match wins, shadowed copy) | `add-to-path`, `command-not-found` | type, which, command, export, sudo |
| `standard-streams` | Flow (fd table for `> log 2>&1`) | `redirection`, `heredocs`, `curl-pipe-bash` | cat, tee, echo, ls |
| `quoting-expansion` | Flow (one line through all 6 steps) | `expansion-quoting`, `sed-awk` | echo, bash, set |
| `shell-startup-files` | Flow (an SSH login on Ubuntu) | `persistent-alias`, `add-to-path` | source, bash, alias, export |
| `exit-status` | Flow (`exit(1)` → `$?`), Zones (code ranges) | `exit-codes`, `command-chaining` (and the guide lists both) | set, bash, kill |

The pattern is the same as in G0: the guides link to the scenarios rather than repeating them. Each guide's mental model covers what the scenario's "How it works" leaves out, and Under the hood holds the rest.

### One rule engine change

`packages/core/src/rules/base.ts` now rates `declare`, `typeset`, `local` and `tty` as read-only, next to `export`, `set` and `unset`. Before, they fell through to `modifies`, so `declare -p FOO` and `tty` failed the observe check. The 364 tests still pass. Calls to shell functions (`f() {…}; f`) still rate `modifies`, which is right, because the engine can't see what a function does. Two `set -e` examples were rewritten without functions for that reason.

## Accuracy: checked on Ubuntu 24.04 (WSL), bash 5.2.21

Every observe output comes from that machine, with two kinds of change:
- `/dev/pts/2` became `/dev/pts/0`;
- WSL's long Windows `PATH` became Ubuntu's default.

What the checks confirmed:

- **Environment:**
  - `env -i bash -c env` leaves `PWD`, `SHLVL=0` and `_`.
  - With no `PATH`, bash sets one but doesn't export it.
  - `/proc/<pid>/environ` is mode `0400`, and it doesn't pick up later exports.
  - Arrays don't export.
  - `export -f` creates `BASH_FUNC_f%%`.
  - `ARG_MAX` is `2097152`.
- **sudoers** (read as root): `env_reset`, and `secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"`.
- **pam_env:** `/etc/pam.d/cron` reads `/etc/environment` through pam_env. So cron does get `/etc/environment` on Ubuntu, and the guide says that rather than claiming a short fixed `PATH`.
- **PATH lookup:**
  - A non-executable match is skipped. If it's the only match, the code is 126.
  - An empty `PATH` entry runs files from the current folder.
  - Assigning to `PATH` empties the hash table.
  - `which` is `/usr/bin/which.debianutils`, a `#! /bin/sh` script.
- **`/etc/profile.d/apps-bin-path.sh`** adds only `/snap/bin` (and `XDG_DATA_DIRS`). An earlier draft said it also added Flatpak folders; that was wrong and is removed.
- **Startup files:**
  - `/etc/skel` holds `.bash_logout`, `.bashrc` and `.profile`, and no `.bash_profile`.
  - `~/.profile` sources `~/.bashrc` at lines 13–15.
  - `~/.bashrc` lines 5–9 are the `case $-` guard.
  - `/etc/profile` runs `/etc/bash.bashrc` when `PS1` is set.
  - `/bin/sh` is dash.
- **Streams:**
  - With a pty, fds 0, 1, 2 and 255 point at `/dev/pts/N`.
  - In a pipe, `/proc/self/fd/0` is `pipe:[…]`.
  - The default pipe capacity is 65536 (`F_GETPIPE_SZ`).
  - `yes | head -n 2` gives `PIPESTATUS` `141 0`.
  - With `> f 2>&1`, Python's stderr line landed before its earlier stdout line.
- **Quoting:**
  - `{1..$n}` stays literal.
  - `$(…)` strips trailing newlines.
  - `IFS=:` splits `a::b` into three fields, one of them empty.
  - `$'it\'s'` works.
  - zsh says `no matches found` for `a?b=1`, and bash passes it through.
- **Exit status:**
  - `exit 256` → 0, `exit 300` → 44, `exit -1` → 255.
  - Killed by SIGTERM → 143, by SIGKILL → 137.
  - `timeout` → 124, a syntax error → 2.
  - Under `set -e`: `x=$(false)` stops the script, while `export x=$(false)` and `local x=$(false)` don't.
  - A failure inside a function called as `f || …` doesn't stop it either.

**Not re-checked:** the claim that Ubuntu's graphical login reads `~/.profile` comes from the Ubuntu wiki (cited), not from a test. WSL has no desktop session.

## For your review

1. **Two Deeper guides are long.** `quoting-expansion` (8 min) and `shell-startup-files` (7 min). Both have a lot under the hood. If that's too much, trim them.
2. **Fixed: widget titles kept their case.** Flow, Layers and Zones titles, and Zones' column headings, used `label-caps`, which uppercased commands and paths (`CP ~/{DOCS,SRC}`, `~/.LOCAL/BIN`). They now use a new `label-mono` utility in `global.css`: the same mono font, size and weight, without `text-transform`. Zone headings in scenario before/after widgets change too, so `npm test` now reads as `npm test`.
3. **The rule engine change above.** Small, but it changes what `/explain` says for `declare`, `local` and `tty`.

## Environment gotchas

- **pnpm keeps losing its `pnpm.exe`.** `npm i -g pnpm@12.16.1` installs `pn.exe`, `pnpx.exe`, `pnx.exe` and `pnpm.exe` in `%APPDATA%\npm\node_modules\pnpm`. Within the session, `pnpm.exe` disappeared twice: I copied `pn.exe` over it, and later it was gone again. Something on the machine removes it (antivirus is likely). It's unknown what. Workarounds that don't need pnpm:
  - **build:** `node node_modules/astro/bin/astro.mjs build`, run from `apps/web`;
  - **type check:** the same with `check`;
  - **tests:** `npx vitest run`, run from `packages/core`;
  - **dev server:** the `web-node` launch config.
- **WSL from Git Bash:**
  - Set `MSYS_NO_PATHCONV=1`, or paths get mangled.
  - Run checks from a script file. `wsl -- bash -c '…'` goes through the user's login shell (zsh), which expands `$?` before bash sees it.
  - Redirect output to a file inside WSL and `cat` it. Output that comes straight back sometimes loses its first lines.
  - WSL's `/tmp` empties when the distro stops.
- **Port 4321** was taken by another session's dev server, so the preview ran on 4322.

## Next

1. Fold in any feedback from Jd's review of G1 on the preview.
2. **G2: Processes (rest) and Services and logs** (plan §6, tracks 4 and 6):
   - Processes: `processes-basics`, `signals`, `file-descriptors`, `jobs-sessions`. `ports-sockets` is already order 4.
   - Services: `systemd-units`, `journald-logs`, `scheduled-tasks`.
   - Link them from the existing scenarios: `cpu-ram-hog`, `frozen-app`, `stopped-job`, `keep-running`, `system-service`, `watch-log`, `apt-lock`.
   - When `file-descriptors` exists, consider making it the prerequisite of `ports-sockets` in place of `standard-streams`.
3. Commit each phase to `guides/phase-g0` and push. Don't open a PR.

The Vercel MCP can see the project `linux-lab` (`prj_cnWMs93w7sqRbOGlhtYFyGMSK2IF`, team `team_xBpQs3rXzAFbhv1oP80FBIeH`), but listing its deployments returns 403, so this session couldn't confirm the preview URL.
