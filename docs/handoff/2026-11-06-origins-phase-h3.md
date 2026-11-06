# Handoff · 2026-11-06 · Origins Phase H3: chapters 7–10, timeline complete

**Task:** Phase H3 of `docs/origins-plan.md`: chapters `stack-shifts`, `linux-everywhere`, `licenses` and `whos-who`; the "Linux everywhere" timeline events; `people.ts` completed for Who's who.

Read the plan, then the H1 and H2 handoffs, then this file.

**Status:** committed on branch `origins/phase-h3` (from `origins/phase-h2`) and pushed, no PR; review on the branch's Vercel preview. Locally: 529 tests pass, `astro check` 0 errors and 0 warnings, the build makes 165 pages with zero `[content]` warnings. In the browser at 375px, `/origins`, `/origins/timeline` and the four new chapters return 200 and none scrolls sideways. The timeline shows 64 events and all five category chips (Unix 12, GNU 9, Kernel 13, Distros 17, Ecosystem 13). All ten chapters are now published, so `/origins` has no "On the way" chapters left; only the Names & lore card is still "On the way" (H4).

## What was added

| Chapter | Minutes | Sections | Widgets |
|---|---|---|---|
| `stack-shifts` | 12 | Init: SysV, Upstart, systemd (with a critics/supporters table) · Display: X11 and Wayland · Desktops: KDE and GNOME · Shells · C libraries: glibc and musl | Table |
| `linux-everywhere` | 11 | Servers and the cloud · Supercomputers · Phones, laptops and things · WSL · Containers: namespaces and cgroups | Layers (app → image → namespaces → cgroups → host kernel) |
| `licenses` | 10 | The two families · The licences side by side (GPL-2.0, GPL-3.0, LGPL, AGPL, MPL, Apache, MIT, BSD) · Why the kernel stayed on GPLv2 · Which licence does a program use? | Comparison table |
| `whos-who` | 9 | The people (a table of 20 rows linking each to its chapter) · The kernel's own structure · The organisations (LF, FSF, OSI, Debian, Canonical, Red Hat, SUSE, freedesktop.org, Conservancy) | Two tables |

- **Timeline:** 15 new events (64 in all, past the plan's "about 50"): X at MIT (1984), KDE (1996), GNOME (1997), GPLv3 (29 Jun 2007), cgroups in 2.6.24 (24 Jan 2008), the first Android phone (2008), Wayland (2008), systemd's announcement (30 Apr 2010), Docker (2013), user namespaces in 3.8 (2013), Debian choosing systemd (11 Feb 2014), Kubernetes 1.0 and the CNCF (Jul 2015), WSL (2016), all TOP500 on Linux (Nov 2017), Rust in 6.1 (Dec 2022).
- **People:** 17 added (28 in all): Stephen Bourne, Brian Fox, Christine Peterson, Eben Moglen, Ian Murdock, Patrick Volkerding, Marc Ewing, Bob Young, Judd Vinet, Mark Shuttleworth, Lennart Poettering, Matthias Ettrich, Miguel de Icaza, Kristian Høgsberg, Theodore Ts'o, Alan Cox, Solomon Hykes.
- **Neutral debates:** systemd gets a two-column table of what critics and supporters said; GPLv3 and the kernel gives the anti-tivoization and patent terms, Torvalds' objection, and the practical obstacle of thousands of copyright holders; the licences chapter says it isn't legal advice.

## Accuracy

Read directly: Poettering's "Rethinking PID 1" (posted 30 April 2010; Upstart "found its way into all major distributions"); the Debian technical committee announcement (11 February 2014, systemd default for jessie); Wayland's own description; the X.Org Foundation wiki; GNOME's story (1997, Miguel de Icaza and Federico Mena); musl's description ("lightweight, fast, simple, free"); `namespaces(7)` (user namespaces unprivileged since 3.8) and `cgroups(7)` (initial release in 2.6.24, v2 official in 4.5); LXC's feature list; Microsoft's WSL pages (WSL 2 runs a real Linux kernel in a lightweight VM, distributions as containers, systemd support, open source); the Kubernetes history post (1.0 announced with the new CNCF); **TOP500's operating system statistics: 500 Linux systems on every list from November 2017 to June 2026, 498 on June 2017**; GPLv3's date (29 June 2007); GitHub tags for 2.6.24 (24 Jan 2008) and 6.1 (11 Dec 2022). Blocked sites were read from Internet Archive snapshots (see the H2 handoff).

### Not checked against a fetched source (please skim)

1. **Stack:** Upstart first used by Ubuntu in 2006, in RHEL 6 and ChromeOS; Fedora first with systemd in 2011; Ubuntu switching after Debian; Devuan; X11 from 1987; X clients able to read each other's input; GNOME and KDE defaulting to Wayland sessions; XWayland; KDE's 1996 start by Matthias Ettrich (kde.org's announcement list is cited, but its page didn't show the 1996 text to my scripts); Qt's licence and later GPL relicensing; GNOME 3 in 2011, MATE, Cinnamon, COSMIC; csh, ksh, zsh as macOS's default in 2019; fish not POSIX; dash as `/bin/sh` on Debian and Ubuntu; Rich Felker as musl's author.
2. **Everywhere:** the LAMP history; Microsoft shipping its own Linux distribution for Azure infrastructure; Android's first phone in 2008, Bionic, Android Common Kernels from LTS releases; ChromeOS since 2011 and its Debian container; Yocto and Buildroot; mount namespaces first; FreeBSD jails; cgroups from Google engineers; LXC in 2008; Docker in 2013 and the OCI; Kubernetes released in 2014; Docker Desktop's VM; WSL first in 2016; Rust in 6.1 (the tag date is checked, not the Rust claim itself).
3. **Licences:** which projects use which licence (Git, Bash, GCC, coreutils, glibc, Firefox, Kubernetes, Android's user space, X11); macOS and PlayStation using FreeBSD code; the history of the TiVo dispute; "version 2 only" from early on.
4. **Who's who:** the Linux Foundation formed in 2007 and its fellows; the Linux Mark Institute; Software in the Public Interest; Software Freedom Conservancy; IBM owning Red Hat since 2019; about two thousand developers per kernel release; Alan Cox's and Theodore Ts'o's roles; Marc Ewing and Bob Young; Ian Murdock's dates (1973–2015).

## For your review

1. The tone of the debate sections (systemd, GPLv3).
2. Whether Who's who should be a people directory generated from `people.ts` (all 28 with links) instead of, or as well as, the hand-written table with chapter links.
3. The "Not checked" list.

## Next

**H4:** `lore.ts` and `/origins/lore` (searchable), lore in search, "Background" links from guides and commands back to the chapters, name origins on command pages, and a final pass over every `asOf` and source link.
