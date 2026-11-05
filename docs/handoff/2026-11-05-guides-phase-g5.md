# Handoff · 2026-11-05 · Guides Phase G5: Kernel and boot

**Task:** Phase G5 of `docs/guides-plan.md`, the Kernel and boot track (plan §6, track 5). Read `docs/guides-plan.md` first, then the G0 to G4 handoffs, then this file.

**Status:** committed on branch `guides/phase-g0` on top of G4 (cc37efb) and pushed. Still no PR: one large PR into `main` once every guide phase is done. Everything below passes:

- **Tests:** 444 pass (`npx vitest run` in `packages/core`), 26 more than G4, all from the rule engine change below.
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** passes, no `[content]` warnings; `dist/g` has 31 guides.
- **Browser** (dev server at 375px):
  - the 4 guides, `/learn/kernel`, 4 scenarios and 4 command pages return 200 and link to the new guides;
  - no guide scrolls sideways, and no table runs past its column (checked with Under the hood open);
  - each guide has the six H2s in order, and "Under the hood" is collapsed;
  - Flow steps through on `boot-sequence` (Step through, Next ×2 → "3 / 7"); no console errors;
  - `search.json` has all 4 guides.

## What was added

| Guide | Track, order, level | Widgets | Linked from (scenario `concepts`) | Command pages |
|---|---|---|---|---|
| `kernel-user-space` | Kernel 1, E, 7 min | Layers (cat → glibc → kernel → driver → disk), table of the kernel's jobs | `cpu-ram-hog` (top's `us`/`sy`, the OOM killer) | top, free, ps |
| `system-calls` | Kernel 2, D, 7 min | Flow (one `read()` from call to `errno`), strace options table, errno table | `frozen-app` (state `D`), `permission-denied-script` (execve errors) | ps, lsof, cat |
| `boot-sequence` | Kernel 3, E, 8 min | Flow (UEFI → shim/GRUB → kernel → initramfs → switch root → systemd → login), "where it stopped" table, kernel parameter table | `system-service` ("starts at boot") | systemctl, journalctl |
| `kernel-modules` | Kernel 4, D, 7 min | Flow (USB Wi-Fi: uevent → udev → modules.alias → deps → probe), modprobe.d table | none fits; reached from `/c/journalctl` | journalctl |

**Command pages with new `concepts`:** `journalctl` → boot-sequence, kernel-modules; `systemctl` → boot-sequence; `top` → kernel-user-space; `free` → proc-sys, kernel-user-space. There are no `dmesg`, `lsmod`, `modinfo` or `uname` command pages, so those candidates couldn't be linked.

**Prerequisites:** kernel-user-space ← processes-basics; system-calls ← kernel-user-space, file-descriptors; boot-sequence ← kernel-user-space, systemd-units; kernel-modules ← kernel-user-space, proc-sys.

**Links instead of repeats:** kthreadd and the WSL PID difference → `processes-basics`; capabilities → `setuid-capabilities`; the loader → `shared-libraries`; fstab at boot → `mounts-devices`; sysctl and `/sys/module` → `proc-sys`; targets → `systemd-units`; earlier boots in the journal → `journald-logs`; builtins → `pressing-enter`.

## Rule engine change

`packages/core/src/rules/base.ts` and `src/normalize.ts`, each with tests and counter-cases:

- **Read-only:** `modinfo`, `lsinitramfs`, `systemd-detect-virt`; `modprobe` with only `-D`/`--show-depends`, `-c`/`--showconfig` or `-n`/`--dry-run`.
- **A bug fix:** `dmesg -C`, `-c`, `--clear`, `--read-clear` (wipe the kernel message buffer) and `-n`, `-D`, `-E`, `--console-*` (change console logging) rated **read-only**, because `dmesg` was on the plain read-only list. They're now `elevated`. Plain `dmesg`, `dmesg -T`, `--level` stay read-only.
- **`modprobe`, `insmod`, `rmmod`** were "not in the list yet → modifies". They're now `elevated` ("code that runs inside the kernel, for the whole machine").
- **`strace` is a wrapper**, like `time` and `nice`: `strace -e trace=openat cat f` is rated by `cat`, and `strace rm -rf ~` stays destructive. It's not peeled when it has `-o`/`--output` (writes a file) or `-p`/`--attach` (attaches to a running process); then strace itself rates `modifies`.
- **Clean-up:** G4 left the `ldconfig -p`/`ldd` block in `baseSeverity` twice. The first copy is removed; behaviour is unchanged.

## Accuracy: checked on Ubuntu 24.04.4 (WSL 2, kernel 6.6.87.2-microsoft-standard-WSL2), systemd 255.4-1ubuntu8.18

**A correction to the brief:** in this WSL setup PID 1 *is* systemd (`/sbin/init`), and WSL's `/init` runs as PID 2 (`init-systemd(Ubuntu)`), as G2 found. The guide says that.

### Composed outputs: please compare with a real Ubuntu 24.04 install

All three are in `boot-sequence`, because WSL has no firmware, GRUB or Ubuntu kernel:

1. **`systemd-analyze`**: `6.204s (firmware) + 2.817s (loader) + 2.395s (kernel) + 9.522s (userspace)`. WSL prints only `1.958s (userspace)`. Numbers are invented. **Check:** whether Ubuntu with GRUB on UEFI really shows `(firmware)` and `(loader)`. I believe systemd gets them from the firmware's performance table (ACPI FPDT), and many Ubuntu reports show them, but systemd-analyze(1) doesn't say when they appear. The explain text hedges ("only when the firmware reports them"). Ubuntu 24.04's initramfs-tools doesn't run systemd in the initrd, so no `(initrd)` part is shown; that's from the man page's examples, not a test.
2. **`cat /proc/cmdline`**: `BOOT_IMAGE=/boot/vmlinuz-6.8.0-85-generic root=UUID=5d1c… ro quiet splash vt.handoff=7`. The UUID matches the composed fstab in `mounts-devices`.
3. **`ls /boot`**: two kernels (`6.8.0-84`, `-85`), each with `config-`, `initrd.img-`, `System.map-`, `vmlinuz-`, plus `efi`, `grub`, and the `vmlinuz`/`initrd.img`/`.old` symlinks, laid out like `ls -C` at 60 columns. A real desktop may also have `memtest86+…` files; I left them out because I couldn't confirm them.

And one output in `system-calls`:

4. **`strace -e trace=openat,read,write,close cat /etc/hostname`**: strace isn't installed and wasn't installed. I wrote a 100-line Python ptrace tracer (standard library only, in the session scratchpad, not in the repo) and traced `cat /etc/hostname` on the machine. The call order, paths, flags (`0x80000` = `O_CLOEXEC`, `0x0` = `O_RDONLY`), read size 131072, return values and the ELF header bytes are from that real trace; the formatting is strace's, written by hand; the hostname became `laptop`; locale-file calls are trimmed (the explain text says so). Two traced details are also used in the prose: `ls /nonexistent` fails in `statx` with ENOENT, and `echo hi > /root/x` fails in `openat` with flags `0x241` (`O_WRONLY|O_CREAT|O_TRUNC`) and EACCES. The counts "`true` 30, `cat` about 60, `ls -l /etc` over 700" are from the tracer (`cat` under `LANG=C`; under `C.UTF-8` it's 119).

### Other edits to real outputs

- Hostname `TOP-IT-354` → `laptop` in the `journalctl -k` lines.
- `journalctl -k … | grep` in `boot-sequence` leaves out two `EXT4-fs (sda)`/`(sdb)` lines: read-only mounts of WSL's own system images.
- `modinfo bridge`: trailing space after `vermagic` removed.
- `lsmod`, `modprobe -D`, `ls /etc/modprobe.d`, `/sys/module/bridge`, `tainted`, `cat /proc/self/syscall`, `/proc/$$/wchan`, `vdso`, `syscall-filter`, `critical-chain`, `time ls -R`, `/proc/stat`, `ls -l /dev/mem /proc/kcore`, `uname -r` are real WSL output. The guides say where a laptop would differ (more modules, `signer` lines, a `-generic` kernel name).

### What the checks confirmed

- **Ubuntu restricts dmesg:** `/etc/sysctl.d/10-kernel-hardening.conf` says `dmesg_restrict defaults to 1 via CONFIG_SECURITY_DMESG_RESTRICT` (WSL's kernel has it at 0). `kptr_restrict = 1`; `yama.ptrace_scope = 1` (`10-ptrace.conf`).
- **System calls:** `/proc/self/syscall` from `cat` shows call 0 (read) on fd 3 for 0x20000 bytes; reading a sibling's `/proc/<pid>/syscall` fails with `Operation not permitted` (ptrace check). A shell waiting for its child is in `do_wait`. `[vdso]` is mapped; no `[vsyscall]`. `systemd-timesyncd` and `systemd-resolved` show `Seccomp: 2` with 28 filters; `ProtectKernelModules=yes` on timesyncd. `cd` in `bash -c` made a `chdir` call (80) and `pwd` wrote without `getcwd`. x86-64 numbers used: read 0, write 1, execve 59, openat 257 (seen in the trace).
- **Time:** `time ls -R /usr/share` gave `user 0.020s`, `sys 0.141s`.
- **Modules:** 12 loaded; 924 `.ko` files (uncompressed) under an overlay mount at `/usr/lib/modules/<ver>`; `modules.builtin` 347 lines; `modules.alias` 11,007 lines; `/sys/module` 177 entries; `ext4` built in with `softdep: pre: crc32c`; `bridge` refcnt 1, holder `br_netfilter`; `/etc/modules` and `modules-load.d/modules.conf` carry the "obsolete" comment; `iwlwifi.conf` uses `remove`, systemd's `modprobe.d` uses `options`; `systemd-modules-load.service` is static and ran.
- **Boot (WSL):** the kernel log has `Trying to unpack rootfs image as initramfs...` and `Run /init as init process`; `/sbin/init` → `/usr/lib/systemd/systemd`; `get-default` is `graphical.target`; `runlevel` `N 5`; no `/sys/firmware/efi`; `/boot` empty; no `linux-image` packages, no GRUB, no initramfs-tools.
- **From the cited docs (web-fetched):** bootup(7) stages and target order; systemd-analyze's `@`/`+` and the blame caveat; initramfs-tools(7) script phases and `break=`/`root=`/`init=`; Ubuntu's Secure Boot page: Microsoft signs shim, Canonical signs GRUB, kernel and shipped modules, unsigned modules aren't loaded, DKMS modules are signed with a machine MOK enrolled in MokManager's text screens at the next reboot, initrd images aren't validated; kernel_lockdown(7) blocks `/dev/mem`, `/proc/kcore` and unsigned modules; vdso(7)'s four x86-64 calls; syscall(2)'s registers; proc_pid_syscall(5)'s format.

**Not checked on a machine or in a fetched source** (general knowledge, please skim):

- Ubuntu turning on kernel lockdown when Secure Boot is on;
- `modinfo` on Ubuntu showing `signer`/`sig_key`; modules compressed as `.ko.zst`;
- Ubuntu hiding the GRUB menu, Shift (BIOS) / Esc (UEFI) to show it, "Advanced options" and recovery mode;
- the EFI partition's `EFI/ubuntu/grub.cfg` being a three-line stub;
- `/boot` keeping the previous kernel with `.old` symlinks;
- the "where it stopped" table (each line is the usual cause, not the only one) and `nomodeset`;
- Fedora's dracut with systemd in the initrd and Arch's mkinitcpio;
- ARM64 `read` = 63;
- NVIDIA and some Wi-Fi chips needing **Additional Drivers**; `dkms status`; the `linux-firmware` package and `/lib/firmware`;
- Docker's default seccomp profile and browser sandboxes using seccomp.

**References:** every URL in the 4 guides returns 200 (37 checked). Not used because they couldn't be reached from this machine: docs.kernel.org (kernel-parameters, module-signing, tainted-kernels), kernel.org and strace.io, the same network problem as earlier phases. `wiki.ubuntu.com/UEFI/SecureBoot` loads but is now a stub, so the guides cite its replacement on documentation.ubuntu.com. `ubuntu.com/server/docs/how-to/kernel/` 404s.

## For your review

1. **The four composed outputs** above, especially whether `systemd-analyze` on your Ubuntu install shows `(firmware)` and `(loader)`.
2. **The rule engine change**, especially `dmesg -C` now `elevated` (a real fix), `modprobe` now `elevated`, and `strace` being peeled as a wrapper.
3. **The "Not checked" list.**
4. **`kernel-modules` has no scenario link.** No scenario is about drivers or modules; it's reached from `/c/journalctl`, the other three kernel guides and `/learn/kernel`. A future "Wi-Fi or graphics driver not working" scenario would be its natural home.

## Environment gotchas

Same as G1 to G4. The dev server got 4322 (another session held 4321). New this time:

- WSL's distro restarts between `wsl` calls more often than it used to, so boot-relative numbers (`ctxt`, timestamps) change from run to run. Each output in the guides comes from one run.
- `ps` inside a script still prints `your 120x1 screen size is bogus`; ignore it.
- Without strace, `/proc/<pid>/syscall` and a ctypes ptrace loop in Python are enough to trace a program you start yourself (`ptrace_scope = 1` allows tracing your own children).

## Next

1. Fold in any feedback from Jd's review of G1 to G5 on the preview.
2. **G6: Networking** (plan §6, track 7): `interfaces-ip`, `dns-resolution`, `how-ssh-works`, `firewall-basics`. Candidates: the `port-in-use` scenario, `curl-pipe-bash`, and the `ss`, `curl`, `ip` (no page yet) command pages. Settle plan §9.3 (an SSH & Remote scenario module) first if it should ship alongside. WSL's networking is NAT'd behind Windows (`eth0`, a resolver at the Windows host), so `ip route`, `resolv.conf` and firewall outputs will need care; `ufw` is likely inactive.
3. Commit each phase to `guides/phase-g0` and push. Don't open a PR.
