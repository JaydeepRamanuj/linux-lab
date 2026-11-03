import type { Accent } from '../lib/theme';

export const MODULE_IDS = ['everyday-rescue', 'processes-ports', 'files-permissions', 'packages', 'decode-agent-commands'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export interface Module {
  id: ModuleId;
  name: string;
  icon: string;
  color: Accent;
  description: string;
}

export const MODULES: Module[] = [
  {
    id: 'everyday-rescue',
    name: 'Everyday Rescue',
    icon: 'LifeBuoy',
    color: 'indigo',
    description: 'The things you do once a month and always forget: install an AppImage, fix PATH, find where a program lives.'
  },
  {
    id: 'processes-ports',
    name: 'Processes & Ports',
    icon: 'Activity',
    color: 'purple',
    description: 'Port already in use, a frozen app, a server that should keep running after you close the terminal.'
  },
  {
    id: 'files-permissions',
    name: 'Files & Permissions',
    icon: 'FolderLock',
    color: 'emerald',
    description: 'Permission denied, root-owned files after a stray sudo, a full disk, and finding files by name or content.'
  },
  {
    id: 'packages',
    name: 'Packages',
    icon: 'Package',
    color: 'orange',
    description: 'apt locks, broken installs, removing a package properly and installing a .deb file.'
  },
  {
    id: 'decode-agent-commands',
    name: 'Decode Agent Commands',
    icon: 'Bot',
    color: 'rose',
    description: 'The shell patterns coding agents use all the time: chaining, redirection, quoting, xargs, sed, heredocs, curl | bash.'
  }
];

export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
