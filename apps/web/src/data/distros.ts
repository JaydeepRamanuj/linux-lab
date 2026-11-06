// Distributions for the family tree (docs/origins-plan.md §3.3 and §5.2). `parent` is the distro each one is
// built from; the build checks that every parent exists and that there are no cycles (lib/contentChecks.ts).
// `founded` is the year of the first public release unless `note` says otherwise.

export const DISTRO_FAMILIES = ['debian', 'redhat', 'arch', 'suse', 'slackware', 'gentoo', 'independent'] as const;
export type DistroFamily = (typeof DISTRO_FAMILIES)[number];

export const FAMILY_LABEL: Record<DistroFamily, string> = {
  debian: 'Debian',
  redhat: 'Red Hat',
  arch: 'Arch',
  suse: 'SUSE',
  slackware: 'Slackware',
  gentoo: 'Gentoo',
  independent: 'Independent'
};

/** One line per family: what its members share. */
export const FAMILY_SUMMARY: Record<DistroFamily, string> = {
  debian: '`.deb` packages and APT. The biggest family: Debian’s archive is the base for Ubuntu and, through Ubuntu, much of the desktop world.',
  redhat: '`.rpm` packages and DNF. Fedora is the upstream, Red Hat Enterprise Linux the product, and a set of rebuilds offer RHEL compatibility.',
  arch: 'pacman, a rolling release and a minimal base you build up yourself. Its derivatives add installers and defaults.',
  suse: '`.rpm` packages with zypper, and the YaST configuration tool. Germany’s Linux, now with a rolling and a fixed community edition.',
  slackware: 'The oldest distribution still maintained. Plain `.txz` packages, no dependency resolution, and BSD-style init scripts.',
  gentoo: 'Everything compiled from source with Portage, tuned by USE flags. Its build system also sits under ChromeOS.',
  independent: 'Not built from another distribution: each has its own package manager and its own idea of how a system should work.'
};

export type ReleaseModel = 'fixed' | 'rolling' | 'lts' | 'fixed+lts';

export const RELEASE_MODEL_LABEL: Record<ReleaseModel, string> = {
  fixed: 'Fixed releases',
  rolling: 'Rolling',
  lts: 'Long-term support',
  'fixed+lts': 'Fixed, with LTS'
};

export type DistroStatus = 'active' | 'discontinued' | 'changed';

export interface Distro {
  id: string;
  name: string;
  parent?: string;
  family: DistroFamily;
  founded: number;
  packageFormat: string;
  packageManager: string;
  releaseModel: ReleaseModel;
  init: string;
  status: DistroStatus;
  note: string;
  url: string;
  asOf: string;
}

const AS_OF = '2026-11-06';

export const DISTROS: Distro[] = [
  // Debian family
  { id: 'debian', name: 'Debian', family: 'debian', founded: 1993, packageFormat: 'deb', packageManager: 'APT (apt, dpkg)', releaseModel: 'fixed', init: 'systemd', status: 'active', note: 'A volunteer project with a social contract and its own free software guidelines. Stable releases every two years or so; testing and unstable roll in between.', url: 'https://www.debian.org/', asOf: AS_OF },
  { id: 'ubuntu', name: 'Ubuntu', parent: 'debian', family: 'debian', founded: 2004, packageFormat: 'deb', packageManager: 'APT, plus snap', releaseModel: 'fixed+lts', init: 'systemd', status: 'active', note: 'Canonical’s Debian derivative. A release every six months and an LTS every two years, which made it the default for desktops and cloud images.', url: 'https://ubuntu.com/', asOf: AS_OF },
  { id: 'linux-mint', name: 'Linux Mint', parent: 'ubuntu', family: 'debian', founded: 2006, packageFormat: 'deb', packageManager: 'APT', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'Built on Ubuntu LTS with its own Cinnamon desktop and conservative updates. A common first stop for people leaving Windows.', url: 'https://linuxmint.com/', asOf: AS_OF },
  { id: 'pop-os', name: 'Pop!_OS', parent: 'ubuntu', family: 'debian', founded: 2017, packageFormat: 'deb', packageManager: 'APT, plus Flatpak', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'System76’s Ubuntu derivative for its own laptops and desktops, with its own COSMIC desktop.', url: 'https://system76.com/pop/', asOf: AS_OF },
  { id: 'elementary', name: 'elementary OS', parent: 'ubuntu', family: 'debian', founded: 2011, packageFormat: 'deb', packageManager: 'APT, plus Flatpak', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'An Ubuntu LTS base with its own Pantheon desktop and app store, designed to look and feel consistent.', url: 'https://elementary.io/', asOf: AS_OF },
  { id: 'zorin', name: 'Zorin OS', parent: 'ubuntu', family: 'debian', founded: 2009, packageFormat: 'deb', packageManager: 'APT, plus Flatpak and snap', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'Ubuntu LTS with layouts that imitate Windows and macOS, aimed at people switching.', url: 'https://zorin.com/os/', asOf: AS_OF },
  { id: 'kali', name: 'Kali Linux', parent: 'debian', family: 'debian', founded: 2013, packageFormat: 'deb', packageManager: 'APT', releaseModel: 'rolling', init: 'systemd', status: 'active', note: 'The successor to BackTrack: Debian testing plus hundreds of security tools, for penetration testing and forensics. Not meant as an everyday desktop.', url: 'https://www.kali.org/', asOf: AS_OF },
  { id: 'raspberry-pi-os', name: 'Raspberry Pi OS', parent: 'debian', family: 'debian', founded: 2012, packageFormat: 'deb', packageManager: 'APT', releaseModel: 'fixed', init: 'systemd', status: 'active', note: 'Debian for Raspberry Pi boards, first released as Raspbian, with the firmware and tools the hardware needs.', url: 'https://www.raspberrypi.com/software/', asOf: AS_OF },

  // Red Hat family
  { id: 'red-hat-linux', name: 'Red Hat Linux', family: 'redhat', founded: 1994, packageFormat: 'rpm', packageManager: 'RPM', releaseModel: 'fixed', init: 'SysV init', status: 'discontinued', note: 'The original Red Hat distribution, which created the RPM format. Ended with version 9 in 2003, split into Fedora and Red Hat Enterprise Linux.', url: 'https://www.redhat.com/en/about/company', asOf: AS_OF },
  { id: 'rhel', name: 'Red Hat Enterprise Linux', parent: 'red-hat-linux', family: 'redhat', founded: 2002, packageFormat: 'rpm', packageManager: 'DNF', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'Red Hat’s paid product: a major release every few years, each supported for ten years or more. Today each major version is branched from Fedora through CentOS Stream.', url: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux', asOf: AS_OF },
  { id: 'fedora', name: 'Fedora', parent: 'red-hat-linux', family: 'redhat', founded: 2003, packageFormat: 'rpm', packageManager: 'DNF', releaseModel: 'fixed', init: 'systemd', status: 'active', note: 'Red Hat’s community distribution, first called Fedora Core. A release about every six months, and usually the first to ship new technology such as systemd, Wayland and PipeWire.', url: 'https://fedoraproject.org/', asOf: AS_OF },
  { id: 'centos-stream', name: 'CentOS Stream', parent: 'fedora', family: 'redhat', founded: 2019, packageFormat: 'rpm', packageManager: 'DNF', releaseModel: 'rolling', init: 'systemd', status: 'active', note: 'Where the next minor version of RHEL is developed in the open: continuously updated, between Fedora and RHEL.', url: 'https://www.centos.org/centos-stream/', asOf: AS_OF },
  { id: 'centos', name: 'CentOS Linux', parent: 'rhel', family: 'redhat', founded: 2004, packageFormat: 'rpm', packageManager: 'YUM, later DNF', releaseModel: 'lts', init: 'systemd', status: 'changed', note: 'A free rebuild of RHEL, hugely popular on servers. In December 2020 Red Hat moved the project to CentOS Stream; CentOS Linux 7 was the last to end, in 2024.', url: 'https://www.centos.org/', asOf: AS_OF },
  { id: 'rocky', name: 'Rocky Linux', parent: 'rhel', family: 'redhat', founded: 2021, packageFormat: 'rpm', packageManager: 'DNF', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'Started by CentOS’s original founder, Gregory Kurtzer, after the CentOS change, to be a free RHEL-compatible rebuild again.', url: 'https://rockylinux.org/', asOf: AS_OF },
  { id: 'alma', name: 'AlmaLinux', parent: 'rhel', family: 'redhat', founded: 2021, packageFormat: 'rpm', packageManager: 'DNF', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'The other main RHEL-compatible replacement for CentOS Linux, started by CloudLinux and run by a foundation.', url: 'https://almalinux.org/', asOf: AS_OF },

  // Arch family
  { id: 'arch', name: 'Arch Linux', family: 'arch', founded: 2002, packageFormat: 'pkg.tar.zst', packageManager: 'pacman', releaseModel: 'rolling', init: 'systemd', status: 'active', note: 'A minimal, rolling base you assemble yourself, known for the ArchWiki and the user-built packages of the AUR.', url: 'https://archlinux.org/', asOf: AS_OF },
  { id: 'manjaro', name: 'Manjaro', parent: 'arch', family: 'arch', founded: 2011, packageFormat: 'pkg.tar.zst', packageManager: 'pacman (pamac)', releaseModel: 'rolling', init: 'systemd', status: 'active', note: 'Arch with a graphical installer and its own repositories, which hold packages back a little to test them.', url: 'https://manjaro.org/', asOf: AS_OF },
  { id: 'endeavouros', name: 'EndeavourOS', parent: 'arch', family: 'arch', founded: 2019, packageFormat: 'pkg.tar.zst', packageManager: 'pacman', releaseModel: 'rolling', init: 'systemd', status: 'active', note: 'Close to plain Arch, with an installer and a few helpers. The successor to Antergos.', url: 'https://endeavouros.com/', asOf: AS_OF },
  { id: 'steamos', name: 'SteamOS 3', parent: 'arch', family: 'arch', founded: 2022, packageFormat: 'pkg.tar.zst', packageManager: 'Flatpak (read-only base)', releaseModel: 'fixed', init: 'systemd', status: 'active', note: 'Valve’s system for the Steam Deck: an image-based, read-only Arch system with Proton for Windows games. Earlier SteamOS versions were Debian-based.', url: 'https://store.steampowered.com/steamos', asOf: AS_OF },

  // SUSE family
  { id: 'suse-linux', name: 'SUSE Linux', parent: 'slackware', family: 'suse', founded: 1994, packageFormat: 'rpm', packageManager: 'YaST, RPM', releaseModel: 'fixed', init: 'SysV init', status: 'changed', note: 'S.u.S.E. started by translating Slackware into German, then built its own distribution with the YaST tool. Its community side became openSUSE in 2005.', url: 'https://www.suse.com/company/history/', asOf: AS_OF },
  { id: 'sles', name: 'SUSE Linux Enterprise', parent: 'suse-linux', family: 'suse', founded: 2000, packageFormat: 'rpm', packageManager: 'zypper', releaseModel: 'lts', init: 'systemd', status: 'active', note: 'SUSE’s enterprise product, RHEL’s main commercial rival, strong in Europe and on SAP and mainframe systems.', url: 'https://www.suse.com/products/server/', asOf: AS_OF },
  { id: 'opensuse-tumbleweed', name: 'openSUSE Tumbleweed', parent: 'suse-linux', family: 'suse', founded: 2014, packageFormat: 'rpm', packageManager: 'zypper', releaseModel: 'rolling', init: 'systemd', status: 'active', note: 'A rolling release in which every snapshot is tested automatically before release. In its current form since November 2014.', url: 'https://www.opensuse.org/', asOf: AS_OF },
  { id: 'opensuse-leap', name: 'openSUSE Leap', parent: 'sles', family: 'suse', founded: 2015, packageFormat: 'rpm', packageManager: 'zypper', releaseModel: 'fixed', init: 'systemd', status: 'active', note: 'The fixed-release community edition, built from the same sources as SUSE Linux Enterprise.', url: 'https://www.opensuse.org/', asOf: AS_OF },

  // Slackware family
  { id: 'sls', name: 'Softlanding Linux System', family: 'slackware', founded: 1992, packageFormat: 'tar', packageManager: 'none', releaseModel: 'fixed', init: 'SysV-style', status: 'discontinued', note: 'One of the first complete distributions, with X included. Its bugs led Patrick Volkerding to start Slackware.', url: 'https://www.slackware.com/info/', asOf: AS_OF },
  { id: 'slackware', name: 'Slackware', parent: 'sls', family: 'slackware', founded: 1993, packageFormat: 'txz', packageManager: 'pkgtool, slackpkg', releaseModel: 'fixed', init: 'BSD-style init scripts', status: 'active', note: 'The oldest distribution still maintained, aiming to be the most “UNIX-like” Linux. Releases come when they’re ready, years apart.', url: 'https://www.slackware.com/', asOf: AS_OF },

  // Gentoo family
  { id: 'gentoo', name: 'Gentoo', family: 'gentoo', founded: 2002, packageFormat: 'ebuild (source)', packageManager: 'Portage (emerge)', releaseModel: 'rolling', init: 'OpenRC or systemd', status: 'active', note: 'Builds everything from source with Portage, configured with USE flags, so each system is compiled for its owner’s choices.', url: 'https://www.gentoo.org/', asOf: AS_OF },
  { id: 'chromeos', name: 'ChromeOS', parent: 'gentoo', family: 'gentoo', founded: 2011, packageFormat: 'image', packageManager: 'none (image updates)', releaseModel: 'rolling', init: 'Upstart', status: 'active', note: 'Google’s laptop system. Built with Gentoo’s Portage tools, but shipped as a sealed image that updates itself. Runs Android and Linux apps in containers.', url: 'https://www.chromium.org/chromium-os/', asOf: AS_OF },

  // Independent
  { id: 'alpine', name: 'Alpine Linux', family: 'independent', founded: 2005, packageFormat: 'apk', packageManager: 'apk', releaseModel: 'fixed', init: 'OpenRC', status: 'active', note: 'Tiny and security-minded, built on musl and BusyBox instead of glibc and GNU coreutils. The usual base for small container images.', url: 'https://alpinelinux.org/', asOf: AS_OF },
  { id: 'nixos', name: 'NixOS', family: 'independent', founded: 2003, packageFormat: 'nix', packageManager: 'Nix', releaseModel: 'fixed', init: 'systemd', status: 'active', note: 'The whole system is described in one configuration file and built by Nix, so it can be reproduced exactly and rolled back. Grew out of a research project.', url: 'https://nixos.org/', asOf: AS_OF },
  { id: 'void', name: 'Void Linux', family: 'independent', founded: 2008, packageFormat: 'xbps', packageManager: 'XBPS', releaseModel: 'rolling', init: 'runit', status: 'active', note: 'Not a fork of anything: its own package manager and build system, runit instead of systemd, and a choice of glibc or musl.', url: 'https://voidlinux.org/', asOf: AS_OF }
];

export const distroById = (id: string) => DISTROS.find((d) => d.id === id);

/** Children of a distro (or the roots of a family when `parent` is undefined), oldest first. */
export function childrenOf(parent: string | undefined, family?: DistroFamily): Distro[] {
  return DISTROS.filter((d) => d.parent === parent && (parent !== undefined || d.family === family)).sort((a, b) => a.founded - b.founded || a.name.localeCompare(b.name));
}

/** Roots of a family: members whose parent is missing or in another family. */
export function familyRoots(family: DistroFamily): Distro[] {
  return DISTROS.filter((d) => d.family === family && (!d.parent || distroById(d.parent)?.family !== family)).sort((a, b) => a.founded - b.founded);
}
