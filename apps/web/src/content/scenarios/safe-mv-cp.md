---
number: 20
title: "Avoid (and Recover From) a Wrong mv or cp Overwrite"
quote: "I moved draft.md into notes/ and it replaced the draft.md that was already there. No warning. Three weeks of notes."
module: files-permissions
severity: modifies
primaryCommand: mv -i draft.md notes/
symptoms:
  - mv overwrote my file
  - cp replaced file
  - file overwritten
  - no warning before overwrite
  - undo mv
  - recover overwritten file
  - mv -i
  - cp -i
  - no clobber
  - "overwrite?"
before:
  kind: zones
  title: Same name, two files
  caption: "A plain `mv` or `cp` replaces a file with the same name at the destination, without asking."
  zones:
    - title: ~ (here)
      items:
        - { text: draft.md, tone: base, note: "43 bytes, Nov 3" }
    - title: notes/
      items:
        - { text: draft.md, tone: caution, note: "67 bytes, Sep 12: would be replaced" }
after:
  kind: zones
  title: Asked first, or kept a copy
  caption: "`-i` asks, `-n` refuses, and `--backup` moves the old file aside instead of destroying it."
  zones:
    - title: ~ (here)
      empty: moved
      items: []
    - title: notes/
      items:
        - { text: draft.md, tone: good, note: new }
        - { text: "draft.md.~1~", tone: good, note: "the old one, kept" }
steps:
  - title: Check both files first
    kind: readonly
    command: ls -l draft.md notes/draft.md
    output: |
      -rw-r--r-- 1 jd jd 43 Nov  3 09:15 draft.md
      -rw-r--r-- 1 jd jd 67 Sep 12 18:40 notes/draft.md
    note: "If a file of the same name is already there, a plain `mv draft.md notes/` destroys it."
  - title: Make mv ask
    kind: modifies
    command: mv -i draft.md notes/
    output: "mv: overwrite 'notes/draft.md'? n"
    note: "`-i` (interactive) asks before replacing. Type `n` and Enter to keep both files where they are; `y` to go ahead. `cp -i` works the same."
  - title: "Or: never overwrite"
    kind: modifies
    command: mv -n draft.md notes/
    output: "mv: not replacing 'notes/draft.md'"
    note: "`-n` (no clobber) skips anything that already exists, without asking. Handy when moving many files at once."
  - title: "Or: overwrite, but keep the old one"
    kind: modifies
    command: mv -v --backup=numbered draft.md notes/
    output: "renamed 'draft.md' -> 'notes/draft.md' (backup: 'notes/draft.md.~1~')"
    note: "The old file is renamed to `draft.md.~1~` instead of being destroyed. Doing it again makes `~2~`, `~3~`, and so on. `-v` prints what happened."
  - title: Both are there
    kind: readonly
    command: ls notes/
    output: "draft.md  draft.md.~1~"
    note: "Compare them with `diff notes/draft.md 'notes/draft.md.~1~'`, then keep what you need and delete the other."
replay:
  context: "Two more ways mv surprises you, both run for real."
  commands:
    - { line: "$ mv report.pdf archive", type: input }
    - { line: "$ ls -l archive", type: input }
    - { line: "-rw-r--r-- 1 jd jd 2 Nov  4 08:18 archive", type: output }
    - { line: "$ mv report2.pdf archive2/", type: input }
    - { line: "mv: cannot move 'report2.pdf' to 'archive2/': Not a directory", type: output }
cautions:
  - type: danger
    text: "An overwritten file can't be undone from the terminal: `mv` and `cp` don't use the Trash. Your options are a copy somewhere else, such as git, a backup or a Timeshift/btrfs snapshot. Check before you move, not after."
  - type: caution
    text: "If the destination folder doesn't exist, `mv report.pdf archive` renames the file to `archive` instead of moving it into a folder. A trailing slash (`archive/`) makes `mv` fail with `Not a directory` instead of guessing."
avoid:
  - "If the overwritten file was committed to git, get the old version back with `git show HEAD:notes/draft.md > draft-september.md`. Editors keep local history too: VS Code's Timeline view, for example."
  - "Make `-i` the default with aliases: `alias mv='mv -i'` and `alias cp='cp -i'`. See the persistent alias scenario to make them stick."
  - "`cp -r site backup` copies the folder *to* `backup` the first time, but *into* it (`backup/site`) the second time, once `backup` exists."
  - "For whole folders, `rsync -av --backup src/ dest/` shows what it copies and keeps replaced files as `name~`."
related: [find-files, persistent-alias, symlink-shortcut]
anatomy:
  "-i": "Interactive: ask before replacing a file that already exists."
  "draft.md": "What to move."
  "notes/": "Where to put it. The trailing slash means \"into this folder\", and fails if `notes` isn't a folder."
---

## The situation

You moved or copied a file and a file with the same name was already at the destination. `mv` and `cp` replaced it without a word. Or you're about to move a batch of files and want to be sure nothing gets clobbered.

## How it works

`mv` and `cp` assume you mean it: if the destination name exists, the old file is replaced. Its contents are gone, and the terminal has no recycle bin to restore it from.

Three flags change that:

- **`-i`** asks before each overwrite.
- **`-n`** never overwrites; the source stays where it was.
- **`--backup=numbered`** overwrites, but first renames the old file to `name.~1~`.

They work the same on `mv` and `cp`. Get into the habit of `-i` (or make it an alias), and a wrong overwrite becomes a prompt you answer `n` to.
