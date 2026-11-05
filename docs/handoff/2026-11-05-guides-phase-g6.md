# Handoff · 2026-11-05 · Guides Phase G6: Networking

**Task:** Phase G6 of `docs/guides-plan.md`, the Networking track (plan §6, track 7). It's the last guide phase. Read `docs/guides-plan.md` first, then the G0 to G5 handoffs, then this file.

**Status:** committed on branch `guides/phase-g0` on top of G5 (b716550) and pushed. Still no PR: the next step is one large PR into `main` (see "Before the big PR" at the end). Everything below passes:

- **Tests:** 529 pass (`npx vitest run` in `packages/core`), 85 more than G5, all from the rule engine change below.
- **Type check:** `astro check` reports 0 errors, 0 warnings and the same 2 old hints.
- **Build:** passes, no `[content]` warnings; `dist/g` has all 35 guides.
- **Browser** (dev server at 375px):
  - the 4 guides return 200, none scrolls sideways, and every table fits its column (checked with Under the hood open);
  - each has the six H2s in order, and "Under the hood" is collapsed;
  - no literal `**` or `](` in the rendered text, and no "left to right";
  - Flow steps through on `how-ssh-works` (Step through → "1 / 5"); no console errors;
  - `/learn/networking`, `/learn`, 8 scenarios and 6 command pages link to the new guides; `search.json` has all 4.

## What was added

| Guide | Track, order, level | Widgets | Linked from (scenario `concepts`) | Command pages |
|---|---|---|---|---|
| `interfaces-ip` | Networking 1, E, 7 min | Layers (a packet from curl → routing table → neighbour table → wlp2s0 → router), symptom table, address table | `port-in-use`, `which-package` | ss, curl |
| `dns-resolution` | Networking 2, E, 8 min | Flow (getaddrinfo → nsswitch → hosts → mDNS → stub → resolved → recursive resolver → answer), error message table | `sed-awk` (Docker's `db` name), `curl-pipe-bash` (HTTPS vs spoofed DNS) | curl |
| `how-ssh-works` | Networking 3, E, 8 min | Zones (two key pairs and where each half lives), Flow (connect → key exchange → host proof → user proof → session), error → step table | `keep-running`, `chmod-numbers`, `heredocs`, `open-from-terminal` | chmod, journalctl, systemctl, ss |
| `firewall-basics` | Networking 4, D, 7 min | Layers (ufw → iptables-nft → nftables → packets), ufw command table | none fits; reached from `/c/ss`, `/c/sudo`, `/c/systemctl` and the other three guides | ss, sudo, systemctl |

**Command pages with new `concepts`:** `ss` → interfaces-ip, firewall-basics; `curl` → dns-resolution; `systemctl` and `journalctl` → how-ssh-works. `lsof` and `sudo` weren't given `concepts`: nothing on those pages is about the new guides (`ports-sockets` already covers `lsof -i`), and `sudo` is linked from `firewall-basics`' own `commands`.

**Prerequisites:** interfaces-ip ← ports-sockets; dns-resolution ← interfaces-ip; how-ssh-works ← ports-sockets, permissions-model; firewall-basics ← interfaces-ip, ports-sockets.

**Back-links added to older guides:** `ports-sockets` links `interfaces-ip` (where addresses come from) and `firewall-basics` (in the `0.0.0.0` misconception); `systemd-units` uses `ssh.socket` as a second socket-activation example and links `how-ssh-works`.

**Links instead of repeats:** sockets, ports, bind and `0.0.0.0` → `ports-sockets`; socket activation → `systemd-units`; `/proc/sys/net` and sysctl → `proc-sys`; `~/.ssh` permissions → `permissions-model` and the `chmod-numbers` scenario; auth.log → `journald-logs`; signing keys vs host keys → `what-is-a-package`; SIGHUP on disconnect → `jobs-sessions` and `keep-running`; drivers → `kernel-modules`; `ifconfig` → the `which-package` scenario.

### Plan §9.3 (SSH & Remote module)

Not needed to write the guide, so I didn't stop to ask. `how-ssh-works` stands on its own, and its error table (`Could not resolve hostname`, `Connection refused`, `Connection timed out`, `HOST IDENTIFICATION HAS CHANGED`, `Permission denied (publickey)`, `UNPROTECTED PRIVATE KEY FILE!`) is a ready list of scenarios for such a module. If the module ships, each scenario adds `concepts: [how-ssh-works]` and the links appear on both sides; nothing in the guide has to change. The module itself is left for later, as you said.

## Rule engine change

`packages/core/src/rules/base.ts` (a new `networkBasis` function) and `system.ts`, with 85 tests and counter-cases in `rules.test.ts`.

**Bug fixes, like G5's `dmesg -C`: these changed the network and rated read-only.**

- **`ip` with abbreviated verbs.** iproute2 accepts any prefix of a verb, and the old check matched only whole words, so `ip r a 10.0.0.0/8 dev eth0` (route add), `ip r d default`, `ip a f dev eth0` (flush) and `ip link s lo up` (set) were read-only. Tested in WSL as an unprivileged user: each of those reached the kernel and got `Operation not permitted`, while `ip a s` showed addresses. For `link`, `s` means `set`; everywhere else it means `show`. Also now `elevated`: `ip netns exec`, `ip -batch FILE`.
- **`ss -K` / `--kill`** closes every matching socket. Was read-only (`ss` is on the read-only list); now `elevated`.
- **`nmcli`** was read-only for everything, including `nmcli connection delete home`, `nmcli radio wifi off` and `nmcli networking off`. Now read-only only for listing and showing (`nmcli`, `nmcli device status`, `nmcli c s`, `nmcli device wifi list`, `nmcli radio wifi`); anything else is `elevated`. Abbreviations are handled (`nmcli d se …` is `set`, `nmcli c mo …` is `modify`).
- **`hostnamectl set-hostname`**, **`hostnamectl hostname NAME`**, **`timedatectl set-*`**, **`ifconfig eth0 down`**, **`route add`** and **`iwconfig wlan0 essid …`** were read-only. Now `elevated`; plain `hostnamectl`, `timedatectl`, `ifconfig`, `route -n` stay read-only.

**Newly read-only** (were `modifies` or `elevated`):

- `resolvectl` status, query, statistics, show-cache, and the link settings (`dns`, `domain`, …) when they only show. Setting them is `elevated`; `flush-caches` is `modifies`.
- `networkctl` list/status/lldp/label/cat (`up`, `down`, `reconfigure` are `elevated`).
- `ssh -G`, `-V`, `-Q` (print and exit, never connect). Plain `ssh host` stays `modifies`.
- `ssh-keyscan` (connects, but sends no username, password or key).
- `ssh-keygen -l`, `-F`, `-L`, `-B` with only `-f`/`-E`/`-v` (and `-H` together with `-F`). `-R` (edits known_hosts), `-H`, `-t` stay `modifies`.
- `ufw status`/`show`/`app list|info`/`--version`; `nft list …`, `nft describe`, `nft --version`; `iptables`/`ip6tables` `-L`, `-S`, `-V` (including clusters like `-nvL`); `firewall-cmd --state`/`--list-*`/`--get-*`/`--query-*`. These rated `modifies`, and `iptables -nvL`, `-S` and `--version` rated `elevated`, because the old check looked only at the first argument. `iptables -L -F` used to pass that check; it's now `elevated`.

**Now `modifies`** (was read-only): `ssh-add` with a key or `-D`/`-d` (changes what the agent holds; `-l`/`-L` stay read-only).

**Noticed, not changed:** `gpg` is on the plain read-only list, so `gpg --delete-secret-keys` and `gpg --import` rate read-only. It's G4's territory and not a command I touched here; worth the same treatment.

## Accuracy: checked on Ubuntu 24.04.4 (WSL 2, kernel 6.6.87.2), iproute2 6.1.0, OpenSSH 9.6p1 Ubuntu-3ubuntu13.20, systemd 255

**How things WSL doesn't have were checked.** WSL's image has no `ufw`, `nftables`, `iptables`, `dig` or `sshd`. Nothing was installed. Instead I fetched Ubuntu's own packages with `apt-get download` into `/tmp`, extracted them with `dpkg-deb -x`, and read their files or ran their binaries from there with `LD_LIBRARY_PATH`:

- `ufw` 0.36.2-6: `/etc/default/ufw`, `ufw.conf`, `before.rules`, the OpenSSH app profile, `ufw.service`, the postinst, and the Python source for the `ufw status verbose` format and the `enable` warning.
- `nftables`, `iptables`: `/etc/nftables.conf`, `nftables.service`, the alternatives priorities (nft 20, legacy 10), and `iptables --version` → `(nf_tables)`. As root (read-only), the extracted `nft list ruleset` printed nothing and `iptables -L -n` showed three empty chains with policy ACCEPT: WSL has no rules.
- `openssh-server`: `ssh.socket` (`ListenStream=0.0.0.0:22` and `[::]:22`), `ssh.service`, the postinst enabling the socket, the `sshd-socket-generator`, the `sshd_config` template, and `sshd -T` on it (`passwordauthentication yes`, `permitrootlogin without-password`, `kbdinteractiveauthentication no`).
- `bind9-dnsutils` and its libraries: real `dig example.com`, `dig +trace`, `dig @127.0.0.53`.
- **A real SSH server, locally:** the extracted `sshd`, run as jd on `127.0.0.1:2222` with throwaway keys in `/tmp`, gave the real first-connection prompt, `ssh -v` key lines, `Permission denied (publickey)` for an unknown key, the `from="10.0.0.0/8"` refusal, `Connection refused` once stopped, and the sshd log lines. A second run with `StrictModes yes` and a `666` `authorized_keys` gave `Authentication refused: bad ownership or modes for file …`.
- **github.com, without credentials:** `ssh-keyscan` and `ssh -v` with `PreferredAuthentications=none`, `-F none`, `IdentityAgent=none` and a known_hosts file in `/tmp`, so no key was offered and nothing in `~/.ssh` was read or written. The three fingerprints match GitHub's published list. A known_hosts file holding gitlab.com's key under github.com's name produced the real `REMOTE HOST IDENTIFICATION HAS CHANGED` banner.

### Composed or edited outputs: please review

1. **`interfaces-ip`, `nmcli device status`:** composed for a laptop (WSL has no NetworkManager). The `lo … connected (externally)` row is what I believe NetworkManager 1.46 shows; please compare.
2. **`dns-resolution`, `ls -l /etc/resolv.conf`:** composed (WSL replaces the link with its own file). The target and length (39) are exact; the date is invented.
3. **`dns-resolution`, `resolvectl status`:** composed for a laptop, in the real format of WSL's output (`resolv.conf mode: stub`, a Wi-Fi link with DNS from the router, `DNS Domain: lan`).
4. **`dns-resolution`, `dig example.com`:** trimmed from a real run of the extracted `dig`. Changed: the server line to `127.0.0.53` (WSL's goes to the Windows host), TTL `0` → `300` (WSL's DNS proxy returns 0; 300 is the real TTL from `dig +trace`), `ra` added to the flags and `ADDITIONAL: 1` (what a resolver behind the stub returns), query time.
5. **`how-ssh-works`, `ls -l ~/.ssh`:** composed. The `.pub` size (91) is exact for a `jd@laptop` comment; the others are plausible.
6. **`how-ssh-works`, `ssh-keygen -lf ~/.ssh/id_ed25519.pub` and `ssh-add -l`:** real fingerprint of a throwaway key generated with `-C jd@laptop` in `/tmp`; only the path is changed.
7. **`how-ssh-works`, the `ssh -v` block and the host-key-changed banner:** real, trimmed (marked `…`), with paths changed from `/tmp/g6/…` to `/home/jd/.ssh/…` and `explicit` dropped (it appears only with `-i`).
8. **`firewall-basics`, `sudo ufw status verbose`:** composed from ufw's own format strings (`%-26s %-12s%s`, the `Default:` and `New profiles:` lines), since ufw can't run without iptables.
9. Every other observe output is real WSL output, or the contents of a file from Ubuntu's package (ufw, nftables, openssh-server). Trailing spaces were removed. The explain text says where a laptop differs (`wlp2s0` vs `eth0`, the `mdns4_minimal` nsswitch line).

### What the checks confirmed

- **Interfaces:** `ip -br addr`, `ip route`, `ip route get`, `ip neigh`, `ip route show table local`, `ip rule` outputs; WSL is `172.19.250.113/20` behind `172.19.240.1`; only an `fe80::` IPv6 address, and `dig +trace` reports `network unreachable` for IPv6 root servers; `/etc/netplan` is empty in WSL; `ubuntu-minimal` depends on `iproute2` and `netplan.io`, `ubuntu-desktop` on `network-manager` and `libnss-mdns`; `/etc/sysctl.d/10-ipv6-privacy.conf` sets `use_tempaddr = 2`; NetworkManager ships `dns=systemd-resolved`.
- **DNS:** nsswitch `hosts: files dns`; libnss-mdns' postinst inserts `mdns4_minimal [NOTFOUND=return]` before `dns`; the stub file's three lines; resolved listens on `127.0.0.53` and `127.0.0.54` (the man page calls the second "proxy" mode); `resolvectl query` output and `-t MX`; `getent hosts`; the error messages from `ping` (`No address associated with hostname`), `ssh` (`Name or service not known`) and `curl` (`(6) Could not resolve host`); `getaddrinfo(3)` for EAI_NONAME/NODATA/AGAIN; Docker's docs for `127.0.0.11`.
- **SSH:** `/etc/ssh/ssh_config` sets `HashKnownHosts yes`, `SendEnv LANG LC_*`; `ssh -G` output; `ssh-keygen -H` and `-F` on a hashed file; default key type is ed25519; the `UNPROTECTED PRIVATE KEY FILE!` text (via `ssh-keygen -y` on a `644` key); `ssh-add -l` with and without an agent; agent socket `srw-------`; `ssh -L` listening on `127.0.0.1` and `[::1]`; Ubuntu's docs say sshd keeps the first value and the `Include` comes first; `/var/log/auth.log` lines use RFC 3339 timestamps on 24.04 (the guide quotes only the message part).
- **Firewall:** everything in "How things WSL doesn't have were checked" above; `ubuntu-standard` depends on `ufw`, `nftables`, `iptables`, `bind9-dnsutils`; Ubuntu's firewall docs say ufw is disabled initially; Docker's docs say Docker and ufw are incompatible for published ports.

**Not checked on a machine or in a fetched source** (general knowledge, please skim):

- the `nmcli` `lo` row (above); NetworkManager preferring a cable through route metrics;
- Ubuntu Desktop's netplan file handing everything to NetworkManager;
- WSL's `localhost` forwarding to Windows;
- `resolvectl query` printing `Data from: cache` on a second run (WSL's TTL-0 answers never cache);
- Ubuntu Desktop starting an SSH agent at login with the GNOME keyring;
- whether Ubuntu Desktop installs `ufw` (it's in `ubuntu-standard`; I didn't confirm Desktop pulls that in);
- `nftables.service` not being enabled on a fresh install (read from its postinst, which only re-enables it if it was enabled before);
- Fedora: systemd-resolved, and firewalld on by default with zones; Arch: no firewall, plain `resolv.conf`;
- Docker, LXD, libvirt and Kubernetes adding their own rules; cloud security groups;
- `ssh-copy-id`, ProxyJump (`-J`) and the agent-forwarding risk (from ssh(1), not tested).

**References:** all 31 URLs in the 4 guides return 200. `man.openbsd.org` couldn't be reached from this machine, so the SSH man pages point at manpages.ubuntu.com (noble), which also matches Ubuntu's OpenSSH 9.6.

**Side effects on the test machine:** one `sudo -n true` I ran by mistake is in WSL's auth.log as `a password is required` (no password was entered, nothing ran). A check script whose `cd /tmp/…` failed after a distro restart downloaded 8 library `.deb` files and an extracted `x/` folder into `packages/core`; they were deleted before committing. Everything else was in WSL's `/tmp`, which empties on restart. The local `sshd` instances ran as jd on loopback and were stopped.

## Fixes along the way

- **The SSH error table** was three columns and broke words mid-way at 375px. The step now leads the explanation in bold, in two columns.
- **"left to right"** in the `dns-resolution` Flow (about reading the nsswitch line, not the layout) is now "in the order written", to keep the rule simple.

## For your review

1. **The composed and edited outputs** above (1 to 8).
2. **The rule engine change**, especially the bug fixes (`ip` abbreviations, `nmcli`, `ss -K`, `hostnamectl`), and `ssh -G`/`ssh-keyscan` now being read-only.
3. **The "Not checked" list.**
4. **`firewall-basics` has no scenario link.** No scenario is about firewalls. An SSH & Remote module's "Connection timed out" scenario would be its natural home.

## Environment gotchas

Same as G1 to G5. The dev server got 4322. New this time:

- WSL's distro restarted between calls often enough that `/tmp` was empty on the next call. Download, extract and test inside one script.
- `pkill -f PATTERN` inside `wsl bash -c '…PATTERN…'` kills the calling shell too, because its own command line matches.
- `ssh` reads the host-key answer from the terminal and flushes typed-ahead input, so `echo yes | script -qfc 'ssh …'` still fails; use `-o StrictHostKeyChecking=accept-new` with a throwaway known_hosts file.
- `apt-get download` works without root and is a clean way to read a package's default files.

## Before the big PR into main

Every guide phase is done: 35 guides in 8 tracks. Before opening the PR from `guides/phase-g0` into `main`:

1. **Your review on the Vercel preview of G1 to G6**, and the open items from each phase:
   - composed outputs: `lsblk` and `fstab` in `mounts-devices` (G3); `systemd-analyze`, `/proc/cmdline`, `ls /boot` and the strace sample (G5); the eight items above (G6);
   - the snapcraft.io reference links (G4);
   - the rule engine changes from G1 to G6, which change what `/explain` says for many commands;
   - each phase's "Not checked" list.
2. **Decide or park the plan's open questions:** §9.3 (SSH & Remote module) and §9.5 (sandbox concept tabs → guide links). §9.1, §9.2 and §9.4 were answered in G0.
3. **Run the real toolchain once:** `pnpm test`, `pnpm check` and `pnpm build` from the root, on a machine where pnpm works or in CI, since every phase used the node fallbacks. Confirm the Vercel preview build for the branch is green.
4. **Branch state:** `guides/phase-g0` was 7 commits ahead of `main` and 0 behind before this commit, so 8 ahead with it. If `main` moves, merge it in and re-run the build.
5. **PR description:** the branch name says G0 but holds G0 to G6; title the PR for the whole guides pillar. It can link the seven handoffs, and should list the rule engine changes and the composed outputs in one place for reviewers.
6. **Optional, known gaps:** search doesn't index guide bodies (G0 handoff); the site is dark-only, so the DoD's light-theme check doesn't apply yet; `kernel-modules` and `firewall-basics` have no scenario links; `gpg` and the snap/flatpak/dpkg-deb read-only forms aren't in the rule engine yet.
