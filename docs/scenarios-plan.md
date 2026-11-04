# Scenarios expansion plan

**Date:** 2026-11-04
**Goal:** go from 5 scenarios to 35. This covers every scenario in `shellgyan-plan.md` §3.1 plus 12 new ones, and adds the command pages they link to.

## Ground rules (every phase)

- **Format.** Follow the existing scenarios: one file per scenario in `apps/web/src/content/scenarios/<slug>.md`. Frontmatter has `number`, `title`, `quote`, `module`, `severity`, `primaryCommand`, `symptoms`, before/after `zones`, `steps`, `cautions`, `avoid`, `related` and `anatomy`. The body has `## The situation` and `## How it works`. Add `replay` where a terminal replay helps.
- **State panels.** Use the existing `zones` widget. FileTree, PermissionGrid, ProcessTable and the other widgets from plan §3.2 are a separate milestone and out of scope here.
- **Severity.** Use the four real levels: `readonly`, `modifies`, `elevated`, `destructive`. A scenario's `severity` is the most severe step it asks you to run. A step's `kind` must never be milder than what the rule engine says (see Phase 0).
- **Numbering.** Numbers continue from 6 and follow this plan's order.
- **Command pages.** Every command a scenario uses gets a page in `src/content/commands/<name>.yaml`. Each page lists the scenario under `scenarios:`, including existing pages such as `kill.yaml` and `find.yaml`.
- **Cross-links.** Every `related` slug must exist. Link both ways where it makes sense.
- **Distros.** Default to Ubuntu/Debian. Add `dnf`/`pacman` equivalents on command pages where they differ.
- **Definition of done for each phase:**
  1. `pnpm test`, `pnpm check` and `pnpm build` pass, with no `[content]` warnings.
  2. A browser check of each new scenario and command page at desktop width and at 375px: zones, walkthrough, anatomy, replay, related links.
  3. Home and module pages show the new cards, and search finds them by their `symptoms`.
  4. A handoff file in `docs/handoff/`. Then a commit, once you've reviewed the phase.

---

## Phase 0: Content guardrails

Do this first, so that 30 new files can't quietly break things.

- Turn the step-severity check in `src/pages/s/[slug].astro` from `console.warn` into a build failure, or move it into a test that runs over every scenario.
- Fail the build when a `related` or `scenarios` slug, or a command name, doesn't exist.
- Fail the build when two scenarios share a `number`.
- Check that the 5 existing scenarios still build cleanly.
- Clear the existing `[content]` warnings: add command pages for `echo` (moved forward from Phase 1) and `npm`, used by `command-chaining`.

**Done.** The checks live in `apps/web/src/lib/contentChecks.ts`. See `docs/handoff/2026-11-04-scenarios-phase-0.md`.

## Phase 1: Everyday Rescue (6 scenarios)

| # | Slug | Scenario | Severity |
|---|---|---|---|
| 6 | `add-to-path` | Add a folder to PATH permanently | elevated |
| 7 | `command-not-found` | "command not found": where is this program? | readonly |
| 8 | `open-from-terminal` | Open the current folder in the file manager or editor | readonly |
| 9 | `symlink-shortcut` | Make a shortcut with a symlink | modifies |
| 10 | `persistent-alias` | Create a shell alias that sticks | elevated |
| 11 | `extract-archive` | Unpack a .tar.gz / .zip | modifies |

**Already done in Phase 0:** `echo` (add the Phase 1 scenarios that use it to its `scenarios:`).
**New command pages:** `export`, `type`, `command`, `xdg-open`, `ln`, `alias`, `tar`, `unzip`, plus `tr` and `code` (used by the scenarios' steps).
**Existing pages to update:** `which`, `source`.

**Done.** #6 and #10 are elevated: they append to `~/.bashrc` / `~/.bash_aliases`, which run in every new terminal. See `docs/handoff/2026-11-04-scenarios-phase-1.md`.

## Phase 2: Processes & Ports (5 scenarios)

| # | Slug | Scenario | Severity |
|---|---|---|---|
| 12 | `frozen-app` | Frozen app: find and kill it | modifies |
| 13 | `keep-running` | Keep a process running after closing the terminal | modifies |
| 14 | `stopped-job` | Ctrl+Z stopped my program: where did it go? | modifies |
| 15 | `cpu-ram-hog` | What is eating my CPU or RAM? | readonly |
| 16 | `system-service` | Restart or check a system service | elevated |

**New command pages:** `pgrep`, `nohup`, `tmux`, `jobs` (covers `fg`/`bg`), `top`, `htop`, `free`, `systemctl`, `journalctl`, plus `tail` (moved forward from Phase 3) and `head`.
**Existing pages to update:** `ps`, `kill`, `pkill`, `sudo`.

**Done.** See `docs/handoff/2026-11-04-scenarios-phase-2.md`.

## Phase 3: Files & Permissions (6 scenarios)

| # | Slug | Scenario | Severity |
|---|---|---|---|
| 17 | `root-owned-files` | Files owned by root after a stray sudo | elevated |
| 18 | `disk-full` | Find what's eating disk space | readonly |
| 19 | `find-files` | Find files by name or content | readonly |
| 20 | `safe-mv-cp` | Avoid (and recover from) a wrong mv/cp overwrite | modifies |
| 21 | `chmod-numbers` | Read chmod numbers: what 755 and 644 mean | modifies |
| 22 | `watch-log` | Watch a log file live | readonly |

**New command pages:** `sort`, `ncdu`, `rg`, `stat`, `less`.
**Already done in Phase 2:** `tail`, `head` (add the Phase 3 scenarios that use them).
**Existing pages to update:** `chown`, `chmod`, `du`, `df`, `find`, `grep`, `mv`, `cp`, `ls`.

**Done.** `umask` is documented on the `chmod` page. Two rule fixes: bare `umask` is readonly, and `find -exec` with a read-only program (`ls`, `grep`, `stat`…) is readonly. See `docs/handoff/2026-11-04-scenarios-phase-3.md`.

## Phase 4: Packages (4 scenarios)

| # | Slug | Scenario | Severity |
|---|---|---|---|
| 23 | `fix-broken-install` | Fix a broken install | elevated |
| 24 | `remove-package` | Remove a package and its leftovers | elevated |
| 25 | `install-deb` | Install a .deb file | elevated |
| 26 | `which-package` | Which package gives me this command? | readonly |

**New command pages:** `apt-file`, `apt-cache`.
**Existing pages to update:** `apt`, `dpkg`. Add `dnf`/`pacman` equivalents in `distros`.

**Done.** All severities match the plan. Extra page: `readlink` (used in `which-package`). Command pages gained an optional `distrosTitle`, so `apt`, `dpkg`, `apt-file` and `apt-cache` show their `dnf`/`pacman` equivalents under "Same … on other distros" instead of "Install it". Rule fixes: `dpkg --remove`/`--unpack` are elevated like `-r`/`-i`, `apt -s` (simulate) is readonly, and `apt-mark show*` is readonly while other `apt-mark` subcommands are elevated. See `docs/handoff/2026-11-04-scenarios-phase-4.md`.

## Phase 5: Decode Agent Commands, part 1 (5 scenarios)

| # | Slug | Scenario | Severity |
|---|---|---|---|
| 27 | `redirection` | Redirection: `>`, `>>`, `2>&1`, `/dev/null` | modifies |
| 28 | `expansion-quoting` | Expansion and quoting: `$(…)`, `$VAR` vs `"$VAR"` | readonly |
| 29 | `find-exec-xargs` | `find -exec … {} \;` / `+` and `xargs` | destructive |
| 30 | `sed-awk` | `sed -i 's/a/b/g'` and `awk '{print $2}'` | modifies |
| 31 | `heredocs` | Heredocs: `cat <<'EOF' > file` | modifies |

**New command pages:** `xargs`, `sed`, `awk`, `cat`, `tee`.
**Existing pages to update:** `find`.

## Phase 6: Decode Agent Commands, part 2 (4 scenarios)

| # | Slug | Scenario | Severity |
|---|---|---|---|
| 32 | `curl-pipe-bash` | `curl -fsSL … \| bash`: what are you running? | elevated |
| 33 | `agent-cleanup` | `rm -rf node_modules`, `mkdir -p`, `npx` | destructive |
| 34 | `env-vars` | Environment variables and `.env`: `export`, `env`, `VAR=x cmd` | readonly |
| 35 | `exit-codes` | Exit codes: `$?`, `set -e`, `\|\| true` | readonly |

**New command pages:** `bash`, `npx`, `env`, `set`.
**Existing pages to update:** `curl`, `rm`, `mkdir`.

These two phases are closest to what the Explainer does. Add each primary command as an example chip on `/explain` if it isn't one already.

## Phase 7: Final pass

- Read through all 35 scenarios together: consistent tone, no duplicated explanations (link to the other scenario instead), and `related` links that form sensible paths through each module.
- Check the library index: every command has a category and level, and none are orphans with no scenario or related commands.
- Run a full build and a browser spot-check of the home page, every module page, search and a sample of pages at 375px.
- Write a handoff file and deploy to Vercel (with your go-ahead).

---

## Notes

- **Severities are provisional.** Each one gets settled when the scenario is written: Phase 0 makes the build fail if a step is marked milder than the engine's verdict. If the engine gets a verdict wrong (too strict or too lenient), fix the rule in `packages/core` with a test, and don't bend the content to match.
- **Size.** 30 scenarios and about 45 new command pages. Phases 1–6 can each be reviewed on their own.
