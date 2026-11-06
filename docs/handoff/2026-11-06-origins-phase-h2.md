# Handoff · 2026-11-06 · Origins Phase H2: standards, distributions and the family tree

**Task:** Phase H2 of `docs/origins-plan.md`: chapters `standards`, `what-is-a-distro` and `distro-families`, `distros.ts` and `/origins/distros` with the `DistroTree` widget (a compact version inside `distro-families`), and the distros-and-business timeline events. Your instruction for this phase: include the major distros (Fedora, Kali, Arch and the like), explain how they differ, and explain why there are so many.

Read `docs/origins-plan.md`, the H1 handoff (`2026-11-06-origins-phase-h1.md`), then this file.

**Status:** committed on branch `origins/phase-h2` (branched from `origins/phase-h1`) and pushed, no PR. You review it on the branch's Vercel preview. Locally:

- **Tests:** 529 pass (`npx vitest run` in `packages/core`), none new.
- **Type check:** 0 errors, 0 warnings, the same 2 hints.
- **Build:** 161 pages (H1's 157 plus 3 chapters and `/origins/distros`), zero `[content]` warnings.
- **Browser** (dev server, 1280px and 375px): `/origins`, `/origins/distros`, `/origins/timeline` and the 3 new chapters return 200, and none scrolls sideways at 375px. `#distro=ubuntu` opens Ubuntu's details on load. Family chip plus "Active only" leaves 5 of 30 distros matching, and the rest are dimmed, not removed. On a phone, picking a distro opens a bottom sheet. The compact tree in `distro-families` renders all 7 families with 30 links.

## What was added

### `src/data/distros.ts`: 30 distributions in 7 families

| Family | Distributions |
|---|---|
| Debian | Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS, Zorin OS, **Kali Linux**, Raspberry Pi OS |
| Red Hat | Red Hat Linux (discontinued), RHEL, **Fedora**, CentOS Stream, CentOS Linux (changed), Rocky Linux, AlmaLinux |
| Arch | **Arch Linux**, Manjaro, EndeavourOS, SteamOS 3 |
| SUSE | SUSE Linux (changed), SUSE Linux Enterprise, openSUSE Tumbleweed, openSUSE Leap |
| Slackware | Softlanding Linux System (discontinued), Slackware |
| Gentoo | Gentoo, ChromeOS |
| Independent | Alpine Linux, NixOS, Void Linux |

Each entry has the plan's §3.3 fields, plus `FAMILY_SUMMARY` (one line per family) and labels. A parent can be in another family: SUSE Linux's parent is Slackware, and the tree shows it as "Based on Slackware (Slackware)" in the SUSE card and "Also the base of SUSE Linux (SUSE)" in the Slackware card.

**Tree shape decisions:** RHEL's parent is Red Hat Linux (RHEL 2.1 came out before Fedora), and the text says each RHEL major version is branched from Fedora through CentOS Stream today. CentOS Stream's parent is Fedora. openSUSE Leap's parent is SUSE Linux Enterprise (it's built from the same sources).

### Build checks (added to `lib/contentChecks.ts`)

A duplicate or non-kebab-case distro id, an unknown family, a bad url or `asOf`, a missing parent, **a parent founded after its child**, and **a parent chain that loops**. Tested by making Debian a child of Ubuntu and giving Void a parent that doesn't exist: one build reported all 10 errors (the founding-year one, a loop for each of the 8 distros in the cycle, and the missing parent). The file was restored. `/origins/distros` is now an allowed link target in chapter bodies.

### `/origins/distros` and the `DistroTree` widget

- One collapsible card per family (`<details open>`), each an indented tree with founding years. Grey dots mark discontinued and changed distros. The same layout works at every width, so phones get the per-family lists the plan asked for, not a wide diagram.
- **Filters:** family chips, a release model select, and an "Active only" checkbox, with a count of matches. Non-matching distros are dimmed so the tree keeps its shape.
- **Details:** package format and manager, release model, init system, status, the note, "Based on" and "Base of" links (clickable), the project link and `asOf`. It's a sticky side panel on desktop and a bottom sheet on phones. The selection is kept in the hash (`#distro=kali`).
- **Gotcha fixed:** `<main>` has a fade-in animation that leaves a `transform`, which makes `position: fixed` relative to `<main>` rather than the screen, so the phone sheet appeared 2,600px down the page. It's now rendered into `<body>` with a React portal. Anything fixed-position added later inside `<main>` will hit the same thing.
- **Compact mode** (`<DistroTree />` in MDX, through `DistroTreeCompact.astro`): static, no JavaScript, every name links to `/origins/distros#distro=<id>`.
- The `/origins` index's "Distro family tree" card is now live.

### Timeline: 19 new events (49 in all)

Standards: POSIX.1 (1988), UNIX certification (1995), FHS 2.3 (29 Jan 2004), FHS 3.0 (3 Jun 2015), POSIX.1-2024. Distros: S.u.S.E. founded (1992), Red Hat founded (1993), Slackware's first beta (Apr 1993), Debian (Aug 1993), Debian Social Contract (1997), Arch 0.1 (Mar 2002), Red Hat Linux → Fedora/RHEL (2003), Ubuntu 4.10 (Oct 2004), Ubuntu's first LTS (2006), Linux Mint (2006), Kali (2013), Tumbleweed (4 Nov 2014), CentOS → CentOS Stream (8 Dec 2020), Debian 13 (9 Aug 2025). The Distros filter chip now appears on the timeline.

## The three chapters

| Chapter | Minutes | Sections | Widgets |
|---|---|---|---|
| `standards` | 8 | POSIX: the interface · The Single UNIX Specification and the UNIX name · FHS: where the files go · LSB: the standard that faded | Tables (POSIX parts; FHS paths) |
| `what-is-a-distro` | 11 | What's in the box · Upstream and downstream · Release models (with backports) · **Why are there so many?** | Layers (bootloader → kernel → userland → init → package manager → desktop); release model table |
| `distro-families` | 12 | The tree · Debian · Red Hat · Arch · SUSE · Slackware and Gentoo · The independents · **How they differ, at a glance** · **How to choose** | Compact DistroTree; comparison table; "if you want → look at" table |

**Your two asks:** "Why are there so many?" in `what-is-a-distro` gives six reasons (different goals, values, design ideas, disagreements such as Ubuntu and the CentOS change, friendlier front ends, companies and hardware), then why the families stay few: building tens of thousands of packages is expensive, so most distributions are derivatives. "How they differ" is the family sections plus a comparison table (package format, install command, release model, init, C library, known for) and a "how to choose" table.

**Kali** says plainly that it's for security testing, not an everyday desktop, and that testing systems without permission is illegal in most places.

## Accuracy

This network blocks most distribution sites (debian.org, slackware.com, fedoraproject.org, nixos.org, voidlinux.org, opensuse.org, almalinux.org, gentoo.org, zorin.com) for both curl and the browser pane. I read **Internet Archive snapshots from October and November 2026** of the official pages (`archive.org/wayback/available`, then the `id_` raw snapshot) and cite the original URLs. Read directly or from those snapshots:

- **Debian:** started August 1993 by Ian Murdock "in the spirit of Linux and GNU"; the name from Ian and Debra; Debian 1.0 was released as 1.1; Bruce Perens coordinated the DFSG and Social Contract; stable/testing/unstable; **13 "trixie" released 9 Aug 2025, 13.7 on 12 Sep 2026**.
- **Ubuntu:** 2004, Mark Shuttleworth and Debian developers founded Canonical; releases every six months from October 2004; LTS every fourth release from 2006, "the origin of the term LTS".
- **Red Hat:** founded 1993; CentOS Stream as continuously delivered upstream of RHEL; Fedora as the upstream of future RHEL majors; CentOS Linux downstream. **Rocky Linux:** 8 Dec 2020 announcement, Gregory Kurtzer, CentOS founder.
- **Arch:** Judd Vinet, development from early 2001, 0.1 in March 2002. **Linux Mint:** Clement Lefebvre, 2006, based on Debian and Ubuntu. **Kali:** formerly BackTrack, Debian-based, for penetration testing. **SUSE:** founded 1992, "the world's first provider of an Enterprise Linux distribution". **Tumbleweed:** rolling; Greg Kroah-Hartman's idea; merged with Factory on 4 Nov 2014. **Slackware:** first beta April 1993; "most UNIX-like". **Alpine:** musl and BusyBox, under 8 MB for a container. **Void:** independent, runit, XBPS. **Gentoo:** Portage, ebuilds. **NixOS:** reproducible, declarative. Manjaro, EndeavourOS, Pop!_OS (Ubuntu-compatible), Zorin (alternative to Windows and macOS).
- **Standards:** The Open Group: POSIX created by vendors and users in the 1980s, formal UNIX certification from 1995, "Even a Linux distribution has become UNIX certified", SUS core volumes are POSIX and ISO/IEC 9945. **The UNIX register as of today lists only IBM AIX and z/OS, HPE HP-UX and SCO UnixWare/OpenServer: macOS isn't on it**, so the chapter says macOS *was* certified. FHS 2.3 on 29 Jan 2004 and 3.0 on 3 Jun 2015 (refspecs.linuxfoundation.org). POSIX Issue 8 at pubs.opengroup.org.

### Not checked against a fetched source (please skim)

1. **Founding years** for Red Hat Linux (1994), RHEL (2002), Fedora Core (2003), CentOS (2004), CentOS Stream (2019), Rocky and Alma (2021, first releases), Pop!_OS (2017), elementary (2011), Zorin (2009), Raspbian (2012), Manjaro (2011), EndeavourOS (2019), SteamOS 3 (2022), SLE (2000), Leap (2015), SLS (1992), Gentoo (2002, version 1.0), ChromeOS (2011), **Alpine (2005)** and **NixOS (2003, the Nix research project; NixOS itself came a little later)**. The last two are the softest.
2. **Distro details:** S.u.S.E. starting by translating Slackware; SLS's bugs prompting Slackware; CentOS Linux 7 ending in 2024; AlmaLinux started by CloudLinux; Arch inspired by CRUX; Fedora first with systemd, Wayland and PipeWire; Fedora and RHEL using SELinux and firewalld; ChromeOS built with Portage and using Upstart; SteamOS 3 on Arch (earlier versions on Debian); Debian keeping non-free firmware in its own section.
3. **Standards:** Stallman naming POSIX (instead of "IEEE-IX"); POSIX.1-2024 published jointly with the IEEE; the certificate names (UNIX 95, 98, 03, V7); macOS certified against UNIX 03; Huawei EulerOS as the certified Linux; FSSTND starting in 1993; LSB's start in 1998, its ISO status, LSB 5.0 in 2015 and Debian dropping LSB.
4. **Example:** `openssl 3.0.13-0ubuntu3.4` as an Ubuntu-style version string.

## For your review

1. **The tree**: one card per family with indented children, rather than one big diagram. And the colours: each family has an accent, and Slackware and Independent share indigo.
2. **"Why are there so many?"** and **"How to choose"**: is that the depth you wanted?
3. **Tables on a phone:** three wide tables (release models, the six-column comparison, POSIX parts) scroll sideways inside their own box at 375px. The page itself doesn't. The guides avoided wide tables; these felt worth it.
4. The "Not checked" list.

## Environment gotchas (new in H2)

- **Most distro sites are unreachable from this network.** `curl -s "http://archive.org/wayback/available?url=<url>"` returns the latest snapshot; add `id_` after the timestamp to get the raw page. `scratchpad/g.sh` in this session did both.
- A shell heredoc full of quotes and backticks broke bash's parser; writing the Python edit to a file and running it was reliable.

## Next

**H3:** `stack-shifts`, `linux-everywhere`, `licenses`, `whos-who`; the "Linux everywhere" timeline events (about 50 in total was the plan's target; there are 49 now, so H3 will pass it); `people.ts` completed for Who's who.
