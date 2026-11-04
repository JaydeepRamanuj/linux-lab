# Handoff · 2026-11-04 · Scenarios Phase 7: final pass

**Task:** Phase 7 of `docs/scenarios-plan.md`: read the 35 scenarios as a set, check the library for orphans, run a full build and browser check, and write this handoff. The Vercel deploy waits for your go-ahead.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-6.md`.

**Status:** the pass is done. These all pass:

- `pnpm test`: 364 tests (none new).
- `pnpm check`: 0 errors, 0 warnings, the same 2 old hints.
- `pnpm build`: 108 pages, zero `[content]` warnings.
- **Browser:** every built page (107 URLs) loaded in Playwright at 1280px and at 375px. On every page: HTTP 200, no console errors, no sideways scroll, no empty code spans, and no internal links to missing pages. The search box (desktop) puts the right scenario first for "port already in use", "exit code 127", "unpack tar", "chmod 755", "rm -rf node_modules" and "curl bash safe".

**Not done: the deploy.** The plan says to deploy to Vercel with your go-ahead, and I haven't had it. Work is on branch `scenarios/phase-5` (the branch this session was told to use), on top of the Phase 6 commit.

## What I checked, and what I found

### The link graph

A script over all 35 scenarios and 63 command pages counted each one's inbound and outbound `related` links, and which links go one way only.

- **`open-from-terminal` (#8) had no inbound links.** Nothing pointed to it. Now `symlink-shortcut` and `command-not-found` do.
- **`update-desktop-database` had no inbound command link.** Now `xdg-open` links to it, and it links back.
- **One-way links are fine as they are.** Most go from a specific scenario to a broader one (`sed-awk` → `find-files`, `agent-cleanup` → `disk-full`), which is the useful direction. Every scenario has at least two outbound links, and every module's scenarios link mostly within the module and out to the neighbouring one.
- `apt-cache` and `command` are used by no scenario, but each has three inbound and three outbound `related` links. That isn't an orphan by the plan's definition, so I left them.

### The library index

All 63 commands have a category and a level. The schema requires both, and the build would fail without them. Spread: `shell` 12, `files` 12, `text` 10, `processes` 9, `packages` 6, `system` 6, `disk` 3, `networking` 3, `permissions` 2. Levels: 40 everyday, 23 intermediate, none advanced.

### Duplicated explanations

I grepped for the topics most likely to be explained twice (`${VAR:?}`, `|| true`, `set -e`, `$?`, `2>&1`, `-print0`, `source ~/.bashrc`, `kill -9`, `readlink -f`, "no spaces around `=`"). Most repeats are one line in context, which is fine. Two were real overlaps, and now point to the scenario that owns the topic:

- `command-chaining` had two avoid lines on `echo $?` and `set -e`. They're one line now, pointing to the exit codes scenario.
- `agent-cleanup`'s danger caution now points to expansion and quoting for why `${OUT_DIR:?}` works.

`frozen-app` and `port-in-use` both explain SIGKILL in a sentence. Each needs it where it is, so I left both.

### A wrong command in two places

`port-in-use` suggested `kill $(lsof -t -i :3000)`, and so did the `kill` page. **`lsof -i :3000` lists clients connected to the port as well as the server**, so that kills a browser tab or test runner talking to the dev server too. I checked this for real: with a Node server and one client on port 3000, `lsof -t -i :3000` printed both PIDs, and `lsof -t -i :3000 -sTCP:LISTEN` printed only the server's.

- Both places now use `-sTCP:LISTEN`.
- `port-in-use` had no cautions at all. It now has one about the `ESTABLISHED` lines.
- The `lsof` page gained the `-sTCP:LISTEN` flag and a gotcha.

### Tone and style

- **Titles:** #1–31 use Title Case. The four I wrote in Phase 6 had slipped into sentence case, and now match. Command page titles are all sentence case, consistently.
- **Spelling:** consistently British in prose (`recognise`, `colour`). The `color` hits are flags like `--color=auto`.
- No em dashes, and no filler words like "simply", "easily" or "just run".
- Every scenario has `## The situation` and `## How it works`, symptoms, cautions (now including #2), avoid tips, related links and anatomy notes. Only `open-from-terminal` has no replay, which is optional.
- I didn't rewrite the early scenarios (#1–5) to match the later ones' length. They're shorter (100–150 words of body text against about 200), but complete and in the same voice.

### Seven command pages scrolled sideways on phones

The first full pass found 7 command pages wider than a 375px screen: `awk` (134px), `apt-file` (56px), `rg` (17px), and `apt`, `apt-cache`, `dpkg` and `unzip` (1px each). Earlier phases only browser-checked their own pages, so this had been live for a while.

The cause was the example command wells. A long single-line example (`awk '…' logs/app.log`, `apt-file search --regexp 'bin/convert$'`) set the width of its flex container instead of scrolling inside it. `CommandWell` (`components/ui/ui.tsx`) now has `min-w-0 max-w-full`, and the distro wells on command pages get `min-w-0` (`pages/c/[slug].astro`). Long examples now scroll inside their own box, as the scenario wells already did. The rerun found no overflow on any page.

## Changes in this pass

- Content: `port-in-use`, `command-chaining`, `agent-cleanup`, `symlink-shortcut`, `command-not-found`, and the titles of #32–35.
- Command pages: `kill`, `lsof`, `xdg-open`, `update-desktop-database`.
- Site: the `CommandWell` width fix above (`components/ui/ui.tsx`, `pages/c/[slug].astro`). No engine changes.

## Still open (from earlier handoffs, not fixed here)

- `git clean -n` is rated modifies, but it's a dry run (Phase 6).
- sed's own write commands (`s/a/b/w file`, `e`) are rated readonly (Phase 5).
- `dpkg-deb -I/-c` is rated modifies, and `apt-get check` elevated, though both only read (Phase 4).
- The "may not boot" wording for overwriting or deleting `/etc/apt/sources.list` is a stretch (Phases 5 and 6).

## Deploy

When you're ready, say so and I'll deploy the branch to Vercel. Before production, check on the preview:

- `/`, every `/m/<module>/`, the search box, and `/library/`;
- the four Phase 6 scenarios;
- `/s/port-in-use/` (the new caution) and `/s/expansion-quoting/` (the backticks line fixed in Phase 6).
