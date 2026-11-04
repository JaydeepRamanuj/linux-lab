# Handoff · 2026-11-04 · Scenarios Phase 1: Everyday Rescue (#6–11)

**Task:** Phase 1 of `docs/scenarios-plan.md`: six Everyday Rescue scenarios and the command pages they use.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-0.md` (content checker) and `2026-11-04-m3-explainer.md` (app state).

**Status:** Phase 1 is done. `pnpm test` (257 core tests), `pnpm check` (0 errors, 0 warnings) and `pnpm build` pass, with zero `[content]` warnings. Not browser-checked (no browser preview in this environment). Next is **Phase 2 (Processes & Ports, #12–16)**.

## What's built

| # | Scenario | Severity | Primary command |
|---|---|---|---|
| 6 | `add-to-path` | elevated | `echo 'export PATH="$HOME/go/bin:$PATH"' >> ~/.bashrc` |
| 7 | `command-not-found` | readonly | `type bat` (the `bat` → `batcat` rename on Debian/Ubuntu) |
| 8 | `open-from-terminal` | readonly | `xdg-open .` |
| 9 | `symlink-shortcut` | modifies | `ln -s ~/projects/shellgyan/apps/web ~/web` |
| 10 | `persistent-alias` | elevated | `echo "alias gs='git status'" >> ~/.bash_aliases` |
| 11 | `extract-archive` | modifies | `tar -xzf mytool-2.1.0-linux-x64.tar.gz -C ~/opt` |

**New command pages (10):** `export`, `type`, `command`, `xdg-open`, `ln`, `alias`, `tar`, `unzip`, plus `tr` (used in `echo "$PATH" | tr ':' '\n'`) and `code` (used in `open-from-terminal`).

**Updated pages:** `scenarios:` back-links on `echo`, `ls`, `which`, `grep`, `source`, `dpkg`, `mkdir`, `rm`. New `related` links: `which` → `type`, `command`; `source` → `export`, `alias`; `echo` → `export`, `tr`; `rm` → `ln`.

**Cross-links:** `appimage-install` now links to `extract-archive` and `symlink-shortcut`. `extract-archive` links back to it.

## Rule engine changes (`packages/core`, with tests)

- `~/.bash_aliases` counts as shell config (`rules/files.ts`). Writing to it is now elevated, like `~/.bashrc`, because Ubuntu's `.bashrc` runs it in every terminal.
- `tar -t…` / `tar --list` / `tar tzf` (dashless) and `unzip -l/-v/-Z` are readonly (`rules/base.ts`). They only list the archive. Extracting and creating stay modifies.
- `unalias` is readonly, like `alias` and `unset`. It only affects the current shell.

## Where outputs came from

Run for real in this container (Ubuntu 24.04), in a scratch `HOME`, with the username and home path replaced by `jd` / `/home/jd`:

- `add-to-path`: PATH handling, `which`, the `grep -n` of `.bashrc` (line 118 is real: the stock `/etc/skel/.bashrc` is 117 lines). `gopls` was a stand-in script. The `PATH` listing is Ubuntu desktop's default PATH, not the container's.
- `command-not-found`: the `type` and `which` output (with a stand-in `batcat`).
- `persistent-alias`: the `alias` list and the `grep -n bash_aliases` output, from the stock Ubuntu `.bashrc`. Also checked that the last definition wins.
- `symlink-shortcut`: everything, including the two gotchas below. The link size (36) is the real length of the target path.
- `extract-archive`: everything (archives built for the test).

Written from knowledge, not run:

- `open-from-terminal`: there's no desktop in the container, so `xdg-open` and `code` weren't run. Their normal output is nothing.
- `dpkg -L bat | grep bin/` → `/usr/bin/batcat`. bat isn't installed here, and installing packages would change the system.
- The replays show bash's plain `bat: command not found`. A Ubuntu desktop with the `command-not-found` package prints a longer "Command 'bat' not found, but can be installed with…" message instead.

## Gotchas found while testing

- **`rm -r link/` (trailing slash) deletes the target folder's contents**, then fails with `cannot remove 'link/': Not a directory`, so it looks like nothing happened. This is a danger caution in `symlink-shortcut` and a gotcha on `ln`. The rule engine already rates `rm -r ~/web/` as elevated (a recursive delete of a home-folder path), so no rule change was needed.
- **Running `ln -s target ~/web` a second time** creates `target/web` inside the target folder. This is the `-n` step in `symlink-shortcut`.
- **Anatomy notes only apply to the primary command**, not to step commands. An `anatomy:` key for a token that only appears in a step is silently ignored. The content checker doesn't catch this. Worth adding to it?

## Pages to check on the Vercel preview

Scenarios: `/s/add-to-path/`, `/s/command-not-found/`, `/s/open-from-terminal/`, `/s/symlink-shortcut/`, `/s/persistent-alias/`, `/s/extract-archive/`

New commands: `/c/export/`, `/c/type/`, `/c/command/`, `/c/xdg-open/`, `/c/code/`, `/c/ln/`, `/c/alias/`, `/c/tar/`, `/c/unzip/`, `/c/tr/`

Changed: `/c/echo/`, `/c/which/`, `/c/source/`, `/c/rm/`, `/m/everyday-rescue/`, home page.

Checked without a browser: all six cards are in `dist/index.html` and `dist/m/everyday-rescue/index.html`, and running the site's Fuse settings over `dist/search.json` finds each scenario by its symptoms ("add to path", "batcat", "open in vs code", "remove symlink", "alias disappears", "untar", …).

## Next: Phase 2

Scenarios #12–16 (`frozen-app`, `keep-running`, `stopped-job`, `cpu-ram-hog`, `system-service`). New pages: `pgrep`, `nohup`, `tmux`, `jobs`, `top`, `htop`, `free`, `systemctl`, `journalctl`. Update `ps`, `kill`, `pkill` and `sudo`. `systemctl` and `journalctl` likely won't work in the container (no systemd).
