# Handoff · 2026-11-04 · Scenarios Phase 6: Decode Agent Commands, part 2 (#32–35)

**Task:** Phase 6 of `docs/scenarios-plan.md`: four Decode Agent Commands scenarios and the command pages they use.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-5.md` and the earlier phase handoffs.

**Status:** Phase 6 is done. These all pass:

- `pnpm test`: 364 tests (37 new, none changed).
- `pnpm check`: 0 errors, 0 warnings. The 2 hints are the same old ones in `SearchBar.tsx` and `anatomy.ts`.
- `pnpm build`: 108 pages, zero `[content]` warnings.

**Browser-checked this time** (Playwright against `dist/`, 1280px and 375px): the 4 new scenarios, the 4 new and 3 updated command pages, `/explain/`, `/m/decode-agent-commands/` and `/`. No console errors, no sideways scroll on any of them, after two fixes listed under "Site changes". I looked at screenshots of `curl-pipe-bash` (375), `env-vars` (1280) and `exit-codes` (375).

Work is on branch `scenarios/phase-5` (the branch this session was told to use), on top of the Phase 5 commit. Next is **Phase 7 (final pass)**.

## What's built

| # | Scenario | Severity | Primary command |
|---|---|---|---|
| 32 | `curl-pipe-bash` | elevated | `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh \| bash` |
| 33 | `agent-cleanup` | **modifies** (planned destructive) | `rm -rf node_modules package-lock.json && npm install` |
| 34 | `env-vars` | **modifies** (planned readonly) | `PORT=4000 npm run dev` |
| 35 | `exit-codes` | **modifies** (planned readonly) | `npm test \|\| true` |

**Why three severities moved:**
- **#33:** same reasoning as #29 in Phase 5. Every step deletes only regenerable things (`node_modules`). The destructive case, `rm -rf "$OUT_DIR/"` with an empty variable, is a danger caution, and the replay shows it safely with `echo rm -rf "$OUT_DIR/"` → `rm -rf /`, then `${OUT_DIR:?}` aborting. Making it destructive would mean a step nobody should run.
- **#34 / #35:** the iconic agent forms (`PORT=4000 npm run dev`, `npm test || true`) run project scripts, which the engine correctly rates modifies. Readonly versions were possible (`TZ=Asia/Tokyo date`, `grep -q … || true`) but they don't match what people actually see from agents. If you'd rather have readonly here, swap the primary commands and drop the `npm` steps.

**New command pages (4):** `bash`, `npx`, `env`, `set`.

**Updated pages:**
- **`curl`:** `-o-` explained, a pinned-nvm "download then `bash -n`" example, gotchas for missing `-f` and for rustup's `--proto '=https' --tlsv1.2`. `related: bash`.
- **`rm`:** `echo rm -rf "$OUT_DIR/"` dry-run example; gotcha that `package-lock.json` isn't a generated folder.
- **`mkdir`:** `mkdir -p src/components/ui` example; the real error text without `-p`; gotcha that `-p` silently creates typo folders. `related: npx`.
- **Back-links:** `npm`, `ls`, `du`, `head`, `grep`, `less`, `tail`, `echo`, `export`, `cat`, `source`.
- **`related`:** `npm` → `npx`; `export` → `env`, `set`; `source` → `bash`, `set`.

**Cross-links:** `command-chaining` → `exit-codes`; `redirection` → `exit-codes` (for `| tee` and `PIPESTATUS`); `expansion-quoting` → `env-vars`, `agent-cleanup` (`${VAR:?}`); `add-to-path` → `env-vars`, `curl-pipe-bash`; `heredocs` → `curl-pipe-bash`; `install-deb` → `curl-pipe-bash`. The new four link to each other and back.

**`/explain` chips:** added `PORT=4000 npm run dev` and `npm test || true`. Not added: the nvm one-liner (the existing `curl -fsSL https://example.com/install.sh | bash` chip shows the same pattern) and `rm -rf node_modules package-lock.json && npm install` (the existing `rm -rf node_modules && npm install` chip, which is also the input's placeholder, is nearly identical). Say if you want either.

## Rule engine changes (`packages/core/src/rules/`, tests in `test/rules.test.ts`)

1. **Shells (`base.ts`, new `shellBasis`).** `bash`/`sh`/`zsh`/… used to fall through to "`bash` isn't in ShellGyan's list yet", modifies, whatever they ran. Now:
   - `bash -c '…'` with a literal body is readonly itself, so the verdict comes from the body, which the analyzer already opened up. `bash -ec 'ls missing.txt; echo after'` is readonly; `bash -c "rm -rf /"` is still destructive; `bash -c "$CMD"` is still elevated.
   - `bash -n FILE`, `bash -n < FILE` and `curl … | bash -n` are readonly (syntax check only). `remote.ts`'s pipe-to-shell rule now skips `-n`. `| sudo bash -n` stays elevated through the sudo rule.
   - `bash FILE`, `bash -x FILE` and `bash < FILE` stay modifies, with the message "Runs the script FILE, which can do anything you can. Read it before you run it."
   - Plain `bash` (and `env -i bash`) is readonly: "Starts a new interactive bash".
   - `exit` and `return` are readonly.
2. **Deleting one system file (`files.ts`, `systemFileDelete`).** `rm -f /etc/hosts` was modifies. Non-recursive `rm` now mirrors `writeTargetHit`: apt drop-ins (`/etc/apt/sources.list.d/*`, `keyrings/*`, …) elevated; anything else under `/etc` or `/boot` destructive; `~/.bashrc` and the other shell configs elevated; `/usr`, `/opt`, `/var`, `/bin`, … elevated. `/tmp/x` and project files stay modifies. Found by running the NodeSource installer's text through the engine.
3. **`gpg -o FILE` (`files.ts`).** `gpg --dearmor -o /usr/share/keyrings/x.gpg` was readonly. The `sort -o` rule is now `outputOption` and covers `gpg`/`gpg2` too (`-o F`, `-oF`, `--output F`, `--output=F`), through the same write-target check. `gpg -d file` and `gpg --list-keys` stay readonly.

Left alone, worth a look:
- **`git clean -n`** (dry run) is modifies. Easy fix, but no scenario uses `git` and there's no `git` page.
- **`rm /etc/apt/sources.list`** says "may not boot, log in or reach the network". The verdict (destructive) matches overwriting it; the wording is a stretch for that file. Same as Phase 5's note about the overwrite message.
- The NodeSource script, pasted whole into the engine, comes out elevated, as the handoff predicted, with the apt drop-in messages on each `tee`.

## Site changes

- **Anatomy chips wrap** (`components/anatomy/Anatomy.tsx`: `max-w-full break-all text-left`). The nvm URL token made `/s/curl-pipe-bash/` scroll 14px sideways at 375px.
- **`Prose` renders ``` `` … `` ``` spans** (`components/ui/ui.tsx`), as Markdown does, for code containing a backtick. **This was a live Phase 5 bug:** the `expansion-quoting` avoid line "Backticks (``` `` `cmd` `` ```)" rendered as broken, empty code boxes. I hit the same thing in `env-vars` and reworded that one (`API_KEY=$(curl …)`), then fixed the renderer for the Phase 5 line.

## Where outputs came from

Everything ran in a throwaway `/tmp/sg6` with `HOME=/tmp/sg6/home/jd`, `USER=jd`, its own npm cache and an empty npm global prefix, and `PATH` without the container's `/opt/node22/bin` (which has a global `tsc`). `/home/jd` replaces the real path. Node 22.23.4, npm 10.9.9. `/tmp/sg6` is deleted.

- **`curl-pipe-bash`:** only `raw.githubusercontent.com` is reachable through the proxy (deb.nodesource.com, bun.sh, astral.sh, get.pnpm.io, sh.rustup.rs are not).
  - **Real:** the nvm v0.40.1 download, `head -n 5`, the `grep -nE` output, `bash -n` (no output), "495 lines" in the zone.
  - **Not run:** `bash install.sh`. **The permission classifier blocked running the downloaded script**, which is fair. The two `=> …` messages in that step's note are quoted from the script's own `nvm_echo` lines, and the `tail -n 4 ~/.bashrc` output was produced by `printf`-ing the script's literal `SOURCE_STR` and `COMPLETION_STR` (lines 425–428) onto a copy of `/etc/skel/.bashrc`. "`command -v nvm` prints `nvm`" is from knowledge.
  - **Replay:** the NodeSource `setup_22.x` text is the copy in `github.com/nodesource/distributions` (`scripts/deb/setup_22.x`), fetched from raw.githubusercontent.com, because deb.nodesource.com was blocked. The replay shows the `deb.nodesource.com` URL users actually copy. The grep outputs are real against the GitHub copy. The danger caution's summary (repo, signing key, two pin files, `apt update`) comes from reading it.
- **`agent-cleanup`:** real. A stand-in `shop` project with `express` (68 packages, 4.5M). `ls` (through `script`, `COLUMNS=80`; I turned a tab into spaces), `du -sh`, `rm -rf`, `npm ci`, the `mkdir` error, the `npx tsc --noEmit` prompt answered `n` (through `script`, with timed input), `npm install --save-dev typescript` (it resolved TypeScript 7.0.2; "added 2 packages"), `ls node_modules/.bin`.
  - "This is not the tsc command you are looking for" is from the `tsc@2.0.4` package source (`npm pack`, read, not run).
  - Replay: `echo rm -rf "$OUT_DIR/"` → `rm -rf /` is real. The `${OUT_DIR:?}` message was captured non-interactively (`bash: line 1: …`) and is shown without `line 1:`, as an interactive shell prints it.
- **`env-vars`:** real. `echo`, `npm run dev` with and without `PORT`, the two `bash -c` child checks, `env | grep`, `cat .env`, `set -a; source .env; set +a` then `npm run dev` on 4000, `node --env-file`. The `.env` secrets are fake. The replay's `export $(cat .env | xargs)` → `APP_NAME=[My]` and the `#` comment error are real. **Edit:** the error is ``export: `#': not a valid identifier``; the caution writes `'#'` to avoid a backtick in inline code.
- **`exit-codes`:** real. Every step's output, the replay (with and without `pipefail`), and the 126/127 codes. 130 and 137 are from knowledge. The `npm test` stand-in is Phase 5's `test.js`.

## Checks

- All four cards are in `dist/index.html` and `dist/m/decode-agent-commands/index.html` (35 scenarios now). Both new chips show on `/explain/`.
- Search (the site's Fuse settings over `dist/search.json`) ranks each new scenario **first** for all 28 queries I tried, for example: "is curl bash safe", "sudo -E bash -", "rm -rf node_modules", "Ok to proceed? (y)", "npx tsc", ".env file not loaded", "not a valid identifier", "what does || true mean", "exit code 127", "grep returns 1".

## Gotchas

- **YAML:** `stateLabels: [curl … | bash, Download, read, then run]` parsed as four labels. Quote labels with commas. `command: echo "PORT is: $PORT"` failed on `: `, so it's single-quoted.
- **Anatomy keys** are single tokens: `npm test` fails the build, `test` works.
- **`pkill -f "http.server 4329"` killed my own shell**, because the pattern was in the shell's command line. Use `ss -ltnp` to find the PID instead.
- Process check at the end: no `http.server`, `node server.js` or astro processes left, and no scratch screenshots in the repo.

## Pages to check on the Vercel preview

Scenarios: `/s/curl-pipe-bash/` (anatomy chip wrapping at 375px), `/s/agent-cleanup/`, `/s/env-vars/`, `/s/exit-codes/`

New commands: `/c/bash/`, `/c/npx/`, `/c/env/`, `/c/set/`

Changed: `/c/curl/`, `/c/rm/`, `/c/mkdir/`, `/c/npm/`, `/c/export/`, `/c/source/`; `/s/expansion-quoting/` (the backticks avoid line now renders), `/s/command-chaining/`, `/s/redirection/`, `/s/add-to-path/`, `/s/heredocs/`, `/s/install-deb/`; `/explain/` (2 new chips).

## Next: Phase 7

The final pass in the plan: read all 35 together for tone and duplication, check the library index for orphans, a full browser spot-check, a handoff, and a Vercel deploy with your go-ahead. The Playwright script used here is easy to rerun over every page: serve `apps/web/dist` with `python3 -m http.server`, then for each URL check `document.documentElement.scrollWidth - innerWidth` and console errors at 1280 and 375.
