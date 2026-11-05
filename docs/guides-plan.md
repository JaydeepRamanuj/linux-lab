# Guides plan: "How Linux Works"

**Date:** 2026-11-04
**Goal:** add a third content pillar, **guides**, that explains the system the commands run on: the shell, filesystem, permissions, processes, kernel and boot, services, networking (including SSH) and packages. Guides link both ways with scenarios and command pages.

This plan runs alongside `scenarios-plan.md`, not after it. It doesn't replace the scenarios plan, and the scenario phases are not blocked on it.

## 1. Why

Each scenario already relies on a concept it never explains:

| Scenario | Concept underneath |
|---|---|
| `port-in-use` | Sockets, ports, file descriptors |
| `apt-lock` | File locks, processes |
| `permission-denied-script` | The rwx model, the exec bit, shebangs |
| `command-chaining` | Exit codes, how the shell parses a line |
| `appimage-install` | PATH, executables, desktop entries |

Without the concept, the fix is a recipe you memorise. With it, you can handle the next problem yourself.

## 2. Three pillars

| Pillar | Question it answers | Route |
|---|---|---|
| Scenarios | "Something broke, how do I fix it?" | `/s/[slug]` |
| Commands | "What does this command do?" | `/c/[slug]` |
| **Guides** | "How does this part of Linux actually work?" | `/g/[slug]`, index at `/learn`, tracks at `/learn/[track]` |

- **Home page:** three entry points: *Fix something*, *Look up a command*, *Understand the system*.
- **Header:** add **Learn** next to Scenarios and Library.
- **Tagline:** "Linux Command Survival Guide" no longer covers the site. The ShellGyan name stays. Proposed tagline: "Fix it, look it up, understand it." (open question, §9).

## 3. Ground rules

- **See it on your machine.** Every guide has read-only `observe` commands that make the concept visible on the reader's own system (`stat file`, `ls -l /proc/$$/fd`, `systemd-analyze blame`, `ssh -v host`). The build fails if the rule engine classes any `observe` command above `readonly`.
- **Scope rule.** Go as deep as a power user needs to debug their own machine, and no deeper. For anything beyond that, link out to man pages, kernel docs or the relevant RFC.
- **Two depths.** *The mental model* is the 5-minute read and is always visible. *Under the hood* holds the deeper part, collapsed by default.
- **Accuracy.** Every guide lists `references` (man pages, kernel.org docs, freedesktop and systemd docs). Before writing a claim, check it on a real Ubuntu machine or in the cited source.
- **Distros.** Default to Ubuntu/Debian. Call out where Fedora or Arch differ (paths, init details, package tooling).
- **Cross-links.** Every slug in `prerequisites`, `commands`, `scenarios` and `concepts` must exist. The build fails otherwise (extends Phase 0 of the scenarios plan).

## 4. Content model

### 4.1 `guides` collection

One file per guide: `apps/web/src/content/guides/<slug>.mdx`. MDX, so widgets can sit inline in the text. If MDX integration turns out to be costly, fall back to `.md` with frontmatter-driven widgets, like scenarios.

```ts
const guides = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/guides' }),
  schema: z.object({
    track: z.enum(TRACK_IDS),
    order: z.number().int().positive(),        // position within the track
    title: z.string(),
    summary: z.string(),                       // one sentence, used on cards and in search
    level: z.enum(['essentials', 'deeper']),
    readingMinutes: z.number().int().positive(),
    prerequisites: z.array(z.string()).default([]),   // guide slugs
    observe: z.array(z.object({
      command: z.string(),
      explain: z.string(),
      output: z.string().optional()            // sample output, trimmed
    })).default([]),
    misconceptions: z.array(z.object({ myth: z.string(), reality: z.string() })).default([]),
    commands: z.array(z.string()).default([]),   // command page names
    scenarios: z.array(z.string()).default([]),  // scenario slugs
    references: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    draft: z.boolean().default(false)
  })
});
```

### 4.2 Changes to existing collections

- `scenarios`: add `concepts: z.array(z.string()).default([])`. The scenario page shows a **"Why this works"** block linking to those guides.
- `commands`: add the same `concepts` field. The command page shows **"Concepts behind this command"**.
- Guide pages show **"Where you'll run into this"**: the guide's own `scenarios` and `commands` lists, plus any scenario or command whose `concepts` includes this guide.

### 4.3 Body structure

Every guide uses these H2s, in this order:

1. `## The mental model`: one diagram and a short explanation.
2. `## Under the hood`: collapsed by default.
3. `## See it on your machine`: rendered from `observe`, with Anatomy on each command.
4. `## Common misconceptions`: rendered from `misconceptions`.
5. `## Where this shows up`: generated from the cross-links.

The body Markdown holds sections 1 and 2. The page template renders 3 to 5 from frontmatter.

### 4.4 Tracks

`apps/web/src/data/tracks.ts`, shaped like `modules.ts` (id, name, icon, color, description). The track list is in §6.

## 5. Widgets

Concept writing needs more diagrams than scenarios do. All widgets are data-driven (JSON props) and work in both themes and at 375px.

| Widget | Shows | Example guides |
|---|---|---|
| `Zones` (existing) | Grouped items, before/after | File descriptors, PATH |
| **`Layers`** (new) | A vertical stack with a highlighted path through it | Kernel vs user space, the network stack |
| **`Flow`** (new) | Ordered stages; can step through one at a time | Boot sequence, SSH handshake, pressing Enter |
| `FileTree` (plan §3.2) | Directory tree with notes | Filesystem layout, mounts |
| `PermissionGrid` (plan §3.2) | rwx matrix with octal value | Permissions model |

`FileTree` and `PermissionGrid` are already planned for scenarios. Whichever milestone gets to them first builds them.

## 6. Tracks and guides

The first pass is 35 guides. `E` = essentials, `D` = deeper.

### Track 1: The shell (`shell`)

| Slug | Guide | Level |
|---|---|---|
| `pressing-enter` | What happens when you press Enter (parse → expand → PATH lookup → fork/exec → wait) | E |
| `environment-variables` | Environment variables and how children inherit them | E |
| `path` | How PATH lookup works, and why `which` can lie | E |
| `standard-streams` | stdin, stdout, stderr, redirection and pipes | E |
| `quoting-expansion` | Quoting and expansion order (globs, `$var`, `$(...)`) | D |
| `shell-startup-files` | `.bashrc`, `.profile`, login and interactive shells | D |
| `exit-status` | Exit status, `&&`, `\|\|` and `set -e` (renamed from `exit-codes` in G1: the scenario has that slug) | E |

### Track 2: Filesystem (`filesystem`)

| Slug | Guide | Level |
|---|---|---|
| `everything-is-a-file` | Everything is a file (regular files, directories, devices, sockets, pipes) | E |
| `filesystem-layout` | The directory layout: `/etc`, `/var`, `/usr`, `/opt`, `/home`, `/tmp` | E |
| `inodes-links` | Inodes, hard links and symlinks | D |
| `mounts-devices` | Mounts, block devices and `/etc/fstab` | D |
| `proc-sys` | `/proc` and `/sys`: the kernel as a filesystem | D |

### Track 3: Permissions and users (`permissions`)

| Slug | Guide | Level |
|---|---|---|
| `permissions-model` | The rwx model for files and directories, and octal modes | E |
| `users-groups` | Users and groups: `/etc/passwd`, `/etc/group`, `/etc/shadow` | E |
| `how-sudo-works` | What sudo actually does (sudoers, the environment, root-owned files) | E |
| `setuid-capabilities` | setuid, setgid, the sticky bit and capabilities | D |

### Track 4: Processes (`processes`)

| Slug | Guide | Level |
|---|---|---|
| `processes-basics` | Processes, PIDs, the process tree and PID 1 | E |
| `signals` | Signals: TERM vs KILL, Ctrl+C, Ctrl+Z, SIGHUP | E |
| `file-descriptors` | File descriptors and open files (`/proc/<pid>/fd`, lsof) | D |
| `ports-sockets` | Ports and sockets: what "address already in use" means | E |
| `jobs-sessions` | Jobs, sessions and why closing the terminal kills things | D |

### Track 5: Kernel and boot (`kernel`)

| Slug | Guide | Level |
|---|---|---|
| `kernel-user-space` | Kernel space vs user space, and what the kernel does | E |
| `system-calls` | System calls: how programs ask the kernel for things (strace) | D |
| `boot-sequence` | Firmware → bootloader → kernel → initramfs → systemd | E |
| `kernel-modules` | Kernel modules and drivers | D |

### Track 6: Services and logs (`services`)

| Slug | Guide | Level |
|---|---|---|
| `systemd-units` | systemd units, targets and dependencies | E |
| `journald-logs` | Where logs live: journald and `/var/log` | E |
| `scheduled-tasks` | cron vs systemd timers | D |

### Track 7: Networking (`networking`)

| Slug | Guide | Level |
|---|---|---|
| `interfaces-ip` | Network interfaces, IP addresses and routes | E |
| `dns-resolution` | How a name becomes an IP (`/etc/hosts`, resolv.conf, systemd-resolved) | E |
| `how-ssh-works` | How SSH works: key exchange, host keys, `known_hosts`, user keys, the agent, `~/.ssh/config` | E |
| `firewall-basics` | Firewall basics: ufw and nftables at a high level | D |

### Track 8: Software and packages (`software`)

| Slug | Guide | Level |
|---|---|---|
| `what-is-a-package` | What a package is, how repositories work and why they're signed | E |
| `shared-libraries` | Shared libraries and "error while loading shared libraries" | D |
| `app-formats` | apt vs AppImage vs Snap vs Flatpak | E |

(If the first pass needs to be smaller, drop the `D` guides from tracks 5 to 8. That leaves 30.)

## 7. Phases

### Phase G0: Foundation and three pilot guides

- Add the `guides` collection, `tracks.ts`, and the `concepts` field on scenarios and commands.
- Routes: `/learn`, `/learn/[track]`, `/g/[slug]`. Add Learn to the header and a third entry point on the home page.
- Build the **Layers** and **Flow** widgets.
- Build checks:
  - every `observe` command classifies as `readonly`;
  - every guide, scenario and command slug referenced exists;
  - no two guides in a track share an `order`.
- Search: index guides by title, summary and misconceptions in `search.json.ts`.
- **Pilot guides** (these link to the 5 existing scenarios):
  - `permissions-model`: links `permission-denied-script`
  - `ports-sockets`: links `port-in-use`
  - `pressing-enter`: links `command-chaining`, `appimage-install`
- Add `concepts` to the 5 existing scenarios.

Review the pilots before writing more, to settle tone, depth and how the widgets get used.

**Done, waiting for your review.** Answers to §9: MDX (`@astrojs/mdx` 5.x, the line for Astro 6), Flow steppable from the start, the tagline changed to "Fix it, look it up, understand it." (one constant in `src/data/site.ts`, so it's easy to change again). The pilots link to 11 scenarios and 11 command pages, not only the original 5 scenarios, because 35 exist now. Extra build check: links inside guide bodies must point to real pages. Along the way, `Prose` learned `**bold**` and `[links](…)`, which fixed 9 scenario notes that were showing literal `**`. See `docs/handoff/2026-11-05-guides-phase-g0.md`.

### Phases G1 to G4: Tracks that line up with scenario modules

Ship each track with, or just after, its matching scenario phase, so new scenarios have concepts to link to.

**G1 is done and waiting for your review.** It adds the six other Shell guides: `environment-variables`, `path`, `standard-streams`, `quoting-expansion`, `shell-startup-files` and `exit-status`. 11 scenarios now link to them. See `docs/handoff/2026-11-05-guides-phase-g1.md`.

**G2 is done and waiting for your review.** It adds `processes-basics`, `signals`, `file-descriptors` and `jobs-sessions` to the Processes track, and the whole Services and logs track: `systemd-units`, `journald-logs` and `scheduled-tasks`. 9 scenarios link to them, and the rule engine now rates a few more inspection commands as read-only (`kill -l`, `crontab -l`, `systemd-analyze calendar` and others). See `docs/handoff/2026-11-05-guides-phase-g2.md`.

**G3 is done and waiting for your review.** It adds the whole Filesystem track (`everything-is-a-file`, `filesystem-layout`, `inodes-links`, `mounts-devices`, `proc-sys`) and the rest of Permissions (`users-groups`, `how-sudo-works`, `setuid-capabilities`). 13 scenarios and 8 command pages link to them, and the rule engine now rates `namei`, `getcap`, read-only `sysctl`, `capsh --print`/`--decode` and `sudo -l` as read-only. Two sample outputs in `mounts-devices` (`lsblk`, `fstab`) are composed for a laptop because WSL has no partitions. See `docs/handoff/2026-11-05-guides-phase-g3.md`.

**G4 is done and waiting for your review.** It adds the whole Software and packages track: `what-is-a-package`, `shared-libraries` and `app-formats`. All 7 package-related scenarios and the `apt`, `apt-cache`, `apt-file` and `dpkg` command pages link to them. The rule engine now rates `ldd`, `ldconfig -p`, `gpgv`, `readelf` and `objdump` as read-only. Every sample output comes from the machine; Snap, Flatpak and AppImage details WSL can't show are in the prose, from cited docs. See `docs/handoff/2026-11-05-guides-phase-g4.md`.

| Guide phase | Tracks | Ships with scenarios-plan phase |
|---|---|---|
| G1 | Shell (rest) | Phase 1: Everyday Rescue, Decode Agent Commands |
| G2 | Processes (rest), Services and logs | Phase 2: Processes & Ports |
| G3 | Filesystem, Permissions (rest) | Phase 3: Files & Permissions |
| G4 | Software and packages | Phase 4: Packages |

### Phases G5 and G6: Tracks with no scenario module yet

- **G5:** Kernel and boot. **Done, waiting for your review.** It adds `kernel-user-space`, `system-calls`, `boot-sequence` and `kernel-modules`. 4 scenarios and the `journalctl`, `systemctl`, `top` and `free` command pages link to them. The rule engine now rates `modinfo`, `lsinitramfs` and `modprobe -D` as read-only, treats `strace` as a wrapper, and rates `dmesg -C` (which was wrongly read-only) and `modprobe` as elevated. Three `boot-sequence` outputs (`systemd-analyze`, `/proc/cmdline`, `ls /boot`) are composed for a real install, and the strace sample is formatted from a real trace. See `docs/handoff/2026-11-05-guides-phase-g5.md`.
- **G6:** Networking. **Done, waiting for your review.** It adds `interfaces-ip`, `dns-resolution`, `how-ssh-works` and `firewall-basics`. 8 scenarios and the `ss`, `curl`, `systemctl`, `journalctl`, `chmod` and `sudo` command pages link to them. The rule engine now rates abbreviated `ip` verbs (`ip r a`, `ip link s`), `nmcli` changes, `ss -K`, `hostnamectl set-hostname`, `ifconfig eth0 down` and `route add` as elevated (all were wrongly read-only), and `resolvectl`, `networkctl`, `ssh -G`, `ssh-keyscan`, `ssh-keygen -l`/`-F` and the listing forms of `ufw`, `nft`, `iptables` and `firewall-cmd` as read-only. Eight outputs are composed or edited for a laptop (NetworkManager, the resolver stub, `dig`, `~/.ssh`, `ufw status`). See `docs/handoff/2026-11-05-guides-phase-g6.md`, which also lists what's needed before the PR into `main`.

**All guide phases are done: 35 guides in 8 tracks.**

These may later get their own scenario modules, such as an "SSH & Remote" module (`Permission denied (publickey)`, `REMOTE HOST IDENTIFICATION HAS CHANGED`, setting up key login). That's a separate decision; see §9. `how-ssh-works` doesn't depend on it: its error table is a ready list of scenarios, and each one would link back through `concepts`.

## 8. Definition of done (each phase)

1. `pnpm test`, `pnpm check` and `pnpm build` pass, with no `[content]` warnings.
2. A browser check of each new guide at desktop width and at 375px, in light and dark: widgets, Under the hood collapse, observe commands with Anatomy, misconceptions, cross-links.
3. Every new guide is reachable from `/learn` and from at least one scenario or command page, and search finds it.
4. Every factual claim is checked against a cited reference or a real machine.
5. A handoff file in `docs/handoff/`. Then a commit, once you've reviewed the phase.

## 9. Open questions for Jd

1. **Tagline.** Change "Linux Command Survival Guide" to something like "Fix it, look it up, understand it"?
2. **MDX or Markdown.** MDX gives inline widgets but adds an integration. Is it worth it?
3. **SSH & Remote module.** Add a sixth scenario module alongside G6?
4. **Interactive depth.** Should Flow diagrams be steppable from the start (click through the boot stages), or start static?
5. **Linux Basics sandbox (plan §3.3).** Its concept tabs ("What is PATH?", "stdin/stdout/stderr" and so on) become links to the guides here, rather than separate content. Agree?
