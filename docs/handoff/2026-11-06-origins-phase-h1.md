# Handoff · 2026-11-06 · Origins Phase H1: foundation, chapters 1–3, timeline v1

**Task:** Phase H1 of `docs/origins-plan.md`. Add the Origins section (collection, timeline and people data, build checks, routes, header and home entry, search, the Timeline and TimelineStrip widgets) and the first three chapters, then stop for review of tone, depth and how the timeline looks.

Read `docs/origins-plan.md` first (§8 now records your answers), then this file.

**Status:** committed on branch `origins/phase-h1` (from `origins/plan`, 164a0fc) and pushed, no PR; you review it on the branch's Vercel preview. Everything below passes locally:

- **Tests:** 529 pass (`npx vitest run` in `packages/core`). None are new; the Origins checks run in the build, like the guide checks.
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** 157 pages (3 chapters, `/origins`, `/origins/timeline` are new), zero `[content]` warnings.
- **Browser** (dev server, 1280px and 375px): `/`, `/origins`, `/origins/timeline`, the 3 chapters and `/learn`. None scrolls sideways at 375px. Timeline filters work, the hash (`#filter=kernel`) is set and read back, "All" clears it, and `#linux-announced` jumps to and outlines that event. Search finds chapters and events ("tanenbaum", "bitkeeper", "copyleft", "hurd"). No console errors.
- **Light/dark:** the site is still dark-only (see the G0 handoff), so only dark was checked.

## Your answers (plan §8)

1. Name: **Origins**. 2. Chapter route: **`/o/[slug]`**. 4. Home page: **a small fourth entry**.
3. Distros: include the major ones (Fedora, Kali, Arch and the like), and **explain how they differ and why there are so many distros in the first place**. That's H2: it belongs in `what-is-a-distro` (why distributions exist at all) and `distro-families` (how the families differ), plus Kali and the other big names in `distros.ts`.

## What was built

### Content model and data

- `origins` collection in `content.config.ts`: the plan's §3.1 schema (`url` uses zod 4's `z.url()`). Files: `src/content/origins/<slug>.mdx`.
- `src/data/timeline.ts`: categories, the 5 eras (with one-line summaries) and **30 events**. Also `formatEventDate` ('1991-08-25' → '25 Aug 1991'), `isValidEventDate` and `sortedTimeline`.
- `src/data/people.ts`: 11 people (the ones the three chapters need). H3 completes it.
- `src/lib/origins.ts`: chapters in reading order, events with their chapter titles filled in, `formatAsOf`.

### Build checks (`lib/contentChecks.ts`, all errors)

Timeline: duplicate id, id not kebab-case (it's the URL anchor), bad date, source not a URL, unknown category or era, **a year outside its era's range**, unknown chapter. People: duplicate id. Chapters: duplicate `order`; unknown `people`, `events`, `guides`, `commands` or `scenarios`; `asOf` not `YYYY-MM-DD`; body doesn't start with `## The short version` or end with `## Why it matters today`; no topic H2 between them; a `## Further reading` in the body (the page renders it); a body link to a missing `/s/`, `/g/`, `/c/` or `/o/` page, or to an `/origins/…` page that doesn't exist yet. Guide bodies may now link `/o/` pages too, with the same check.

A throwaway broken chapter produced all 13 chapter errors in one build; it's deleted. The timeline and people checks weren't exercised that way, but they follow the same pattern. Distro checks (parents, cycles) come with `distros.ts` in H2.

### Pages

- **`/origins`:** intro, the published chapters as cards (number, span, minutes, summary), then the 7 unwritten chapters dimmed as "On the way", so the reading order shows from the start. A side column links the timeline; the distro tree and Names & lore show as "On the way".
- **`/o/[slug]`:** hero (chapter number, span, minutes), the chapter's **timeline strip**, the MDX body with a sticky **At a glance** sidebar (`keyFacts`, `people`) on desktop, then **The practical side** (guide cards, reusing `ConceptLinks`), scenarios and commands, **Further reading** from `references`, previous/next chapter, and the `asOf` line. On a phone the sidebar comes after the text, so the chapter starts with its short version rather than a list of people.
- **`/origins/timeline`:** the full timeline.
- **Header:** Scenarios, Library, Learn, **Origins**, Explain. Five items didn't fit at 375px (Explain was cut off), so below `sm` the nav items' padding and gaps are smaller. Desktop is unchanged.
- **Home:** a slim card under the three entry points, "Where Linux comes from", with five milestone chips (1969 Unix, 1983 GNU, 1991 Linux, 1992 GPL, 2005 git) that link to those events on the timeline.

### Widgets (`components/origins/`)

- **`Timeline.tsx`** (`client:load`). Server-rendered with every event shown, so it works without JavaScript. Filter chips with counts; categories with no events are hidden (Distros, for now). The filter goes in the hash as `#filter=<category>`, not `#<category>`, so it can't clash with event anchors. Era headers with years and summary; eras with nothing visible are hidden. Desktop: a centre line with events alternating sides (the alternation restarts in each era). Mobile: one column with the line on the left. Each event shows date, category, title, the one-line why, its chapter link and its source host. `:target` outlines a linked event.
- **`TimelineStrip.astro`** (static). The chapter's `events` as small cards that scroll sideways inside their own box, each linking to `/origins/timeline#<id>`.

### Search

Chapters (`Ch 01` badge, "Origins" group) and timeline events (year badge, "Timeline" group, URL `/origins/timeline#<id>`) are indexed. Chapters are tagged with their key facts, people's names, H2/H3 headings, **bold terms** and the text of **The short version**. Without the last two, "copyleft" found nothing: the guides don't index body text either (G0 handoff), so I added just these two parts, not the whole body. The GNU chapter now bolds **copyleft** where it introduces the term.

## The three chapters

| Chapter | Minutes | Sections | Practical links |
|---|---|---|---|
| `unix` | 10 | A spare PDP-7 · The PDP-11, the manual and C · Pipes and small tools (a table: Unix habit → what it looks like now) · Berkeley, AT&T and the Unix wars | everything-is-a-file, standard-streams, pressing-enter, processes-basics, permissions-model, inodes-links, ports-sockets; grep, sort, sed, awk, bash; command-chaining, redirection |
| `gnu-free-software` | 11 | From a sharing community to GNU · What "free" means (four freedoms table, copyleft, LGPL) · What GNU built · The missing kernel · GNU/Linux or Linux? · Free software and open source | shared-libraries, what-is-a-package, pressing-enter, system-calls; bash, grep, sed, tar, ls, cp |
| `linux-kernel` | 12 | A hobby, on a 386 · From "not for money" to the GPL · "LINUX is obsolete" · Version numbers (a table) · BitKeeper and git · How a kernel is made today (**Flow**: merge window → rc1 → weekly rcs → release → stable → longterm) | kernel-user-space, kernel-modules, system-calls, boot-sequence |

**Tone:** the guides' rules: British spelling, no em dashes, no "simply" or "just" (except in quotes), Title Case titles. Quotes are short and link to the original. Neutral on the debates: "GNU/Linux or Linux?" gives both cases and says Debian uses one name and most others the other; "Free software and open source" gives the practical and the ethical case; the Tanenbaum debate "never had a clean winner".

**Not yet linked back from the guides.** The plan puts "Background" links from guides to chapters in H4, so no guide or command page links to Origins yet. Chapters link to guides; nothing goes the other way.

## Accuracy

Most primary sources were read directly. This machine couldn't reach several of them by curl, so I used three routes:

- **gnu.org and the ACM Turing page** return 403 to curl but loaded in the browser pane. Read there: the initial announcement (27 Sep 1983, "Gnu's Not Unix"), "The GNU Project" (January 1984 at MIT, Emacs from September 1984, the $150 tapes, FSF in 1985, Symbolics in 1981, the PDP-10 in 1982, Brian Fox and Roland McGrath, the LGPL as "a matter of strategy", "By 1990 … the only major missing component was the kernel", the Hurd on Mach and its delays, the "not-quite-complete GNU system" quote and the GNU/Linux request), the manifesto (written 1985), GPL v1 (February 1989) and v2 (June 1991), the Hurd history (started 1990; 0.1 in September 1996; GNU 0.2 in 1997), the four freedoms, the coding standards' `--help`/`--version` rule, and the 1983 Turing Award.
- **kernel.org** wouldn't connect at all (the G0 handoff hit this too). The same files from the full mirror at `www.mirrorservice.org/sites/ftp.kernel.org/pub/linux/kernel/`: RELNOTES-0.01 ("a free minix-like kernel for i386(+) based AT-machines", GCC 1.40, a bash binary, no mount), RELNOTES-0.12 (the GPL takes effect "as of the first of February"), and the archive dates for 0.95 (8 Mar 1992), 1.0 (13 Mar 1994), 2.0 (9 Jun 1996), 2.6.0 (18 Dec 2003) and 3.0 (22 Jul 2011). The kernel docs (`Documentation/process/2.Process.rst`: a two-week merge window, rcs up to rc6–rc9, the stable team, longterm selection) and `COPYING` (GPL-2.0 WITH Linux-syscall-note) came from GitHub's torvalds/linux. The references still point at kernel.org, the canonical address.
- **Present-day facts (asOf 2026-11-06)**, from the GitHub tags of torvalds/linux: 7.3 on 18 Oct 2026, 7.4-rc1 on 1 Nov 2026; 4.0 Apr 2015, 5.0 Mar 2019, 6.0 Oct 2022, 6.19 Feb 2026, 7.0 Apr 2026; 21 directories under `arch/`. git's first commit is 7 Apr 2005, "the information manager from hell".

Also read: Ritchie's "Evolution of the Unix Time-sharing System" on nokia.com (1969; Thompson, Canaday and Ritchie's filesystem; "well into 1970" for Kernighan's name, a "pun on Multics"; i-nodes, directories and special files on the PDP-7; the patent department; pipes in 1972 at McIlroy's "suggestion (or perhaps insistence)"; C begun in 1971; the kernel in C in 1973 as "the most important watershed"; the 1974 paper). The First Edition manual page (3 November 1971). McIlroy's "A Research UNIX Reader" (PDF, text-extracted): V7 in 1979 as "the first portable edition", the Bourne shell in V7, pipes making stdin/stdout a "philosophy" (v3), grep by Thompson (v4), Kernighan coining the name. Both Usenet threads on Google Groups: the 1991 post's wording, Bash 1.08 and GCC 1.40; Tanenbaum's 29 Jan 1992 post ("Microkernels have won"), Torvalds' reply opening, and Hedrick's reply about MINIX patches. opensource.org: 3 Feb 1998 in Palo Alto, Christine Peterson, OSI founded by Raymond and Perens in late February 1998, the OSD derived from the DFSG. gcc.gnu.org: 0.9 on 22 Mar 1987, 1.0 on 23 May 1987. git-scm.com: BitKeeper in 2002, revoked in 2005, git's goals. The Open Group: owns the UNIX standard and licenses the trademark through certification.

**Corrected along the way:** pipes are 1972 (Ritchie), not 1973; Torvalds replied to Tanenbaum within hours (the same UTC day), not "the next day"; the reasons for Unix compatibility and for the LGPL now follow Stallman's own wording.

### Not checked against a fetched source (general knowledge, please skim)

1. **BSD and System V dates:** 1BSD in 1978, 4.2BSD in 1983 with TCP/IP and sockets, US defence (DARPA) funding, vi and the C shell from Berkeley, virtual memory on the VAX. The TUHS archive is cited but has no dates. McKusick's history and FreeBSD's site didn't load from here.
2. **AT&T:** the consent decree that kept it out of the computer business, the cheap university licences, the Bell System breakup, System V, the Unix wars (Sun from BSD to System V), and the USL v. BSDi lawsuit in the early 1990s.
3. **Kernel:** Torvalds at the University of Helsinki and buying a 386 (his own post says 386(486) AT clones, not that he bought one); the version number jump after 0.12 "as 1.0 was expected to be close"; even/odd series from 1.0 to 2.6; 3.0 "for the 20th year"; Junio Hamano taking over git; the Ubuntu version string `6.8.0-48-generic` as an example.
4. **GNU:** GPL version 3 in 2007; GPL v1 replacing per-program licences; Bash taking features from the C and Korn shells; the Netscape announcement in January 1998 (the OSI page says only "shortly after").
5. **People:** birth years, Bill Joy's work, Kernighan as "the K in awk".
6. **Links that didn't load from this machine:** stallman.org, kroah.com, cs.princeton.edu/~bwk and cs.vu.nl/~ast (people's pages); the kernel.org URLs (canonical; content confirmed via the mirror). The DOI for the 1974 CACM paper is behind Cloudflare's bot check, so the event cites Ritchie's paper instead.

## For your review

1. **Tone and depth** of the three chapters (10–12 minutes each). Shorter, or more like the guides with an "Under the hood" fold?
2. **The timeline look** at desktop and phone width: alternating cards, era headers, filter chips. Also: should the alternation run across eras instead of restarting in each?
3. **The chapter page layout:** sticky sidebar on desktop, sidebar after the text on a phone.
4. **The header at 375px:** five items now fit, but only with tight padding. If you add a sixth (Sandbox), the nav will need a menu.
5. **Timeline scope:** the plan says about 25 events for eras 1–3; there are 26, plus 4 later kernel events (BitKeeper, 2.6, git, 3.0) that chapter 3 needs. Eras 4 and 5 fill in during H2 and H3.
6. The "Not checked" list above.

## Environment gotchas

- **pnpm is still broken** (`pnpm.exe` missing from the global npm folder). I used `node node_modules/astro/bin/astro.mjs check|build` in `apps/web` and `npx vitest run` in `packages/core`. The dev server is `.claude/launch.json`'s `web-node`.
- **Source sites:** gnu.org 403s and rate-limits (429) automated fetches but works in the browser pane; kernel.org doesn't connect from this network, but `www.mirrorservice.org/sites/ftp.kernel.org/` and GitHub (`raw.githubusercontent.com/torvalds/linux`, the GitHub API for tags) do; dl.acm.org shows a Cloudflare bot check (left alone); oreilly.com and mckusick.com don't load at all.
- **Ritchie's papers moved:** `bell-labs.com/usr/dmr/www/*` now redirects to `nokia.com/bell-labs/about/dennis-m-ritchie/*`; `hist.html` at the old address returns 410.

## Next

1. Your review of the points above, then commit H1 on `origins/phase-h1`.
2. **H2:** `standards`, `what-is-a-distro` (including why there are so many distributions), `distro-families` (how they differ), `distros.ts` with about 25 distros including Fedora, Kali, Arch and the other big names, `/origins/distros` with the `DistroTree` widget, and the distros-and-business timeline events. Add `'/origins/distros'` to `ORIGINS_PAGES` in `contentChecks.ts` when the page exists, and turn on its card on `/origins`.
