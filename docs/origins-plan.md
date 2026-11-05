# Origins plan: "About Linux"

**Date:** 2026-11-05
**Goal:** add a fourth content section, **Origins**, about Linux itself rather than how to use it: where Unix and GNU came from, how Linus Torvalds' kernel came about, what a distribution is, the distro families, the wider ecosystem, licenses and the people and organisations involved. It's reference material for someone who already uses Linux, not a beginner course.

This is a section of its own, next to Scenarios, Library and Learn. It's **not** a ninth guide track: the guides explain how to work with the system; Origins explains what the system is and where it came from.

## 1. Where it sits

| Section | Question it answers | Route |
|---|---|---|
| Scenarios | "Something broke, how do I fix it?" | `/s/[slug]` |
| Library | "What does this command do?" | `/c/[slug]`, index at `/library` |
| Learn | "How does this part of Linux work?" | `/g/[slug]`, index at `/learn` |
| **Origins** | "Where did Linux come from, and what's around it?" | `/o/[slug]`, index at `/origins` |

Pages inside Origins:

| Page | Route | What it is |
|---|---|---|
| Index | `/origins` | Intro, the chapters in reading order, links to the three pages below |
| Chapters | `/o/[slug]` | The ten long-form chapters (§4) |
| Timeline | `/origins/timeline` | Interactive timeline, 1969 to today (§5.1) |
| Distro family tree | `/origins/distros` | Interactive tree of which distro came from which (§5.2) |
| Names & lore | `/origins/lore` | Searchable list of name origins and jargon (§5.3) |

`/history` is already the Explainer's history page, which is why the timeline lives under `/origins`.

- **Header:** add **Origins** after Learn (before Explain).
- **Home page:** a fourth, smaller entry point below the existing three, e.g. *"Where Linux comes from"* linking to `/origins`, with the timeline as a teaser.
- **Search:** chapters, timeline events and lore entries are all indexed.

## 2. Ground rules

- **Accuracy first.** This section is all facts and dates, and they're easy to get subtly wrong. Every chapter lists `references`, and every timeline event carries a `source` URL. Prefer primary sources: kernel.org, gnu.org, fsf.org, the Bell Labs / Dennis Ritchie papers, the original Usenet posts, distro project pages, the TOP500 site. Wikipedia can point the way but isn't cited as the source.
- **Dates that go stale get an `asOf`.** Anything about the present (latest kernel version, a distro's status, market share, TOP500 numbers) is marked with the date it was checked, and the page shows it ("as of November 2026").
- **Neutral on the debates.** GNU/Linux naming, systemd, free vs open source, CentOS Stream: present each side and what happened, don't pick a winner.
- **Quote sparingly, link to the original.** Short quotes only (a line from Linus' 1991 announcement, the GNU Manifesto title). Link to the full text instead of reproducing it.
- **Tie back to the practical sections.** Every chapter links to the guides, commands and scenarios it explains the background of (for example the systemd history links to `systemd-units`, distro families to `what-is-a-package` and `app-formats`). The build fails if a linked slug doesn't exist.
- **Not absolute basics.** Assume the reader knows what a terminal, a file and a package are.

## 3. Content model

### 3.1 `origins` collection

One file per chapter: `apps/web/src/content/origins/<slug>.mdx`, MDX like the guides so widgets can sit inline.

```ts
const origins = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/origins' }),
  schema: z.object({
    order: z.number().int().positive(),         // reading order on /origins
    title: z.string(),
    summary: z.string(),                        // one or two sentences, for cards and search
    readingMinutes: z.number().int().positive(),
    span: z.string().optional(),                // e.g. "1969–1983", shown on the card
    keyFacts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),  // sidebar "at a glance"
    people: z.array(z.string()).default([]),    // ids from people data (§3.4)
    events: z.array(z.string()).default([]),    // timeline event ids shown in this chapter
    guides: z.array(z.string()).default([]),    // related guide slugs
    commands: z.array(z.string()).default([]),
    scenarios: z.array(z.string()).default([]),
    references: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
    asOf: z.string().optional(),                // ISO date, for chapters with present-day facts
    draft: z.boolean().default(false)
  })
});
```

Body structure for each chapter:

1. `## The short version`: three or four paragraphs, always visible.
2. Topic sections (H2s that fit the chapter).
3. `## Why it matters today`: the link from history to the system you use now.
4. `## Further reading`: rendered from `references`.

The page template renders *At a glance* (`keyFacts`, `people`), the chapter's timeline strip (`events`) and *Related* (guides, commands, scenarios) from frontmatter.

### 3.2 Timeline data

`apps/web/src/data/timeline.ts`, a typed array, so it's easy to validate and reuse in chapters:

```ts
interface TimelineEvent {
  id: string;                 // e.g. 'linux-announced'
  date: string;               // 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD', only as precise as the source
  title: string;
  why: string;                // one line: why it mattered
  category: 'unix' | 'gnu' | 'kernel' | 'distros' | 'ecosystem';
  era: 'unix' | 'gnu' | 'kernel-born' | 'distros-business' | 'everywhere';
  chapter?: string;           // origins slug
  source: string;             // URL
}
```

Eras: Unix (1969–1983), GNU (1983–1991), The kernel is born (1991–1998), Distros and business (1993–2004), Linux everywhere (2005–now). Eras overlap where history does; each event belongs to one.

### 3.3 Distro data

`apps/web/src/data/distros.ts`:

```ts
interface Distro {
  id: string;
  name: string;
  parent?: string;            // distro id it's based on
  family: 'debian' | 'redhat' | 'arch' | 'suse' | 'slackware' | 'gentoo' | 'independent';
  founded: number;
  packageFormat: string;      // 'deb', 'rpm', 'pkg.tar.zst', 'apk', 'nix', ...
  packageManager: string;
  releaseModel: 'fixed' | 'rolling' | 'lts' | 'fixed+lts';
  init: string;
  status: 'active' | 'discontinued' | 'changed';   // 'changed' e.g. CentOS Linux → Stream
  note: string;               // one line: what it's for / known for
  url: string;
  asOf: string;
}
```

### 3.4 People and lore data

- `apps/web/src/data/people.ts`: id, name, known for, years, link. Used by *Who's who* and chapter sidebars.
- `apps/web/src/data/lore.ts`: term, kind (`name-origin` or `jargon`), explanation, optional related command/guide, source.

### 3.5 Build checks (extend `contentChecks.ts`)

- Every timeline event has a `source`, a valid date, and a unique `id`.
- Every `events`, `people`, `guides`, `commands`, `scenarios` and `chapter` reference resolves.
- Every distro `parent` exists, and there are no cycles.
- No two chapters share an `order`.
- Links inside chapter bodies point to real pages (same check the guides have).

## 4. Chapters

| # | Slug | Chapter | Covers |
|---|---|---|---|
| 1 | `unix` | Unix: where it all started | Bell Labs 1969, Thompson and Ritchie, the 1973 rewrite in C, AT&T licensing, BSD and the Unix wars; the Unix philosophy (small tools, pipes, text). Links `everything-is-a-file`, `standard-streams`. |
| 2 | `gnu-free-software` | GNU and free software | Stallman and GNU (1983), the GNU Manifesto, the FSF, the GPL and copyleft, what GNU supplied (gcc, bash, coreutils, glibc), why Hurd never shipped, the GNU/Linux naming debate, free software vs open source (OSI 1998). |
| 3 | `linux-kernel` | Linus and the kernel | MINIX, the August 1991 announcement, the Tanenbaum–Torvalds debate, the move to the GPL (1992), 1.0 (1994), version numbering, BitKeeper and the birth of git (2005), how the kernel is developed today (merge window, rcs, stable and LTS, maintainers). Links `kernel-user-space`, `kernel-modules`. |
| 4 | `standards` | Standards: POSIX, SUS and FHS | What "Unix-like" means, POSIX and the Single UNIX Specification, why macOS is certified Unix and Linux isn't, the FHS and LSB. Links `filesystem-layout`. |
| 5 | `what-is-a-distro` | What a distribution really is | Kernel + GNU userland + init + package manager + defaults + release model; upstream and downstream, backports, LTS. Links `what-is-a-package`, `boot-sequence`. |
| 6 | `distro-families` | The distro families | Debian (Ubuntu, Mint, Pop!_OS), Red Hat (Fedora, RHEL, CentOS → Stream, Rocky, Alma), Arch, SUSE, Slackware, Gentoo, Alpine (musl, BusyBox), NixOS; fixed vs rolling releases; how to choose. Embeds a compact family tree. Links `app-formats`. |
| 7 | `stack-shifts` | The big shifts in the stack | The init wars (SysV → Upstart → systemd), X11 → Wayland, GNOME and KDE, the shell family (sh → bash → zsh, fish), glibc vs musl. Links `systemd-units`, `shell-startup-files`. |
| 8 | `linux-everywhere` | Linux everywhere | Servers and cloud, Android, ChromeOS, embedded, the TOP500, WSL; containers from namespaces and cgroups to Docker and Kubernetes. Links `proc-sys`, `processes-basics`. |
| 9 | `licenses` | Licenses in practice | GPLv2 vs v3 and why the kernel stays on v2, LGPL, MIT, BSD, Apache 2.0; what each lets you do, in a comparison table. |
| 10 | `whos-who` | Who's who | People (Thompson, Ritchie, Stallman, Torvalds, Greg Kroah-Hartman, Ian Murdock, Lennart Poettering and others) and organisations (Linux Foundation, FSF, kernel.org, Debian project, Canonical, Red Hat/IBM, SUSE): who funds and steers what. |

## 5. Pages and widgets

All widgets are data-driven, work in light and dark, and work at 375px with no horizontal page scroll.

### 5.1 Timeline (`/origins/timeline`)

- About 50 events from §3.2, grouped by era with an era header and a one-line era summary.
- Filter chips by category (Unix, GNU, Kernel, Distros, Ecosystem); the selected filter is kept in the URL hash so it can be linked.
- Each event: date, title, the one-line "why", a link to its chapter and its source.
- Desktop: vertical line with events alternating sides. Mobile: single column.
- A small `TimelineStrip` variant shows a chapter's `events` inline at the top of that chapter.

### 5.2 Distro family tree (`/origins/distros`)

- A tree drawn from `parent` links, grouped by family, with founding years.
- Clicking a distro opens a detail panel: package format and manager, release model, init, status, one-line note, link.
- Filters: family, release model, active only.
- Mobile: collapsible per-family lists instead of the wide tree.

### 5.3 Names & lore (`/origins/lore`)

- Name origins: `grep` (`g/re/p`), `awk` (Aho, Weinberger, Kernighan), `bash` (Bourne Again SHell), `sed`, `tar`, `cron`, daemon, root, tarball, why `/usr` exists, Tux, and so on.
- Jargon: userland, upstream/downstream, backport, LTS, distro, rolling release, RTFM, bikeshedding.
- A filter box and kind tabs. Entries that relate to a command or guide link to it, and those command pages can show "Name origin" later (§7).

## 6. Phases

Each phase lives on its own branch (`origins/phase-hN`), like the guide and scenario phases.

### Phase H1: Foundation, chapters 1–3, timeline v1

- Add the `origins` collection, `timeline.ts`, `people.ts`, and the build checks in §3.5.
- Routes: `/origins`, `/o/[slug]`, `/origins/timeline`. Add **Origins** to the header and the home-page entry point.
- Build the `Timeline` and `TimelineStrip` widgets.
- Search: index chapters and timeline events.
- Chapters: `unix`, `gnu-free-software`, `linux-kernel`.
- Timeline v1: the events for eras 1–3 (about 25).

Review H1 before writing more, to settle tone, depth and how the timeline looks.

### Phase H2: Chapters 4–6 and the distro family tree

- Chapters: `standards`, `what-is-a-distro`, `distro-families`.
- `distros.ts` (about 25 distros) and `/origins/distros` with the `DistroTree` widget; a compact version embedded in `distro-families`.
- Timeline events for the distros and business era.

### Phase H3: Chapters 7–10, timeline complete

- Chapters: `stack-shifts`, `linux-everywhere`, `licenses`, `whos-who`.
- Timeline events for the "Linux everywhere" era, bringing it to about 50.
- `people.ts` complete for *Who's who*.

### Phase H4: Names & lore, cross-links, polish

- `lore.ts` and `/origins/lore`; index lore entries in search.
- Back-links from the practical sections: guides that have an Origins chapter behind them (`systemd-units`, `what-is-a-package`, `filesystem-layout`, `kernel-user-space` and others) get a small "Background" link; command pages with a lore entry can show the name origin.
- A final pass over every `asOf` date and source link.

## 7. Definition of done (each phase)

1. `pnpm test`, `pnpm check` and `pnpm build` pass, with no `[content]` warnings.
2. A browser check of each new page at desktop width and at 375px, in light and dark: timeline filters, tree interactions, chapter sidebars and cross-links.
3. Every new chapter is reachable from `/origins` and search finds it; every timeline event links to a chapter or a source.
4. Every date and factual claim is checked against a cited source; present-day facts carry an `asOf`.
5. A handoff file in `docs/handoff/`. Then a commit, once you've reviewed the phase.

## 8. Open questions for Jd

1. **Name.** "Origins" for the header and `/origins`, or something else ("About Linux", "Story")?
2. **Chapter route.** `/o/[slug]` matches `/s`, `/c` and `/g`. Fine, or prefer `/origins/[slug]`?
3. **Distro list.** About 25 distros in the tree. Any you particularly want included (e.g. Kali, Manjaro, elementary, Zorin, Void)?
4. **Home page.** A fourth entry point on the home page, or only the header link?
