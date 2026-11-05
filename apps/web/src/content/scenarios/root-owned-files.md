---
number: 17
title: "Files Owned by Root After a Stray sudo"
quote: "npm install fails with EACCES: permission denied. I once ran sudo npm install in this project."
module: files-permissions
severity: elevated
primaryCommand: sudo chown -R $USER:$USER node_modules package-lock.json
symptoms:
  - "EACCES: permission denied"
  - permission denied in my own project
  - owned by root
  - sudo npm install
  - "rm: cannot remove: Permission denied"
  - can't delete node_modules
  - chown
  - take ownership
  - "insufficient permission for adding an object"
before:
  kind: zones
  title: Half the project is root's
  caption: "Everything the `sudo` command created belongs to root. You can read it, but you can't change or delete it."
  zones:
    - title: ~/projects/blog
      items:
        - { text: "package.json", tone: base, note: jd }
        - { text: "README.md", tone: base, note: jd }
        - { text: "package-lock.json", tone: bad, note: root }
        - { text: "node_modules/", tone: bad, note: "root, and everything inside" }
after:
  kind: zones
  title: All yours again
  caption: "`chown -R` hands the root-owned files back to you. Nothing inside them changes."
  zones:
    - title: ~/projects/blog
      items:
        - { text: "package.json", tone: base, note: jd }
        - { text: "README.md", tone: base, note: jd }
        - { text: "package-lock.json", tone: good, note: jd }
        - { text: "node_modules/", tone: good, note: jd }
steps:
  - title: See the error
    kind: modifies
    command: npm install slugify-lite
    output: |
      npm error code EACCES
      npm error syscall mkdir
      npm error path /home/jd/projects/blog/node_modules/slugify-lite
      npm error errno -13
      npm error Error: EACCES: permission denied, mkdir '/home/jd/projects/blog/node_modules/slugify-lite'
      …
      npm error If you believe this might be a permissions issue, please double-check the
      npm error permissions of the file and its containing directories, or try running
      npm error the command again as root/Administrator.
    note: "npm can't create a folder inside `node_modules`. Its last line suggests running as root, which is how this started: don't."
  - title: Look at who owns what
    kind: readonly
    command: ls -l
    output: |
      total 16
      -rw-r--r-- 1 jd   jd      7 Nov  4 08:15 README.md
      drwxr-xr-x 3 root root 4096 Nov  4 08:15 node_modules
      -rw-r--r-- 1 root root  356 Nov  4 08:15 package-lock.json
      -rw-r--r-- 1 jd   jd     87 Nov  4 08:15 package.json
    note: "The third and fourth columns are the owner and group. `root` there, in your own project, is the leftover of a `sudo` command."
  - title: List everything that isn't yours
    kind: readonly
    command: find . ! -user "$USER"
    output: |
      ./package-lock.json
      ./node_modules
      ./node_modules/.package-lock.json
      ./node_modules/tiny-md
      ./node_modules/tiny-md/index.js
      ./node_modules/tiny-md/package.json
    note: "`!` means \"not\": every file whose owner isn't you. In a real project this can be thousands of lines; add `| head` to see the start. What matters is which top-level names show up."
  - title: Take them back
    kind: elevated
    command: sudo chown -R $USER:$USER node_modules package-lock.json
    note: "Name exactly the paths `find` listed. `chown` needs `sudo` here because only root can give away root's files. It asks for your password once."
  - title: Check nothing is left
    kind: readonly
    command: find . ! -user "$USER"
    note: "No output: every file in the project is yours again."
  - title: Run it again, without sudo
    kind: modifies
    command: npm install slugify-lite
    output: |2

      added 1 package in 266ms
replay:
  context: Even deleting the folder fails until ownership is fixed.
  commands:
    - { line: "$ rm -rf node_modules", type: input }
    - { line: "rm: cannot remove 'node_modules/.package-lock.json': Permission denied", type: output }
    - { line: "rm: cannot remove 'node_modules/tiny-md/index.js': Permission denied", type: output }
    - { line: "rm: cannot remove 'node_modules/tiny-md/package.json': Permission denied", type: output }
    - { line: "$ ls -ld node_modules", type: input }
    - { line: "drwxr-xr-x 3 root root 4096 Nov  4 08:15 node_modules", type: output }
    - { line: "$ sudo chown -R $USER:$USER node_modules package-lock.json", type: input }
    - { line: "[sudo] password for jd:", type: output }
    - { line: "$ find . ! -user \"$USER\"", type: input }
cautions:
  - type: danger
    text: "Never `sudo chown -R $USER /` or point `chown -R` at `/usr`, `/etc` or `/var`. System files must stay owned by root, and many programs, `sudo` itself included, refuse to run when they aren't. There's no undo short of reinstalling."
  - type: caution
    text: "Don't fix the error by adding `sudo` to every `npm install`. Each one creates more root-owned files, and runs the packages' install scripts as root."
avoid:
  - "`$USER:$USER` is owner:group. On Ubuntu your main group has the same name as you; check with `id -gn` if unsure."
  - "Git has the same problem after a `sudo git pull`: some folders in `.git/objects` end up owned by root and later commits fail with `insufficient permission for adding an object`. `find .git ! -user \"$USER\"` finds them; `chown` them the same way."
  - "`npm install -g` failing with EACCES isn't a reason for `sudo` either. Install Node with `nvm` (or `fnm`), so global packages live in your home folder."
  - "If you'd rather start clean, `sudo rm -rf node_modules package-lock.json` then a normal `npm install` works too. Check the path twice before running `rm -rf` with `sudo`."
related: [permission-denied-script, chmod-numbers, disk-full]
concepts: [permissions-model, users-groups, how-sudo-works]
anatomy:
  "-R": "Recursive: the folder and everything inside it."
  "$USER:$USER": "New owner:group. `$USER` is your username, so this means \"me, and my group\"."
  "node_modules": "Only the paths `find` listed as not yours."
  "package-lock.json": "Only the paths `find` listed as not yours."
---

## The situation

You ran one command with `sudo` in a project, maybe because it failed with "permission denied" or because a guide said to. It worked. Now ordinary commands in the same folder fail: `npm install` says EACCES, `rm` can't delete things, git can't commit.

## How it works

Every file has an **owner**. A program run with `sudo` runs as **root**, so every file it creates belongs to root. Your user can read those files (the default permissions let everyone read), but only the owner can write to them or add and remove files in a root-owned folder.

`chown` (change owner) fixes this. Giving away files that aren't yours needs root, so this one command does need `sudo`, as a one-off repair. Afterwards, run the tool without `sudo`, so it doesn't happen again.

`find . ! -user "$USER"` shows exactly what to fix. Point `chown -R` at those paths, not at a parent folder. That keeps the repair as small as the mistake.
