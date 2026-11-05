---
number: 1
title: Install an AppImage as a Desktop App
quote: "I downloaded an .AppImage. How do I make it show up in my app menu?"
module: everyday-rescue
severity: modifies
primaryCommand: chmod +x ~/Applications/obsidian.AppImage
symptoms:
  - appimage
  - app not in menu
  - double click does nothing
  - how to install appimage
  - .desktop file
  - launcher
  - "dlopen(): error loading libfuse.so.2"
before:
  kind: zones
  title: Just downloaded
  caption: The AppImage sits in Downloads without execute permission, and the app menu knows nothing about it.
  zones:
    - title: ~/Downloads
      items:
        - { text: Obsidian-1.7.7.AppImage, tone: bad, note: "rw- · not executable" }
    - title: ~/Applications
      empty: does not exist yet
      items: []
    - title: App menu
      empty: not listed
      items: []
after:
  kind: zones
  title: Installed
  caption: The file lives in `~/Applications`, can run, and a `.desktop` entry puts it in the menu.
  zones:
    - title: ~/Downloads
      items: []
    - title: ~/Applications
      items:
        - { text: obsidian.AppImage, tone: good, note: "rwx · executable" }
        - { text: obsidian.png, tone: base, note: icon }
    - title: App menu
      items:
        - { text: Obsidian, tone: good, note: "~/.local/share/applications/obsidian.desktop" }
steps:
  - title: Find the file you downloaded
    kind: readonly
    command: ls -l ~/Downloads/*.AppImage
    output: "-rw-rw-r-- 1 jd jd 118M Nov  3 21:04 /home/jd/Downloads/Obsidian-1.7.7.AppImage"
    note: "The `-rw-` at the start means you can read and write it, but not execute it. That's why double-clicking does nothing."
  - title: Create a home for your AppImages
    kind: modifies
    command: mkdir -p ~/Applications
    note: "`-p` creates the folder only if it's missing and never complains if it already exists. Any folder works; `~/Applications` is a common convention."
  - title: Move it there with a short name
    kind: modifies
    command: mv ~/Downloads/Obsidian-1.7.7.AppImage ~/Applications/obsidian.AppImage
    note: "A version-free name means the menu entry keeps working when you swap in a newer file later."
  - title: Make it executable
    kind: modifies
    command: chmod +x ~/Applications/obsidian.AppImage
    note: "`+x` adds execute permission. Now the file is a program, not just data."
  - title: Run it once from the terminal
    kind: modifies
    command: ~/Applications/obsidian.AppImage
    note: "If it opens, great. If you see `dlopen(): error loading libfuse.so.2`, install FUSE 2 (see the caution above) and try again."
  - title: Create the menu entry
    editor:
      file: ~/.local/share/applications/obsidian.desktop
      content: |
        [Desktop Entry]
        Type=Application
        Name=Obsidian
        Exec=/home/jd/Applications/obsidian.AppImage %U
        Icon=/home/jd/Applications/obsidian.png
        Categories=Office;
        Terminal=false
    note: "`.desktop` files don't expand `~`, so `Exec` and `Icon` need full paths. Replace `jd` with your username (`whoami` prints it). The icon is optional: any PNG works."
  - title: Refresh the app menu
    kind: modifies
    command: update-desktop-database ~/.local/share/applications
    note: "Rebuilds the menu's cache for your user. Most desktops pick up new entries on their own within a few seconds; this makes it immediate."
replay:
  context: Installing Obsidian from Downloads, with the .desktop file written by a heredoc.
  commands:
    - { line: "$ mkdir -p ~/Applications", type: input }
    - { line: "$ mv ~/Downloads/Obsidian-1.7.7.AppImage ~/Applications/obsidian.AppImage", type: input }
    - { line: "$ chmod +x ~/Applications/obsidian.AppImage", type: input }
    - { line: "$ cat > ~/.local/share/applications/obsidian.desktop <<EOF", type: input }
    - { line: "> [Desktop Entry]", type: output }
    - { line: "> Type=Application", type: output }
    - { line: "> Name=Obsidian", type: output }
    - { line: "> Exec=$HOME/Applications/obsidian.AppImage %U", type: output }
    - { line: "> EOF", type: output }
    - { line: "$ update-desktop-database ~/.local/share/applications", type: input }
    - { line: "$ grep Exec ~/.local/share/applications/obsidian.desktop", type: input }
    - { line: "Exec=/home/jd/Applications/obsidian.AppImage %U", type: output }
cautions:
  - type: caution
    text: "Ubuntu 22.04 and later don't ship FUSE 2, which most AppImages need. If it won't start, run `sudo apt install libfuse2` (on 24.04 the package is `libfuse2t64`). Don't install the `fuse` package: it can remove `fuse3` and parts of your desktop."
avoid:
  - Keep every AppImage in one folder like `~/Applications`, so you always know where they are and what to delete.
  - Use a version-free file name, so updating means replacing one file, not editing the `.desktop` entry.
  - "Only run AppImages from the project's official site or GitHub releases: an AppImage runs with all your permissions."
related: [permission-denied-script, extract-archive, symlink-shortcut, install-deb]
concepts: [pressing-enter, permissions-model]
anatomy:
  "+x": "Add (+) execute permission (x) for everyone who can read the file."
---

## The situation

You downloaded an app as a single `.AppImage` file. Double-clicking it does nothing, or opens it in the archive manager, and it isn't in your app menu.

## How it works

An AppImage is the whole app packed into one executable file: nothing gets installed, it just runs. Two things are missing after a download:

- **Execute permission.** Browsers save downloads as plain data (`rw-`). `chmod +x` marks the file as a program.
- **A menu entry.** Desktop menus are built from `.desktop` files. Your own go in `~/.local/share/applications/`, so no `sudo` is needed. The `Exec=` line says what to run, and `%U` passes along files you open with it.

To uninstall, delete the AppImage and its `.desktop` file. That's all there is.
