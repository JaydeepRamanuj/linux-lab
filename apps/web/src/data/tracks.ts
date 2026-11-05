import type { Accent } from '../lib/theme';

// Guide tracks (docs/guides-plan.md §6). Shaped like modules.ts: one track per part of the system.
export const TRACK_IDS = ['shell', 'filesystem', 'permissions', 'processes', 'kernel', 'services', 'networking', 'software'] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export interface Track {
  id: TrackId;
  name: string;
  icon: string;
  color: Accent;
  description: string;
}

export const TRACKS: Track[] = [
  {
    id: 'shell',
    name: 'The Shell',
    icon: 'SquareTerminal',
    color: 'indigo',
    description: 'What happens between pressing Enter and seeing output: parsing, expansion, PATH, streams and exit codes.'
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    icon: 'FolderTree',
    color: 'cyan',
    description: 'Everything is a file: the directory layout, inodes and links, mounts, and the kernel as a filesystem in /proc and /sys.'
  },
  {
    id: 'permissions',
    name: 'Permissions & Users',
    icon: 'KeyRound',
    color: 'emerald',
    description: 'The rwx model, users and groups, what sudo really does, and the special bits beyond rwx.'
  },
  {
    id: 'processes',
    name: 'Processes',
    icon: 'GitFork',
    color: 'purple',
    description: 'PIDs and the process tree, signals, file descriptors, ports and sockets, and why closing a terminal kills things.'
  },
  {
    id: 'kernel',
    name: 'Kernel & Boot',
    icon: 'Cpu',
    color: 'rose',
    description: 'Kernel space and user space, system calls, the boot sequence and kernel modules.'
  },
  {
    id: 'services',
    name: 'Services & Logs',
    icon: 'ServerCog',
    color: 'orange',
    description: 'systemd units and targets, where logs live, and scheduling work with cron or timers.'
  },
  {
    id: 'networking',
    name: 'Networking',
    icon: 'Network',
    color: 'cyan',
    description: 'Interfaces, addresses and routes, how a name becomes an IP, how SSH works, and firewalls at a high level.'
  },
  {
    id: 'software',
    name: 'Software & Packages',
    icon: 'Package',
    color: 'orange',
    description: 'What a package is, why repositories are signed, shared libraries, and apt vs AppImage vs Snap vs Flatpak.'
  }
];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id);
