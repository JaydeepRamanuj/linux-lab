export const COMMAND_CATEGORY_IDS = [
  'files',
  'permissions',
  'processes',
  'networking',
  'packages',
  'disk',
  'text',
  'shell',
  'system'
] as const;
export type CommandCategoryId = (typeof COMMAND_CATEGORY_IDS)[number];

export const COMMAND_CATEGORIES: Record<CommandCategoryId, string> = {
  files: 'Files',
  permissions: 'Permissions',
  processes: 'Processes',
  networking: 'Networking',
  packages: 'Packages',
  disk: 'Disk',
  text: 'Text processing',
  shell: 'Shell basics',
  system: 'System & services'
};

export const LEVELS = { everyday: 'Everyday', intermediate: 'Intermediate', advanced: 'Advanced' } as const;
