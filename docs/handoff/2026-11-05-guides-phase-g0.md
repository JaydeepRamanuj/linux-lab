# Handoff · 2026-11-05 · Guides Phase G0: foundation and three pilot guides

**Task:** Phase G0 of `docs/guides-plan.md`. Add the guides pillar (collection, tracks, routes, widgets, build checks, search) and the three pilot guides, then stop for review of tone, depth and widget use before writing more.

Read `docs/guides-plan.md` first, then this file. The scenarios work it builds on is in `2026-11-04-scenarios-phase-7.md`.

**Status:** G0 is built. Nothing is committed yet. Everything below passes:

- `pnpm test`: 364 tests (none new; the guide checks run in the build, like the scenario checks).
- `pnpm check`: 0 errors, 0 warnings, the same 2 old hints.
- `pnpm build`: 120 pages (108 before, plus 3 guides, `/learn` and 8 track pages), zero `[content]` warnings.
- **Browser** (dev server, 1280px and 375px): the 3 guides, `/learn`, 3 track pages (one empty), home, `/library`, `/explain`, 4 scenarios and 3 command pages. Every page returns 200 and none scrolls sideways at 375px. "Under the hood" is collapsed by default and opens. Flow steps through (Step through, Next ×2 → "3 / 8", the other stages dimmed). The search dropdown shows a Guides group.

## Decisions (your answers to §9, and mine)

- **MDX:** yes. `@astrojs/mdx@5.0.6`, not the latest 8.x: 8.x needs Astro 7, and 6.x needs the new `markdown-satteri` processor. 5.x is the line for Astro 6.
- **Flow:** steppable from the start. All stages and details show by default, which is also what renders without JavaScript. "Step through" focuses one stage, with Prev/Next, a counter and "Show all". Clicking a stage title jumps to it.
- **Tagline:** "Fix it, look it up, understand it." It lives only in `src/data/site.ts` (`TAGLINE`), which the page title, the home hero pill and the footer read, so changing it later is one line.
- **G0 only.** Stopped here for your review, as the plan says.
- **§9.3 (SSH module) and §9.5 (sandbox concept tabs → guide links)** are still open. Neither blocks G1.

## What was built

### Content model

- `guides` collection in `content.config.ts`, exactly the plan's §4.1 schema (`url` uses zod 4's `z.url()`). Files are `src/content/guides/<slug>.mdx`.
- `concepts: string[]` on scenarios and commands.
- `src/data/tracks.ts`: the 8 tracks from §6. A new `cyan` accent and 7 track icons are in `lib/theme.ts`.
- **Cross-links can be declared on either side.** A guide's `scenarios`/`commands`, or a scenario's/command's `concepts`. Every page shows the union (`lib/guides.ts`), so a link written once shows up at both ends. I used `concepts` on the scenario and command side for most links, so the scenario files say what they rely on.

### Pages

- `/learn`: all 8 tracks, with the published guides under each. Tracks without guides are dimmed: "Guides for this track are on the way".
- `/learn/[track]`: all 8 exist, including empty ones, so links from `/learn` never 404.
- `/g/[slug]`: a hero (track, level, minutes, "Read first" prerequisites), then the MDX body, **See it on your machine**, **Common misconceptions**, **Where this shows up**, **References**, and Previous/Next within the track.
- **Scenario pages** get a **Why this works** card after the replay. **Command pages** get **Concepts behind this command** before the related links.
- **Header:** Scenarios, Library, **Learn**, Explain. It fits at 375px.
- **Home:** three entry points under the hero (*Fix something* → `#modules`, *Look up a command* → `/library`, *Understand the system* → `/learn`). The old bottom row had a Library card, which the new entry point duplicates, and a "Command explainer **soon**" card, although `/explain` has been live since M3. Both are replaced by one live Explainer card.

### Widgets (`components/widgets/`, MDX wrappers in `components/guide/`)

- **Flow** (`Flow.tsx`): hydrated with `client:visible` through `guide/Flow.astro`. A client directive can't go on a component passed through MDX's `components` map, so the wrapper holds it.
- **Layers** (`Layers.tsx`): static, so no JavaScript ships for it. Layers have tones (user, kernel, hardware), chips and `edge` labels on the boundaries. A rail with dots and a line marks the highlighted path.
- **Zones** (existing) gets a framed MDX wrapper, `guide/Zones.astro`.
- The guide page passes `{ Flow, Layers, Zones }` to `<Content components>`, so `.mdx` files need no imports.

### "Under the hood" collapse

`lib/rehypeUnderTheHood.ts` moves everything from `## Under the hood` to the next H2 (or the end) into `<details class="deeper">`, with the H2 in its `<summary>`. It works without JS. It's registered on `mdx()` only, so scenarios are untouched.

### Build checks (`lib/contentChecks.ts`, errors unless noted)

- Two guides in a track share an `order`.
- A guide's `prerequisites`, `commands` or `scenarios` entry doesn't exist (drafts count as missing).
- A scenario's or command's `concepts` slug isn't a published guide.
- An `observe` command rates above `readonly`.
- The body's H2s aren't exactly `## The mental model` then `## Under the hood`, ignoring fenced code.
- The body links to a `/s/`, `/g/` or `/c/` page that doesn't exist. The plan didn't ask for this one; guide bodies link a lot.
- **Warning:** no scenario or command page links to the guide (DoD #3).

I checked these with a throwaway broken guide: one build reported all 6 error types, and the file is deleted. The `concepts` check wasn't part of that test; it follows the same pattern as the scenario `related` check.

### Search

Guides are indexed with `title`, `summary` (subtitle), misconceptions (myth and reality) and `observe` commands as tags. The dropdown shows the track name as the badge and the summary in place of a command. Spot checks: "press enter", "socket", "umask" and "address already in use" find the right guide in the top two. Body text isn't indexed, so "fork exec" ranks the Enter guide second and "sticky bit" finds nothing. Adding the body's H3s or bold terms as tags would help if that matters.

## The three pilots

| Guide | Track | Widgets | Linked from |
|---|---|---|---|
| `permissions-model` | Permissions, order 1 | Zones (the 9 bits), Flow (the check) | `permission-denied-script`, `chmod-numbers`, `root-owned-files`, `appimage-install`; `chmod`, `chown`, `stat` |
| `ports-sockets` | Processes, order 4 | Layers (process → socket table → TCP/IP → interfaces) | `port-in-use`; `lsof`, `ss`, `kill` |
| `pressing-enter` | Shell, order 1 | Flow (8 stages for `ls -l ~/projects \| grep app`), a table of error → stage | `command-chaining`, `appimage-install`, `command-not-found`, `add-to-path`, `permission-denied-script`, `exit-codes`, `expansion-quoting`, `env-vars`; `type`, `which`, `command`, `bash`, `echo` |

`ports-sockets` has no prerequisites yet. The plan's `file-descriptors` guide (Processes, order 3) would be the natural one when it exists.

**Tone:** the same as the scenarios: British spelling, no em dashes, no "simply" or "just". Titles are Title Case like the scenarios. The guides link to a scenario instead of repeating it: the chmod number table stays in `chmod-numbers`, the expansion order detail in `expansion-quoting`, and the exit code detail in `exit-codes`.

**Anatomy on observe commands** is there, as the plan says, but folded under "What each part does" for each command. Six open anatomy blocks made the section very long. Easy to flip if you'd rather see them open.

## Accuracy: checked on Ubuntu 24.04 (WSL), bash 5.2.21

Every observe output is from that machine, except the PIDs, the `node` process name and `/snap/bin` on `PATH`. WSL has no Node, and puts `/usr/lib/wsl/lib` on `PATH` instead. Things the run confirmed or corrected:

- **umask is `0022` under WSL**, although `/etc/login.defs` has `UMASK 022` with `USERGROUPS_ENAB yes`, which gives `002` at a normal PAM login. The guide shows `0022` and says both are common, rather than claiming one.
- **The owner of a `044` file gets Permission denied** while others can read it. **A script with `--x` fails, and a binary with `--x` runs.** A folder with `r` but no `x` lists names but won't open files. A read-only file in your own folder can be deleted. Home folders are `750` (`HOME_MODE 0750`).
- **Bash 5.2 says `cannot execute: required file not found`** for a missing `#!` interpreter and for CRLF line endings. It isn't the older "bad interpreter" message. The guide gives both.
- **A stale hash:** after deleting the first `foo` on `PATH`, bash says `No such file or directory` until `hash -r`. A file with no `#!` gets run by bash as a script.
- **A socket inherited by a child process keeps the port after the parent is killed.** `ss -ltnp` showed `sleep` holding it. **A TIME-WAIT entry blocked a plain `bind()` with EADDRINUSE, and `SO_REUSEADDR` succeeded.** Ports below 1024: `EACCES`. `ip_local_port_range` is `32768 60999`.
- **References:** 14 of 15 URLs return 200. `docs.kernel.org/networking/ip-sysctl.html` couldn't be reached from this machine (an SSL connect error from curl and the browser pane alike, a network problem here, not a 404). It's the canonical location, but check it once.

## Fixes to existing things along the way

- **`Prose` now renders `**bold**` and `[links](/s/…)`.** Links are allowed for site paths and https URLs only. Bold fixes a live bug: 9 step notes and cautions in `cpu-ram-hog`, `fix-broken-install`, `install-deb`, `remove-package`, `system-service` and `which-package` have been showing literal `**` all along. They now render bold. No existing content had `[text](url)` syntax.
- **Long inline code in Markdown bodies now wraps** (`overflow-wrap: anywhere` on `.md code`). `/proc/sys/net/ipv4/ip_unprivileged_port_start` pushed past a 375px screen.
- **GFM in MDX.** Since Astro 6.4, `markdown.gfm` is left undefined, and the new `processor` supplies the default. MDX 5 copies the undefined value, so tables didn't render. `mdx({ gfm: true, smartypants: true })` fixes it. Putting the rehype plugin on `mdx()` instead of `markdown.rehypePlugins` also avoids the new deprecation warning.

## Environment gotchas (for the next session)

- **pnpm is broken on this machine.** The corepack cache for 12.16.1 is missing `bin/pnpm.mjs`, so `pnpm` isn't on `PATH`. I used the native binary from the npx cache: `%LOCALAPPDATA%/npm-cache/_npx/38e94cc39f33ae43/node_modules/pnpm/pn.exe` (it prints 12.16.1), copied as `pnpm.exe` into a folder on `PATH` for the root scripts. Reinstalling with `corepack enable` or `npm i -g pnpm@12.16.1` should fix it properly.
- **`.claude/launch.json` has a second config, `web-node`,** that runs the Astro dev server through node from `apps/web`. The original `web` config needs `pnpm` on `PATH`. The dev server has to start in `apps/web`, because `lib/anatomy.ts` resolves `@shellgyan/core` from `process.cwd()`: with `--root apps/web` from the repo root, every page 500s.
- **Light and dark:** the plan's DoD says to check both, but the site is dark-only (`color-scheme: dark`, one token set). Widgets use the same tokens as the rest of the site, so they'll follow when a light theme exists.

## Next

1. **Your review of the pilots:** tone, depth, length (7–8 minutes each), and whether Flow, Layers and Zones are used the way you want. Also: anatomy folded or open?
2. Then **G1: the rest of the Shell track** (`environment-variables`, `path`, `standard-streams`, `quoting-expansion`, `shell-startup-files`, `exit-codes`). Two slugs to settle first. The guide slug `exit-codes` is the same as the scenario slug `exit-codes`. The routes differ (`/g/` vs `/s/`), so nothing breaks, but search shows two "Exit codes" results. Similarly, `environment-variables` overlaps the `env-vars` scenario. Consider `exit-status` or keeping the names and making the guide titles clearly conceptual.
3. Commit when you've reviewed. Suggested branch: `guides/phase-g0`.
