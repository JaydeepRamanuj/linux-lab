# Handoff · 2026-11-06 · Origins Phase H4: names & lore, back-links, final pass

**Task:** Phase H4 of `docs/origins-plan.md`, the last Origins phase: `lore.ts` and `/origins/lore`, lore in search, "Background" links from guides and commands back to the chapters, name origins on command pages, and a final pass over every `asOf` and source link.

Read the plan and the H1, H2 and H3 handoffs first.

**Status:** committed on branch `origins/phase-h4` (from `origins/phase-h3`) and pushed, no PR; review on the branch's Vercel preview. Locally: 529 tests pass, `astro check` reports 0 errors and 0 warnings, and the build makes 166 pages with zero `[content]` warnings. Browser checks (375px and desktop): `/origins/lore` doesn't scroll sideways, `#daemon` lands on that entry and outlines it, typing "kernel" filters to 8 entries and the Jargon tab narrows them to 5, and `/c/grep` shows its name origin and two chapter links. No console errors.

## What was added

### `src/data/lore.ts`: 27 entries

- **Name origins (15):** grep, sed, awk, bash, tar, shell, rc (`.bashrc`), Unix, GNU, Debian, Ubuntu, Tux, daemon, tarball, shebang.
- **Jargon (12):** userland, upstream/downstream, backport, LTS, distro, rolling release, copyleft, PID 1, RTFM, bikeshedding, foo/bar, Unix-like.
- Each has a `source`: an external URL, or, for jargon this site defines itself (upstream, backport, distro, Unix-like), the chapter that defines it, such as `/o/what-is-a-distro`.
- **Left out because no source could be reached:** cron (the "chronos" story), root, why `/usr` exists (Rob Landley's often-quoted 2010 BusyBox email has no archive snapshot), and how Linux got its name (Ari Lemmke and the FTP directory, which comes from Torvalds' book, not an online source). They'd be easy to add with a source you're happy with.

### `/origins/lore`

A filter box (term and explanation) and All / Name origins / Jargon tabs, over a two-column grid of cards. Each card links to its command, guide and chapter, and to its source. Server-rendered with everything shown, so it works without JavaScript. The `/origins` index card is live, so every Explore card is now a link.

### Back-links ("Background")

A new `components/origins/Background.astro` card, built from the chapters' own `guides` and `commands` lists, so a link written once on the chapter shows on both sides:

- **18 guide pages:** app-formats, boot-sequence, everything-is-a-file, filesystem-layout, journald-logs, kernel-modules, kernel-user-space, mounts-devices, permissions-model, pressing-enter, proc-sys, processes-basics, shared-libraries, shell-startup-files, standard-streams, system-calls, systemd-units, what-is-a-package. That covers the plan's examples: systemd-units, what-is-a-package, filesystem-layout and kernel-user-space.
- **17 command pages:** apt, apt-cache, awk, bash, cp, dpkg, find, grep, htop, journalctl, ls, ps, sed, sort, systemctl, tar, top.
- **Name origins on 5 command pages:** awk, bash, grep, sed, tar (any lore entry with `command` set and kind `name-origin`).

On guides the card sits before References; on commands, after "Concepts behind this command".

### Search and checks

- Lore entries are indexed (group "Names & lore", badge "name" or "jargon", URL `/origins/lore#<id>`).
- New build errors: a duplicate or non-kebab-case lore id; an unknown command, guide or chapter; a source that is neither a URL nor an existing `/s/`, `/g/`, `/c/` or `/o/` page; a broken site link in an explanation. `/origins/lore` is an allowed link target in chapter bodies.

## Final pass

- **`asOf`:** all 7 chapters with present-day facts and all 30 distros are dated 2026-11-06. The only figures that will go stale soon: the latest kernel (7.3, 7.4-rc1), Debian 13.7, and the TOP500 list (June 2026; the November 2026 list is due later this month).
- **Sources:** 127 distinct URLs across the chapters and the timeline, people, distro and lore data. 76 return 200 from this machine. The other 51 are on hosts this network blocks (gnu.org, kernel.org, debian.org and the other distro sites, top500.org and so on); **all 51 have a live (200) snapshot in the Internet Archive**, so none is a typo or a dead page. On the Vercel preview, from a normal network, they should load directly. Spot-check a few from your browser.

### Not checked against a fetched source (please skim)

- Tux in 1996 and Torvalds suggesting a penguin (Larry Ewing's page confirms only that he drew it with the GIMP).
- daemon: "Project MAC" (the Jargon File confirms Maxwell's demon and the later "Disk And Execution MONitor" backronym).
- Bash as a pun on "born again"; bikeshedding's 1999 FreeBSD email (bikeshed.org confirms it comes from Poul-Henning Kamp and the FreeBSD FAQ).
- Read directly: grep's `g/re/p`, sed from `gres` and McMahon, awk's three initials, shell from Multics and `rc` from CTSS runcom (all McIlroy's reader); tar as "tape archiver" (GNU tar manual); GNU's recursive acronym; Debian from Debra and Ian; Ubuntu's meaning; the Jargon File's entries for userland, daemon, tarball, shebang, RTFM and foo.

## The whole section, for the big review

| Phase | Branch | What |
|---|---|---|
| H1 | `origins/phase-h1` | Foundation, timeline, chapters 1–3 |
| H2 | `origins/phase-h2` | Standards, distributions, distro tree, chapters 4–6 |
| H3 | `origins/phase-h3` | Chapters 7–10, timeline complete |
| H4 | `origins/phase-h4` | Names & lore, back-links, final pass |

Each branch builds on the one before, so `origins/phase-h4` has everything: 10 chapters, 64 timeline events, 30 distributions, 28 people and 27 lore entries, on four pages (`/origins`, `/origins/timeline`, `/origins/distros`, `/origins/lore`) plus `/o/<slug>` for each chapter.

**Before a PR into main:**

1. Review on the Vercel preview of `origins/phase-h4`, using the four handoffs' "For your review" and "Not checked" lists.
2. The guides work (`guides/phase-g0`) isn't in `main` yet, and Origins builds on it (`origins/plan` was branched from it). Merge the guides PR first, or open one PR for both.
3. `pnpm test`, `pnpm check` and `pnpm build` on a machine or CI where pnpm works, since every phase used the node fallbacks. The Vercel preview build covers `build`.
4. Optional follow-ups: the four lore entries left out above; a people directory generated from `people.ts` on Who's who (H3 question); search still doesn't index full chapter bodies, only key facts, headings, bold terms and the short version.
