---
number: 29
title: "find -exec {} \\; and +, and xargs"
quote: "After a merge, my agent cleaned up with find . -name \"*.orig\" -exec rm {} +. What do {} and + mean, and how do I check what it deletes?"
module: decode-agent-commands
severity: modifies
primaryCommand: find . -name "*.orig" -exec rm {} +
symptoms:
  - find -exec
  - "what does {} mean"
  - "\\; vs +"
  - xargs
  - find xargs rm
  - delete files matching a pattern
  - run a command on every file
  - "xargs: cannot remove, file names with spaces"
  - "rm: missing operand"
  - "find: missing argument to -exec"
  - print0
  - find -delete deleted everything
before:
  kind: zones
  title: Leftovers from a merge
  caption: "Git leaves `.orig` copies of conflicted files. `find` can list them; `-exec` decides what happens to each."
  zones:
    - title: ~/projects/site
      items:
        - { text: "src/app.ts", tone: base }
        - { text: "src/app.ts.orig", tone: caution }
        - { text: "src/components/Header.tsx.orig", tone: caution }
        - { text: "src/components/Order Summary.tsx.orig", tone: caution, note: "space in the name" }
        - { text: "README.md.orig", tone: caution }
after:
  kind: zones
  title: One rm, four files
  caption: "With `+`, `find` runs `rm` once with every match as an argument. Your real files are untouched."
  zones:
    - title: ~/projects/site
      items:
        - { text: "src/app.ts", tone: base }
        - { text: "src/components/Header.tsx", tone: base }
        - { text: "README.md", tone: base }
        - { text: "*.orig", tone: ghost, note: deleted }
steps:
  - title: List first
    kind: readonly
    command: find . -name "*.orig"
    output: |
      ./src/components/Order Summary.tsx.orig
      ./src/components/Header.tsx.orig
      ./src/app.ts.orig
      ./README.md.orig
    note: "Exactly these files are what `-exec` or `-delete` would act on. Read the list before adding either."
  - title: "\\; runs the command once per file"
    kind: readonly
    command: find . -name "*.orig" -exec echo rm {} \;
    output: |
      rm ./src/components/Order Summary.tsx.orig
      rm ./src/components/Header.tsx.orig
      rm ./src/app.ts.orig
      rm ./README.md.orig
    note: "`echo` in front turns it into a dry run: it prints the commands instead of running `rm`. `{}` is replaced by each file name, and `\\;` marks the end of the command. The backslash keeps the shell from treating `;` as its own."
  - title: "+ runs it once, with all the files"
    kind: readonly
    command: find . -name "*.orig" -exec echo rm {} +
    output: |
      rm ./src/components/Order Summary.tsx.orig ./src/components/Header.tsx.orig ./src/app.ts.orig ./README.md.orig
    note: "Same files, one command. With thousands of matches that's far faster. Each file is still a separate argument, so the space in `Order Summary` is safe."
  - title: Delete them
    kind: modifies
    command: find . -name "*.orig" -exec rm {} +
    note: "No output means it worked. Run the list from step 1 again and it comes back empty. `find . -name \"*.orig\" -delete` does the same without starting `rm`."
  - title: "The xargs way, safely"
    kind: modifies
    command: find . -name "*.orig" -print0 | xargs -0 rm
    note: "`xargs` reads names from the pipe and runs `rm` with them. `-print0` and `-0` separate names with an invisible NUL byte instead of newlines, so spaces can't break a name in two."
  - title: "xargs works for reading too"
    kind: readonly
    command: find src -name "*.tsx" -print0 | xargs -0 grep -l "fetchUser"
    output: |
      src/components/Order Summary.tsx
    note: "Which components call `fetchUser`. `find -exec grep -l fetchUser {} +` gives the same answer. `xargs` is worth knowing because it takes a list from any command, like `grep -l` or `git diff --name-only`."
replay:
  context: "The agent's first try used a plain pipe."
  commands:
    - { line: "$ find . -name \"*.orig\" | xargs rm", type: input }
    - { line: "rm: cannot remove './src/components/Order': No such file or directory", type: output }
    - { line: "rm: cannot remove 'Summary.tsx.orig': No such file or directory", type: output }
    - { line: "$ find . -name \"*.orig\"", type: input }
    - { line: "./src/components/Order Summary.tsx.orig", type: output }
    - { line: "$ find . -name \"*.orig\" -print0 | xargs -0 rm", type: input }
    - { line: "$ find . -name \"*.orig\" | xargs rm", type: input }
    - { line: "rm: missing operand", type: output }
    - { line: "Try 'rm --help' for more information.", type: output }
    - { line: "$ find . -name \"*.orig\" | xargs -r rm", type: input }
cautions:
  - type: danger
    text: "`find` checks its options in order, and `-delete` is an action, not a filter. `find . -delete -name \"*.orig\"` deletes everything under the current folder before `-name` is ever looked at. Put every test first and `-delete` or `-exec rm` last. Run it with nothing after the tests first."
  - type: caution
    text: "`find … | xargs rm` without `-print0`/`-0` splits names at spaces and newlines. Here it only failed. With a file called `old notes` next to one called `old`, it deletes `old`, which `find` never matched."
avoid:
  - "`-ok rm {} \\;` asks y/n for each file before deleting it. Good for a handful of files."
  - "With an empty list, `xargs rm` still runs `rm` once with nothing and prints `rm: missing operand`. `xargs -r` skips the run."
  - "`xargs -n1 cmd` runs `cmd` once per item; `xargs -I{} cp {} backup/` puts each item where `{}` is."
  - "Exit code 123 from `xargs` means one of the commands it ran failed. Check the error lines above it."
related: [find-files, sed-awk, expansion-quoting, disk-full]
anatomy:
  ".": "Start in the current folder. Check `pwd` first: this is the whole scope of the delete."
  "\"*.orig\"": "Names ending in `.orig`. Quoted, so `find` gets the `*` and not the shell."
  "-exec": "Run a command on what was found. Everything up to `+` or `\\;` is that command."
  "{}": "Replaced by the file names `find` found."
  "+": "Pass all the names to one `rm`, instead of one `rm` per file (`\\;`)."
---

## The situation

Agents clean up with one-liners: `find . -name "*.orig" -exec rm {} +`, `find . -name "*.pyc" -delete`, `grep -rl foo src | xargs sed -i …`. They act on every file `find` or `grep` matched, and you never see the list unless you ask for it.

## How it works

`find` walks the folder tree and checks each file against the expression you give it, **left to right**. Tests such as `-name` and `-type` filter. Actions such as `-print` (the default), `-delete` and `-exec` do something to the files that got that far.

`-exec CMD … {} TERMINATOR` runs a command on the matches:

- `{}` stands for the file name.
- `\;` ends the command and runs it **once per file**.
- `+` ends it and runs it **once for as many files as fit** on a command line.

`xargs` does the `+` job for any list that arrives through a pipe. It reads names from stdin and turns them into arguments. By default it splits on whitespace, which breaks names with spaces. `find -print0 | xargs -0` uses NUL bytes instead, and a file name can't contain one.
