// Breaks a command into tokens with a plain-English explanation for each.
// Flags are looked up as "<subcommand> <flag>" first, because the same flag
// means different things to different commands (e.g. -m for revert vs branch).

const SUBCOMMANDS = {
  reset: 'Moves the current branch pointer (and HEAD) to another commit; the mode decides what happens to the index and files.',
  revert: 'Creates a new commit that applies the exact inverse of an existing commit. History is not rewritten.',
  checkout: 'With `-- <path>`: copies a file out of a commit into your working tree and index. With a branch: switches branches.',
  commit: 'Records the staged changes as a new commit.',
  restore: 'Restores files in the working tree and/or the staging area from the index or a given commit.',
  branch: 'Lists, creates, renames or deletes branch pointers.',
  fetch: 'Downloads new commits and refs from a remote without touching your branches or files.',
  merge: 'Joins another branch\'s history into the current branch.',
  rebase: 'Replays commits on top of a new base, producing new commits with new hashes.',
  pull: 'Fetch, then integrate the remote branch into the current one (merge by default, or rebase).',
  stash: 'Shelves uncommitted changes on a stack so you get a clean working tree.',
  add: 'Stages content so it will be part of the next commit.',
  bisect: 'Binary-searches history to find the commit that introduced a bug.',
  tag: 'Creates, lists or deletes tags, which are permanent names for specific commits.',
  blame: 'Shows which commit and author last changed each line of a file.',
  log: 'Shows commit history.',
  reflog: 'Lists every position HEAD and your branches have been at, including commits no branch points to any more.',
  'cherry-pick': 'Applies the changes from an existing commit as a new commit on the current branch.'
};

const FLAGS = {
  'reset --soft': 'Move the branch only. Index and working tree are untouched, so the undone changes stay staged.',
  'reset --hard': 'Move the branch AND overwrite the index and working tree to match. Uncommitted changes are destroyed.',
  'revert -m': 'Mainline parent: for a merge commit, which parent to treat as the main line (1 = the branch merged into).',
  'branch -m': 'Move / rename a branch.',
  'commit -m': 'Use the following string as the commit message.',
  'commit --amend': 'Replace the last commit with a new one (staged changes + new or same message). The hash changes.',
  'tag -m': 'Tag message (implies an annotated tag).',
  'tag -a': 'Create an annotated tag object with tagger, date and message. Recommended for releases.',
  'stash push': 'Save changes to a new stash entry (the explicit form of plain `git stash`).',
  'stash -u': 'Include untracked files in the stash. Without it, new files are left behind.',
  'stash -m': 'A description for the stash entry, shown in `git stash list`.',
  'restore --staged': 'Operate on the staging area: unstage, without touching your files.',
  'fetch --prune': 'Delete remote-tracking refs (origin/…) for branches that no longer exist on the remote.',
  'merge --abort': 'Cancel the in-progress merge and restore the pre-merge state.',
  'merge --continue': 'Finish a merge after resolving conflicts (creates the merge commit).',
  'rebase -i': 'Interactive: opens an editor listing the commits so you can pick, squash, fixup, reword, reorder or drop them.',
  'pull --rebase': 'Rebase your local commits on top of the fetched remote commits instead of creating a merge commit.',
  'add -p': 'Patch mode: review each hunk and choose whether to stage it.',
  'blame -L': 'Limit blame to a line range, e.g. -L 88,95.',
  'cherry-pick -x': 'Append "(cherry picked from commit …)" to the message for traceability.',
  '--': 'Everything after this is a file path, not a branch or commit name.',
  '-jar': 'Run a program packaged as a .jar file.',
  '--delete-files': 'BFG: remove every file with this name from all commits (except the protected HEAD).'
};

const ARGS = {
  'HEAD~1': 'The commit one before HEAD (its first parent).',
  'HEAD~N': 'N commits before HEAD, i.e. how far back the edit list should go.',
  'origin/main': 'Your local copy of where main was on the remote "origin" at the last fetch.',
  'old-name': 'The current branch name.',
  'new-name': 'The name to rename it to.',
  'main': 'The branch to rebase onto.',
  'v2.0.0': 'The tag name. Semantic Versioning (MAJOR.MINOR.PATCH) is the convention.',
  '1': 'Parent number 1, the branch that was merged into (usually main).',
  '.env': 'The file name to purge from history.',
  'repo.git': 'The bare mirror clone to rewrite.',
  'bfg.jar': 'The BFG Repo-Cleaner program.',
  '&&': 'Run the next command only if the previous one succeeded.',
  'git': 'The Git command-line tool.',
  'java': 'The Java runtime, needed to run BFG.'
};

const PLACEHOLDERS = {
  hash: 'A commit hash. The first 7+ characters are enough, e.g. a3f9c2e.',
  'commit-hash': 'A commit hash. The first 7+ characters are enough, e.g. a3f9c2e.',
  'merge-commit-hash': 'The hash of the merge commit to undo (find it with `git log --merges`).',
  'deleting-commit': 'The commit that deleted the file. The trailing ^ means "its parent", the last snapshot that still had the file.',
  file: 'Path to the file, relative to where you are in the repo.',
  'new-branch': 'Name for the branch that will own the misplaced commits.',
  base: 'Hash of the last commit that correctly belongs on the current branch.',
  start: 'First line number.',
  end: 'Last line number.'
};

function tokenize(command) {
  // Keep quoted strings together.
  return command.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
}

export function getCommandAnatomy(command) {
  const tokens = tokenize(command);
  let sub = null;
  let afterGit = false;

  return tokens.map((text) => {
    let explanation;
    if (afterGit) {
      sub = text;
      afterGit = false;
      explanation = SUBCOMMANDS[text];
    } else if (text === 'git') {
      afterGit = true;
    } else if (text === '&&') {
      sub = null;
    }

    if (!explanation && text.startsWith('-')) {
      explanation = FLAGS[`${sub} ${text}`] ?? FLAGS[text];
    }
    if (!explanation && sub === 'stash' && text === 'push') explanation = FLAGS['stash push'];
    if (!explanation) explanation = ARGS[text];
    if (!explanation && text.startsWith('"')) explanation = 'A quoted message or description.';
    if (!explanation) {
      const ph = text.match(/<([^>]+)>/g);
      if (ph) {
        explanation = ph.map((p) => PLACEHOLDERS[p.slice(1, -1)] ?? 'A value you fill in.').join(' ');
      }
    }
    if (!explanation && /^-L?\d/.test(text)) explanation = 'Line range.';
    if (!explanation) {
      explanation = text.startsWith('-')
        ? 'An option that changes how the command behaves.'
        : 'An argument: a branch, file, commit or other value.';
    }
    return { text, explanation };
  });
}
