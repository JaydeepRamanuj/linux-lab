# Handoff · 2026-11-04 · Scenarios Phase 5: Decode Agent Commands, part 1 (#27–31)

**Task:** Phase 5 of `docs/scenarios-plan.md`: five Decode Agent Commands scenarios and the command pages they use.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-4.md` and the earlier phase handoffs.

**Status:** Phase 5 is done. These all pass:

- `pnpm test`: 327 tests (34 new, 1 changed).
- `pnpm check`: 0 errors and 0 warnings. The 2 hints are the same old ones in `SearchBar.tsx` and `anatomy.ts`.
- `pnpm build`: 100 pages, zero `[content] scenario` / `[content] command` warnings.

Not browser-checked. Branch `scenarios/phase-5`, cut from `origin/scenarios/phase-4`. Next is **Phase 6 (Decode Agent Commands part 2, #32–35)**.

## What's built

| # | Scenario | Severity | Primary command |
|---|---|---|---|
| 27 | `redirection` | modifies | `npm test > test.log 2>&1` |
| 28 | `expansion-quoting` | readonly | `cat "$file"` |
| 29 | `find-exec-xargs` | **modifies** (planned destructive) | `find . -name "*.orig" -exec rm {} +` |
| 30 | `sed-awk` | modifies | `sed -i 's/localhost:5432/db:5432/g' .env` |
| 31 | `heredocs` | modifies | `cat <<'EOF' > .env.example` … `EOF` (multi-line) |

**#29 is modifies, not destructive.** Each step deletes only the `.orig` files that `find . -name "*.orig"` listed inside the project. The engine rates that the same as `rm` on those files, and I agree with it. The destructive-looking form, `find . -delete -name …` (which deletes everything), is a danger caution. It isn't a step, because the scenario never asks you to run it. The engine now rates that form elevated (see below). If you want #29 to be destructive, that means adding a step the user shouldn't run. I'd rather not.

**New command pages (5):** `cat`, `tee`, `xargs`, `sed`, `awk`. `awk` has a `distrosTitle` of "Get GNU awk" (Ubuntu's `awk` is mawk).

**Updated pages:**
- **`find`:** separate `-exec … \;`, `-exec … +` and `-ok` flags; dry-run and `-print0 | xargs -0` examples; gotchas for `| xargs rm` with spaces and for a missing `\;`.
- **`sort`:** a `sort -o names.txt names.txt` example, and `related: awk`.
- **Back-links:** `echo`, `ls`, `npm`, `grep`, `rm`, `which`, `readlink`. `which` and `readlink` are needed because `$(readlink -f "$(which awk)")` runs inside steps of #28 and #31.
- **`related`:** `grep` → `sed`/`awk`/`xargs`; `rm` → `find`/`xargs`; `echo` → `cat`/`tee`; `tail` → `tee`; `tr` → `sed`.

**Cross-links:** `command-chaining` → `redirection`, `expansion-quoting`; `find-files` → `find-exec-xargs`; `watch-log` → `sed-awk`. The five new scenarios link to each other and back to those three.

**`/explain` chips:** I added `npm test > test.log 2>&1`, `cat "$file"`, the `sed -i` line and the heredoc. I didn't add `find . -name "*.orig" -exec rm {} +`, because the existing `find . -name "*.log" -mtime +7 -exec rm {} \;` chip shows the same pattern. Say if you want it anyway.

## Rule engine changes (`packages/core/src/rules/files.ts`, with tests in `test/rules.test.ts`)

I checked every command you listed with `pnpm explain`. These were already right, so I left them alone:

- `xargs rm`: modifies, with "list not visible". `xargs rm -r` is elevated.
- `find … -exec rm {} +` / `\;` and `find … -delete`: modifies under `.`, destructive under `~` or `/`.
- `sed -i` / `-i.bak`: modifies. Outside the project it's elevated.
- `awk '{print $2}'`: readonly.
- `tee`: modifies.
- `cat <<'EOF' > file`: modifies, and elevated into `~/.bashrc`.
- `>` and `>>` into existing files: modifies.

These verdicts were wrong, and I fixed them:

1. **`find` with no test before the delete** (`find . -delete`, `find . -delete -name "*.tmp"`, `find . -exec rm {} +`) was modifies. Every file under the start folder matches, so it's `rm -r` of that folder. It now gets the same verdict as `rm -r`:
   - elevated for `.`, `..` and paths outside the project, with a message saying the tests must come first;
   - modifies for a project subfolder (`find build -delete`);
   - destructive for `~` and `/`, as before.

   "Test" means a filter such as `-name`, `-type`, `-mtime`, `-size` or `-user`. `-maxdepth`, `-print` and parentheses don't count. **One existing test changed:** `find . -exec ls {} + -exec rm {} +` went from modifies to elevated. It does delete every file under `.`.
2. **`sort -o FILE`** was readonly. It now goes through the same write-target check as `>`, so `sort -o ~/.bashrc …` is elevated. This covers `-o F`, `-oF`, `-uo F` and `--output=F`.
3. **awk that writes or runs things** was readonly. These forms are now caught (new rule `awk-writes`):
   - `print > "f"` and `print >> "f"` get the same verdict as `>` to that file, so `> "/etc/hosts"` is destructive and `> "/dev/stderr"` is harmless. A computed file name is modifies.
   - `system(…)`, `print | "cmd"`, `"cmd" | getline` and `-f script.awk` are modifies.

   String contents are blanked out before matching, so `print "a -> b"` stays readonly, and so do comparisons outside `print` (`$3 > 100 {print $1}`). Phase 3's choice to keep `awk` modifies under `find -exec` stands.
4. **A drop-in apt file under `/etc/apt/`** (`sources.list.d/*`, `keyrings/*`, `preferences.d/*`, `trusted.gpg.d/*`) was destructive, with the message "can stop the machine from booting or logging in". That isn't true of an apt source. It's now elevated: "changes where apt installs software from and which signing keys it trusts". An existing test deliberately keeps replacing `/etc/apt/sources.list` destructive, so that stays, and so do `ubuntu.sources`/`debian.sources` and `apt.conf.d/*`. This matters for `sudo tee` in #31's caution, and for Phase 6's `curl | bash` installers that add repos.

Left alone, worth a look:
- **sed's own write commands** (`s/a/b/w out.txt`, `sed 'w file'`, and GNU `e`) are still readonly. They're rare, and hard to tell apart from ordinary scripts without a sed parser.
- **`sed -i '' 's/a/b/' f`**, the macOS form, reports "Edits s/a/b in place" as well as `f`. GNU sed really does treat `''` as the script and fails, which is now a gotcha in the content. The verdict (modifies) is right; only the message is odd.

## Site changes for multi-line commands

The heredoc is the first multi-line `primaryCommand`, and it exposed two problems:

- **The command well at desktop width used `sm:whitespace-nowrap`.** That would have joined the heredoc into one line. `CommandWell` (`components/ui/ui.tsx`) now uses `whitespace-pre` for commands that contain a newline, top-aligned and scrolling sideways. Single-line commands are unchanged.
- **A one-row preview was needed.** I added `commandPreview()` in `ui.tsx`: the first line plus ` …`. It's used on scenario cards, home Quick reference chips, `/explain` chips, search result rows and the scenario meta description. Copy buttons still copy the full command.

Step commands already used `whitespace-pre-wrap`, so multi-line steps were fine. Anatomy tokens for the heredoc are `cat`, `<<`, `>` and `.env.example`. The body and `'EOF'` aren't tokens, so the anatomy key is `<<`, not `<<'EOF'`.

## Where outputs came from

Everything ran for real in a throwaway `/tmp/sg5`, with `HOME=/tmp/sg5/home/jd` and `USER=jd`. The container runs Ubuntu 24.04, bash 5.2.21, GNU sed 4.9, findutils 4.9.0, mawk 1.3.4 and npm 10.9. I replaced `/tmp/sg5/home/jd` with `/home/jd`. `/tmp/sg5` is deleted. Nothing outside it was written. Every `rm`, `sed -i`, `>` and `find -delete` ran inside it.

- **`redirection`:** real. The "tests" are a stand-in `test.js` (`npm test` → `node test.js`) that prints three lines to stdout and two to stderr, then exits 1. npm's `> shop@1.0.0 test` header is real. That covers the `ls` stdout/stderr split, `>`, `>>`, `2>&1`, `2>/dev/null`, `| tee`, the wrong-order `2>&1 > file` replay, the `sort notes.txt > notes.txt` → empty file caution, and the `noclobber` message (captured interactively through `script`, so it has no `line 1:` prefix).
  - **Edits:** the `>` / `>>` step shows a `&&` chain. I ran the three commands separately, and the output is the same.
  - The replay drops the blank lines from `cat test.log`.
- **`expansion-quoting`:** real. `echo $HOME`, single vs double quotes, `$(readlink -f "$(which awk)")` → `/usr/bin/mawk`, the `cat $file` split errors, the braces example, globbing, both loops in the replay, `"Cost: $5"`, and `${BUILD_DIR:?}` aborting (`parameter null or not set`). I used awk for the `$(…)` example because `which python3` points to `/usr/local/bin/python3.13` on this container, which isn't what a desktop has. `mawk` behind `/usr/bin/awk` is what Ubuntu desktops have too (see Phase 4).
- **`find-exec-xargs`:** real. The `find` listing order is the container filesystem's. The `-exec echo` dry runs, the `-exec rm {} +` and `-delete` runs, the plain-pipe `xargs rm` split errors, the `rm: missing operand` on an empty list, `-r`, and `xargs -0 grep -l` are all real output. The `find . -delete -name "*.orig"` danger was run in a separate scratch folder and emptied it. The `old notes` / `old` claim was checked: `old` was deleted. `xargs -p` needs a terminal, wasn't captured, and isn't shown.
- **`sed-awk`:** real. That covers `grep -n`, the preview, `-i.bak`, the `grep` of `.env` and `.env.bak`, `g` vs no `g`, all three awk steps, and the replay where the broad `s/localhost/db/g` over `src` breaks `API_URL`. These caution and gotcha messages were also run:
  - the `.` regex turning `100` into `2.0`;
  - `unknown option to s` for `s/usr/local/opt/`;
  - `sed -i ''` → `can't read s/localhost/db/g`;
  - `awk: not an option: -i`.
  - **Edit:** `unknown option to `s'` is paraphrased as `unknown option to s` in the avoid text, because of the backtick.
- **`heredocs`:** real. That covers the quoted and unquoted heredocs, `>>`, `tee <<'EOF'`, the unquoted-backticks replay (which really ran `npm test` and wrote its stdout into README.md), `<<-` with tabs, and the indented-`EOF` warning (interactive, through `script`, ended with Ctrl+D). The `sudo cat <<'EOF' > …` → `bash: …: Permission denied` claim was run as uid 1000 against a root-owned folder in `/tmp/sg5`. Bash fails on the redirect before `sudo` starts, so this needed no working sudo.
  - **Edit:** the replay's `> ` continuation prompts come from a separate interactive run of the same command. The backticks run itself was non-interactive.
  - **Edit:** the warning's real text ends ``(wanted `EOF')``. The caution writes `(wanted 'EOF')` to avoid a backtick inside inline code.

Nothing is written from knowledge except prose claims, such as `&>` being bash's short form, `ssh server <<'EOF'`, and `-ok` asking per file. I ran `-ok`, but its piped output isn't shown.

## Checks without a browser

- All five cards are in `dist/index.html` (31 scenarios now) and `dist/m/decode-agent-commands/index.html`, as `href="/s/<slug>"`. All five new command pages build.
- The heredoc page's well has `sm:whitespace-pre`. Its card, Quick reference chip and meta description show `cat <<'EOF' > .env.example …`.
- Search (the site's Fuse settings over `dist/search.json`) ranks each new scenario **first** for every symptom I tried, 33 queries in all. Examples:
  - `redirection`: "what does 2>&1 mean", "/dev/null", "hide errors", "file is empty after sort".
  - `expansion-quoting`: "quote variables", "single vs double quotes", "file name with spaces", "word splitting".
  - `find-exec-xargs`: "find -exec", "xargs", "what does {} mean", "rm: missing operand".
  - `sed-awk`: "sed -i", "awk print column", "backup before sed".
  - `heredocs`: "heredoc", "cat EOF", "here-document delimited by end-of-file", "sudo cat > file permission denied".

## Gotchas

- **YAML:** `command: echo "Home: $HOME" && echo 'Home: $HOME'` failed to parse: a plain value containing `: `. It's single-quoted now, with `''` for the inner single quotes. Multi-line step commands use `|-`, so there's no trailing newline.
- **Anatomy on a heredoc:** the tokens are `cat`, `<<`, `>` and the file. Keys like `<<'EOF'` fail the build.
- **Interactive captures:** `script -qc "bash --norc -i"` fed from a pipe hung once on an unfinished heredoc, because it waited for `EOF` forever. Feed it with timed input and `timeout`. I killed the stuck one.
- Process check at the end: no `script`, `bash --norc`, `node test.js` or astro processes left.

## Pages to check on the Vercel preview

Scenarios: `/s/redirection/`, `/s/expansion-quoting/`, `/s/find-exec-xargs/`, `/s/sed-awk/`, `/s/heredocs/` (check the multi-line well at desktop width and at 375px)

New commands: `/c/cat/`, `/c/tee/`, `/c/xargs/`, `/c/sed/`, `/c/awk/`

Changed:
- Command pages: `/c/find/`, `/c/sort/`, `/c/echo/`, `/c/grep/`, `/c/rm/`, `/c/ls/`, `/c/npm/`, `/c/which/`, `/c/readlink/`, `/c/tail/`, `/c/tr/`.
- Scenarios: `/s/command-chaining/`, `/s/find-files/`, `/s/watch-log/`.
- Also `/m/decode-agent-commands/`, the home page (cards and Quick reference) and `/explain/` (4 new chips, and the heredoc chip's preview).

## Next: Phase 6

Scenarios #32–35 (`curl-pipe-bash`, `agent-cleanup`, `env-vars`, `exit-codes`). New pages: `bash`, `npx`, `env`, `set`. Update `curl`, `rm` and `mkdir`. Phase 6 also adds primary commands as `/explain` chips.
- `curl-pipe-bash` will meet the new apt drop-in rule.
- `exit-codes` can link back to `redirection` for `| tee` and `PIPESTATUS`.
- `expansion-quoting` already covers `${VAR:?}`, so `agent-cleanup` can link to it instead of re-explaining.
