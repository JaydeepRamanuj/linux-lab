# Handoff · 2026-11-04 · Scenarios Phase 4: Packages (#23–26)

**Task:** Phase 4 of `docs/scenarios-plan.md`: four Packages scenarios and the command pages they use.

Read `docs/scenarios-plan.md` first, then `2026-11-04-scenarios-phase-3.md`, `-phase-2.md`, `-phase-1.md` and `-phase-0.md`.

**Status:** Phase 4 is done. `pnpm test` (293 tests, 20 of them new), `pnpm check` (0 errors, 0 warnings; the 2 hints are in `SearchBar.tsx` and `anatomy.ts`, untouched here) and `pnpm build` (90 pages) pass, with zero `[content]` warnings. Not browser-checked. Branch `scenarios/phase-4`, cut from `origin/scenarios/phase-3`. Next is **Phase 5 (Decode Agent Commands part 1, #27–31)**.

## What's built

| # | Scenario | Severity | Primary command |
|---|---|---|---|
| 23 | `fix-broken-install` | elevated | `sudo apt --fix-broken install` |
| 24 | `remove-package` | elevated | `sudo apt purge --autoremove nginx` |
| 25 | `install-deb` | elevated | `sudo apt install ./pixelpad_2.3.1_amd64.deb` |
| 26 | `which-package` | readonly | `apt-file search bin/ifconfig` |

All severities match the plan. #23 and #25 share a story: #25's replay shows `dpkg -i` breaking the install, and #23 fixes it.

**New command pages (3):** `apt-file`, `apt-cache`, plus `readlink` (used in `which-package` to follow the alternatives link behind `awk`). `apt-cache` lists no scenarios: none of the four needs it in a step, and `apt show` reads better for beginners. It's linked from `apt`, `apt-file` and `dpkg`.

**Updated pages:**
- **`apt` and `dpkg`:** rewritten with new flags, examples and gotchas: `./file.deb`, `purge --autoremove`, `-s`, `'~c'`, `dpkg -I`, `--audit`, the `dpkg -S` substring and alternatives gotchas, and `ii`/`rc`/`iU`.
- **Back-links:** `which`, `grep`, `ls`. **`related` links:** `which` → `dpkg`, `readlink`; `ln` → `readlink`.

**Cross-links:** `apt-lock` → `fix-broken-install`; `command-not-found` → `which-package`; `appimage-install` → `install-deb`; `disk-full` → `remove-package`.

## `distros` on package-tool pages

The plan asked for `dnf`/`pacman` equivalents in `distros`, but that section's heading was hard-coded as "Install it", which is wrong for `apt` itself. I added an optional `distrosTitle` to the command schema (`content.config.ts`), and `pages/c/[slug].astro` uses it, defaulting to "Install it". `apt` uses "Same job on other distros"; `dpkg`, `apt-file` and `apt-cache` use "Same lookup on other distros". Existing pages (`ncdu`, `rg`, …) are unchanged.

## Rule engine changes (`packages/core/src/rules/system.ts`, with 20 new tests)

- **`dpkg --remove` / `--unpack` / `--triggers-only` are elevated.** Before, only the short forms counted, so `dpkg --remove --force-remove-reinstreq pkg` came back **readonly**. That was too lenient, and it was the only wrong verdict in this phase in that direction.
- **`apt`/`apt-get`/`aptitude` with `-s`, `--simulate`, `--dry-run`, `--just-print`, `--no-act` or `--recon` are readonly.** They only print the plan and run without root. `remove-package` recommends `apt remove -s python3` as a preview. With `sudo` in front it's still elevated (the sudo rule).
- **`apt-mark`:** `showmanual`/`showauto`/`showhold` are readonly. `manual`/`auto`/`hold`/… are elevated, because they change what `autoremove` and upgrades do system-wide. Before, all of `apt-mark` fell through to modifies.

Left alone and worth a look: `dpkg-deb -I/-c` (reading a .deb) comes back modifies; the content uses `dpkg -I`/`-c`, which are readonly. `apt-get check` is elevated, though it only checks. `apt-file update` without `sudo` is readonly, but it fails without root anyway, and the content always shows it with `sudo`.

## Where outputs came from

You asked for anything that changes packages to be written from knowledge. I could do better than that without touching the container's package database. These were the methods:

1. **Real read-only commands** on the container (Ubuntu 24.04.5, apt 2.8.3, dpkg 1.22).
2. **apt with a separate config** (`APT_CONFIG`): its own `sources.list`, package lists, cache and state in the scratchpad. I ran `apt-get update` into scratch lists from archive.ubuntu.com. The real `/var/lib/apt/lists` stayed empty, as it was at the start.
3. **A fake dpkg root** (`dpkg --root=<scratch>`), seeded with a copy of the container's `/var/lib/dpkg/status` and `info/`. apt drove dpkg inside it via `DPkg::Options::=--root=…`. **No maintainer scripts ran:** the stand-in .deb has none, the nginx debs were repacked without theirs, the libc++ debs have none, and I emptied the fake root's `ldconfig` and file trigger interests so dpkg never tried to run libc-bin's script. (An earlier attempt to extract an Ubuntu base image and chroot into it was blocked by the permission classifier, so I didn't pursue it.)

Afterwards, `dpkg --audit` on the real system is clean, nothing from these tests is in the real `/opt` or `/usr`, and every scratch tree, `/tmp/sg4`, and the 800 MB Contents file are deleted. In every output, the user is `jd` and the path is `/home/jd`. The "files and directories currently installed" counts (~56k) are the container's, not a desktop's.

- **`pixelpad_2.3.1_amd64.deb` is a stand-in** I built with `dpkg-deb`: a stub binary, a `.desktop` file and a 2.3 MB filler library. It has no maintainer scripts. Its `Depends` line uses real noble packages. On a stock Ubuntu desktop only `libc++1` is missing, and that's what the output shows. Vendor download sites (discord.com, dl.google.com, github.com) are blocked by the proxy, so I couldn't use a real vendor .deb.
- **`fix-broken-install`:** all real. That covers the `dpkg -i` replay and the `apt install htop` unmet-dependencies error, both run in the fake root. `dpkg --audit`, the `--fix-broken install` run (unpack and `Setting up …` lines) and `dpkg -l pixelpad` (at `COLUMNS=80`, through `script`) are also real. **Three edits:**
  - "Need to get 421 kB of archives." comes from a `--download-only` run with an empty cache. The real install run said "0 B/421 kB" because the files were already cached.
  - **"Processing triggers for libc-bin (2.39-0ubuntu8.9) ..." is from knowledge.** A real system prints it. I suppressed the trigger, and took the version from the container.
  - The Get/Unpack lines are cut to `…`.

  The claim that Ubuntu 24.04 has no `libappindicator1` is real: `apt-cache policy` shows no candidate.
- **`remove-package`:** real nginx 1.24.0-2ubuntu7.19 and nginx-common debs from noble-updates, repacked without maintainer scripts and installed into the fake root. Before that, `apt install -s nginx` in the fake root planned exactly `nginx nginx-common`, the same as on a desktop: I added real `iproute2`/`libbpf1`/`libatm1t64` status entries, which desktops have. I marked `nginx-common` automatic in `extended_states`, as apt would. These outputs are real apt/dpkg runs through `script`, with `SUDO_USER=jd` so apt prints `sudo apt autoremove`:
  - `apt list --installed 'nginx*'`;
  - `purge --autoremove`;
  - `remove` → "no longer required" → `autoremove`;
  - `dpkg -l | grep '^rc'`;
  - `apt purge '~c'`;
  - the `ls /etc/nginx` listing and the "No such file or directory" afterwards.

  The python3 claim (40 packages on a minimal install, including `software-properties-common`) is a real `apt remove -s python3` against the container's status. "On a desktop it's many more" is from knowledge. **Not shown:** the real nginx scripts stop the service and, on purge, clean up `/var/log/nginx` and the `sites-enabled/default` link. A real run might also print "Processing triggers for man-db". I left those out rather than invent output.
- **`install-deb`:** `dpkg -I` is real. The `apt install ./…deb` run is real, in the fake root, with the .deb in a uid-1000 `home/jd/Downloads` at mode 750 under a throwaway `/tmp/sg4`. That's how the **`N: Download is performed unsandboxed as root …`** notice was produced for real. The run in the root-only scratchpad printed a `W:` about apt's cache dir instead, which is why I used `/tmp/sg4`. "Need to get 421 kB/2723 kB" and "Note, selecting 'pixelpad' instead of …" are real. `dpkg -L pixelpad | grep bin/`, the "Unable to locate package" error (through `script`) and `dpkg --print-architecture` are real.
- **`which-package`:** everything about dpkg is real on the container: `dpkg -S "$(which rg)"`, the `awk` alternatives miss and `readlink -f` fix, `ls -l /usr/bin/awk`, and `dpkg -S bin/rg` also matching `rgrep`. `apt show net-tools` is real, against the scratch lists. **apt-file isn't installed**, and installing it would change the system. Its answers are real data: I grepped the noble `Contents-amd64.gz` (the file apt-file downloads). Examples: `bin/ifconfig` → net-tools only, a bare `ifconfig` → 49 lines from 34 packages, `bin/convert` → 59 lines, and `--regexp 'bin/convert$'` → only `graphicsmagick-imagemagick-compat`. **The `package: /path` output format is from knowledge**, as is Ubuntu's `Command 'ifconfig' not found, but can be installed with:` message in the replay. I switched from `dig` to `ifconfig` because `bind9-dnsutils` is `Priority: standard`, so `dig` may already be on a desktop.

## Checks without a browser

- All four cards are in `dist/index.html` (26 scenarios now) and `dist/m/packages/index.html` (5).
- Search (the site's Fuse settings over `dist/search.json`) ranks each scenario first for several of its symptoms:
  - `fix-broken-install`: "unmet dependencies", "dpkg was interrupted", "dependency problems - leaving unconfigured", "broken packages".
  - `remove-package`: "is no longer required", "config files left after uninstall", "remove completely".
  - `install-deb`: "install deb", ".deb file", "Unable to locate package", "unsandboxed as root".
  - `which-package`: "which package provides", "ifconfig command not found", "no path found matching pattern", "dpkg -S".

  For "uninstall package" and "autoremove", `/c/apt` comes first and `remove-package` second.
- The anatomy notes for the primary commands render, and the `distrosTitle` heading shows on `apt`/`dpkg`/`apt-file`; `ncdu` still says "Install it".

## Gotchas

- **YAML:** `apt-cache.yaml` failed to parse twice, both times on an unquoted plain value containing `: ` (the summary and a gotcha starting with a backtick). `dpkg -I` output starts with a space, so it needs `output: |2`.
- **`dpkg -l | grep …` prints ~170-character lines** when piped, whatever `COLUMNS` says. `dpkg -l NAME` on a terminal fits 80 columns. The `rc` step keeps the wide real line.
- **apt prints `Use 'sudo apt autoremove'` only when `SUDO_USER` is set.** Run as root directly, it says `Use 'apt autoremove'`.
- **Scratchpad again:** it's root-only, so apt's `_apt` sandbox user can't read anything in it. Use a world-traversable throwaway dir for anything that needs another user.
- Process check at the end: no `apt`, `dpkg`, `script` or test servers left running.

## Pages to check on the Vercel preview

Scenarios: `/s/fix-broken-install/`, `/s/remove-package/`, `/s/install-deb/`, `/s/which-package/`

New commands: `/c/apt-file/`, `/c/apt-cache/`, `/c/readlink/`

Changed: `/c/apt/`, `/c/dpkg/`, `/c/which/`, `/c/grep/`, `/c/ls/`, `/c/ln/`, `/s/apt-lock/`, `/s/command-not-found/`, `/s/appimage-install/`, `/s/disk-full/`, `/m/packages/`, home page. `/c/ncdu/` too, to confirm "Install it" still shows.

## Next: Phase 5

Scenarios #27–31 (`redirection`, `expansion-quoting`, `find-exec-xargs`, `sed-awk`, `heredocs`). New pages: `xargs`, `sed`, `awk`, `cat`, `tee`. Update `find`. Phase 3 left `sed -i`/`awk` as modifies under `find -exec` on purpose. Check what the engine says for `sed -i` and `awk` on their own before writing #30.
