# Handoff · 2026-11-04 · Scenarios Phase 3: Files & Permissions (#17–22)

**Task:** Phase 3 of `docs/scenarios-plan.md`: six Files & Permissions scenarios and the command pages they use.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-2.md`, `-phase-1.md` and `-phase-0.md`.

**Status:** Phase 3 is done. `pnpm test` (273 core tests), `pnpm check` (0 errors, 0 warnings; the 2 hints are in `SearchBar.tsx` and `anatomy.ts`, untouched here) and `pnpm build` pass, with zero `[content]` warnings. Not browser-checked. Branch `scenarios/phase-3`, cut from `scenarios/phase-2`. Next is **Phase 4 (Packages, #23–26)**.

## What's built

| # | Scenario | Severity | Primary command |
|---|---|---|---|
| 17 | `root-owned-files` | elevated | `sudo chown -R $USER:$USER node_modules package-lock.json` |
| 18 | `disk-full` | readonly | `du -h -d 1 ~ \| sort -h` |
| 19 | `find-files` | readonly | `find ~ -iname "*invoice*"` |
| 20 | `safe-mv-cp` | modifies | `mv -i draft.md notes/` |
| 21 | `chmod-numbers` | modifies | `chmod 755 deploy.sh` |
| 22 | `watch-log` | readonly | `tail -f logs/app.log` |

All severities match the plan.

**New command pages (5):** `sort`, `ncdu`, `rg`, `stat`, `less`.

**Updated pages:**
- **Back-links and new content:** `chmod` (700, capital `X`, `umask`), `chown`, `du`, `df`, `find` (`-user`, the unquoted-glob gotcha), `grep` (`--exclude-dir`, `-c`, `--line-buffered`), `mv` and `cp` (`--backup`), `ls` and `tail` (`-F` vs `-f`).
- **Back-links only:** `npm`, `journalctl`, `sudo`.
- `head` only gained a `related` link to `sort`, because no Phase 3 step runs it.

**Cross-links:**
- `permission-denied-script` → `chmod-numbers`, `root-owned-files`. It linked only to `appimage-install` before.
- `keep-running` → `watch-log`
- `system-service` → `watch-log`
- `cpu-ram-hog` → `disk-full`
- `persistent-alias` → `safe-mv-cp`

## Rule engine changes (`packages/core`, with tests)

- **`umask` is readonly** (`rules/base.ts`). It wasn't in any list, so it fell through to modifies, even bare `umask`, which only prints the mask. Like `export` and `alias`, it only affects the current shell.
- **`find … -exec` with a read-only program is readonly** (`rules/files.ts`). Before, any `-exec` was modifies, including `find ~ -size +1G -exec ls -lh {} +`. The allowlist is narrow on purpose. It covers `ls`, `stat`, `file`, `cat`, `head`, `tail`, `wc`, `grep`, `rg`, `du`, checksums and the like. Programs that are readonly elsewhere but can write with some flags (`sed -i`, `sort -o`, `awk`) stay modifies under `-exec`. If any `-exec` in the command isn't on the list, the old behaviour applies. Seven new tests in total, covering both changes.

## Checker change

- `COVERED_BY` now maps `umask` → `chmod`, so the `chmod` page documents it and the checker doesn't ask for a separate `umask` page.

## Where outputs came from

Run for real in this container (Ubuntu 24.04, GNU coreutils 9.4). I replaced the scratch paths with `/home/jd`, and the user `root` or `ubuntu` with `jd`. The container runs as root, so anything that needed a normal user's permission checks ran as uid 1000 via `setpriv`, in a throwaway `/tmp/sg3`, now deleted. No user was created.

- **`root-owned-files`:** real. `npm install` as root, then as uid 1000. The EACCES error, `ls -l`, `find . ! -user "$USER"`, the failed `rm -rf node_modules`, `chown`, and the successful retry are all real output. There was no network, so the package was a local one installed with `--install-links`. The step shows `npm install slugify-lite`, and the error text is what npm printed for that package. The real `npm error` stack-trace lines are cut to `…`. The `.git/objects` claim in `avoid` is also real: a root `git add` left `.git/objects/63` owned by root.
- **`disk-full`:** `du`, `sort`, `find -exec ls -lh` and both replay mistakes are real. They ran over a fake home of `fallocate`d files (19G in total, deleted afterwards). **`df -h /` is written from knowledge**, because the container's disk isn't full. I chose its numbers to fit the story: a 48G disk, 46G used, 0 available because of the 5% reserve. **`ncdu`** isn't installed here and wasn't run.
- **`find-files`:** real. That includes the unquoted-glob replay. It also includes the `paths must precede expression` caution, which I checked separately with two matching files. The `rg` step uses the grouped output it prints at a terminal, captured through `script`.
- **`safe-mv-cp`:** real. Covers `mv -i` (answered `n`), `mv -n` → `not replacing`, `--backup=numbered`, `ls` in terminal (column) layout, the `mv report.pdf archive` rename, the trailing-slash error and the `cp -r` nesting. The `git show HEAD:… >` recovery in `avoid` was also run. `rsync --backup` is from knowledge.
- **`chmod-numbers`:** real, run as uid 1000 with umask 002 (Ubuntu's default). This includes the `chmod -R 644 css` lock-out replay and both recursive fixes from the caution (capital `X` and `find -type d/-type f`). The final `stat` step combines lines from the individual runs. The SSH `UNPROTECTED PRIVATE KEY FILE!` message is from knowledge.
- **`watch-log`:** real. A background script wrote fake API log lines, now killed. The `tail -n`, `tail -f`, `tail -f | grep`, `-f` vs `-F` rotation and replay outputs are real, cut to excerpts marked `…`. The claim that grep buffers when it isn't writing to a terminal is real: piped, it printed nothing, while through `script` it printed live. `less +F` was not run (it's interactive). **`journalctl -f -u nginx`** wasn't run because there's no systemd here. Neither step has output.

## Gotchas

- **`rg` with no path, when stdin isn't a terminal, reads stdin and hangs.** I hit this running it in a script. It's a gotcha on the `rg` page.
- **Scratchpad permissions:** the session scratchpad is mode 700 under root, so uid 1000 can't reach it. Use a separate world-traversable dir for `setpriv` runs, and delete it afterwards.
- **`ls -l` prints the year instead of the time** for timestamps "in the future". The container clock was about 08:20, so `touch -d 09:02` showed `2026`. Use times in the past.
- **YAML:** a plain `summary:` containing `: ` fails to parse (`stat.yaml` did). Quote it. `output: |2` with a blank first line works for npm's output.
- Process check at the end: `pgrep -af 'writer\.sh|tail -[fFn]|http\.server|ncdu'` found nothing.

## Not done / worth a look

- **`git` has no command page.** Scenarios mention git only in prose for that reason. A git page would let `safe-mv-cp` show the `git show` recovery as a real step.
- **Inconsistent git verdicts, not touched:** `git restore .` and `git checkout -- file` are modifies, while `git reset --hard` is elevated. All three discard uncommitted work the same way. Out of scope for this phase.
- **`sudo chown -R $USER:$USER ~` comes back destructive.** That's arguably too strict for your own home folder. The scenario avoids it (it chowns only the paths `find` listed), so I left the rule as it is.

## Pages to check on the Vercel preview

Scenarios: `/s/root-owned-files/`, `/s/disk-full/`, `/s/find-files/`, `/s/safe-mv-cp/`, `/s/chmod-numbers/`, `/s/watch-log/`

New commands: `/c/sort/`, `/c/ncdu/`, `/c/rg/`, `/c/stat/`, `/c/less/`

Changed: `/c/chmod/`, `/c/chown/`, `/c/du/`, `/c/df/`, `/c/find/`, `/c/grep/`, `/c/mv/`, `/c/cp/`, `/c/ls/`, `/c/tail/`, `/c/head/`, `/c/npm/`, `/c/journalctl/`, `/c/sudo/`, `/s/permission-denied-script/`, `/s/keep-running/`, `/s/system-service/`, `/s/cpu-ram-hog/`, `/s/persistent-alias/`, `/m/files-permissions/`, home page.

Checked without a browser:
- All six cards are in `dist/index.html` and `dist/m/files-permissions/index.html`.
- Search (the site's Fuse settings over `dist/search.json`) ranks each scenario first for 4 of its symptoms each. Examples: "EACCES permission denied", "No space left on device", "where is my file", "undo mv", "what does 755 mean", "log stopped updating".

## Next: Phase 4

Scenarios #23–26 (`fix-broken-install`, `remove-package`, `install-deb`, `which-package`). New pages: `apt-file`, `apt-cache`. Update `apt` and `dpkg`, and add `dnf`/`pacman` equivalents. Most of it needs `sudo apt`, which changes system state, so expect to write much of the output from knowledge. `apt-cache` and `dpkg -S` are read-only and can run for real.
