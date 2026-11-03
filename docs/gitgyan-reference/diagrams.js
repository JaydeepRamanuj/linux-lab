// Before/after repository-state diagrams for each scenario, rendered by components/Diagram.jsx.
//
// graph nodes: { id, x (column), y (lane, default 0), label?, note?, tone?, refs? }
//   tone: base | focus | bad | good | ghost (unreachable / reflog only)
//   refs: 'HEAD→main' (HEAD attached), 'HEAD' (detached), 'main', 'origin/main', 'v2.0.0' (tag),
//         '~name' (stale/deleted ref)
// graph edges: [parent, child, kind?]  kind: undefined | 'ghost' | 'dashed' | 'copy' (file copied across)
// zones: { title, items: [{ text, tone?, note? }], empty? }

export const DIAGRAMS = {
  'scenario-01': {
    before: {
      kind: 'graph', title: 'Committed too early',
      caption: 'C bundles unrelated changes and is the tip of main.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'bad', note: 'mixed commit', refs: ['HEAD→main'] }],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'Changes staged',
      caption: 'main moves back to B. C is only in the reflog; its changes sit in the staging area.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'focus', refs: ['HEAD→main'] }, { id: 'C', x: 2, tone: 'ghost', note: 'reflog only' }],
      edges: [['A', 'B'], ['B', 'C', 'ghost']]
    }
  },
  'scenario-02': {
    before: {
      kind: 'graph', title: 'Dead-end commit',
      caption: 'C is an experiment you want gone.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'bad', note: 'experiment', refs: ['HEAD→main'] }],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'Wiped',
      caption: 'main, the index and your files all match B. C survives only in the reflog.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'focus', refs: ['HEAD→main'] }, { id: 'C', x: 2, tone: 'ghost', note: 'reflog only' }],
      edges: [['A', 'B'], ['B', 'C', 'ghost']]
    }
  },
  'scenario-03': {
    before: {
      kind: 'graph', title: 'Bad commit is public',
      caption: 'Buggy commit C is already on origin/main and teammates have pulled it.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'bad', note: 'b9f3d12 bug', refs: ['HEAD→main', 'origin/main'] }],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'History preserved',
      caption: 'New commit R applies the exact inverse of C. Nothing is rewritten.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'bad', note: 'bug' },
        { id: 'R', x: 3, tone: 'good', note: 'reverts C', refs: ['HEAD→main', 'origin/main'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['C', 'R']]
    }
  },
  'scenario-04': {
    before: {
      kind: 'graph', title: 'File deleted',
      caption: 'B deleted formatDate.js. The last commit that still had it is A (= B^).',
      nodes: [
        { id: 'A', x: 0, note: 'has file' }, { id: 'B', x: 1, tone: 'bad', note: 'deletes file' },
        { id: 'C', x: 2, refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'File restored',
      caption: 'The file is copied out of B^ (= A) and committed as D. Nothing else changes.',
      nodes: [
        { id: 'A', x: 0, tone: 'good' }, { id: 'B', x: 1 }, { id: 'C', x: 2 },
        { id: 'D', x: 3, tone: 'good', note: 'restores', refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D', 'copy']]
    }
  },
  'scenario-05': {
    before: {
      kind: 'graph', title: 'Typo in last commit',
      caption: 'B has a bad message or a missing file.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'bad', note: 'typo', refs: ['HEAD→main'] }],
      edges: [['A', 'B']]
    },
    after: {
      kind: 'graph', title: 'Replaced',
      caption: "--amend creates a new commit B' (new hash). The old B is orphaned.",
      nodes: [
        { id: 'A', x: 0 }, { id: "B'", x: 1, tone: 'good', note: 'fixed', refs: ['HEAD→main'] },
        { id: 'B', x: 1, y: 1, tone: 'ghost', note: 'reflog only' }
      ],
      edges: [['A', "B'"], ['A', 'B', 'ghost']]
    }
  },
  'scenario-06': {
    before: {
      kind: 'graph', title: 'Branch deleted',
      caption: 'No ref points at X and Y any more, but the commits still exist.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, refs: ['HEAD→main'] },
        { id: 'X', x: 1, y: 1, tone: 'ghost' }, { id: 'Y', x: 2, y: 1, tone: 'ghost', note: '7f3c2a1' }
      ],
      edges: [['A', 'B'], ['A', 'X', 'ghost'], ['X', 'Y', 'ghost']]
    },
    after: {
      kind: 'graph', title: 'Branch recreated',
      caption: 'A new branch pointer at 7f3c2a1 makes the commits reachable again.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, refs: ['main'] },
        { id: 'X', x: 1, y: 1, tone: 'good' }, { id: 'Y', x: 2, y: 1, tone: 'good', refs: ['HEAD→feature/stripe-integration'] }
      ],
      edges: [['A', 'B'], ['A', 'X'], ['X', 'Y']]
    }
  },
  'scenario-07': {
    before: {
      kind: 'zones', title: 'Too much staged',
      caption: '`git add .` staged a secrets file along with the real change.',
      zones: [
        { title: 'Working directory', items: [], empty: 'no other changes' },
        { title: 'Staging area', items: [{ text: 'src/Button.jsx', tone: 'good' }, { text: '.env', tone: 'bad', note: 'contains secrets' }] }
      ]
    },
    after: {
      kind: 'zones', title: 'Unstaged',
      caption: '.env leaves the index but stays on disk, untouched.',
      zones: [
        { title: 'Working directory', items: [{ text: '.env', tone: 'caution', note: 'untracked, still on disk' }] },
        { title: 'Staging area', items: [{ text: 'src/Button.jsx', tone: 'good' }] }
      ]
    }
  },
  'scenario-08': {
    before: {
      kind: 'zones', title: 'Messy edits',
      caption: 'The working copy has drifted from what is committed.',
      zones: [
        { title: 'Working directory', items: [{ text: 'src/api/client.js', tone: 'bad', note: 'hard-coded localhost URL' }] },
        { title: 'Index / HEAD', items: [{ text: 'src/api/client.js', note: 'uses process.env.API_URL' }] }
      ]
    },
    after: {
      kind: 'zones', title: 'Restored',
      caption: 'The file is overwritten from the index. Your edits are gone for good.',
      zones: [
        { title: 'Working directory', items: [{ text: 'src/api/client.js', tone: 'good', note: 'matches index' }] },
        { title: 'Index / HEAD', items: [{ text: 'src/api/client.js', note: 'unchanged' }] }
      ]
    }
  },
  'scenario-09': {
    before: {
      kind: 'graph', title: 'Broken main',
      caption: 'Merge M brought feature commit X into main. Parent 1 = B, parent 2 = X.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'X', x: 2, y: 1, tone: 'bad', note: 'buggy' },
        { id: 'M', x: 3, tone: 'bad', refs: ['HEAD→main', 'origin/main'] }
      ],
      edges: [['A', 'B'], ['B', 'X'], ['B', 'M'], ['X', 'M']]
    },
    after: {
      kind: 'graph', title: 'History preserved',
      caption: "M' restores main's tree to parent 1 (B). X stays in history.",
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'X', x: 2, y: 1, note: 'still merged' },
        { id: 'M', x: 3 }, { id: "M'", x: 4, tone: 'good', note: 'reverts M', refs: ['HEAD→main', 'origin/main'] }
      ],
      edges: [['A', 'B'], ['B', 'X'], ['B', 'M'], ['X', 'M'], ['M', "M'"]]
    }
  },
  'scenario-10': {
    before: {
      kind: 'graph', title: 'Diverged',
      caption: 'Local main has junk commits D and E; origin/main has moved on to C.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, refs: ['origin/main'] },
        { id: 'D', x: 2, y: 1, tone: 'bad' }, { id: 'E', x: 3, y: 1, tone: 'bad', refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['B', 'D'], ['D', 'E']]
    },
    after: {
      kind: 'graph', title: 'Mirror of remote',
      caption: 'main now equals origin/main. D and E survive only on the backup branch.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'good', refs: ['HEAD→main', 'origin/main'] },
        { id: 'D', x: 2, y: 1, tone: 'ghost' }, { id: 'E', x: 3, y: 1, tone: 'ghost', refs: ['backup/messy-local-state'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['B', 'D', 'ghost'], ['D', 'E', 'ghost']]
    }
  },
  'scenario-11': {
    before: {
      kind: 'graph', title: 'Wrong branch',
      caption: 'B and C were meant for a feature branch but landed on main.',
      nodes: [
        { id: 'A', x: 0, note: '3a8c2f0' }, { id: 'B', x: 1, tone: 'bad' },
        { id: 'C', x: 2, tone: 'bad', refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'Moved',
      caption: 'Same commits, new owner: feature/checkout points at C, main is back at A.',
      nodes: [
        { id: 'A', x: 0, refs: ['main'] }, { id: 'B', x: 1, y: 1, tone: 'good' },
        { id: 'C', x: 2, y: 1, tone: 'good', refs: ['HEAD→feature/checkout'] }
      ],
      edges: [['A', 'B'], ['B', 'C']]
    }
  },
  'scenario-12': {
    before: {
      kind: 'graph', title: 'Typo in name',
      caption: 'A branch is just a named pointer, so renaming never touches commits.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, refs: ['HEAD→feature/usr-authentcation', 'origin/feature/usr-authentcation'] }],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'Renamed',
      caption: 'Same commits. Only the local and remote pointers changed name.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'good', refs: ['HEAD→feature/user-authentication', 'origin/feature/user-authentication'] }],
      edges: [['A', 'B'], ['B', 'C']]
    }
  },
  'scenario-13': {
    before: {
      kind: 'graph', title: 'Stale refs',
      caption: 'X was merged and deleted on GitHub, but your local refs still point at it.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'X', x: 1, y: 1, refs: ['feature/auth-v1', '~origin/feature/auth-v1'] },
        { id: 'M', x: 2, refs: ['HEAD→main'] }
      ],
      edges: [['A', 'X'], ['A', 'M'], ['X', 'M']]
    },
    after: {
      kind: 'graph', title: 'Pruned',
      caption: 'Both refs are gone. X is still safe in main because it was merged.',
      nodes: [{ id: 'A', x: 0 }, { id: 'X', x: 1, y: 1 }, { id: 'M', x: 2, tone: 'good', refs: ['HEAD→main'] }],
      edges: [['A', 'X'], ['A', 'M'], ['X', 'M']]
    }
  },
  'scenario-14': {
    before: {
      kind: 'graph', title: 'Conflict',
      caption: 'B and C both edited the same line of api.js.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'bad', note: 'edits api.js', refs: ['HEAD→main'] },
        { id: 'C', x: 1, y: 1, tone: 'bad', note: 'edits api.js', refs: ['feature/perf'] }
      ],
      edges: [['A', 'B'], ['A', 'C']]
    },
    after: {
      kind: 'graph', title: 'Resolved',
      caption: 'Merge commit M records your hand-resolved version of api.js.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 1, y: 1, refs: ['feature/perf'] },
        { id: 'M', x: 2, tone: 'good', note: 'resolved', refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['A', 'C'], ['B', 'M'], ['C', 'M']]
    }
  },
  'scenario-15': {
    before: {
      kind: 'graph', title: 'Mid-merge',
      caption: 'A merge is half done: conflicts in 8 files, nothing committed yet.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, refs: ['HEAD→main'] },
        { id: 'C', x: 1, y: 1, refs: ['feature/redesign'] }, { id: 'M?', x: 2, tone: 'ghost', note: 'MERGING' }
      ],
      edges: [['A', 'B'], ['A', 'C'], ['B', 'M?', 'ghost'], ['C', 'M?', 'ghost']]
    },
    after: {
      kind: 'graph', title: 'Aborted',
      caption: 'Back to exactly where you were before running git merge.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'good', refs: ['HEAD→main'] },
        { id: 'C', x: 1, y: 1, refs: ['feature/redesign'] }
      ],
      edges: [['A', 'B'], ['A', 'C']]
    }
  },
  'scenario-16': {
    before: {
      kind: 'graph', title: 'Behind main',
      caption: 'Your branch forked from A; main has gained B and C since.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, refs: ['main'] },
        { id: 'X', x: 1, y: 1 }, { id: 'Y', x: 2, y: 1, refs: ['HEAD→feature/user-settings'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['A', 'X'], ['X', 'Y']]
    },
    after: {
      kind: 'graph', title: 'Linear history',
      caption: "X and Y are replayed on top of C as new commits X' and Y'.",
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, refs: ['main'] },
        { id: "X'", x: 3, y: 1, tone: 'good' }, { id: "Y'", x: 4, y: 1, tone: 'good', refs: ['HEAD→feature/user-settings'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['C', "X'"], ["X'", "Y'"]]
    }
  },
  'scenario-17': {
    before: {
      kind: 'graph', title: 'Noisy history',
      caption: 'Six commits: one real change plus five "fix" and "WIP" follow-ups.',
      nodes: [
        { id: 'A', x: 0, refs: ['main'] }, { id: '1', x: 1, note: 'oauth' }, { id: '2', x: 2, tone: 'bad', note: 'WIP' },
        { id: '3', x: 3, tone: 'bad', note: 'fix' }, { id: '4', x: 4, tone: 'bad', note: 'fix 2' },
        { id: '5', x: 5, tone: 'bad', note: 'lol' }, { id: '6', x: 6, tone: 'bad', note: 'ok now', refs: ['HEAD→feature'] }
      ],
      edges: [['A', '1'], ['1', '2'], ['2', '3'], ['3', '4'], ['4', '5'], ['5', '6']]
    },
    after: {
      kind: 'graph', title: 'Squashed',
      caption: 'One commit with a clean message and the same final code.',
      nodes: [{ id: 'A', x: 0, refs: ['main'] }, { id: 'S', x: 1, tone: 'good', note: 'feat(auth): oauth signup', refs: ['HEAD→feature'] }],
      edges: [['A', 'S']]
    }
  },
  'scenario-18': {
    before: {
      kind: 'graph', title: 'Diverged',
      caption: 'A teammate pushed D while you committed C on the same base.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, refs: ['HEAD→feature/payments'] },
        { id: 'D', x: 2, y: 1, refs: ['origin/feature/payments'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['B', 'D']]
    },
    after: {
      kind: 'graph', title: 'Rebased & pushed',
      caption: "Your C is replayed after D as C', then pushed as a normal fast-forward.",
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'D', x: 2 },
        { id: "C'", x: 3, tone: 'good', refs: ['HEAD→feature/payments', 'origin/feature/payments'] }
      ],
      edges: [['A', 'B'], ['B', 'D'], ['D', "C'"]]
    }
  },
  'scenario-19': {
    before: {
      kind: 'zones', title: 'Half-done feature',
      caption: 'Uncommitted work blocks a clean switch to a hotfix.',
      zones: [
        { title: 'Working directory', items: [{ text: 'SettingsForm.jsx', tone: 'caution', note: 'modified' }, { text: 'useSettings.js', tone: 'caution', note: 'new, untracked' }] },
        { title: 'Stash', items: [], empty: 'empty' }
      ]
    },
    after: {
      kind: 'zones', title: 'Shelved',
      caption: 'With -u both files are shelved, including the untracked one. The tree is clean for the hotfix.',
      zones: [
        { title: 'Working directory', items: [], empty: 'clean' },
        { title: 'Stash', items: [{ text: 'stash@{0}', tone: 'focus', note: 'WIP: user settings form' }] }
      ]
    }
  },
  'scenario-20': {
    before: {
      kind: 'zones', title: 'Two changes, one file',
      caption: 'userService.js mixes a bug fix with an unrelated refactor.',
      zones: [
        { title: 'Working directory', items: [{ text: 'hunk 1: db.findById fix', tone: 'good' }, { text: 'hunk 2: comment cleanup', tone: 'caution' }] },
        { title: 'Staging area', items: [], empty: 'nothing staged' }
      ]
    },
    after: {
      kind: 'zones', title: 'Split',
      caption: 'Only hunk 1 is staged, so the next commit holds just the fix.',
      zones: [
        { title: 'Working directory', items: [{ text: 'hunk 2: comment cleanup', tone: 'caution' }] },
        { title: 'Staging area', items: [{ text: 'hunk 1: db.findById fix', tone: 'good' }] }
      ]
    }
  },
  'scenario-21': {
    before: {
      kind: 'graph', title: 'Regressed file',
      caption: 'B had the fast DataTable; C made it worse.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'good', note: 'b4e7d12 fast' },
        { id: 'C', x: 2, tone: 'bad', note: 'slow refactor' }, { id: 'D', x: 3, refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['C', 'D']]
    },
    after: {
      kind: 'graph', title: 'One file restored',
      caption: "Only DataTable.jsx is taken from B. Everything else stays at D's version.",
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1, tone: 'good' }, { id: 'C', x: 2 }, { id: 'D', x: 3 },
        { id: 'E', x: 4, tone: 'good', note: 'restores file', refs: ['HEAD→main'] }
      ],
      edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['B', 'E', 'copy']]
    }
  },
  'scenario-22': {
    before: {
      kind: 'graph', title: 'Bug somewhere',
      caption: 'v1.4.0 worked and HEAD is broken. Which commit in between did it?',
      nodes: [
        { id: '1', x: 0, tone: 'good', note: 'good', refs: ['v1.4.0'] }, { id: '2', x: 1, label: '?' }, { id: '3', x: 2, label: '?' },
        { id: '4', x: 3, label: '?' }, { id: '5', x: 4, label: '?' }, { id: '6', x: 5, label: '?' },
        { id: '7', x: 6, tone: 'bad', note: 'bad', refs: ['HEAD→main'] }
      ],
      edges: [['1', '2'], ['2', '3'], ['3', '4'], ['4', '5'], ['5', '6'], ['6', '7']]
    },
    after: {
      kind: 'graph', title: 'Found in 3 tests',
      caption: 'Test 4 (bad), then 2 (good), then 3 (bad), so 3 is the first bad commit.',
      nodes: [
        { id: '1', x: 0, tone: 'good', refs: ['v1.4.0'] }, { id: '2', x: 1, tone: 'good', note: 'test 2' },
        { id: '3', x: 2, tone: 'bad', note: '1st bad', refs: ['bisect/bad'] }, { id: '4', x: 3, tone: 'bad', note: 'test 1' },
        { id: '5', x: 4, tone: 'bad' }, { id: '6', x: 5, tone: 'bad' }, { id: '7', x: 6, tone: 'bad', refs: ['main'] }
      ],
      edges: [['1', '2'], ['2', '3'], ['3', '4'], ['4', '5'], ['5', '6'], ['6', '7']]
    }
  },
  'scenario-23': {
    before: {
      kind: 'graph', title: 'Untagged',
      caption: 'The release commit has no permanent name.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, note: 'release', refs: ['HEAD→main', 'origin/main'] }],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'Tagged & pushed',
      caption: 'v2.0.0 always points at C, even as main moves on.',
      nodes: [{ id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'C', x: 2, tone: 'good', refs: ['HEAD→main', 'v2.0.0'] }],
      edges: [['A', 'B'], ['B', 'C']]
    }
  },
  'scenario-24': {
    before: {
      kind: 'zones', title: 'Mystery line',
      caption: 'Before you change it, find out why it is there.',
      zones: [
        { title: 'invoiceGenerator.js:88', items: [{ text: 'const tax = amount * 0.18;', tone: 'caution', note: 'Why 0.18? Is it safe to change?' }] }
      ]
    },
    after: {
      kind: 'zones', title: 'Context found',
      caption: 'blame gives you the commit; show gives you the reason.',
      zones: [
        { title: 'git blame', items: [{ text: 'a7f3c21e (sarah.dev 2024-08-14)', tone: 'focus' }] },
        { title: 'git show a7f3c21e', items: [{ text: 'Fix tax calculation for foreign clients (JIRA-12)', tone: 'good' }] }
      ]
    }
  },
  'scenario-25': {
    before: {
      kind: 'graph', title: 'Fix only on main',
      caption: 'Security fix F is on main (v3). release/v2.4 still lacks it.',
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'F', x: 2, tone: 'good', note: 'security fix' }, { id: 'G', x: 3, refs: ['main'] },
        { id: 'R', x: 1, y: 1, refs: ['HEAD→release/v2.4'] }
      ],
      edges: [['A', 'B'], ['B', 'F'], ['F', 'G'], ['A', 'R']]
    },
    after: {
      kind: 'graph', title: 'Backported',
      caption: "F' has the same diff as F, but it's a new commit on release/v2.4.",
      nodes: [
        { id: 'A', x: 0 }, { id: 'B', x: 1 }, { id: 'F', x: 2, tone: 'good' }, { id: 'G', x: 3, refs: ['main'] },
        { id: 'R', x: 1, y: 1 }, { id: "F'", x: 3, y: 1, tone: 'good', note: '-x: from F', refs: ['HEAD→release/v2.4', 'v2.4.1'] }
      ],
      edges: [['A', 'B'], ['B', 'F'], ['F', 'G'], ['A', 'R'], ['R', "F'"]]
    }
  },
  'scenario-26': {
    before: {
      kind: 'graph', title: 'Secret in history',
      caption: 'A added .env and C deleted it, but A still contains the secret.',
      nodes: [
        { id: 'A', x: 0, tone: 'bad', note: '+ .env' }, { id: 'B', x: 1, tone: 'bad', note: 'has .env' },
        { id: 'C', x: 2, note: 'rm .env', refs: ['HEAD→main', 'origin/main'] }
      ],
      edges: [['A', 'B'], ['B', 'C']]
    },
    after: {
      kind: 'graph', title: 'History rewritten',
      caption: 'Every commit is rewritten without .env. All hashes change and everyone must re-clone.',
      nodes: [
        { id: "A'", x: 0, tone: 'good', note: 'no .env' }, { id: "B'", x: 1, tone: 'good', note: 'no .env' },
        { id: "C'", x: 2, tone: 'good', refs: ['HEAD→main', 'origin/main'] }
      ],
      edges: [["A'", "B'"], ["B'", "C'"]]
    }
  }
};

export const getScenarioDiagram = (id) => DIAGRAMS[id];
