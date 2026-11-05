---
number: 6
title: Add a Folder to PATH Permanently
quote: "I ran go install and it worked, but now the terminal says gopls: command not found."
module: everyday-rescue
severity: elevated
primaryCommand: 'echo ''export PATH="$HOME/go/bin:$PATH"'' >> ~/.bashrc'
symptoms:
  - add to path
  - PATH
  - command not found after install
  - export PATH
  - .bashrc
  - permanently
  - ~/.local/bin
  - go/bin
  - cargo bin
before:
  kind: zones
  title: Installed, but not on PATH
  caption: The program exists, but the shell only looks in the folders listed in `PATH`, and `~/go/bin` isn't one of them.
  zones:
    - title: PATH
      items:
        - { text: /usr/local/bin, tone: base }
        - { text: /usr/bin, tone: base }
        - { text: /bin, tone: base }
        - { text: "… /snap/bin", tone: base }
    - title: ~/go/bin
      items:
        - { text: gopls, tone: bad, note: "shell never looks here" }
    - title: ~/.bashrc
      items:
        - { text: "no PATH line", tone: ghost }
after:
  kind: zones
  title: On PATH in every terminal
  caption: "`~/.bashrc` adds the folder each time a terminal opens, so `gopls` is found everywhere."
  zones:
    - title: PATH
      items:
        - { text: /home/jd/go/bin, tone: good, note: "added first" }
        - { text: /usr/local/bin, tone: base }
        - { text: /usr/bin, tone: base }
        - { text: "… /snap/bin", tone: base }
    - title: ~/go/bin
      items:
        - { text: gopls, tone: good, note: found }
    - title: ~/.bashrc
      items:
        - { text: 'export PATH="$HOME/go/bin:$PATH"', tone: focus, note: "line 118" }
steps:
  - title: See where the shell looks for programs
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
    note: "`PATH` is one line of folders separated by `:`. `tr` puts each on its own line. The shell searches them in this order and runs the first match."
  - title: Confirm the program is where you think
    kind: readonly
    command: ls ~/go/bin
    output: gopls
    note: "Go installs into `~/go/bin`. Other installers use `~/.local/bin` (pip, pipx), `~/.cargo/bin` (Rust) or `~/.npm-global/bin`. The installer's output usually says which."
  - title: Try it in this terminal only
    kind: readonly
    command: export PATH="$HOME/go/bin:$PATH"
    note: "Puts `~/go/bin` in front and keeps everything that was there (`:$PATH`). Nothing is written to disk: close the terminal and it's gone, which makes this a safe test."
  - title: Check the shell finds it now
    kind: readonly
    command: which gopls
    output: /home/jd/go/bin/gopls
  - title: Make it permanent
    kind: elevated
    command: 'echo ''export PATH="$HOME/go/bin:$PATH"'' >> ~/.bashrc'
    note: "`>>` appends one line to the end of `~/.bashrc`, which runs in every new terminal. The single quotes matter: they write `$HOME` and `$PATH` literally, so they're filled in fresh each time. ShellGyan marks this elevated because a broken line here breaks every terminal you open."
  - title: Check what you wrote
    kind: readonly
    command: grep -n "go/bin" ~/.bashrc
    output: '118:export PATH="$HOME/go/bin:$PATH"'
    note: "One line, at the end, with `$HOME` and `$PATH` still as text. If you see it twice, delete the duplicate in an editor."
  - title: Load it into the terminal you're in
    kind: modifies
    command: source ~/.bashrc
    note: "New terminals pick it up on their own. `source` applies it to this one without closing it."
replay:
  context: A fresh terminal after `go install golang.org/x/tools/gopls@latest`.
  commands:
    - { line: "$ gopls version", type: input }
    - { line: "gopls: command not found", type: output }
    - { line: "$ ls ~/go/bin", type: input }
    - { line: "gopls", type: output }
    - { line: "$ echo 'export PATH=\"$HOME/go/bin:$PATH\"' >> ~/.bashrc", type: input }
    - { line: "$ source ~/.bashrc", type: input }
    - { line: "$ which gopls", type: input }
    - { line: "/home/jd/go/bin/gopls", type: output }
cautions:
  - type: danger
    text: "Never write `export PATH=$HOME/go/bin` without `:$PATH` at the end. It replaces the whole list, and the next command is `ls: command not found`. If that happens, open the file with the full path, `/usr/bin/nano ~/.bashrc`, and fix the line."
  - type: caution
    text: "Use `>>`, not `>`. A single `>` replaces your whole `~/.bashrc` with this one line."
  - type: caution
    text: "Using zsh (the default on some distros and on macOS)? It reads `~/.zshrc`, not `~/.bashrc`. `echo $SHELL` tells you which shell you have."
avoid:
  - "For `~/.local/bin` you may not need any of this: Ubuntu's `~/.profile` adds it automatically if the folder exists when you log in. Create it, then log out and back in."
  - "Prefer installers that put programs in a folder already on `PATH`, like `~/.local/bin`."
  - "Running `source ~/.bashrc` many times adds the folder to `PATH` again each time. It's harmless, and a new terminal starts clean."
related: [command-not-found, persistent-alias, env-vars, curl-pipe-bash]
concepts: [pressing-enter]
anatomy:
  "'export PATH=\"$HOME/go/bin:$PATH\"'": "The line to add. Single quotes write `$HOME` and `$PATH` as text, so they're filled in fresh each time a terminal starts. `:$PATH` keeps every folder that was already there."
  "~/.bashrc": "Bash's startup file: it runs every time you open a terminal."
---

## The situation

You installed a tool with `go install`, `pip install --user`, `cargo install` or a vendor script. It says it succeeded, but typing the tool's name gives `command not found`. Running it with its full path, `~/go/bin/gopls`, works.

## How it works

When you type a name, the shell doesn't search your disk. It checks each folder in the `PATH` variable, in order, and runs the first file with that name. Language installers drop programs into folders in your home directory, which often aren't in that list.

`export PATH="new-folder:$PATH"` puts a folder in front of the list, but only for the current shell. Every terminal starts as a new shell, so the change has to go in a file that runs at startup. For bash that's `~/.bashrc`. Putting the folder first means your version wins if the same name exists elsewhere. Put it last (`$PATH:new-folder`) if you want the system's copy to win instead.
