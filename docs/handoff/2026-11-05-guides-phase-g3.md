# Handoff · 2026-11-05 · Guides Phase G3: Filesystem and Permissions

**Task:** Phase G3 of `docs/guides-plan.md`: the whole Filesystem track and the rest of Permissions (plan §6, tracks 2 and 3). Read `docs/guides-plan.md` first, then the G0, G1 and G2 handoffs, then this file.

**Status:** committed on branch `guides/phase-g0` on top of G2 (dcd0098) and pushed. Still no PR: one large PR into `main` once every guide phase is done. Everything below passes:

- **Tests:** 406 pass (`npx vitest run` in `packages/core`), 22 more than G2, all from the rule engine change below.
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** 141 pages (133 plus the 8 guides), no `[content]` warnings.
- **Browser** (dev server at 375px):
  - the 8 guides return 200, none scrolls sideways, and no table runs past its column;
  - each has the six H2s in order, and "Under the hood" is collapsed;
  - no literal `**` or `](` in the rendered text (misconceptions use links);
  - Layers renders; Flow steps through (Step through, Next ×2 → "3 / 6"); no console errors;
  - 8 scenario pages, `/c/sudo`, `/c/ln`, `/learn/filesystem` and `/learn/permissions` link to the new guides; `search.json` has all 8.

## What was added

| Guide | Track, order, level | Widgets | Linked from (scenario `concepts`) | Command pages |
|---|---|---|---|---|
| `everything-is-a-file` | Filesystem 1, E | Zones (the 7 types), table | `redirection` | ls, stat, cat |
| `filesystem-layout` | Filesystem 2, E | Zones (who writes where), table | `disk-full`, `find-files`, `extract-archive`, `appimage-install`, `add-to-path`, `install-deb` | ls, du, df, dpkg |
| `inodes-links` | Filesystem 3, D | Zones (names → inodes), 2 tables | `safe-mv-cp`, `symlink-shortcut` | ln, ls, stat, readlink, find, mv, cp, rm, du |
| `mounts-devices` | Filesystem 4, D | Layers (path → mount → fs → device), Flow (fstab at boot) | `disk-full`, `appimage-install` | df, du, lsof |
| `proc-sys` | Filesystem 5, D | Layers (`free` reading meminfo), 2 tables | `cpu-ram-hog` | cat, ps, top, free, lsof |
| `users-groups` | Permissions 2, E | Flow (login), table | `root-owned-files` | chown, ls, stat |
| `how-sudo-works` | Permissions 3, E | Flow (`sudo apt update`), table | `root-owned-files`, `curl-pipe-bash` | sudo, tee, env, chown |
| `setuid-capabilities` | Permissions 4, D | Zones (real vs effective UID), table | `chmod-numbers` | chmod, ls, stat, find, sudo |

Command pages with new `concepts`: `ln`, `readlink`, `stat` → inodes-links; `df` → mounts-devices; `free` → proc-sys; `sudo` → how-sudo-works; `chown` → users-groups; `chmod` → setuid-capabilities.

**Prerequisites:** everything-is-a-file ← standard-streams; filesystem-layout ← everything-is-a-file; inodes-links ← everything-is-a-file; mounts-devices ← everything-is-a-file, filesystem-layout; proc-sys ← everything-is-a-file, processes-basics; users-groups ← permissions-model; how-sudo-works ← users-groups, environment-variables; setuid-capabilities ← permissions-model, how-sudo-works.

**Scenario candidates not linked:** `permission-denied-script` already links `permissions-model` (which covers `noexec` and the exec bit), and nothing in it is about the new guides. `inodes-links` links to `file-descriptors` for deleted-but-open files instead of repeating it.

## Rule engine change

`packages/core/src/rules/base.ts` and `remote.ts` now rate these as read-only, each with tests and counter-cases in `rules.test.ts`:

- `namei`, `getcap` (`setcap` stays `modifies`);
- `sysctl` when it only reads: no `-w`, no `name=value`, no `-p`, `--load` or `--system`;
- `capsh` with only `--print`, `--decode=`, `--supports=` or `--explain=` (plain `capsh` and `capsh -- -c …` stay `modifies`);
- `sudo -l`, `-ll`, `--list`, `-V`, `--version` with no command after them. Before, `sudo -l` was `elevated` with the message "Opens a root shell", which was wrong. `sudo -l cmd` stays `elevated`.

## Accuracy: checked on Ubuntu 24.04.4 (WSL 2, kernel 6.6), util-linux 2.39, sudo 1.9.15p5

**Edits to sample outputs:**

- The hostname `TOP-IT-354` became `laptop` (`sudo -l`, `journalctl`).
- `ls /` leaves out WSL's own `init` and `wsl*` folders; the layout comes from running `ls -C` at 60 columns on the remaining names.
- `systemctl list-units --type=mount` leaves out WSL mounts and has narrower column padding.
- `find -perm -4000` leaves out `/usr/lib/landscape/apt-update`, which comes with the WSL image.
- `find /run -type s` is trimmed, in its original order.
- **Composed, not from the machine:** `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS` and `grep -v '^#' /etc/fstab` in `mounts-devices`. WSL has unpartitioned virtual disks and an "UNCONFIGURED FSTAB", so a real laptop layout was written by hand: NVMe, 1G EFI vfat, ext4 root, two snap loop devices, UUID lines like the Ubuntu installer writes, `/swap.img`. The column format follows WSL's real `lsblk` output. **Please compare these two with a real Ubuntu install.**
- jd's login shell is zsh on the test machine. It's left as is, and the explain text says Ubuntu's default is bash.

**What the checks confirmed:**

- **File types:** `stat %F` showed all seven types from real paths (`/run/systemd/notify` socket, `/run/initctl` FIFO). `/dev/null` is `1, 3`, `/dev/zero` `1, 5`, `/dev/urandom` `1, 9`, `/dev/sda` `8, 0`. `/dev/stdin` → `/proc/self/fd/0`. `cat /etc` → `Is a directory`.
- **Layout:** `/bin`, `/lib`, `/lib64`, `/sbin` are symlinks into `/usr`; `dpkg -S /bin/ls` finds nothing, `/usr/bin/ls` → coreutils; `/etc/passwd` belongs to no package. `/tmp` is on the root ext4 (no `tmp.mount`); `/usr/lib/tmpfiles.d/tmp.conf` is `D /tmp 1777 root root 30d` with the `/var/tmp` line commented out; `systemd-tmpfiles-setup` runs `--create --remove --boot`. `/run`, `/dev/shm` are tmpfs. `/root` is `700`.
- **Inodes and links:** a hard link shares the inode and raises the link count; deleting the first name leaves the second readable and breaks the symlink. Folder link count 2, then 4 after two subfolders. `ln dir` → `hard link not allowed for directory`. Hard link to `/mnt/c` → `Invalid cross-device link`. `mv` within a filesystem keeps the inode, `mv` to `/dev/shm` gave a new one, `cp` makes a new one, `sed -i` makes a new one (the other hard link kept the old text), `echo >` keeps it. A 9-byte symlink used 0 blocks, a 67-byte one 8. `chmod` on a symlink changed the target. `du` counted a hard-linked 1 MB file once, `--count-links` twice. `ln /etc/passwd` → `Operation not permitted` (`fs.protected_hardlinks = 1`). Perl is hard-linked (inode 2587). `/` is inode 2, `/proc` 1. ext4 reserved blocks: 13421772 of 268435456 (5%), uid 0.
- **Mounts:** `systemd-fstab-generator` exists and `/run/systemd/generator/` has `local-fs.target.wants`; `-.mount` and friends listed; `/etc/mtab` → `../proc/self/mounts`; `findmnt --verify` prints "Success, no errors or warnings detected"; `/run` and `/dev/shm` are `nosuid,nodev`; `/proc/filesystems` lists `nodev` types.
- **/proc and /sys:** `/proc/meminfo` is size 0 and 1475 bytes when read; `/proc/sys` files are `644 root`, and writing as a user → Permission denied; `sysctl.d` files in `/etc` and `/usr/lib` (including `50-pid-max.conf` and `99-protect-links.conf`); `systemd-sysctl.service` runs `/usr/lib/systemd/systemd-sysctl`; `max_user_watches` 524288; `/sys/class/net/eth0` is a symlink into `/sys/devices`.
- **Users:** login.defs values; 24 `nologin` accounts; `jd:x:1000:` has no members; `/etc/shadow` is `640 root:shadow`; jd's hash is `$y$` (yescrypt from `common-password`) while login.defs says SHA512; root's field is `*`; the change date 20518 matches the file date; `nsswitch` is `files systemd`.
- **sudo** (read as root, no password used): sudoers has `env_reset`, `mail_badpass`, `secure_path`, `use_pty`, `%admin`, `%sudo`, `@includedir`; `visudo -c` parses OK; `sudo -V` reports a 15-minute timeout of type `tty` in `/run/sudo/ts` and the `~/.sudo_as_admin_successful` path; `/etc/bash.bashrc` line 44 checks that file; `sudo -u jd env` as root gave `HOME`, `USER`, `LOGNAME`, `SHELL`, `PATH=secure_path`, `TERM`, `DISPLAY`, `LANG`, `MAIL` and `SUDO_*`; `sudo cd /tmp` → `sudo: cd: command not found` plus the built-in hint; `sudo -n true > /root/x` as jd fails in bash before sudo runs; the journal and auth.log record each use; `sudoers.so` contains "%s is not in the sudoers file."; polkit's admin rules list `unix-group:sudo`.
- **setuid and capabilities:** a setuid copy of `id` owned by jd, run by `nobody` via root's sudo, printed `euid=1000(jd)`; a setuid script printed no `euid`; a setgid copy printed `egid=1000(jd)`; `chmod u+s` without `x` shows `S`; `chown jd:jd` by jd and an append each cleared the bit; `rm` of a root file in `/tmp` → `Operation not permitted`; `getcap`: `ping cap_net_raw=ep`; `ping_group_range` is `1 0`; a user shell's `CapEff` is 0 and PID 1's is `000001ffffffffff` (41 capabilities).
- All test files were made in `/tmp/g3*` as jd and deleted afterwards. Root was used only to read and to run `id`, `env` and test programs as other users.

**Not checked on the machine** (from cited docs or general knowledge): udisks mounting at `/media/<user>/<label>` (Fedora/Arch `/run/media`); Fedora and Arch `/tmp` on tmpfs; the AppImage FUSE mount under `/tmp/.mount_…`; laptop `/sys/class/power_supply` and `backlight`; Fedora's `wheel` sudoers line and wide `ping_group_range`; Arch's commented `%wheel` line; Docker group being root-equivalent (Docker's docs).

**References:** 41 of the 43 URLs return 200. Two Ubuntu Community Help pages (Fstab, RootSudo) 404'd and were dropped. freedesktop.org (XDG basedir spec) and wiki.debian.org (UsrMerge) reset the connection from this machine, as in G2. `file-hierarchy(7)` points at man7.org instead of freedesktop.

## Fixes along the way

- **YAML:** `awk -F: '…'` as an observe command must be quoted, because `: ` starts a mapping.
- **MDX:** `<command>` in body text (inside a quoted message) is read as a JSX tag. It's now in backticks.

## For your review

1. **The two composed outputs** in `mounts-devices` (above).
2. **The rule engine change**, especially `sudo -l` now being read-only on `/explain`.
3. **Length:** `mounts-devices`, `how-sudo-works` and `setuid-capabilities` are 8 minutes each.

## Environment gotchas

Same as G1 and G2. The dev server got 4321 this time. `findmnt` with several target paths prints nothing; use `-t` with types. `strace` isn't installed in the WSL image.

## Next

1. Fold in any feedback from Jd's review of G1 to G3 on the preview.
2. **G4: Software and packages** (plan §6, track 8): `what-is-a-package`, `shared-libraries`, `app-formats`. Link them from the Packages scenarios (`install-deb`, `fix-broken-install`, `remove-package`, `which-package`, `apt-lock`, `appimage-install`).
3. Commit each phase to `guides/phase-g0` and push. Don't open a PR.
