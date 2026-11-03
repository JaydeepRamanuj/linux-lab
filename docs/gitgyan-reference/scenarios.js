export const SCENARIOS = [
  {
    id: 'scenario-01',
    number: '01',
    title: 'Undo Last Commit, Keep Changes Staged',
    category: 'undo-recover',
    severity: 'safe',
    primaryCommand: 'git reset --soft HEAD~1',
    tagline: 'Committed too early — split it into smaller commits',
    situation: 'You ran git commit and immediately realized you committed too soon. Maybe you bundled two unrelated changes together, forgot to add a file, or just want to rewrite the commit message. The code itself is fine — you just want to un-commit it and re-stage it properly.',
    howItWorks: '`HEAD~1` means "the commit before HEAD". `git reset --soft` moves only the branch pointer back; your staging area and working directory stay exactly as they were, so everything from the undone commit shows up as staged. The commit itself is no longer on the branch but remains in the reflog for a while. To split the work into smaller commits, unstage everything (`git restore --staged .`) and re-add file by file. Plain `git reset HEAD~1` (the default `--mixed` mode) does both in one go: it undoes the commit and unstages.',
    steps: [
      {
        number: 1,
        instruction: 'Check recent commits to confirm which one to undo',
        command: 'git log --oneline -5',
        explanation: 'Shows the last 5 commits. The top one is the commit you are about to undo.',
        output: 'a3f9c2e WIP stuff\n9b4d1f0 fix: update button styles\n4c1e7a2 feat: add login form'
      },
      {
        number: 2,
        instruction: 'Run the soft reset',
        command: 'git reset --soft HEAD~1',
        explanation: 'Moves the branch back one commit. All changes from that commit are now staged.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Verify changes are staged',
        command: 'git status',
        explanation: 'Everything from the undone commit is listed under "Changes to be committed", including the files you did not want together.',
        output: 'On branch main\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   src/config/env.js\n\tmodified:   src/feature/login.js\n\tnew file:   src/debug.log'
      },
      {
        number: 4,
        instruction: 'Unstage everything so you can split it up',
        command: 'git restore --staged .',
        explanation: 'Moves all changes back to "not staged" without touching the files. Without this step, the next commit would include all three files again.',
        output: ''
      },
      {
        number: 5,
        instruction: 'Stage only the first logical change',
        command: 'git add src/feature/login.js',
        explanation: 'Stage only the files that belong in this commit.',
        output: ''
      },
      {
        number: 6,
        instruction: 'Commit with a better message',
        command: 'git commit -m "feat(login): add remember me checkbox"',
        explanation: 'Creates a clean, focused commit. Repeat add + commit for the config change, and delete the debug log since it should never be committed.',
        output: '[main 7b2e4d1] feat(login): add remember me checkbox\n 1 file changed, 12 insertions(+)'
      }
    ],
    fullExample: {
      context: 'You accidentally committed three files — a feature file, a debug log, and a config change — all in one commit.',
      commands: [
        { line: '$ git log --oneline -3', type: 'input' },
        { line: 'a3f9c2e WIP stuff', type: 'output' },
        { line: '$ git reset --soft HEAD~1', type: 'input' },
        { line: '$ git restore --staged .', type: 'input' },
        { line: '$ git add src/feature/login.js', type: 'input' },
        { line: '$ git commit -m "feat(login): add remember me checkbox"', type: 'input' },
        { line: '[main 7b2e4d1] feat(login): add remember me checkbox', type: 'output' },
        { line: '$ git add src/config/env.js', type: 'input' },
        { line: '$ git commit -m "config: update API base URL for staging"', type: 'input' },
        { line: '[main 8c9d1e2] config: update API base URL for staging', type: 'output' },
        { line: '$ rm src/debug.log', type: 'input' },
        { line: '$ git status', type: 'input' },
        { line: 'nothing to commit, working tree clean', type: 'output' }
      ]
    },
    avoidTips: [
      'Use `git add -p` to stage changes hunk by hunk before committing.',
      'Run `git diff --staged` before every commit to review exactly what will be captured.',
      'If you cannot summarize a commit in one line, it is probably too large.'
    ],
    relatedScenarios: ['scenario-05', 'scenario-07'],
    warnings: [
      { type: 'warning', text: 'Only safe on commits that have NOT been pushed to a shared branch.' }
    ]
  },
  {
    id: 'scenario-02',
    number: '02',
    title: 'Undo Last Commit and Discard All Changes',
    category: 'undo-recover',
    severity: 'destructive',
    primaryCommand: 'git reset --hard HEAD~1',
    tagline: 'The code is a dead end — wipe the commit and all changes',
    situation: 'You went down the wrong path. The commit and all the code in it is garbage. You don\'t want to keep any of it. You want to completely erase the last commit and return your working directory to the state it was in before.',
    howItWorks: '`--hard` resets three things at once: the branch pointer (moves back), the staging area, and the working directory (files rewritten to match). Unlike `--soft`, nothing is kept in your files. The discarded commit can still be found in `git reflog` for a while (unreachable entries expire after ~30 days by default), but any uncommitted edits are lost for good.',
    steps: [
      {
        number: 1,
        instruction: 'Note the commit hash as a safety net',
        command: 'git log --oneline -3',
        explanation: 'Copy the hash of the commit you are discarding. With it you can always get back via `git reset --hard f7c2a09`.',
        output: 'f7c2a09 broken experiment\n3d8b1e5 feat: add shopping cart\n1a9e4c2 feat: product grid'
      },
      {
        number: 2,
        instruction: 'Preview what will be lost',
        command: 'git diff HEAD~1',
        explanation: 'Compares the previous commit with your working tree, i.e. the committed experiment plus any uncommitted edits. All of it disappears after the reset.',
        output: 'diff --git a/src/checkout.js b/src/checkout.js\n+console.log("experiment");\n+const unsafeTotal = cart.reduce(...);'
      },
      {
        number: 3,
        instruction: 'Run the hard reset',
        command: 'git reset --hard HEAD~1',
        explanation: 'Permanently discards the commit and all changes.',
        output: 'HEAD is now at 3d8b1e5 feat: add shopping cart'
      },
      {
        number: 4,
        instruction: 'Verify clean state',
        command: 'git status',
        explanation: 'Confirm everything is clean and matches the previous commit.',
        output: 'On branch main\nnothing to commit, working tree clean'
      }
    ],
    fullExample: {
      context: 'You spent an hour on an experimental checkout refactor, committed it, and realized it introduces an unfixable race condition.',
      commands: [
        { line: '$ git log --oneline -3', type: 'input' },
        { line: 'f7c2a09  broken experiment', type: 'output' },
        { line: '3d8b1e5  feat: add shopping cart', type: 'output' },
        { line: '$ git reset --hard HEAD~1', type: 'input' },
        { line: 'HEAD is now at 3d8b1e5 feat: add shopping cart', type: 'output' }
      ]
    },
    avoidTips: [
      'Before a hard reset, drop a bookmark: `git branch backup/before-reset`. Deleting it later is free.',
      'If you have uncommitted edits you might want, `git stash -u` them first, because `--hard` deletes them.',
      'Use throwaway branches for experiments: `git switch -c experiment/idea`.'
    ],
    relatedScenarios: ['scenario-01', 'scenario-06'],
    warnings: [
      { type: 'danger', text: 'Uncommitted changes in your working directory are deleted permanently. The discarded commit itself is only recoverable through `git reflog` until it expires.' }
    ]
  },
  {
    id: 'scenario-03',
    number: '03',
    title: 'Revert a Pushed Commit Safely',
    category: 'undo-recover',
    severity: 'safe',
    primaryCommand: 'git revert <commit-hash>',
    tagline: 'Bad code is already on the remote — undo it without rewriting history',
    situation: 'A bad commit has already been pushed to a shared branch (main, develop) and teammates may have already pulled it. You cannot use git reset here because it rewrites history and would break everyone\'s local repos. git revert creates a new commit that undoes the bad one while keeping history intact.',
    howItWorks: 'git revert applies the exact inverse of a commit\'s changes as a new commit. The bad commit stays in history (for audit purposes) but is functionally cancelled out. This is always safe on shared branches.',
    steps: [
      {
        number: 1,
        instruction: 'Find the hash of the bad commit',
        command: 'git log --oneline -10',
        explanation: 'Look for the commit message that describes the problem to find its hash.',
        output: 'b9f3d12 bug: remove user data on logout\n3a2d1f0 feat: add user avatar'
      },
      {
        number: 2,
        instruction: 'Preview what that commit changed',
        command: 'git show b9f3d12',
        explanation: 'Confirms you have the right commit before reverting.',
        output: 'commit b9f3d12...\n- const keepSession = true;\n+ const keepSession = false;'
      },
      {
        number: 3,
        instruction: 'Revert it',
        command: 'git revert --no-edit b9f3d12',
        explanation: 'Creates a new "Revert" commit automatically.',
        output: '[main 1a3c5e7] Revert "bug: remove user data on logout"'
      },
      {
        number: 4,
        instruction: 'Push the revert',
        command: 'git push origin main',
        explanation: 'Teammates will get the fix on their next pull.',
        output: 'To github.com/org/repo.git\n   b9f3d12..1a3c5e7  main -> main'
      }
    ],
    fullExample: {
      context: 'A bug that removes user data on logout got pushed to the production main branch.',
      commands: [
        { line: '$ git log --oneline -5', type: 'input' },
        { line: 'b9f3d12  bug: remove user data on logout', type: 'output' },
        { line: '$ git revert --no-edit b9f3d12', type: 'input' },
        { line: '[main 1a3c5e7] Revert "bug: remove user data on logout"', type: 'output' },
        { line: '$ git push origin main', type: 'input' }
      ]
    },
    avoidTips: [
      'Require PR reviews before merging to main.',
      'Set up CI that runs tests on every PR.',
      'Use branch protection rules to block direct pushes to main.'
    ],
    relatedScenarios: ['scenario-01', 'scenario-09']
  },
  {
    id: 'scenario-04',
    number: '04',
    title: 'Restore a Deleted File from an Old Commit',
    category: 'undo-recover',
    severity: 'safe',
    primaryCommand: 'git checkout <deleting-commit>^ -- <file>',
    tagline: 'A file was deleted in history — bring only that file back',
    situation: 'A file was deleted at some point in history — by a teammate, a refactor, or an accidental `git rm`. You need it back but you don\'t want to roll back the entire project to an old state. You want only that one file restored.',
    howItWorks: 'The commit that deleted the file no longer contains it, but its parent does. `<hash>^` means "the parent of <hash>", so `git checkout <deleting-commit>^ -- <file>` copies the file out of the last snapshot that still had it, without touching anything else. The `--` separator tells Git that what follows is a path, not a branch. (`git restore --source=<hash>^ --staged --worktree -- <file>` is the modern equivalent.)',
    steps: [
      {
        number: 1,
        instruction: 'Find the commit that deleted the file',
        command: 'git log --oneline --diff-filter=D -- src/utils/formatDate.js',
        explanation: '`--diff-filter=D` shows only commits that deleted this path. Without it, `git log -- <file>` lists newest first, so the deletion would be the first line, not the last good version.',
        output: '7a2c1f0 chore: delete obsolete helpers'
      },
      {
        number: 2,
        instruction: 'Preview the file in the parent of that commit',
        command: 'git show 7a2c1f0^:src/utils/formatDate.js',
        explanation: '`7a2c1f0^` is the snapshot just before the deletion. Check that this is the version you want.',
        output: 'export function formatDate(date) {\n  return new Intl.DateTimeFormat("en-GB").format(date);\n}'
      },
      {
        number: 3,
        instruction: 'Restore the file',
        command: 'git checkout 7a2c1f0^ -- src/utils/formatDate.js',
        explanation: 'Writes the file into your working directory and stages it automatically.',
        output: ''
      },
      {
        number: 4,
        instruction: 'Commit the restoration',
        command: 'git commit -m "restore: recover formatDate.js"',
        explanation: 'Creates a commit saving the restored file.',
        output: '[main 5d8e1f0] restore: recover formatDate.js'
      }
    ],
    fullExample: {
      context: 'A helper file src/utils/formatDate.js was deleted two weeks ago during a cleanup sprint, but now it is needed again.',
      commands: [
        { line: '$ git log --oneline --diff-filter=D -- src/utils/formatDate.js', type: 'input' },
        { line: '7a2c1f0 chore: delete obsolete helpers   ← the deletion', type: 'output' },
        { line: '$ git checkout 7a2c1f0^ -- src/utils/formatDate.js', type: 'input' },
        { line: '$ git status', type: 'input' },
        { line: 'Changes to be committed:\n\tnew file:   src/utils/formatDate.js', type: 'output' },
        { line: '$ git commit -m "restore: recover formatDate.js"', type: 'input' }
      ]
    },
    avoidTips: [
      'Tag stable releases as named reference points.',
      'Write clear commit messages when deleting files, explaining the reasoning.'
    ],
    relatedScenarios: ['scenario-21']
  },
  {
    id: 'scenario-05',
    number: '05',
    title: 'Fix Last Commit\'s Message or Content',
    category: 'undo-recover',
    severity: 'caution',
    primaryCommand: 'git commit --amend',
    tagline: 'You just committed — fix the message or add a forgotten file',
    situation: 'You just committed and spotted a typo in the message, forgot to include a file, or left a console.log in the code. The commit hasn\'t been pushed yet (or is on a personal branch only). You want to fix it without creating a separate "oops" commit.',
    howItWorks: '`--amend` replaces the last commit with a new one. Technically it creates a brand new commit (new hash) that contains the old commit\'s changes plus anything newly staged, with the new message. The old commit drops off the branch (it is still in the reflog). Because the hash changes, amending a commit that is already on a shared branch rewrites history others depend on.',
    steps: [
      {
        number: 1,
        instruction: 'Fix commit message only',
        command: 'git commit --amend -m "feat(auth): add JWT token validation"',
        explanation: 'Instantly replaces the last commit message with the new one.',
        output: '[main 3a9f1c2] feat(auth): add JWT token validation'
      },
      {
        number: 2,
        instruction: 'Forgot a file? Stage it',
        command: 'git add src/__tests__/auth.test.js',
        explanation: 'Stages the forgotten files you want to bundle into the commit.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Amend keeping the message',
        command: 'git commit --amend --no-edit',
        explanation: 'Bundles staged changes into the last commit without changing the message.',
        output: '[main 4b8e2d1] feat(auth): add JWT token validation'
      },
      {
        number: 4,
        instruction: 'Force push if already on a remote personal branch',
        command: 'git push --force-with-lease origin feature/branch',
        explanation: 'Overwrites the branch on the remote. Only do this on private feature branches.',
        output: 'To github.com/org/repo.git\n + 3a9f1c2...4b8e2d1 feature/branch -> feature/branch (forced update)'
      }
    ],
    fullExample: {
      context: 'You committed the auth feature but realized you made a typo in the commit message and forgot the test file.',
      commands: [
        { line: '$ git log --oneline -1', type: 'input' },
        { line: '2e8d4b0 feat(auth): add JTW token   ← typo', type: 'output' },
        { line: '$ git commit --amend -m "feat(auth): add JWT token validation"', type: 'input' },
        { line: '[main 3a9f1c2] feat(auth): add JWT token validation', type: 'output' },
        { line: '$ git add src/__tests__/auth.test.js', type: 'input' },
        { line: '$ git commit --amend --no-edit', type: 'input' },
        { line: '[main 4b8e2d1] feat(auth): add JWT token validation', type: 'output' }
      ]
    },
    avoidTips: [
      'Run git diff --staged before every commit to double check what is about to be committed.',
      'Set up Git hooks to prevent committing with syntax errors or empty messages.'
    ],
    relatedScenarios: ['scenario-01', 'scenario-17'],
    warnings: [
      { type: 'warning', text: 'Amend rewrites history (creates a new commit hash). Never amend commits that teammates have already pulled. Use --force-with-lease, not --force.' }
    ]
  },
  {
    id: 'scenario-06',
    number: '06',
    title: 'Recover an Accidentally Deleted Branch',
    category: 'undo-recover',
    severity: 'safe',
    primaryCommand: 'git reflog',
    tagline: 'You deleted a branch that wasn\'t fully merged — recover it from reflog',
    situation: 'You deleted a local branch thinking it was merged, but it had unpushed commits that are now seemingly gone. Git doesn\'t immediately garbage-collect commits — they remain in the reflog for about 30 days, giving you a window to recover.',
    howItWorks: 'Deleting a branch only deletes the pointer, not the commits. `git reflog` (reference log) records every position HEAD has been at: commits, checkouts, resets, merges, rebases. Any commit you made or checked out on that branch is listed there with its hash. Find the tip, point a new branch at it, and everything is reachable again. Shortcut: `git branch -D` prints the tip hash as it deletes ("was 7f3c2a1"), so check your terminal scrollback first.',
    steps: [
      {
        number: 1,
        instruction: 'Open reflog and scan for your branch',
        command: 'git reflog | grep stripe',
        explanation: 'Filter the reflog for your commit messages or the branch name (checkout entries read "moving from feature/stripe-integration to main"). The newest matching commit is usually the tip.',
        output: '7f3c2a1 HEAD@{4}: commit: feat: add stripe webhook handler'
      },
      {
        number: 2,
        instruction: 'Identify the last commit hash',
        command: 'git show 7f3c2a1',
        explanation: 'Review the commit details to confirm it represents the tip of your deleted branch.',
        output: 'commit 7f3c2a1...\nAuthor: sarah.dev ...\nfeat: add stripe webhook handler'
      },
      {
        number: 3,
        instruction: 'Recreate the branch',
        command: 'git checkout -b feature/stripe-integration 7f3c2a1',
        explanation: 'Recreates the branch at that exact commit. All work is restored!',
        output: 'Switched to a new branch \'feature/stripe-integration\''
      },
      {
        number: 4,
        instruction: 'Verify commits are back',
        command: 'git log --oneline -5',
        explanation: 'Confirms that all commits are present in history.',
        output: '7f3c2a1 feat: add stripe webhook handler\n4a2c1f0 feat: stripe setup'
      }
    ],
    fullExample: {
      context: 'You deleted a branch named feature/stripe-integration locally by mistake before pushing it.',
      commands: [
        { line: '$ git branch -D feature/stripe-integration', type: 'input' },
        { line: 'Deleted branch feature/stripe-integration (was 7f3c2a1).', type: 'output' },
        { line: '$ git reflog | grep stripe', type: 'input' },
        { line: '7f3c2a1 HEAD@{4}: commit: feat: add stripe webhook handler', type: 'output' },
        { line: '$ git checkout -b feature/stripe-integration 7f3c2a1', type: 'input' },
        { line: 'Switched to a new branch \'feature/stripe-integration\'', type: 'output' }
      ]
    },
    avoidTips: [
      'Use git branch -d (lowercase) — it refuses to delete branches that are not fully merged.',
      'Always push branches to remote before deleting them locally.',
      'Reflog is local to your machine and entries expire (90 days for reachable, 30 for unreachable by default), so recover sooner rather than later.'
    ],
    relatedScenarios: ['scenario-02', 'scenario-10']
  },
  {
    id: 'scenario-07',
    number: '07',
    title: 'Unstage Files Accidentally Added',
    category: 'undo-recover',
    severity: 'safe',
    primaryCommand: 'git restore --staged <file>',
    tagline: 'You ran git add . and staged files you didn\'t mean to commit',
    situation: 'You ran `git add .` or `git add -A` and staged everything, including .env files, build artifacts, IDE settings, or debug logs. You need to unstage specific files without losing your actual code changes.',
    howItWorks: '`git restore --staged` resets a file\'s entry in the staging area (index) back to what HEAD has, and leaves the working directory completely untouched. Your edits are safe; they just won\'t be in the next commit. Think of it as the exact opposite of `git add`. (On Git older than 2.23, use `git reset HEAD <file>`.)',
    steps: [
      {
        number: 1,
        instruction: 'Check what is currently staged',
        command: 'git status',
        explanation: 'See everything currently in the staging area.',
        output: 'Changes to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tnew file:   .env\n\tmodified:   src/Button.jsx'
      },
      {
        number: 2,
        instruction: 'Unstage the file you did not mean to add',
        command: 'git restore --staged .env',
        explanation: 'Removes .env from the staging area. The file itself stays on disk, untouched.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Verify only the intended files remain staged',
        command: 'git status',
        explanation: '.env is now untracked again. (Tip: to unstage everything at once, use `git restore --staged .`)',
        output: 'Changes to be committed:\n\tmodified:   src/Button.jsx\n\nUntracked files:\n\t.env'
      },
      {
        number: 4,
        instruction: 'Make sure it never gets staged again',
        command: 'echo ".env" >> .gitignore',
        explanation: 'Ignored files are skipped by `git add .`. Commit the .gitignore change along with your real work.',
        output: ''
      }
    ],
    fullExample: {
      context: 'You ran git add . and accidentally added a .env configuration file that contains database secrets.',
      commands: [
        { line: '$ git add .', type: 'input' },
        { line: '$ git status', type: 'input' },
        { line: '\tnew file:   .env            ← DO NOT COMMIT', type: 'output' },
        { line: '\tmodified:   src/Button.jsx  ← want this', type: 'output' },
        { line: '$ git restore --staged .env', type: 'input' },
        { line: '$ echo ".env" >> .gitignore', type: 'input' },
        { line: '$ git add .gitignore', type: 'input' },
        { line: '$ git commit -m "feat(ui): update button hover styles"', type: 'input' },
        { line: '[main 5e1a9c3] feat(ui): update button hover styles', type: 'output' }
      ]
    },
    avoidTips: [
      'Set up a proper .gitignore file before your first commit.',
      'Never run `git add .` blindly; review with `git status` first, or use `git add -p`.',
      'Add a global gitignore file for OS-specific files like .DS_Store or IDE configurations.'
    ],
    relatedScenarios: ['scenario-01', 'scenario-08', 'scenario-20']
  },
  {
    id: 'scenario-08',
    number: '08',
    title: 'Discard Changes to a Specific File',
    category: 'undo-recover',
    severity: 'destructive',
    primaryCommand: 'git restore <file>',
    tagline: 'Your edits to a file are a mess — revert it to the last committed state',
    situation: 'You edited a file during debugging or experimentation and made it worse. You want to throw away all local changes to that one file and revert it to exactly how it was at the last commit. You only want to reset that file, not the whole branch.',
    howItWorks: '`git restore <file>` overwrites the file in your working directory with the version in the staging area (index), which equals the last commit unless you have staged changes to it. If you already staged some edits, those survive; to throw away both staged and unstaged changes, use `git restore --staged --worktree <file>` (or `git restore --source=HEAD --staged --worktree <file>`). Discarded working-directory changes were never saved by Git, so they cannot be recovered.',
    steps: [
      {
        number: 1,
        instruction: 'Preview what will be lost',
        command: 'git diff src/api/client.js',
        explanation: 'See exactly what changes you are about to discard.',
        output: '- const BASE_URL = process.env.API_URL;\n+ const BASE_URL = "http://localhost:3001";'
      },
      {
        number: 2,
        instruction: 'Discard the local changes',
        command: 'git restore src/api/client.js',
        explanation: 'Overwrites the local file with the version in the index (here identical to the last commit).',
        output: ''
      },
      {
        number: 3,
        instruction: 'Verify restoration',
        command: 'git diff src/api/client.js',
        explanation: 'No output means the file now matches the last commit exactly.',
        output: ''
      }
    ],
    fullExample: {
      context: 'You hardcoded some URLs in src/api/client.js for testing and want to revert them back to the original environment variable configuration.',
      commands: [
        { line: '$ git diff src/api/client.js', type: 'input' },
        { line: '- const BASE_URL = process.env.API_URL;', type: 'output' },
        { line: '+ const BASE_URL = "http://localhost:3001"; // debug', type: 'output' },
        { line: '$ git restore src/api/client.js', type: 'input' },
        { line: '$ git diff src/api/client.js', type: 'input' }
      ]
    },
    avoidTips: [
      'Use git stash to save experimental changes instead of editing tracked configurations directly.',
      'Create local override files that are gitignored (e.g., .env.local) for debugging settings.'
    ],
    relatedScenarios: ['scenario-07', 'scenario-19'],
    warnings: [
      { type: 'danger', text: 'DESTRUCTIVE — working directory changes are unrecoverable once discarded.' }
    ]
  },
  {
    id: 'scenario-09',
    number: '09',
    title: 'Unmerge a Branch with Wrong Code',
    category: 'branches',
    severity: 'safe',
    primaryCommand: 'git revert -m 1 <merge-commit-hash>',
    tagline: 'A feature was merged into main but the code is wrong — safely undo it',
    situation: 'A feature branch was merged into main but the code is broken or shouldn\'t be in production yet. Teammates have likely already pulled the merge. You cannot reset main backwards — that breaks everyone\'s local repos. You need to reverse the merge while keeping git history intact.',
    howItWorks: 'A merge commit has two parents: parent 1 is the branch you merged into (main), parent 2 is the branch that was merged in (the feature). `-m 1` tells `git revert` to treat parent 1 as the mainline, so it creates a new commit that undoes everything the feature brought in and returns main\'s files to their pre-merge state. Nothing is rewritten. Using `-m 2` would instead undo main\'s side, which is almost never what you want.',
    steps: [
      {
        number: 1,
        instruction: 'Find the merge commit hash',
        command: 'git log --oneline --merges -10',
        explanation: 'Look for the merge commit message in the log to identify the target hash.',
        output: 'a9f3c21 Merge branch \'feature/new-checkout\' into main'
      },
      {
        number: 2,
        instruction: 'Inspect what came with the merge',
        command: 'git show a9f3c21 --stat',
        explanation: 'Confirms which files were modified in that merge.',
        output: 'src/checkout.js | 15 +++\nsrc/styles.css   |  4 +'
      },
      {
        number: 3,
        instruction: 'Revert the merge',
        command: 'git revert -m 1 --no-edit a9f3c21',
        explanation: 'Creates a new commit that undoes the entire merge. -m 1 chooses the main branch state as the base.',
        output: '[main 7c4e2f9] Revert "Merge branch \'feature/new-checkout\' into main"'
      },
      {
        number: 4,
        instruction: 'Push the revert to remote',
        command: 'git push origin main',
        explanation: 'Teammates get the fix on their next pull.',
        output: 'To github.com/org/repo.git\n   a9f3c21..7c4e2f9  main -> main'
      }
    ],
    fullExample: {
      context: 'You merged feature/new-checkout but immediately got reports of checkout page crashes.',
      commands: [
        { line: '$ git log --oneline --merges -5', type: 'input' },
        { line: 'a9f3c21  Merge branch \'feature/new-checkout\' into main', type: 'output' },
        { line: '$ git revert -m 1 --no-edit a9f3c21', type: 'input' },
        { line: '[main 7c4e2f9] Revert "Merge branch \'feature/new-checkout\' into main"', type: 'output' },
        { line: '$ git push origin main', type: 'input' }
      ]
    },
    avoidTips: [
      'Enforce pull request reviews and testing before merging to main.',
      'Use feature flags so bad code can be toggled off instantly without reverting.'
    ],
    relatedScenarios: ['scenario-03', 'scenario-15'],
    warnings: [
      { type: 'warning', text: 'Git still considers the feature commits merged. When the fixed branch is ready, first revert the revert (`git revert <revert-hash>`), then merge the new fixes. Otherwise the original changes will not come back.' }
    ]
  },
  {
    id: 'scenario-10',
    number: '10',
    title: 'Reset Branch to Exactly Match Remote',
    category: 'branches',
    severity: 'destructive',
    primaryCommand: 'git reset --hard origin/main',
    tagline: 'Your local branch has diverged — throw away local and sync to remote',
    situation: 'Your local branch has completely diverged from origin. You ran several experiments, rebased badly, or local main is behind by 20 commits with junk on top. You want to throw away all local changes and make your local branch a perfect mirror of remote.',
    howItWorks: 'git fetch origin updates your remote-tracking refs (origin/main etc.) to reflect what\'s actually on the remote server. git reset --hard origin/main then moves your local branch pointer to match that ref exactly, discarding all local commits and working directory changes.',
    steps: [
      {
        number: 1,
        instruction: 'Create a backup branch just in case',
        command: 'git branch backup/messy-local-state',
        explanation: 'Bookmarks your current local commits on a temporary branch as a safety net. It does not save uncommitted edits; run `git stash -u` too if you might want them.',
        output: ''
      },
      {
        number: 2,
        instruction: 'Fetch latest remote state',
        command: 'git fetch origin',
        explanation: 'Updates your remote-tracking refs such as origin/main. Your own branches are not touched.',
        output: 'From github.com:org/repo\n   3d8b1e5..4f9a2c1  main       -> origin/main'
      },
      {
        number: 3,
        instruction: 'Preview local commits that will be lost',
        command: 'git log --oneline origin/main..HEAD',
        explanation: 'Shows commits that exist locally but will be erased by the reset.',
        output: 'a9e1d8f experimental checkout'
      },
      {
        number: 4,
        instruction: 'Reset to match remote exactly',
        command: 'git reset --hard origin/main',
        explanation: 'Moves HEAD and local branch to origin/main. Discards local commits and edits.',
        output: 'HEAD is now at 4f9a2c1 feat: add notifications'
      },
      {
        number: 5,
        instruction: 'Verify up-to-date status',
        command: 'git status',
        explanation: 'Confirm local branch perfectly matches remote.',
        output: 'On branch main\nYour branch is up to date with \'origin/main\'.\nnothing to commit, working tree clean'
      }
    ],
    fullExample: {
      context: 'Your local branch has diverged from remote main, and you want to throw away your local edits and reset.',
      commands: [
        { line: '$ git status', type: 'input' },
        { line: 'Your branch and \'origin/main\' have diverged', type: 'output' },
        { line: '$ git branch backup/messy-local-state', type: 'input' },
        { line: '$ git fetch origin', type: 'input' },
        { line: '$ git reset --hard origin/main', type: 'input' },
        { line: 'HEAD is now at 4f9a2c1 feat: add notifications', type: 'output' }
      ]
    },
    avoidTips: [
      'Run git pull --rebase regularly to avoid branching divergence.',
      'Never commit experimental work directly on main — use feature branches.',
      'Set git config --global pull.rebase true to make rebase the default pull strategy.'
    ],
    relatedScenarios: ['scenario-02', 'scenario-13'],
    warnings: [
      { type: 'danger', text: 'DESTRUCTIVE — permanently discards all local commits and local changes that are not on remote.' }
    ]
  },
  {
    id: 'scenario-11',
    number: '11',
    title: 'Move Commits to the Correct Branch',
    category: 'branches',
    severity: 'caution',
    primaryCommand: 'git branch <new-branch> && git reset --hard <base>',
    tagline: 'You committed on main by mistake — move those commits to a feature branch',
    situation: 'Classic mistake: you\'ve been coding for an hour, then realize you never created the feature branch, so you committed directly onto main. The code is good; it\'s just on the wrong branch. You need those commits on a feature branch and main back where it was.',
    howItWorks: 'Branches are just pointers. `git branch feature/checkout` creates a new pointer at your current commit, so it already "contains" the misplaced commits. Then `git reset --hard <base>` moves main back to the last correct commit. Nothing is copied: the commits keep their hashes and simply belong to the new branch. If the commits must go onto a branch that already exists, switch to it and use `git cherry-pick <first>^..<last>` instead, then reset main the same way.',
    steps: [
      {
        number: 1,
        instruction: 'Find the misplaced commits and the last correct one',
        command: 'git log --oneline -4',
        explanation: 'Note the hash of the last commit that legitimately belongs on main (here 3a8c2f0).',
        output: 'c9f2a31 feat: order confirmation      ← wrong branch\n7b4e1d9 feat: checkout validation      ← wrong branch\n3a8c2f0 fix: nav link color           ← correct base\n91de4b7 chore: bump deps'
      },
      {
        number: 2,
        instruction: 'Create the feature branch at your current commit',
        command: 'git branch feature/checkout',
        explanation: 'The new branch points at c9f2a31, so it already holds both commits. Do not switch to it yet.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Move main back to the correct base',
        command: 'git reset --hard 3a8c2f0',
        explanation: 'Removes the two commits from main only; feature/checkout still points at them. Stash any uncommitted work first, because --hard discards it.',
        output: 'HEAD is now at 3a8c2f0 fix: nav link color'
      },
      {
        number: 4,
        instruction: 'Switch to the feature branch and keep working',
        command: 'git switch feature/checkout',
        explanation: '`git switch` is the modern, branch-only version of `git checkout`.',
        output: "Switched to branch 'feature/checkout'"
      },
      {
        number: 5,
        instruction: 'Verify the commits now live only on the feature branch',
        command: 'git log --oneline main..feature/checkout',
        explanation: 'Lists commits on feature/checkout that main does not have. You should see exactly the two moved commits.',
        output: 'c9f2a31 feat: order confirmation\n7b4e1d9 feat: checkout validation'
      }
    ],
    fullExample: {
      context: 'You accidentally made two checkout commits directly on main instead of a feature branch. Nothing has been pushed yet.',
      commands: [
        { line: '$ git log --oneline -3', type: 'input' },
        { line: 'c9f2a31 feat: order confirmation   ← wrong', type: 'output' },
        { line: '7b4e1d9 feat: checkout validation  ← wrong', type: 'output' },
        { line: '3a8c2f0 fix: nav link color        ← correct base', type: 'output' },
        { line: '$ git branch feature/checkout', type: 'input' },
        { line: '$ git reset --hard 3a8c2f0', type: 'input' },
        { line: 'HEAD is now at 3a8c2f0 fix: nav link color', type: 'output' },
        { line: '$ git switch feature/checkout', type: 'input' },
        { line: "Switched to branch 'feature/checkout'", type: 'output' }
      ]
    },
    avoidTips: [
      'Create the branch before you start editing: `git switch -c feature/name`.',
      'Show the current branch in your shell prompt (Starship, Oh My Zsh, or git\'s own `__git_ps1`).',
      'Enable branch protection on main so accidental direct pushes are rejected.'
    ],
    relatedScenarios: ['scenario-01', 'scenario-25'],
    warnings: [
      { type: 'warning', text: 'Only do this if the commits are not yet pushed to main. If they are, leave main alone and use `git revert` instead.' }
    ]
  },
  {
    id: 'scenario-12',
    number: '12',
    title: 'Rename a Branch',
    category: 'branches',
    severity: 'safe',
    primaryCommand: 'git branch -m old-name new-name',
    tagline: 'Branch has a typo or wrong name — fix it locally and on remote',
    situation: 'You created a branch with a typo (feature/lgoin instead of feature/login), the wrong naming convention, or a name that no longer reflects what the branch does. You need to rename it both locally and on remote without losing commits or breaking teammates.',
    howItWorks: '`git branch -m` ("move") renames the branch locally; commits are untouched because a branch is only a pointer. The remote copy is independent, so you push the new name (with `-u` to make it the upstream) and delete the old name as separate operations. If you are on the branch already, `git branch -m <new-name>` is enough.',
    steps: [
      {
        number: 1,
        instruction: 'Rename the branch locally',
        command: 'git branch -m feature/usr-authentcation feature/user-authentication',
        explanation: 'Renames the branch on your local machine.',
        output: ''
      },
      {
        number: 2,
        instruction: 'Push the new name and track it',
        command: 'git push -u origin feature/user-authentication',
        explanation: 'Creates the remote branch under the new name and sets it as upstream, so plain `git push` / `git pull` use it from now on.',
        output: "To github.com:org/repo.git\n * [new branch]      feature/user-authentication -> feature/user-authentication\nbranch 'feature/user-authentication' set up to track 'origin/feature/user-authentication'."
      },
      {
        number: 3,
        instruction: 'Delete the old branch from remote',
        command: 'git push origin --delete feature/usr-authentcation',
        explanation: 'Deletes the branch containing the typo from origin.',
        output: 'To github.com/org/repo.git\n - [deleted]         feature/usr-authentcation'
      },
      {
        number: 4,
        instruction: 'Verify the tracking setup',
        command: 'git branch -vv',
        explanation: 'The [origin/...] in brackets is the upstream. It should show the new name.',
        output: '* feature/user-authentication 9c1e2f4 [origin/feature/user-authentication] feat: login form'
      }
    ],
    fullExample: {
      context: 'You realized you typed feature/usr-authentcation with typos and want to correct it.',
      commands: [
        { line: '$ git branch -m feature/usr-authentcation feature/user-authentication', type: 'input' },
        { line: '$ git push -u origin feature/user-authentication', type: 'input' },
        { line: ' * [new branch]      feature/user-authentication -> feature/user-authentication', type: 'output' },
        { line: '$ git push origin --delete feature/usr-authentcation', type: 'input' },
        { line: ' - [deleted]         feature/usr-authentcation', type: 'output' }
      ]
    },
    avoidTips: [
      'Define clear branch naming conventions for your team (feature/, fix/, chore/).',
      'Most IDEs and Git GUIs support renaming branches directly with automatic remote updates.'
    ],
    relatedScenarios: ['scenario-11', 'scenario-13'],
    warnings: [
      { type: 'warning', text: 'Deleting the old remote branch closes any open pull request that uses it as its source branch. Teammates who checked it out must switch to the new name.' }
    ]
  },
  {
    id: 'scenario-13',
    number: '13',
    title: 'Clean Up Stale Local Branches',
    category: 'branches',
    severity: 'safe',
    primaryCommand: 'git fetch --prune',
    tagline: 'Your repo has dozens of dead branches — clean them up safely',
    situation: 'After months of development, your local repo has branches that were merged and deleted on remote long ago. Running git branch shows a graveyard. Autocomplete is polluted. You need to clean up without deleting anything active.',
    howItWorks: 'git fetch --prune updates your remote-tracking refs and removes any that no longer exist on remote. It does NOT delete your local branches — it only cleans up the origin/xxx references. You then use git branch --merged to safely identify and delete local branches that have been fully merged.',
    steps: [
      {
        number: 1,
        instruction: 'Fetch and prune remote tracking references',
        command: 'git fetch --prune',
        explanation: 'Prunes deleted remote branch references from your local checkout.',
        output: 'From github.com/org/repo\n - [deleted]         (none)     -> origin/feature/auth-v1'
      },
      {
        number: 2,
        instruction: 'Identify fully merged branches',
        command: 'git branch --merged main',
        explanation: 'Lists local branches whose tip is already contained in main. main itself also appears; never delete it. Branches that were squash-merged on GitHub will not show up here because their commits were rewritten.',
        output: '  feature/auth-v1\n  feature/dark-mode\n* main'
      },
      {
        number: 3,
        instruction: 'Delete the merged branches',
        command: 'git branch -d feature/auth-v1 feature/dark-mode',
        explanation: '-d (lowercase) deletes branches safely, refusing if they contain unmerged work.',
        output: 'Deleted branch feature/auth-v1 (was 3a8c2f0).\nDeleted branch feature/dark-mode (was 9f2c1e0).'
      }
    ],
    fullExample: {
      context: 'You have several old merged feature branches (feature/auth-v1, feature/dark-mode) that you want to delete.',
      commands: [
        { line: '$ git fetch --prune', type: 'input' },
        { line: '- [deleted] origin/feature/auth-v1', type: 'output' },
        { line: '$ git branch --merged main', type: 'input' },
        { line: '  feature/auth-v1', type: 'output' },
        { line: '  feature/dark-mode', type: 'output' },
        { line: '$ git branch -d feature/auth-v1 feature/dark-mode', type: 'input' },
        { line: 'Deleted branch feature/auth-v1', type: 'output' }
      ]
    },
    avoidTips: [
      'Configure automatic pruning globally: `git config --global fetch.prune true`.',
      'To find branches whose remote is gone (common after squash merges), run `git branch -vv` and look for ": gone]".',
      'Delete your local branch right after merging your Pull Request.',
      'Enable "Automatically delete head branches" in GitHub settings.'
    ],
    relatedScenarios: ['scenario-10']
  },
  {
    id: 'scenario-14',
    number: '14',
    title: 'Resolve a Merge Conflict',
    category: 'merge-rebase',
    severity: 'caution',
    primaryCommand: 'git add <file> && git merge --continue',
    tagline: 'Two teammates edited the same lines — manually choose the right version',
    situation: 'You ran git merge and Git stopped with a conflict. Two people edited the same lines and Git doesn\'t know which version to keep. This is normal in active teams — knowing how to resolve it calmly is essential.',
    howItWorks: 'Git merges everything it can automatically and stops on lines both sides changed. In those files it writes conflict markers: your current branch\'s version (HEAD) sits between `<<<<<<<` and `=======`, the incoming branch\'s version between `=======` and `>>>>>>>`. You edit the file to the correct final content, delete all three marker lines, `git add` the file to mark it resolved, and finish with `git merge --continue` (same as `git commit`). Changed your mind? `git merge --abort` puts everything back.',
    steps: [
      {
        number: 1,
        instruction: 'Check which files have conflicts',
        command: 'git status',
        explanation: 'Lists unmerged paths that need manual conflict resolution.',
        output: 'You have unmerged paths.\nUnmerged paths:\n  both modified:   src/config/api.js'
      },
      {
        number: 2,
        instruction: 'Locate conflict markers in file',
        command: 'cat src/config/api.js',
        explanation: 'Look for <<<<<<< HEAD, =======, and >>>>>>> markers.',
        output: '<<<<<<< HEAD\nconst BASE_URL = "https://prod.api.com";\n=======\nconst BASE_URL = "https://staging.api.com";\n>>>>>>> feature/performance-tuning'
      },
      {
        number: 3,
        instruction: 'Edit the file to its final content and remove the markers',
        editor: { file: 'src/config/api.js', content: '// Keep production as the default, allow override for staging\nconst BASE_URL = process.env.API_URL ?? "https://prod.api.com";' },
        explanation: 'Use any editor. Keep one side, the other, or a combination, but no <<<<<<<, ======= or >>>>>>> lines may remain. Run your tests before continuing.',
        output: ''
      },
      {
        number: 4,
        instruction: 'Stage the resolved file',
        command: 'git add src/config/api.js',
        explanation: 'Stages the file, telling Git that you have resolved the conflicts.',
        output: ''
      },
      {
        number: 5,
        instruction: 'Complete the merge',
        command: 'git merge --continue',
        explanation: 'Creates the merge commit using Git\'s prepared message (your editor opens so you can tweak it). Equivalent to `git commit`.',
        output: "[main 9e2c1f0] Merge branch 'feature/performance-tuning'"
      }
    ],
    fullExample: {
      context: 'You merged feature/performance-tuning into main and hit conflicts in src/config/api.js.',
      commands: [
        { line: '$ git merge feature/performance-tuning', type: 'input' },
        { line: 'CONFLICT: Merge conflict in src/config/api.js', type: 'output' },
        { line: 'Automatic merge failed; fix conflicts and then commit the result.', type: 'output' },
        { line: '$ code src/config/api.js   # resolve, delete the markers, save', type: 'input' },
        { line: '$ git add src/config/api.js', type: 'input' },
        { line: '$ git merge --continue', type: 'input' },
        { line: "[main 9e2c1f0] Merge branch 'feature/performance-tuning'", type: 'output' }
      ]
    },
    avoidTips: [
      'Pull changes from main into your branch frequently to resolve smaller conflicts early.',
      'Keep branches short-lived (1-3 days).',
      'Coordinate with teammates before modifying shared configuration files.'
    ],
    relatedScenarios: ['scenario-15', 'scenario-16', 'scenario-18']
  },
  {
    id: 'scenario-15',
    number: '15',
    title: 'Abort a Merge in Progress',
    category: 'merge-rebase',
    severity: 'safe',
    primaryCommand: 'git merge --abort',
    tagline: 'The merge is getting messy — cancel it cleanly and start fresh',
    situation: 'You started a merge and the conflicts are overwhelming, you\'re merging the wrong branch, or you need to consult a teammate before deciding. You want to completely cancel the merge and return to your clean pre-merge state.',
    howItWorks: 'While a merge is in progress (Git has written `.git/MERGE_HEAD` and is waiting for you to commit), `git merge --abort` throws away the partial merge and restores the index and files to the commit you were on. No commit is created, so it is as if the merge never started. Best practice is to start merges with a clean working tree: uncommitted edits you had before the merge may not be restorable.',
    steps: [
      {
        number: 1,
        instruction: 'Verify merge is in progress',
        command: 'git status',
        explanation: 'Confirms that you are in the middle of a conflict resolution phase.',
        output: 'On branch main\nYou have unmerged paths.\n(fix conflicts and run "git commit")'
      },
      {
        number: 2,
        instruction: 'Abort the merge',
        command: 'git merge --abort',
        explanation: 'Instantly rolls back the merge attempt and restores files.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Confirm working tree is clean',
        command: 'git status',
        explanation: 'Check that your local changes are back to normal.',
        output: 'On branch main\nnothing to commit, working tree clean'
      }
    ],
    fullExample: {
      context: 'A merge of feature/redesign starts producing dozens of conflicts in files you are unfamiliar with.',
      commands: [
        { line: '$ git merge feature/redesign', type: 'input' },
        { line: 'CONFLICT (content): Merge conflict in src/App.jsx', type: 'output' },
        { line: 'CONFLICT (content): Merge conflict in src/styles/main.css', type: 'output' },
        { line: 'Automatic merge failed; fix conflicts and then commit the result.', type: 'output' },
        { line: '$ git merge --abort', type: 'input' },
        { line: '$ git status', type: 'input' },
        { line: 'nothing to commit, working tree clean', type: 'output' }
      ]
    },
    avoidTips: [
      'Preview a merge without committing: `git merge --no-commit --no-ff feature/branch`, inspect, then `git merge --abort`.',
      'Merge or rebase from main often so conflicts stay small.',
      'Mid-rebase or mid-cherry-pick? The same escape hatch exists: `git rebase --abort`, `git cherry-pick --abort`.'
    ],
    relatedScenarios: ['scenario-14']
  },
  {
    id: 'scenario-16',
    number: '16',
    title: 'Rebase a Feature Branch on Main Before PR',
    category: 'merge-rebase',
    severity: 'caution',
    primaryCommand: 'git rebase main',
    tagline: 'Your branch is behind main — rebase for a clean, linear history',
    situation: 'Your feature branch was created 2 weeks ago and main has 30 new commits. Merging now creates a messy history with a non-linear graph. Rebasing moves your commits on top of the latest main, making it look like you branched off today.',
    howItWorks: 'Rebase replays your commits one by one on top of the target branch. Each commit gets a new hash. The end result looks like you branched from the latest main. Your changes are identical — only the commit hashes and base point change.',
    steps: [
      {
        number: 1,
        instruction: 'Update local main',
        command: 'git checkout main && git pull origin main',
        explanation: 'Ensure your local main has the latest remote updates.',
        output: 'Switched to branch \'main\'\nAlready up to date.'
      },
      {
        number: 2,
        instruction: 'Switch back to your feature branch',
        command: 'git checkout feature/user-settings',
        explanation: 'Navigate back to the branch you want to rebase.',
        output: 'Switched to branch \'feature/user-settings\''
      },
      {
        number: 3,
        instruction: 'Rebase onto main',
        command: 'git rebase main',
        explanation: 'Replays your commits on top of main. On a conflict, Git pauses: fix the file, `git add` it, then `git rebase --continue` (or `git rebase --abort` to back out).',
        output: 'Successfully rebased and updated refs/heads/feature/user-settings'
      },
      {
        number: 4,
        instruction: 'Force push the rebased branch',
        command: 'git push --force-with-lease origin feature/user-settings',
        explanation: 'Required because your commit hashes have changed. --force-with-lease prevents overwriting team members\' commits.',
        output: 'To github.com/org/repo.git\n + 8f2d9e1...9e1f2a3 feature/user-settings -> feature/user-settings (forced update)'
      }
    ],
    fullExample: {
      context: 'You want to update your feature/user-settings branch to sit on top of the latest changes from the main branch.',
      commands: [
        { line: '$ git checkout main && git pull origin main', type: 'input' },
        { line: '$ git checkout feature/user-settings', type: 'input' },
        { line: '$ git rebase main', type: 'input' },
        { line: 'Successfully rebased and updated refs/heads/feature/user-settings', type: 'output' },
        { line: '$ git push --force-with-lease origin feature/user-settings', type: 'input' }
      ]
    },
    avoidTips: [
      'Shortcut without switching branches: `git fetch origin && git rebase origin/main`.',
      'Rebase daily so conflicts stay small and manageable.',
      'Never rebase commits that have been shared with other developers on a collaborative branch.'
    ],
    relatedScenarios: ['scenario-17', 'scenario-18'],
    warnings: [
      { type: 'warning', text: 'Rebasing rewrites history. Never rebase a branch other people are working on. Use --force-with-lease when pushing.' }
    ]
  },
  {
    id: 'scenario-17',
    number: '17',
    title: 'Squash Messy Commits Before Merge',
    category: 'merge-rebase',
    severity: 'caution',
    primaryCommand: 'git rebase -i HEAD~N',
    tagline: 'Clean up WIP commits into meaningful ones before your PR is reviewed',
    situation: 'Your feature branch has a pile of commits: "WIP", "fix", "fix 2", "lol why isn\'t this working", "ok NOW it works". Normal during development, but you don\'t want that noise in main. Before merging, squash them into 2-3 clean commits with meaningful messages.',
    howItWorks: 'Interactive rebase opens your editor with the commits listed oldest-first, each prefixed by an action: `pick` = keep, `squash` (s) = meld into the commit above and combine messages, `fixup` (f) = meld and discard this message, `reword` (r) = keep but edit the message, `drop` (d) = delete. Reordering lines reorders commits. Save and close, and Git replays the commits according to your instructions, creating new hashes.',
    steps: [
      {
        number: 1,
        instruction: 'Start interactive rebase for the last 6 commits',
        command: 'git rebase -i HEAD~6',
        explanation: 'Git opens your editor with a "todo list" of the last 6 commits, oldest at the top.',
        output: ''
      },
      {
        number: 2,
        instruction: 'Change pick to squash (or fixup) for the commits to fold in',
        editor: { file: '.git/rebase-merge/git-rebase-todo', content: 'pick   3a8c2f0 feat(auth): add oauth signup\nsquash 7b4e1d9 WIP\nsquash c9f2a31 fix\nfixup  4d2e8a1 fix 2\nfixup  9f1b3c7 lol why isn\'t this working\nfixup  e2a7d40 ok NOW it works' },
        explanation: 'Keep `pick` on the first line. `squash` melds a commit into the one above and lets you edit the combined message; `fixup` does the same but throws its message away. Save and close the editor.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Write the clean combined commit message',
        editor: { file: '.git/COMMIT_EDITMSG', content: 'feat(auth): implement oauth signup flow\n\n- Google and GitHub providers\n- Persist session on callback' },
        explanation: 'Git opens the editor once more with all squashed messages. Replace them with one clear message, save and close.',
        output: "[detached HEAD f9d2c1e] feat(auth): implement oauth signup flow\nSuccessfully rebased and updated refs/heads/feature/oauth."
      },
      {
        number: 4,
        instruction: 'Force push the cleaned history',
        command: 'git push --force-with-lease origin feature/oauth',
        explanation: 'Required because the commit hashes changed. `--force-with-lease` refuses if someone else pushed in the meantime.',
        output: 'To github.com:org/repo.git\n + e2a7d40...f9d2c1e feature/oauth -> feature/oauth (forced update)'
      }
    ],
    fullExample: {
      context: 'Your feature/oauth branch has 6 messy commits and you want a single clean one before review.',
      commands: [
        { line: '$ git rebase -i HEAD~6', type: 'input' },
        { line: '(editor) keep "pick" on line 1, mark the other 5 as squash / fixup', type: 'output' },
        { line: '(editor) write "feat(auth): implement oauth signup flow"', type: 'output' },
        { line: 'Successfully rebased and updated refs/heads/feature/oauth.', type: 'output' },
        { line: '$ git log --oneline -2', type: 'input' },
        { line: 'f9d2c1e feat(auth): implement oauth signup flow', type: 'output' },
        { line: '$ git push --force-with-lease origin feature/oauth', type: 'input' }
      ]
    },
    avoidTips: [
      'Write meaningful commit messages even during local development to reduce squashing pain.',
      'Commit follow-ups with `git commit --fixup=<hash>`, then `git rebase -i --autosquash` arranges them for you.',
      'Many teams simply use "Squash and merge" on the pull request instead.'
    ],
    relatedScenarios: ['scenario-05', 'scenario-16'],
    warnings: [
      { type: 'warning', text: 'Rewrites history. Only squash commits on your own branch that nobody else has built on.' }
    ]
  },
  {
    id: 'scenario-18',
    number: '18',
    title: 'Push Rejected: Local and Remote Diverged',
    category: 'merge-rebase',
    severity: 'caution',
    primaryCommand: 'git pull --rebase',
    tagline: 'Someone else pushed while you were working — sync and push cleanly',
    situation: 'You try to git push and get "Updates were rejected because the remote contains work that you do not have locally." A teammate pushed to the same branch while you were working. You need to incorporate their changes before you can push yours.',
    howItWorks: 'git pull --rebase fetches remote changes and then replays YOUR commits on top of them. This keeps a linear history. Regular git pull (without --rebase) does a merge instead, creating an extra "Merge branch..." commit. For feature branches, rebase is cleaner.',
    steps: [
      {
        number: 1,
        instruction: 'Attempt push and see rejection',
        command: 'git push origin feature/payments',
        explanation: 'Git stops you if your local base is out of sync.',
        output: '! [rejected]        feature/payments -> feature/payments (non-fast-forward)\nerror: failed to push some refs'
      },
      {
        number: 2,
        instruction: 'Pull and rebase remote commits',
        command: 'git pull --rebase origin feature/payments',
        explanation: 'Fetches remote commits and applies your commits on top of them.',
        output: 'Successfully rebased and updated refs/heads/feature/payments'
      },
      {
        number: 3,
        instruction: 'Resolve conflicts if any',
        command: 'git rebase --continue',
        explanation: 'If a conflict occurs, fix it, stage it with git add, and run continue.',
        output: ''
      },
      {
        number: 4,
        instruction: 'Push normally',
        command: 'git push origin feature/payments',
        explanation: 'Your commits are now ahead of the remote, so the push succeeds.',
        output: 'To github.com/org/repo.git\n   c9f2a31..f9d2c1e  feature/payments -> feature/payments'
      }
    ],
    fullExample: {
      context: 'You push to feature/payments but get rejected because a coworker pushed changes to the same branch.',
      commands: [
        { line: '$ git push origin feature/payments', type: 'input' },
        { line: '! [rejected]        feature/payments -> feature/payments (non-fast-forward)', type: 'output' },
        { line: '$ git pull --rebase origin feature/payments', type: 'input' },
        { line: 'Successfully rebased', type: 'output' },
        { line: '$ git push origin feature/payments', type: 'input' }
      ]
    },
    avoidTips: [
      'Always run git pull --rebase before starting a fresh coding session.',
      'Configure rebase as the default pull behavior: git config --global pull.rebase true.'
    ],
    relatedScenarios: ['scenario-16', 'scenario-10']
  },
  {
    id: 'scenario-19',
    number: '19',
    title: 'Stash WIP to Handle an Urgent Hotfix',
    category: 'stash-staging',
    severity: 'safe',
    primaryCommand: 'git stash push -u -m "description"',
    tagline: 'Urgent bug arrives mid-feature — shelve your work and come back later',
    situation: 'You\'re deep in a feature — files half-edited, tests broken, not ready to commit. An urgent production bug needs fixing right now. You need to drop what you\'re doing, fix the bug, then return to your work exactly as you left it.',
    howItWorks: '`git stash push` saves your staged and unstaged changes to tracked files as a stash entry (a special commit that is not on any branch) and cleans your working directory. Untracked new files are left behind unless you add `-u` (`--include-untracked`). `git stash pop` re-applies the entry and deletes it; by default everything comes back as unstaged, and `--index` also restores what was staged. If popping hits a conflict, the entry is kept so nothing is lost.',
    steps: [
      {
        number: 1,
        instruction: 'Stash current changes with a description',
        command: 'git stash push -u -m "WIP: user settings form"',
        explanation: '`-u` includes untracked files (like a brand-new component) so the tree is truly clean.',
        output: 'Saved working directory and index state On feature/user-settings: WIP: user settings form'
      },
      {
        number: 2,
        instruction: 'Switch to main and create hotfix branch',
        command: 'git switch main && git pull && git switch -c hotfix/fix-payment',
        explanation: 'Get the latest main and start the hotfix branch from it.',
        output: 'Switched to a new branch \'hotfix/fix-payment\''
      },
      {
        number: 3,
        instruction: 'Fix, commit, and push the hotfix branch',
        command: 'git commit -am "fix: payment validation crash" && git push -u origin hotfix/fix-payment',
        explanation: 'Commit the fix (`-a` stages modified tracked files) and push it for review / deployment.',
        output: '[hotfix/fix-payment a3f8c21] fix: payment validation crash'
      },
      {
        number: 4,
        instruction: 'Return to your feature branch',
        command: 'git switch feature/user-settings',
        explanation: 'Go back to your feature branch to resume work.',
        output: 'Switched to branch \'feature/user-settings\''
      },
      {
        number: 5,
        instruction: 'Pop your stashed changes',
        command: 'git stash pop --index',
        explanation: 'Re-applies the stash (with `--index`, staged changes come back staged) and deletes the entry.',
        output: 'On branch feature/user-settings\nChanges not staged for commit:\n\tmodified:   src/components/SettingsForm.jsx\nUntracked files:\n\tsrc/hooks/useSettings.js\nDropped refs/stash@{0} (5b1c2e9...)'
      }
    ],
    fullExample: {
      context: 'You have modified code in your feature branch, but need to quickly switch to main to fix an invoice payment crash.',
      commands: [
        { line: '$ git stash push -u -m "WIP: settings form"', type: 'input' },
        { line: 'Saved working directory and index state On feature/user-settings: WIP: settings form', type: 'output' },
        { line: '$ git switch main && git pull', type: 'input' },
        { line: '$ git switch -c hotfix/fix-payment-crash', type: 'input' },
        { line: '$ git commit -am "fix: payment validation crash"', type: 'input' },
        { line: '$ git push -u origin hotfix/fix-payment-crash', type: 'input' },
        { line: '$ git switch feature/user-settings', type: 'input' },
        { line: '$ git stash pop --index', type: 'input' },
        { line: 'Dropped refs/stash@{0} (5b1c2e9...)', type: 'output' }
      ]
    },
    avoidTips: [
      'Always give stashes a description using -m, otherwise identifying them in git stash list becomes difficult.',
      'With several stashes, `git stash list` shows them and `git stash pop stash@{N}` restores a specific one.',
      'For longer interruptions, `git worktree add ../hotfix main` gives you a second checkout with no stashing at all.'
    ],
    relatedScenarios: ['scenario-08', 'scenario-20']
  },
  {
    id: 'scenario-20',
    number: '20',
    title: 'Stage Only Specific Lines from a File',
    category: 'stash-staging',
    severity: 'safe',
    primaryCommand: 'git add -p',
    tagline: 'One file has two unrelated changes — commit them separately',
    situation: 'You edited a file and the changes contain two completely unrelated things — you fixed a bug AND refactored some logic. Committing both together mixes concerns in your history. You want to commit only specific lines now, and the rest separately.',
    howItWorks: '`git add -p` (patch mode) splits your changes into hunks, contiguous blocks of changed lines. For each hunk Git shows the diff and asks what to do, so you decide piece by piece what goes into the next commit. The rest stays in your working directory, untouched.',
    steps: [
      {
        number: 1,
        instruction: 'Start patch staging and answer per hunk',
        command: 'git add -p src/api/userService.js',
        explanation: 'Git shows each hunk and asks what to do. Press `y` to stage the bug-fix hunk and `n` to skip the refactor hunk. `s` splits a hunk that is too big, `q` quits.',
        output: '@@ -12,7 +12,7 @@ export async function getUser(id) {\n-  return db.find(id);\n+  return db.findById(id);\n(1/2) Stage this hunk [y,n,q,a,d,j,J,g,/,e,?]? y\n@@ -40,6 +40,4 @@\n-  // TODO: old lookup comments\n(2/2) Stage this hunk [y,n,q,a,d,K,g,/,e,?]? n'
      },
      {
        number: 2,
        instruction: 'Review exactly what is staged',
        command: 'git diff --staged',
        explanation: 'Only the bug fix should appear here. `git diff` (without --staged) shows what is left unstaged.',
        output: '-  return db.find(id);\n+  return db.findById(id);'
      },
      {
        number: 3,
        instruction: 'Commit only the staged lines',
        command: 'git commit -m "fix(api): use correct db.findById method"',
        explanation: 'Creates a commit containing only the bug fix.',
        output: '[main e8c3f1d] fix(api): use correct db.findById method\n 1 file changed, 1 insertion(+), 1 deletion(-)'
      },
      {
        number: 4,
        instruction: 'Commit the remaining changes separately',
        command: 'git commit -am "refactor: simplify user lookup comments"',
        explanation: '`-a` stages all remaining changes to tracked files and commits them.',
        output: '[main d9c2f10] refactor: simplify user lookup comments'
      }
    ],
    fullExample: {
      context: 'You modified src/api/userService.js to fix an ID query bug, and also cleaned up comments.',
      commands: [
        { line: '$ git add -p src/api/userService.js', type: 'input' },
        { line: '(1/2) Stage this hunk [y,n,q,a,d,j,J,g,/,e,?]? y', type: 'output' },
        { line: '(2/2) Stage this hunk [y,n,q,a,d,K,g,/,e,?]? n', type: 'output' },
        { line: '$ git commit -m "fix(api): use correct db.findById method"', type: 'input' },
        { line: '[main e8c3f1d] fix(api): use correct db.findById method', type: 'output' },
        { line: '$ git commit -am "refactor: simplify user lookup comments"', type: 'input' },
        { line: '[main d9c2f10] refactor: simplify user lookup comments', type: 'output' }
      ]
    },
    avoidTips: [
      'Make `git add -p` your default staging routine. It doubles as a final review pass before committing.',
      'Key options: `y` stage, `n` skip, `s` split into smaller hunks, `e` edit the hunk by hand, `?` help.',
      'The same `-p` flag works for `git restore -p` and `git stash push -p`.'
    ],
    relatedScenarios: ['scenario-07', 'scenario-19']
  },
  {
    id: 'scenario-21',
    number: '21',
    title: 'Bring a File from an Old Commit into Current Branch',
    category: 'history-advanced',
    severity: 'safe',
    primaryCommand: 'git checkout <hash> -- <file>',
    tagline: 'An old version of one file was better — restore just that file',
    situation: 'A file was refactored multiple times and the current version is slower and messier than it was 3 weeks ago. You want to go back to the old version of ONLY that file — not roll back the entire project.',
    howItWorks: 'Same mechanism as Scenario 04, applied to a file that still exists. `git checkout <hash> -- <file>` overwrites the file in both the working directory and the index with its version from that commit, so it is staged and ready to commit. Only that one path changes. The modern equivalent is `git restore --source=<hash> --staged --worktree -- <file>`.',
    steps: [
      {
        number: 1,
        instruction: 'Find the commit that had the good version',
        command: 'git log --oneline -- src/components/DataTable.jsx',
        explanation: 'Check the history of the file to identify the best commit.',
        output: 'f9c3a21 refactor: simplify DataTable\nb4e7d12 perf: optimize DataTable virtualization'
      },
      {
        number: 2,
        instruction: 'Preview the old version content',
        command: 'git show b4e7d12:src/components/DataTable.jsx',
        explanation: 'Make sure it is the code you want to restore.',
        output: '// DataTable with row virtualization...'
      },
      {
        number: 3,
        instruction: 'Restore the file from that commit',
        command: 'git checkout b4e7d12 -- src/components/DataTable.jsx',
        explanation: 'Overwrites the file in your working directory and stages the modification.',
        output: ''
      },
      {
        number: 4,
        instruction: 'Commit the restoration',
        command: 'git commit -m "revert(DataTable): restore virtualized version"',
        explanation: 'Commits the restored file.',
        output: '[main e9c8f2a] revert(DataTable): restore virtualized version'
      }
    ],
    fullExample: {
      context: 'You want to bring back the virtualized, fast version of src/components/DataTable.jsx from commit b4e7d12.',
      commands: [
        { line: '$ git log --oneline -- src/components/DataTable.jsx', type: 'input' },
        { line: 'f9c3a21  refactor: simplify DataTable', type: 'output' },
        { line: 'b4e7d12  perf: optimize DataTable virtualization  ← the good one', type: 'output' },
        { line: '$ git checkout b4e7d12 -- src/components/DataTable.jsx', type: 'input' },
        { line: '$ git commit -m "revert(DataTable): restore virtualized version"', type: 'input' }
      ]
    },
    avoidTips: [
      'Write highly descriptive commit messages when doing refactors so they are easy to find.',
      'Tag commits right before massive experimental rewrites.'
    ],
    relatedScenarios: ['scenario-04']
  },
  {
    id: 'scenario-22',
    number: '22',
    title: 'Find Which Commit Introduced a Bug',
    category: 'history-advanced',
    severity: 'safe',
    primaryCommand: 'git bisect',
    tagline: 'Something broke somewhere in 200 commits — binary search to find it',
    situation: 'Something is broken and you don\'t know when it broke. It worked a month ago but doesn\'t work now. There are 200 commits in between. git bisect automates a binary search through history, halving the search space each step until it identifies the exact commit that introduced the bug.',
    howItWorks: 'You tell Git which commit is "bad" (has the bug) and which is "good" (bug didn\'t exist). Git checks out the commit halfway between them. You test and mark it good or bad. Git checks out the new midpoint. Repeat until Git identifies the exact first bad commit. 200 commits = ~8 steps maximum.',
    steps: [
      {
        number: 1,
        instruction: 'Start the bisect session',
        command: 'git bisect start',
        explanation: 'Enters the binary search bisect mode.',
        output: ''
      },
      {
        number: 2,
        instruction: 'Mark the current commit as bad',
        command: 'git bisect bad',
        explanation: 'Tells Git that the currently checked-out commit (HEAD) has the bug.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Mark a known working release as good',
        command: 'git bisect good v1.4.0',
        explanation: 'Provides Git with the starting "good" boundary (can use tags or hashes).',
        output: 'Bisecting: 43 revisions left to test after this (roughly 5 steps)\n[3f1a9e2] feat: refactor cart totals'
      },
      {
        number: 4,
        instruction: 'Test each commit Git checks out and mark it',
        command: 'git bisect good   # or: git bisect bad',
        explanation: 'Git checks out a midpoint. Test your app: works? `git bisect good`. Broken? `git bisect bad`. Can\'t test this one? `git bisect skip`. Repeat until Git names the culprit.',
        output: 'Bisecting: 21 revisions left to test after this (roughly 4 steps)\n...\nc7a9f3e is the first bad commit\ncommit c7a9f3e\n    perf: memoize checkout totals'
      },
      {
        number: 5,
        instruction: 'Reset bisect to return to HEAD',
        command: 'git bisect reset',
        explanation: 'Exits bisect mode and returns you to your starting branch.',
        output: "Previous HEAD position was c7a9f3e perf: memoize checkout totals\nSwitched to branch 'main'"
      }
    ],
    fullExample: {
      context: 'You know the app worked at v1.4.0 but the checkout flow is now broken at HEAD.',
      commands: [
        { line: '$ git bisect start', type: 'input' },
        { line: '$ git bisect bad', type: 'input' },
        { line: '$ git bisect good v1.4.0', type: 'input' },
        { line: 'Bisecting: 43 revisions left to test after this (roughly 5 steps)', type: 'output' },
        { line: '$ git bisect good', type: 'input' },
        { line: 'Bisecting: 21 revisions left to test after this (roughly 4 steps)', type: 'output' },
        { line: '$ git bisect bad', type: 'input' },
        { line: '...', type: 'output' },
        { line: 'c7a9f3e is the first bad commit', type: 'output' },
        { line: '$ git bisect reset', type: 'input' }
      ]
    },
    avoidTips: [
      'Write automated tests for core paths to run them quickly during bisect.',
      'Automate it completely: git bisect run npm test — Git will run the test script and bisect automatically at each step.'
    ],
    relatedScenarios: ['scenario-24']
  },
  {
    id: 'scenario-23',
    number: '23',
    title: 'Tag a Release and Push to Remote',
    category: 'history-advanced',
    severity: 'safe',
    primaryCommand: 'git tag -a v2.0.0 -m "message"',
    tagline: 'Mark a specific commit as a named release version',
    situation: 'You\'ve finished v2.0.0 of your app. You want to permanently mark this exact commit so the team can always check out what was deployed, reference it in release notes, and roll back to it if needed.',
    howItWorks: 'An annotated tag (`-a`) is a full Git object that stores the tagger, date and message, and points at a commit. Unlike a branch, a tag never moves. A lightweight tag (no `-a`) is just a name for a commit with no metadata. Use annotated tags for releases: `git describe` uses them, and they can be signed (`-s`). Tags are not pushed by `git push` automatically; push them by name or with `--follow-tags`.',
    steps: [
      {
        number: 1,
        instruction: 'Ensure main is up to date',
        command: 'git checkout main && git pull origin main',
        explanation: 'Get the latest changes to ensure you tag the correct final release state.',
        output: 'Switched to branch \'main\'\nAlready up to date.'
      },
      {
        number: 2,
        instruction: 'Create the annotated tag',
        command: 'git tag -a v2.0.0 -m "Release 2.0.0: checkout redesign, dark mode"',
        explanation: 'Creates a local annotated tag. -a specifies annotation, -m sets the description.',
        output: ''
      },
      {
        number: 3,
        instruction: 'Push the tag to the remote origin',
        command: 'git push origin v2.0.0',
        explanation: 'Pushes the tag to remote so it becomes visible on GitHub/GitLab.',
        output: 'To github.com/org/repo.git\n * [new tag]         v2.0.0 -> v2.0.0'
      },
      {
        number: 4,
        instruction: 'Verify tag exists on remote',
        command: 'git ls-remote --tags origin',
        explanation: 'Lists tags on the remote. For annotated tags, the `^{}` line shows the commit the tag points at.',
        output: '5d0e3b1c4f...\trefs/tags/v2.0.0\n7f3c2a19e8...\trefs/tags/v2.0.0^{}'
      }
    ],
    fullExample: {
      context: 'You want to tag release v2.0.0 and deploy it to the production server.',
      commands: [
        { line: '$ git checkout main && git pull origin main', type: 'input' },
        { line: '$ git tag -a v2.0.0 -m "Release 2.0.0: checkout redesign, dark mode"', type: 'input' },
        { line: '$ git push origin v2.0.0', type: 'input' },
        { line: ' * [new tag]         v2.0.0 -> v2.0.0', type: 'output' }
      ]
    },
    avoidTips: [
      'Use Semantic Versioning (MAJOR.MINOR.PATCH).',
      'Set `git config --global push.followTags true` so annotated tags on pushed commits go up automatically.',
      'Never move a published tag. Cut a new version (v2.0.1) instead.',
      'Integrate tagging into your CI/CD pipeline so it happens automatically on merged release branches.'
    ],
    relatedScenarios: ['scenario-25']
  },
  {
    id: 'scenario-24',
    number: '24',
    title: 'Find Who Wrote a Specific Line and Why',
    category: 'history-advanced',
    severity: 'safe',
    primaryCommand: 'git blame -L <start>,<end> <file>',
    tagline: 'Trace a suspicious line to its author, commit, and original context',
    situation: 'You\'re debugging and trace a problem to a specific line of code. Before changing it, you want to know: Who wrote this? When? What was the reason? Maybe it looks weird but was deliberate, and changing it would break something else.',
    howItWorks: '`git blame` annotates every line with the commit, author and date that last changed it, and `-L 88,95` limits it to a line range. `git show <hash>` then gives you the full context: the commit message (the "why") and what else changed with it. Blame only shows the last touch, so a formatting commit can hide the real origin. `-w` ignores whitespace changes, and `git log -S "text"` (the pickaxe) finds every commit that added or removed a string.',
    steps: [
      {
        number: 1,
        instruction: 'Blame a range of lines in the target file',
        command: 'git blame -L 88,95 src/billing/invoiceGenerator.js',
        explanation: 'Annotates lines 88 to 95 with commit hashes and author names.',
        output: 'a7f3c21e (sarah.dev 2024-08-14 10:22:41 +0530 88) const tax = amount * 0.18;\n3e9b0a11 (raj.k     2023-11-02 16:05:10 +0530 89) const total = amount + tax;'
      },
      {
        number: 2,
        instruction: 'Show the context of the modifying commit',
        command: 'git show a7f3c21e',
        explanation: 'Display the commit message and full diff to understand why the change was made.',
        output: 'commit a7f3c21e4b...\nAuthor: sarah.dev <sarah@example.com>\nDate:   Wed Aug 14 10:22:41 2024 +0530\n\n    Fix tax calculation for foreign clients (JIRA-12)\n\n    GST applies at 18% to all invoices issued from the India entity.'
      },
      {
        number: 3,
        instruction: 'Search history for occurrences of a specific string',
        command: 'git log -S "taxExempt" --oneline',
        explanation: 'Finds commits that added or removed the string "taxExempt" across the entire history.',
        output: '8c9d1e2 refactor: implement tax-exempt users'
      }
    ],
    fullExample: {
      context: 'You found a line multiplying amount by 0.18 in billing calculations and need to find the rationale.',
      commands: [
        { line: '$ git blame -L 88,95 src/billing/invoiceGenerator.js', type: 'input' },
        { line: 'a7f3c21e (sarah.dev 2024-08-14 10:22:41 +0530 88) const tax = amount * 0.18;', type: 'output' },
        { line: '$ git show a7f3c21e', type: 'input' },
        { line: '    Fix tax calculation for foreign clients (JIRA-12)', type: 'output' },
        { line: '$ git log -S "0.18" --oneline', type: 'input' },
        { line: 'a7f3c21e Fix tax calculation for foreign clients (JIRA-12)', type: 'output' }
      ]
    },
    avoidTips: [
      'Always include ticket IDs (e.g., JIRA-101) in commit messages so developers can look up context.',
      'Keep commit messages descriptive. Explain why, not just what.',
      'List bulk reformatting commits in a `.git-blame-ignore-revs` file so blame skips them (`git config blame.ignoreRevsFile .git-blame-ignore-revs`).'
    ],
    relatedScenarios: ['scenario-22']
  },
  {
    id: 'scenario-25',
    number: '25',
    title: 'Port a Hotfix to an Older Release Branch',
    category: 'history-advanced',
    severity: 'caution',
    primaryCommand: 'git cherry-pick -x <hash>',
    tagline: 'A critical fix on main also needs to go into the v2.4 release branch',
    situation: 'A critical security fix was merged to main (now v3.0.0) but customers on v2.4.x need it too, without being force-upgraded to v3. You need to apply just that one fix commit onto the v2.4 branch without pulling in all the v3 changes.',
    howItWorks: '`git cherry-pick` takes the changes introduced by one commit and applies them as a new commit (new hash) on your current branch. The original on main is untouched. `-x` appends "(cherry picked from commit …)" to the message, so anyone can trace the backport to its source. If the old branch has diverged, expect conflicts: resolve, `git add`, then `git cherry-pick --continue`.',
    steps: [
      {
        number: 1,
        instruction: 'Find the hotfix commit hash on main',
        command: 'git log --oneline main --grep="session fixation"',
        explanation: '`--grep` searches commit messages. Note the hash of the fix.',
        output: '7f3c2a19 fix(auth): prevent session fixation attack'
      },
      {
        number: 2,
        instruction: 'Switch to the older release branch and update it',
        command: 'git switch release/v2.4 && git pull',
        explanation: 'Prepares the branch where the fix needs to be ported.',
        output: 'Switched to branch \'release/v2.4\''
      },
      {
        number: 3,
        instruction: 'Cherry-pick the fix commit',
        command: 'git cherry-pick -x 7f3c2a19',
        explanation: 'Applies the fix here as a new commit. Run your test suite on this branch before releasing.',
        output: '[release/v2.4 a2c8f1d] fix(auth): prevent session fixation attack\n 2 files changed, 14 insertions(+), 3 deletions(-)'
      },
      {
        number: 4,
        instruction: 'Tag the patch release',
        command: 'git tag -a v2.4.1 -m "v2.4.1: backport session fixation fix"',
        explanation: 'Creates the annotated tag on the backported commit.',
        output: ''
      },
      {
        number: 5,
        instruction: 'Push the branch and the tag',
        command: 'git push origin release/v2.4 v2.4.1',
        explanation: 'Tags are not pushed automatically, so name the tag explicitly alongside the branch.',
        output: 'To github.com:org/repo.git\n   e9d3c8a..a2c8f1d  release/v2.4 -> release/v2.4\n * [new tag]         v2.4.1 -> v2.4.1'
      }
    ],
    fullExample: {
      context: 'You need to backport a session fixation security fix from main to the v2.4 release branch.',
      commands: [
        { line: '$ git log --oneline main --grep="session fixation"', type: 'input' },
        { line: '7f3c2a19 fix(auth): prevent session fixation attack', type: 'output' },
        { line: '$ git switch release/v2.4 && git pull', type: 'input' },
        { line: '$ git cherry-pick -x 7f3c2a19', type: 'input' },
        { line: '[release/v2.4 a2c8f1d] fix(auth): prevent session fixation attack', type: 'output' },
        { line: '$ git tag -a v2.4.1 -m "v2.4.1: backport session fixation fix"', type: 'input' },
        { line: '$ git push origin release/v2.4 v2.4.1', type: 'input' },
        { line: ' * [new tag]         v2.4.1 -> v2.4.1', type: 'output' }
      ]
    },
    avoidTips: [
      'Land fixes as small, focused commits. They cherry-pick cleanly; big mixed commits do not.',
      'Establish a clear strategy for backporting fixes to older supported versions.',
      'Document which release versions are actively supported with security patches.'
    ],
    relatedScenarios: ['scenario-11', 'scenario-23']
  },
  {
    id: 'scenario-26',
    number: '26',
    title: 'Remove a Secret Committed to History',
    category: 'history-advanced',
    severity: 'emergency',
    primaryCommand: 'java -jar bfg.jar --delete-files .env repo.git',
    tagline: 'API keys were pushed — purge them from ALL history immediately',
    situation: 'A teammate pushed a .env file, API keys, or a database password to the repo. Even if deleted in the next commit, the secret is visible in git history. Anyone who cloned the repo can still see it. You must purge it from the ENTIRE history across all branches.',
    howItWorks: 'Deleting the file in a new commit is not enough, because every older commit still contains it. BFG Repo-Cleaner rewrites every commit in every branch so the file never existed, which changes all hashes from the first affected commit onward. Two catches: (1) BFG protects your latest commit by default, so the file must already be deleted in HEAD with a normal commit; (2) after the force push, everyone must re-clone, otherwise an old clone can push the secret back. Git itself now recommends `git filter-repo` for the same job (`git filter-repo --invert-paths --path .env`).',
    steps: [
      {
        number: 1,
        instruction: 'Rotate and revoke the leaked credential immediately',
        explanation: 'Do this first, before touching Git. Assume the secret is already compromised: bots scrape public pushes within minutes. Rewriting history does not un-leak it, but rotating does.',
        output: ''
      },
      {
        number: 2,
        instruction: 'Remove the file in a normal commit and push',
        command: 'git rm --cached .env && echo ".env" >> .gitignore && git commit -am "chore: stop tracking .env" && git push',
        explanation: 'BFG never rewrites your latest commit, so HEAD must already be clean. `--cached` keeps your local copy of .env.',
        output: '[main 3c8e0d2] chore: stop tracking .env\n 2 files changed, 1 insertion(+), 4 deletions(-)\n delete mode 100644 .env'
      },
      {
        number: 3,
        instruction: 'Clone a fresh bare mirror of the repository',
        command: 'git clone --mirror https://github.com/org/repo.git',
        explanation: 'A mirror clone contains every branch and tag, which is what you need to rewrite all of history.',
        output: "Cloning into bare repository 'repo.git'...\ndone."
      },
      {
        number: 4,
        instruction: 'Run BFG to strip the file from all history',
        command: 'java -jar bfg.jar --delete-files .env repo.git',
        explanation: 'Removes every file named .env from all commits except the protected HEAD (already clean from step 2).',
        output: 'Protected commits\n-----------------\nThese are your protected commits, and so their contents will NOT be altered:\n * commit 3c8e0d2 (protected by \'HEAD\')\n...\nDeleted files\n-------------\n\tFilename   Git id\n\t---------------------\n\t.env     | 4f1a2b9c (412 B)\n\nBFG run is complete!'
      },
      {
        number: 5,
        instruction: 'Expire old objects and force push the rewrite',
        command: 'cd repo.git && git reflog expire --expire=now --all && git gc --prune=now --aggressive && git push',
        explanation: 'gc physically deletes the old objects. A mirror clone pushes all refs with force automatically. GitHub may reject hidden refs/pull/* refs; ask GitHub Support to purge cached views of the old commits.',
        output: 'To github.com:org/repo.git\n + a7f3c21...8f2d9e1 main -> main (forced update)\n + 19be0c4...d27a8f3 develop -> develop (forced update)'
      },
      {
        number: 6,
        instruction: 'Every teammate deletes their old clone and re-clones',
        command: 'git clone https://github.com/org/repo.git',
        explanation: 'Old clones still contain the secret and the old history. Merging or pushing from them would bring it all back.',
        output: "Cloning into 'repo'..."
      }
    ],
    fullExample: {
      context: 'A teammate accidentally committed a .env file containing AWS credentials to the GitHub repository. The keys have already been rotated.',
      commands: [
        { line: '$ git rm --cached .env && git commit -m "chore: stop tracking .env" && git push', type: 'input' },
        { line: '$ git clone --mirror https://github.com/org/repo.git', type: 'input' },
        { line: "Cloning into bare repository 'repo.git'...", type: 'output' },
        { line: '$ java -jar bfg.jar --delete-files .env repo.git', type: 'input' },
        { line: 'Deleted files: .env (412 B)\nBFG run is complete!', type: 'output' },
        { line: '$ cd repo.git', type: 'input' },
        { line: '$ git reflog expire --expire=now --all && git gc --prune=now --aggressive', type: 'input' },
        { line: '$ git push', type: 'input' },
        { line: ' + a7f3c21...8f2d9e1 main -> main (forced update)', type: 'output' }
      ]
    },
    avoidTips: [
      'Add `.env`, `*.pem` and `*.key` to .gitignore before the first commit, and commit a `.env.example` with dummy values instead.',
      'Install a pre-commit secret scanner such as gitleaks or git-secrets, and enable GitHub push protection / secret scanning.',
      'Prefer a secrets manager (Vault, AWS Secrets Manager, Doppler) over files in the repo.'
    ],
    relatedScenarios: ['scenario-07', 'scenario-02'],
    warnings: [
      { type: 'danger', text: 'Rotate the leaked credentials first. History rewriting does not help if the key was already scraped.' },
      { type: 'warning', text: 'This rewrites every branch and tag. Coordinate with the team: open pull requests break, and everyone must re-clone.' }
    ]
  }
];
