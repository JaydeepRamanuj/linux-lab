---
number: 9
title: Make a Shortcut with a Symlink
quote: "I cd into ~/projects/linux-lab/apps/web twenty times a day. Can I make a shortcut?"
module: everyday-rescue
severity: modifies
primaryCommand: ln -s ~/projects/linux-lab/apps/web ~/web
symptoms:
  - symlink
  - symbolic link
  - shortcut
  - ln -s
  - link a folder
  - broken link
  - remove symlink
  - "No such file or directory"
before:
  kind: zones
  title: A long way down
  caption: Getting to the folder means typing the whole path every time.
  zones:
    - title: ~ (home)
      items:
        - { text: projects/, tone: base }
    - title: ~/projects/linux-lab/apps/web
      items:
        - { text: astro.config.mjs, tone: base }
        - { text: package.json, tone: base }
        - { text: src/, tone: base }
after:
  kind: zones
  title: One hop away
  caption: "`~/web` is a small file that points at the real folder. Opening it opens the folder; the files themselves didn't move."
  zones:
    - title: ~ (home)
      items:
        - { text: projects/, tone: base }
        - { text: "web → projects/linux-lab/apps/web", tone: good, note: symlink }
    - title: ~/projects/linux-lab/apps/web
      items:
        - { text: astro.config.mjs, tone: base }
        - { text: package.json, tone: base }
        - { text: src/, tone: base }
steps:
  - title: Create the link
    kind: modifies
    command: ln -s ~/projects/linux-lab/apps/web ~/web
    note: "The order is the same as `cp`: what you link to first, then the new name. `-s` makes a symbolic link. Without it, `ln` makes a hard link, which doesn't work for folders."
  - title: Look at it
    kind: readonly
    command: ls -l ~/web
    output: "lrwxrwxrwx 1 jd jd 36 Nov  4 07:26 /home/jd/web -> /home/jd/projects/linux-lab/apps/web"
    note: "The `l` at the start and the `->` show it's a link. Its permissions are always `rwxrwxrwx`: what counts are the permissions of the folder it points to."
  - title: Use it like the folder
    kind: readonly
    command: ls ~/web/
    output: "astro.config.mjs  package.json  src"
    note: "`cd ~/web` works too. Anything you change through the link changes the real files: there's only one copy."
  - title: Point it somewhere else
    kind: modifies
    command: ln -sfn ~/projects/linux-lab-v2/apps/web ~/web
    note: "`-f` replaces the old link and `-n` treats the existing link as a file, not as the folder it points to. Without `-n`, the new link quietly lands *inside* the old target as `apps/web/web`."
  - title: Remove the link, not the folder
    kind: modifies
    command: rm ~/web
    note: "No trailing slash. `rm` deletes only the link; the folder and its files are untouched. With a slash, `rm ~/web/` refers to the folder itself and refuses: `Is a directory`."
replay:
  context: Running the same ln -s twice, then cleaning up.
  commands:
    - { line: "$ ln -s ~/projects/linux-lab/apps/web ~/web", type: input }
    - { line: "$ ln -s ~/projects/linux-lab/apps/web ~/web", type: input }
    - { line: "$ ls ~/projects/linux-lab/apps/web/", type: input }
    - { line: "astro.config.mjs  package.json  src  web", type: output }
    - { line: "$ rm ~/projects/linux-lab/apps/web/web", type: input }
    - { line: "$ rm ~/web/", type: input }
    - { line: "rm: cannot remove '/home/jd/web/': Is a directory", type: output }
    - { line: "$ rm ~/web", type: input }
cautions:
  - type: danger
    text: "Never `rm -r ~/web/` (with a slash) to remove a link to a folder. The slash makes `rm` follow the link: it deletes every file in the real folder, then prints `cannot remove 'web/': Not a directory`, so it looks like nothing happened. Remove a link with plain `rm ~/web`."
  - type: caution
    text: "Relative targets are relative to where the link lives, not where you are. `ln -s projects/app links/app` makes a link that looks for `links/projects/app`. Use full paths (`~/…` is expanded for you) unless you need the link to move with the folder."
avoid:
  - "Move or rename the target and the link breaks: `ls -l` still shows the arrow, but opening it says `No such file or directory`. Re-point it with `ln -sfn`."
  - "`readlink -f ~/web` prints the real path a link resolves to, following chains of links."
  - "Put links to programs in `~/.local/bin` to make them callable by name. That's how the `batcat` → `bat` fix works."
related: [command-not-found, add-to-path, open-from-terminal]
concepts: [inodes-links]
anatomy:
  "~/projects/linux-lab/apps/web": "What the link points to (the target). It must come first."
  "~/web": "The new link's name and location."
---

## The situation

Some folders are deep: a project inside a monorepo, a game's save folder, a mounted drive. You want a short name that takes you there, from the terminal and the file manager alike.

## How it works

A **symbolic link** (symlink) is a tiny file whose content is a path. When a program opens the link, the system follows the path and opens the target instead. `cd`, `ls`, editors and file managers all go straight through it.

Deleting or moving a link never affects the target, and deleting the target leaves a **broken link** behind. Links can cross drives and point at folders, unlike hard links. `ln -s` does nothing to the target, which is why it's only "modifies": all it creates is the small link file.
