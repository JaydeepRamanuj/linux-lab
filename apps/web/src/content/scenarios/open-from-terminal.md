---
number: 8
title: Open the Current Folder in the File Manager or Editor
quote: "I'm in the right folder in the terminal. How do I open it in Files, or in VS Code?"
module: everyday-rescue
severity: readonly
primaryCommand: xdg-open .
symptoms:
  - open folder from terminal
  - open file manager
  - open in vs code
  - code .
  - xdg-open
  - open file with default app
  - open url from terminal
  - nautilus
  - explorer.exe
before:
  kind: zones
  title: Only the terminal knows
  caption: You've navigated to the folder in the terminal, but your other apps are somewhere else.
  zones:
    - title: Terminal
      items:
        - { text: ~/projects/linux-lab, tone: focus, note: "you are here" }
    - title: File manager
      empty: not open
      items: []
    - title: Editor
      empty: not open
      items: []
after:
  kind: zones
  title: Opened where you are
  caption: "`.` means \"this folder\", so each app opens exactly where the terminal is."
  zones:
    - title: Terminal
      items:
        - { text: ~/projects/linux-lab, tone: focus }
    - title: File manager
      items:
        - { text: linux-lab, tone: good, note: "xdg-open ." }
    - title: Editor
      items:
        - { text: linux-lab, tone: good, note: "code ." }
steps:
  - title: Open this folder in the file manager
    kind: readonly
    command: xdg-open .
    note: "`.` is the current folder. `xdg-open` hands it to whatever your desktop uses for folders: Files (Nautilus) on GNOME, Dolphin on KDE, Thunar on Xfce."
  - title: Open a file with its default app
    kind: readonly
    command: xdg-open report.pdf
    note: "The same app that opens it when you double-click it: a PDF viewer here, an image viewer for a `.png`."
  - title: Open a URL in your browser
    kind: readonly
    command: xdg-open http://localhost:4321
    note: "Handy when a dev server prints its address."
  - title: Open this folder in VS Code
    kind: readonly
    command: code .
    note: "Opens the folder as a workspace. If VS Code already has this folder open, it switches to that window."
  - title: Jump to a line in a file
    kind: readonly
    command: code -g src/lib/history.ts:42
    note: "`-g` goes to a line (and optionally `:column`). Useful when an error message gives you `file:line`."
cautions:
  - type: danger
    text: "Never run `sudo xdg-open`, `sudo nautilus` or `sudo code`. Graphical apps run as root write root-owned config files into your home folder, and they can break your desktop session. Use `sudo` only for the one command that needs it."
  - type: caution
    text: "Over SSH there's no screen to open things on, so these fail. Use `scp` or your editor's remote feature instead."
avoid:
  - "On WSL, `explorer.exe .` opens the folder in Windows Explorer. On macOS the command is `open .`."
  - "`code: command not found`? In VS Code, open the command palette and run \"Shell Command: Install 'code' command in PATH\". On Linux, the .deb and snap install it for you."
  - "To open a file in a specific app instead of the default, run the app with the file: `gnome-text-editor notes.md`, `gimp photo.png`."
related: [command-not-found, symlink-shortcut]
concepts: [how-ssh-works]
anatomy:
  ".": "The current folder."
---

## The situation

You've `cd`'d your way to a project in the terminal and now want to see it in the file manager, open it in your editor, or open one of its files in the usual app. Navigating there again by clicking is slow.

## How it works

Every Linux desktop keeps a list of which app opens which kind of file: folders, PDFs, images, web links. `xdg-open` asks that list and starts the right app. It's the terminal version of double-clicking, and it works on GNOME, KDE, Xfce and the rest.

Editors with a command-line launcher take a path directly: `code .`, `subl .`, `zed .`. In every case `.` stands for the folder the terminal is in now, which `pwd` prints.

These commands only open things, so they're read-only. Whatever you then do in the app is up to you.
