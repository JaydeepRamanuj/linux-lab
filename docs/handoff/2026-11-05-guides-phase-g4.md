# Handoff · 2026-11-05 · Guides Phase G4: Software and packages

**Task:** Phase G4 of `docs/guides-plan.md`, the Software and packages track (plan §6, track 8). Read `docs/guides-plan.md` first, then the G0 to G3 handoffs, then this file.

**Status:** committed on branch `guides/phase-g0` on top of G3 (da4b21e) and pushed. Still no PR: one large PR into `main` once every guide phase is done. Everything below passes:

- **Tests:** 418 pass (`npx vitest run` in `packages/core`), 12 more than G3, all from the rule engine change below.
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** 144 pages (141 plus the 3 guides). No `[content]` warnings.
- **Browser** (dev server at 375px):
  - the 3 guides, `/learn/software`, the 7 linked scenarios and 4 command pages return 200;
  - no guide scrolls sideways, and no table runs past its column (see the comparison fix below);
  - each guide has the six H2s in order, and "Under the hood" is collapsed;
  - Zones renders; Flow steps through (Step through → "1 / 6"); no console errors;
  - `search.json` has all 3 guides.

## What was added

| Guide | Track, order, level | Widgets | Linked from (scenario `concepts`) | Command pages (guide `commands`) |
|---|---|---|---|---|
| `what-is-a-package` | Software 1, E, 8 min | Flow (apt update → installed), Zones (inside a .deb) | `install-deb`, `fix-broken-install`, `remove-package`, `which-package`, `apt-lock`, `curl-pipe-bash` | apt, apt-cache, apt-file, dpkg |
| `shared-libraries` | Software 2, D, 7 min | Flow (before `main()` runs), table of the two errors | `appimage-install`, `install-deb`, `fix-broken-install` | dpkg, apt-file, apt-cache |
| `app-formats` | Software 3, E, 7 min | Zones (who supplies the libraries), a list comparing the four | `appimage-install`, `install-deb`, `remove-package` | apt, apt-cache, dpkg |

**Command pages with new `concepts`:** `apt` → what-is-a-package, app-formats; `apt-cache` → what-is-a-package; `apt-file` and `dpkg` → what-is-a-package, shared-libraries.

**Prerequisites:** what-is-a-package needs filesystem-layout and how-sudo-works; shared-libraries needs what-is-a-package and pressing-enter; app-formats needs what-is-a-package.

**Links instead of repeats:**
- where package files land, and `dpkg -L`/`-S`: `filesystem-layout`;
- snap loop devices and FUSE: `mounts-devices`;
- the apt lock: `file-descriptors` and the `apt-lock` scenario;
- unattended upgrades: `scheduled-tasks`;
- `rc` packages and autoremove: the `remove-package` scenario.

**Scenario candidates:** all seven are linked. `which-package` and `apt-lock` link only `what-is-a-package`: they're about apt's database and lock, not libraries or formats. `curl-pipe-bash` links `what-is-a-package` because its NodeSource example adds a repository, a key and pin files, which that guide explains.

## Rule engine change

`packages/core/src/rules/base.ts` now rates these as read-only, each with tests and counter-cases in `rules.test.ts`:

- `gpgv`, `readelf`, `objdump` (added to the read-only list);
- `ldconfig` with only `-p`, `--print-cache`, `-V` or `--version`. Plain `ldconfig` and `-v` rebuild the cache and stay `modifies`; `sudo ldconfig` is `elevated`;
- `ldd`, with its own message: it lists libraries, but should only be used on trusted programs, because for some files it runs them. That's ldd(1)'s security note, and the guide repeats it.

Not changed: `snap version`, `snap connections` and `flatpak remotes` still rate `elevated` ("isn't in ShellGyan's list yet"), and `dpkg-deb -I`/`-c` and `ar t` rate `modifies`. No observe command uses them, so I left them alone rather than widen this phase. They'd be easy to add if `/explain` should know them.

## Accuracy: checked on Ubuntu 24.04.4 (WSL 2), apt 2.8.3, dpkg 1.22.6, glibc 2.39, snapd 2.76

**Edits to sample outputs:**

- `snap info firefox` is trimmed to 16 lines. WSL prints `Mozilla**` for the verified mark, which is what the output shows; the explain text says most terminals show a tick.
- `ldd /usr/bin/ls` keeps the real tab indentation and addresses.
- In the `LD_DEBUG=libs` block in `shared-libraries`, the program is shown as `./app`. The real test used a copy of `ls` with `libselinux.so.1` changed to `libselinuy.so.1` in the binary. The search path is shortened with `…`.
- `cat /etc/ld.so.conf.d/*.conf` isn't an observe command, because WSL adds `ld.wsl.conf` (`/usr/lib/wsl/lib`). The guide names only `libc.conf` and `/usr/local/lib`, which are Ubuntu's.
- **No composed outputs this phase.** Every observe output comes from the machine. Snap, Flatpak and AppImage behaviour that WSL can't show is in the prose, from the sources below, and the observe commands stick to what's real here: `apt-cache` and `snap info`, which query the Store live.

**What the checks confirmed:**

- **Sources and signatures:** `ubuntu.sources` (deb822) with `Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg`; `/etc/apt/keyrings/` exists and is empty; `trusted.gpg.d` holds two Ubuntu keys. `gpgv` against the keyring: "Good signature from Ubuntu Archive Automatic Signing Key (2018)", key `F6ECB376…991BC93C`, matching `gpg --show-keys` on the keyring. `InRelease` lists `main/binary-amd64/Packages` with size and SHA256. The `Packages` entry for `openssl_3.0.13-0ubuntu3.16_amd64.deb` gives SHA256 `675b8497…`, and `sha256sum` of the cached file in `/var/cache/apt/archives` matches. `apt-config dump`: `AllowInsecureRepositories "0"`.
- **A repository with no key:** `apt-get update` against `deb.nodesource.com` with a private state folder in `/tmp` (no root, the system's lists untouched, the folder deleted afterwards) gave the exact `NO_PUBKEY 2F59B5F99B1BE0B4` and "is not signed" lines quoted in the guide.
- **Package contents:** `ar t` lists `debian-binary`, `control.tar.zst`, `data.tar.zst`; `dpkg-deb -I` shows `conffiles`, `control`, `md5sums`, `postinst`. `/var/lib/dpkg/info/cron.*` has the seven files shown; `cron.postinst` runs `dpkg-statoverride` and `deb-systemd-helper`; `dpkg -L cron` is 47 paths, 25 of them files. `dpkg --verify` on coreutils and cron prints nothing (exit 0).
- **Versions and priorities:** `apt-cache policy coreutils` (shown); backports at 100; `firefox` is `1:1snap1-0ubuntu5`, "Transitional package - firefox -> firefox snap", Pre-Depends `snapd`; `dpkg --compare-versions 1:1snap1-0ubuntu5 gt 140.0-1` is true. Package counts: `noble` main 6,099, universe 64,755.
- **State:** `/var/lib/dpkg/status` has 529 entries; `extended_states` marks cron `Auto-Installed: 1`; 22 manual, 507 auto.
- **Libraries:**
  - `file`, `readelf -d`, `ldd` and `ldconfig -p` (281 entries) outputs are as shown.
  - `libz.so.1` → `libz.so.1.3`. On 24.04, `libssl.so.3` is a plain file, not a link, so the guide uses zlib for the symlink example.
  - The sonames come from `readelf`. `dpkg -S` gives `zlib1g` and `libssl3t64`; `libssl3t64` Provides/Replaces `libssl3`, and `libfuse2t64` Provides `libfuse2`.
  - `ld.so.conf.d` has `libc.conf` with `/usr/local/lib` and the multiarch file.
  - A missing library gives the exact error and exit 127. `LD_DEBUG=libs` shows the cache first, then the hwcaps and default folders.
  - `objdump -T /usr/bin/ls` needs at most `GLIBC_2.38`. `curl` needs at most 2.34.
  - `/proc/$$/maps` for bash shows `ld-linux`, `libc`, `libtinfo`.
  - `libfuse3-3` is installed and `libfuse2t64` isn't.
- **Snap:** `snap refresh --time` gives `timer: 00:00~24:00/4`; `snap help refresh` documents `--hold`; `snap help revert` says it reactivates the previous revision with its data; `snap help install` documents `--classic`, `--devmode`, `--dangerous`; `snap debug confinement` on WSL prints `partial`. `/snap/README` and `apps-bin-path.sh` are quoted directly. `ubuntu-desktop-minimal` Recommends `snapd`. `flatpak` is in universe, not installed.
- **AppImage:** the type2-runtime source (`runtime.c` on GitHub) has `--appimage-extract`, `--appimage-extract-and-run` and the `/.mount_<name>XXXXXX` template. Its README says it's statically linked and that "libfuse2 is no longer required on the target system".
- **Flatpak** (docs.flatpak.org): the default sandbox has no network and no host files except the app's own folders under `~/.var/app/`; portals as described; flatpak(1) gives `/var/lib/flatpak` (system) and `$XDG_DATA_HOME/flatpak` (user); `--user` needs no root.

**Not checked on the machine** (general knowledge, please skim):

- Fedora and Arch signing each package file;
- Linux Mint shipping Flatpak and disabling snap support;
- Mozilla's own apt repository;
- Flathub's verified badge;
- many Flatpaks requesting the whole home folder;
- snaps being slower only on first start;
- most Go programs being statically linked.

**One side effect:** the first `gpg --show-keys` run created `~/.gnupg/` (an empty `pubring.kbx`) in jd's WSL home. My cleanup command was blocked by the permission classifier, so it's still there. It's harmless; `rm -r ~/.gnupg` removes it if you don't use gpg there.

**References:** all 17 return 200. Dropped because they couldn't be reached from this machine: debian.org (Policy manual, both chapters) and docs.appimage.org reset the connection, the same kind of network problem as kernel.org and freedesktop.org in earlier phases. help.ubuntu.com/community/Repositories/Ubuntu 404s. The two snapcraft.io/docs pages return 200 but now serve a "you should have been redirected" page pointing at Canonical's new docs host, which redirected the fetch tool to a login page. They're the URLs Canonical links to, so I kept them. **Click them once** to check they land somewhere useful in a normal browser.

## Fixes along the way

- **The app-formats comparison** was first a 5-column table, 448px wide in a 293px column at 375px. It's now one short list entry per format.
- **The Zones caption** said "left to right", which is wrong on a phone, where the zones stack. It now says "from apt to AppImage".

## For your review

1. **The rule engine change**, especially `ldd` being read-only with its warning message.
2. **The snapcraft.io reference links** (above).
3. **Length:** `what-is-a-package` is 8 minutes, as Essentials: the signing chain, repository layout and adding a third-party repository all felt necessary.
4. **The "Not checked" list** above.

## Environment gotchas

Same as G1 to G3. The dev server got 4321. New this time:

- A heredoc inside `python3 - <<'EOF' … || node -e "…"` swallowed the rest of the command. Write scripts with the Write tool instead.
- The permission classifier blocks `rm -rf` on anything in the WSL home folder, even a folder the session just made.
- `snap` prints `**` instead of a tick even under `script` with `LANG=C.UTF-8`.

## Next

1. Fold in any feedback from Jd's review of G1 to G4 on the preview.
2. **G5: Kernel and boot** (plan §6, track 5): `kernel-user-space`, `system-calls`, `boot-sequence`, `kernel-modules`. There's no matching scenario module, so links will come mostly from command pages and from existing guides (`proc-sys`, `systemd-units`, `mounts-devices`, `setuid-capabilities`). `strace` isn't installed in the WSL image, and WSL has no real boot (no GRUB, no initramfs, `/init` as PID 1 under systemd), so `boot-sequence` will need sample outputs composed for a real install and flagged.
3. Commit each phase to `guides/phase-g0` and push. Don't open a PR.
