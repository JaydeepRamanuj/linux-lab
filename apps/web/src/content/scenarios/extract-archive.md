---
number: 11
title: Unpack a .tar.gz or .zip
quote: "I downloaded mytool-2.1.0-linux-x64.tar.gz. How do I open it, and where should it go?"
module: everyday-rescue
severity: modifies
primaryCommand: tar -xzf mytool-2.1.0-linux-x64.tar.gz -C ~/opt
symptoms:
  - extract tar.gz
  - unzip
  - untar
  - tar -xzf
  - .tgz
  - .tar.xz
  - open archive
  - "This does not look like a tar archive"
  - "gzip: stdin: not in gzip format"
before:
  kind: zones
  title: Still packed
  caption: Two archives in Downloads. You can't see what's inside, or where the files will land.
  zones:
    - title: ~/Downloads
      items:
        - { text: mytool-2.1.0-linux-x64.tar.gz, tone: focus }
        - { text: photos.zip, tone: focus }
    - title: ~/opt
      empty: does not exist yet
      items: []
after:
  kind: zones
  title: Unpacked where you chose
  caption: "Each archive went into its own folder: `-C` for tar, `-d` for unzip."
  zones:
    - title: ~/Downloads
      items:
        - { text: mytool-2.1.0-linux-x64.tar.gz, tone: ghost, note: "safe to delete" }
        - { text: photos.zip, tone: ghost, note: "safe to delete" }
        - { text: photos/, tone: good, note: "3 files" }
    - title: ~/opt
      items:
        - { text: mytool-2.1.0-linux-x64/, tone: good, note: "bin/, LICENSE, README.md" }
steps:
  - title: Look inside before you unpack
    kind: readonly
    command: tar -tzf mytool-2.1.0-linux-x64.tar.gz
    output: |
      mytool-2.1.0-linux-x64/
      mytool-2.1.0-linux-x64/README.md
      mytool-2.1.0-linux-x64/LICENSE
      mytool-2.1.0-linux-x64/bin/
      mytool-2.1.0-linux-x64/bin/mytool
    note: "`-t` lists, `-z` is for gzip (`.gz`), `-f` names the file. Every path starts with one folder, so unpacking creates just that folder. If the paths have no common folder, the files would spill into wherever you are."
  - title: Make a place for it
    kind: modifies
    command: mkdir -p ~/opt
    note: "`~/opt` is a common spot for programs you unpack yourself. `-C` in the next step needs the folder to exist."
  - title: Unpack it there
    kind: modifies
    command: tar -xzf mytool-2.1.0-linux-x64.tar.gz -C ~/opt
    note: "`-x` extracts. `-C ~/opt` changes into that folder first. Without it, everything lands in the current folder. Prints nothing on success; add `-v` to see each file."
  - title: Check the result
    kind: readonly
    command: ls ~/opt/mytool-2.1.0-linux-x64
    output: "LICENSE  README.md  bin"
  - title: Look inside a zip
    kind: readonly
    command: unzip -l photos.zip
    output: |
      Archive:  photos.zip
        Length      Date    Time    Name
      ---------  ---------- -----   ----
        2412311  2026-11-02 18:41   IMG_0412.jpg
        2198764  2026-11-02 18:41   IMG_0413.jpg
             23  2026-11-02 18:41   notes.txt
      ---------                     -------
        4611098                     3 files
    note: "No folder in front of the names, so this one would scatter three files into the current folder."
  - title: Unzip into its own folder
    kind: modifies
    command: unzip photos.zip -d photos
    output: |
      Archive:  photos.zip
        inflating: photos/IMG_0412.jpg
        inflating: photos/IMG_0413.jpg
       extracting: photos/notes.txt
    note: "`-d` creates the folder if needed. \"inflating\" and \"extracting\" both mean the file was written; they differ only in whether it was compressed."
replay:
  context: Unpacking with the wrong tool, then the right one.
  commands:
    - { line: "$ tar -xzf photos.zip", type: input }
    - { line: "gzip: stdin has more than one entry--rest ignored", type: output }
    - { line: "tar: Child returned status 2", type: output }
    - { line: "tar: Error is not recoverable: exiting now", type: output }
    - { line: "$ unzip photos.zip -d photos", type: input }
    - { line: "Archive:  photos.zip", type: output }
    - { line: "  inflating: photos/IMG_0412.jpg", type: output }
    - { line: "  inflating: photos/IMG_0413.jpg", type: output }
    - { line: " extracting: photos/notes.txt", type: output }
cautions:
  - type: caution
    text: "Unpacking overwrites files with the same name without asking (`tar`), or asks file by file (`unzip`). Unpack into a fresh folder to be safe."
  - type: caution
    text: "Don't unpack with `sudo` unless you have to. Run as root, `tar` restores the owners and permissions stored in the archive, so you can end up with files owned by other users, or programs that run as root (setuid)."
avoid:
  - "Modern GNU tar works out the compression itself: `tar -xf file.tar.gz`, `.tar.xz`, `.tar.bz2` and `.tar.zst` all unpack with plain `-xf`."
  - "Read the flags as words: `x` extract, `z` gzip, `v` verbose, `f` file. `tar -czf out.tar.gz folder/` makes an archive (`c` create)."
  - "To run a program you unpacked, either call it by path (`~/opt/mytool-2.1.0-linux-x64/bin/mytool`) or link it into `~/.local/bin`."
related: [symlink-shortcut, add-to-path, appimage-install]
anatomy:
  "mytool-2.1.0-linux-x64.tar.gz": "The archive: a `.tar` bundle of files, compressed with gzip (`.gz`)."
---

## The situation

Programs, source code and photo dumps often arrive as a single archive file: `.tar.gz` (also `.tgz`) and `.tar.xz` on Linux, `.zip` from everywhere else. You want the files out, in a sensible place, without them scattering across your Downloads folder.

## How it works

A `.tar` file bundles many files and folders into one, keeping their paths and permissions. On its own it isn't compressed, so it's usually compressed afterwards: `.gz`, `.xz`, `.bz2` or `.zst`. A `.zip` does both jobs in one format. That's why each needs a different tool: `tar` for the first family, `unzip` for zips. Use `file name` if the extension lies.

Listing first (`tar -t`, `unzip -l`) changes nothing and answers the two questions that matter: what's in it, and does it unpack into one folder or straight into wherever you are?
