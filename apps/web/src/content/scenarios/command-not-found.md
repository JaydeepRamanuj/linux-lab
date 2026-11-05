---
number: 7
title: "\"command not found\": Where Is This Program?"
quote: "I just ran sudo apt install bat. Why does bat say command not found?"
module: everyday-rescue
severity: readonly
primaryCommand: type bat
symptoms:
  - command not found
  - installed but command not found
  - where is program installed
  - which
  - type
  - batcat
  - fdfind
  - wrong version runs
  - "bash: hash"
before:
  kind: zones
  title: What you typed
  caption: "The shell looks for a file called `bat` in each `PATH` folder. There isn't one."
  zones:
    - title: You typed
      items:
        - { text: bat, tone: bad, note: "command not found" }
    - title: PATH folders
      items:
        - { text: /usr/local/bin, tone: ghost, note: "no bat" }
        - { text: /usr/bin, tone: ghost, note: "no bat" }
        - { text: /bin, tone: ghost, note: "no bat" }
    - title: Package bat installed
      items:
        - { text: /usr/bin/batcat, tone: caution, note: "different name" }
after:
  kind: zones
  title: What's really there
  caption: "Debian and Ubuntu renamed it to avoid a clash with another package. The program was there all along."
  zones:
    - title: You type
      items:
        - { text: batcat, tone: good, note: found }
    - title: PATH folders
      items:
        - { text: /usr/local/bin, tone: ghost }
        - { text: /usr/bin, tone: focus, note: "batcat is here" }
        - { text: /bin, tone: ghost }
    - title: Package bat installed
      items:
        - { text: /usr/bin/batcat, tone: good }
stateLabels: [What you expected, What's really there]
steps:
  - title: Ask the shell what the name means
    kind: readonly
    command: type bat
    output: "bash: type: bat: not found"
    note: "`type` is the most complete answer: it knows about aliases, functions and shell builtins as well as programs on `PATH`. \"not found\" means none of those."
  - title: Search every PATH folder
    kind: readonly
    command: which -a bat
    note: "No output (and exit code 1) means no folder in `PATH` has a file called `bat`. When a name *is* found, `-a` lists every copy in priority order, which explains \"it runs the wrong version\"."
  - title: Ask the package what it installed
    kind: readonly
    command: dpkg -L bat | grep bin/
    output: /usr/bin/batcat
    note: "`dpkg -L` lists every file a package put on disk. Programs live in a `bin/` folder. Here's the answer: on Debian and Ubuntu the program is called `batcat`."
  - title: Confirm the real name works
    kind: readonly
    command: type batcat
    output: batcat is /usr/bin/batcat
  - title: Check where the shell is looking
    kind: readonly
    command: echo "$PATH" | tr ':' '\n'
    output: |
      /usr/local/sbin
      /usr/local/bin
      /usr/sbin
      /usr/bin
      /sbin
      /bin
      /usr/games
      /usr/local/games
      /snap/bin
    note: "If the program turned out to live somewhere not in this list, like `~/go/bin` or `~/.cargo/bin`, that folder needs adding to `PATH`."
replay:
  context: Installing bat on Ubuntu, then finding out what it's really called.
  commands:
    - { line: "$ bat README.md", type: input }
    - { line: "bat: command not found", type: output }
    - { line: "$ type bat", type: input }
    - { line: "bash: type: bat: not found", type: output }
    - { line: "$ dpkg -L bat | grep bin/", type: input }
    - { line: "/usr/bin/batcat", type: output }
    - { line: "$ type batcat", type: input }
    - { line: "batcat is /usr/bin/batcat", type: output }
cautions:
  - type: caution
    text: "Installed a new version and the old one still runs? Bash remembers where it found each program. `hash -r` makes it forget, or open a new terminal."
  - type: caution
    text: "Don't copy or move the program into `/usr/bin` to fix the name. A symlink or alias in your home folder does the job without touching files the package manager owns."
avoid:
  - "To keep typing `bat`, link it: `mkdir -p ~/.local/bin && ln -s /usr/bin/batcat ~/.local/bin/bat` (see the symlink scenario), or add `alias bat=batcat` to `~/.bash_aliases`."
  - "Other Debian/Ubuntu renames to know: `fd` is `fdfind`, `ack` is `ack-grep` on old releases, and `node` was `nodejs` on old ones."
  - "On Ubuntu, `command-not-found` often tells you which package to install. Read its suggestion before installing: it's matching by name only."
related: [which-package, add-to-path, symlink-shortcut, persistent-alias, open-from-terminal]
concepts: [pressing-enter, path]
anatomy:
  "bat": "The name you typed. `type` reports whether it's an alias, a function, a builtin or a program, or nothing at all."
---

## The situation

The terminal says `command not found` for something you're sure you installed. Or the opposite: a command runs, but it's the wrong version, and you want to know which file is actually being run.

## How it works

A name you type can be four things, checked in this order: an **alias**, a **function**, a shell **builtin** (like `cd`), or a **program file** found by searching the folders in `PATH`. `command not found` means all four came up empty.

That usually has one of three causes:

- **The program has a different name.** Packages sometimes rename a program to avoid a clash: `bat` is `batcat` and `fd` is `fdfind` on Debian and Ubuntu. Ask the package manager what it installed.
- **It's installed in a folder not on `PATH`.** Language tools install into your home folder, like `~/go/bin`, `~/.cargo/bin` or `~/.local/bin`. Add that folder to `PATH`.
- **It isn't installed.** The install failed, or it went into a different environment, such as a Python virtualenv you haven't activated.

`which` only searches `PATH`. `type` answers for the shell as a whole, so use it first. In scripts, `command -v name` is the portable check.
