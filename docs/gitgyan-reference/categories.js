export const CATEGORIES = [
  {
    id: 'undo-recover',
    name: 'Undo & Recover',
    icon: 'RotateCcw',
    color: 'indigo',
    description: 'Undo commits, fix the last commit, unstage or discard changes, and bring back deleted files and branches.'
  },
  {
    id: 'branches',
    name: 'Branch Problems',
    icon: 'GitBranch',
    color: 'purple',
    description: 'Commits on the wrong branch, a bad merge on main, diverged local state, typos in names and stale refs.'
  },
  {
    id: 'merge-rebase',
    name: 'Merge & Rebase',
    icon: 'GitMerge',
    color: 'orange',
    description: 'Resolve conflicts, back out of a messy merge, rebase onto main, squash WIP commits and fix rejected pushes.'
  },
  {
    id: 'stash-staging',
    name: 'Stash & Staging',
    icon: 'Package',
    color: 'emerald',
    description: 'Shelve unfinished work for an urgent hotfix, and stage only the lines that belong in the next commit.'
  },
  {
    id: 'history-advanced',
    name: 'History & Advanced',
    icon: 'Search',
    color: 'rose',
    description: 'Hunt down a regression with bisect, trace a line with blame, backport fixes, tag releases, and purge leaked secrets.'
  }
];
