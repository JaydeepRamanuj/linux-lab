# Handoff · 2026-11-04 · Scenarios Phase 2: Processes & Ports (#12–16)

**Task:** Phase 2 of `docs/scenarios-plan.md`, plus a new anatomy-key check in the content checker.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-1.md` and `2026-11-04-scenarios-phase-0.md`.

**Status:** Phase 2 is done. `pnpm test` (266 core tests), `pnpm check` (0 errors, 0 warnings) and `pnpm build` pass, with zero `[content]` warnings. Not browser-checked. Next is **Phase 3 (Files & Permissions, #17–22)**.

## What's built

| # | Scenario | Severity | Primary command |
|---|---|---|---|
| 12 | `frozen-app` | modifies | `kill -9 2893` |
| 13 | `keep-running` | modifies | `nohup ./train.sh > train.log 2>&1 &` |
| 14 | `stopped-job` | modifies | `fg` |
| 15 | `cpu-ram-hog` | readonly | `ps aux --sort=-%cpu \| head -4` |
| 16 | `system-service` | elevated | `sudo systemctl restart nginx` |

**New command pages (11):** `pgrep`, `nohup`, `tmux`, `jobs` (covers `fg`/`bg`), `top`, `htop`, `free`, `systemctl`, `journalctl`, plus `tail` (moved forward from Phase 3; `keep-running` uses it) and `head` (`cpu-ram-hog` pipes into it).

**Updated pages:** `ps`, `kill`, `pkill`, `jobs`, `sudo` and `tail` gained back-links and `related` links. `sudo` now lists `apt-lock` and `system-service`. It listed nothing before, because the checker treats `sudo` as a wrapper, not a program.

**Cross-links:** `port-in-use` → `stopped-job`, `frozen-app`. `apt-lock` → `system-service`. It had no related links before.

## Checker changes (`apps/web/src/lib/contentChecks.ts`)

- **New error:** an `anatomy` key that matches no token of the scenario's `primaryCommand`. Proved by adding `"-g"` to `open-from-terminal` (it appears only in a step). The build failed with: `anatomy key "-g" matches no token in primaryCommand (tokens: "xdg-open", ".")`. Then reverted.
- **`COVERED_BY`:** `fg` and `bg` are documented on the `jobs` page, so the checker looks for that page instead of warning that `fg` and `bg` have none.

## Rule engine change (`packages/core`, with tests)

- `tmux kill-session/kill-server/kill-window/kill-pane` is now modifies. Before, all of `tmux` was readonly, but these subcommands end every program running in the session.

## Where outputs came from

Run for real in this container, with the user and home path replaced by `jd` / `/home/jd`:

- **`frozen-app`:** a small C program that ignores SIGTERM, copied to `~/Applications/obsidian` and started four times with Electron-style `--type=` arguments. All `pgrep`/`kill` behaviour is real, including **the helpers surviving `kill -9` of the main process**. The `ps -o` output came from a second identical run, renumbered to PID 2893 to match the other steps.
- **`keep-running`:** real `nohup`, `jobs -l`, `tail`, `tmux ls` output, with a stand-in `train.sh`.
- **`stopped-job`:** a real interactive bash session driven through `script` (to get a terminal): Ctrl+Z, `Address already in use` from the stopped server, `fg`, Ctrl+C, `There are stopped jobs.`, `kill %1` → `Terminated`.
- **`cpu-ram-hog`:** real `free -h`, `ps` and `top -b` output, with two stand-in hog processes named `node build.js` and `/opt/google/chrome/chrome --type=renderer`. I made these changes to the raw output:
  - Removed the container's own processes from the listings.
  - Changed the `head` counts so each command's output is exactly what that count printed.
  - Dropped a leftover size argument (`1500`) from the chrome command line.
  - Changed `root` to `jd`.

  The memory and CPU numbers are untouched. The container has no swap, so `Swap:` shows 0B.

Written from knowledge, not run:

- **`system-service`:** the container has no systemd (PID 1 is the sandbox's init), so the `systemctl` and `journalctl` output comes from how they look on Ubuntu 24.04, not from a run.
- **`nohup.out` message:** taken from GNU coreutils, because my test's output wasn't a terminal, so `nohup` didn't print it.
- **`htop`:** not installed here, so it has no output.

## Gotchas

- **YAML block scalars whose first line starts with spaces** (column headers like `free -h`, `ps -o`, `systemctl --failed`) need `output: |2`. Plain `|` takes its indentation from the first line, and the build fails with a js-yaml error pointing at the scenario.
- **Test processes:** an exited test shell left a stopped `python3 -m http.server` behind, still holding port 8000 (that's the stopped-job scenario's own point). I killed every test process before committing. If you run these scenarios yourself, check `pgrep -af http.server` afterwards.
- `ps` lists itself as the top CPU user in `ps aux --sort=-%cpu`. The scenario says so.

## Pages to check on the Vercel preview

Scenarios: `/s/frozen-app/`, `/s/keep-running/`, `/s/stopped-job/`, `/s/cpu-ram-hog/`, `/s/system-service/`

New commands: `/c/pgrep/`, `/c/nohup/`, `/c/tmux/`, `/c/jobs/`, `/c/top/`, `/c/htop/`, `/c/free/`, `/c/systemctl/`, `/c/journalctl/`, `/c/tail/`, `/c/head/`

Changed: `/c/ps/`, `/c/kill/`, `/c/pkill/`, `/c/sudo/`, `/s/port-in-use/`, `/s/apt-lock/`, `/m/processes-ports/`.

Checked without a browser: all five cards are in `dist/index.html` and `dist/m/processes-ports/index.html`. Search (the site's Fuse settings over `dist/search.json`) finds each scenario by its symptoms ("app frozen", "ssh disconnect kills process", "ctrl+z", "there are stopped jobs", "high cpu", "Active: failed", …).

## Next: Phase 3

Scenarios #17–22 (`root-owned-files`, `disk-full`, `find-files`, `safe-mv-cp`, `chmod-numbers`, `watch-log`). New pages: `sort`, `ncdu`, `rg`, `stat` and `less` (`tail` and `head` already exist). Update `chown`, `chmod`, `du`, `df`, `find`, `grep`, `mv`, `cp`, `ls`, and add the new scenarios to `tail`/`head`.
