---
number: 18
title: "Find What's Eating Disk Space"
quote: "Ubuntu says my disk is almost full. I don't know what's using it."
module: files-permissions
severity: readonly
primaryCommand: du -h -d 1 ~ | sort -h
symptoms:
  - disk full
  - low disk space
  - "No space left on device"
  - out of space
  - what is using my disk
  - biggest folders
  - du
  - df
  - ncdu
  - trash not emptied
before:
  kind: zones
  title: 100% full, no idea why
  caption: "`df` says the disk is full. It doesn't say what filled it."
  zones:
    - title: "/ (48G)"
      items:
        - { text: "46G used", tone: bad }
        - { text: "0 available", tone: bad, note: "No space left on device" }
    - title: ~ (home)
      items:
        - { text: "Documents, Videos, projects…", tone: ghost, note: "which one?" }
after:
  kind: zones
  title: The big ones, by name
  caption: "`du | sort -h` puts the largest folders last. Two of the three biggest are hidden folders."
  zones:
    - title: ~ (home), 19G
      items:
        - { text: ".local/share/Trash  7.2G", tone: focus, note: "deleted files, still on disk" }
        - { text: "Downloads  6.0G", tone: caution, note: "an old .iso" }
        - { text: ".cache  2.8G", tone: caution, note: "safe to clear" }
        - { text: "projects, Videos, …", tone: base, note: "under 1.5G each" }
steps:
  - title: How full is it?
    kind: readonly
    command: df -h /
    output: |
      Filesystem      Size  Used Avail Use% Mounted on
      /dev/nvme0n1p2   48G   46G     0 100% /
    note: "`Avail` is 0 before `Used` reaches `Size`: about 5% is kept back for the system, so it can still log in and run when you can't."
  - title: Which folders in your home are biggest?
    kind: readonly
    command: du -h -d 1 ~ | sort -h
    output: |
      8.1M	/home/jd/.config
      46M	/home/jd/Documents
      1.4G	/home/jd/Videos
      1.5G	/home/jd/projects
      2.8G	/home/jd/.cache
      6.0G	/home/jd/Downloads
      7.2G	/home/jd/.local
      19G	/home/jd
    note: "Biggest at the bottom, and the last line is the total. Hidden folders (starting with `.`) are included, and they're often the culprits."
  - title: Go one level deeper
    kind: readonly
    command: du -h -d 1 ~/.local/share | sort -h
    output: |
      31M	/home/jd/.local/share/fonts
      7.2G	/home/jd/.local/share
      7.2G	/home/jd/.local/share/Trash
    note: "Repeat on whichever folder is biggest until you reach something you recognise. Here: the Trash. Files you delete in the file manager are only moved there."
  - title: List the single biggest files
    kind: readonly
    command: find ~ -type f -size +1G -exec ls -lh {} +
    output: |
      -rw-r--r-- 1 jd jd 1.7G Nov  4 08:16 /home/jd/.cache/ms-playwright/chromium-1140.tar
      -rw-r--r-- 1 jd jd 7.2G Nov  4 08:16 /home/jd/.local/share/Trash/files/old-vm-disk.qcow2
      -rw-r--r-- 1 jd jd 5.7G Nov  4 08:16 /home/jd/Downloads/ubuntu-24.04.1-desktop-amd64.iso
      -rw-r--r-- 1 jd jd 1.4G Nov  4 08:16 /home/jd/Videos/screen-recording.mp4
    note: "Every file over 1 GB, with its size. `ls -lh` only lists them; nothing is deleted."
  - title: "Or: browse it interactively"
    kind: readonly
    command: ncdu ~
    note: "Same information as a list you can move through: Enter opens a folder, ← goes back, `q` quits. Install it with `sudo apt install ncdu`. Its `d` key deletes, so look first."
replay:
  context: "Two shortcuts that give the wrong answer, run in the same home folder."
  commands:
    - { line: "$ cd ~ && du -sh * | sort -h", type: input }
    - { line: "46M	Documents", type: output }
    - { line: "1.4G	Videos", type: output }
    - { line: "1.5G	projects", type: output }
    - { line: "6.0G	Downloads", type: output }
    - { line: "$ du -h -d 1 . | sort", type: input }
    - { line: "1.4G	./Videos", type: output }
    - { line: "1.5G	./projects", type: output }
    - { line: "19G	.", type: output }
    - { line: "2.8G	./.cache", type: output }
    - { line: "46M	./Documents", type: output }
    - { line: "6.0G	./Downloads", type: output }
    - { line: "7.2G	./.local", type: output }
    - { line: "8.1M	./.config", type: output }
cautions:
  - type: danger
    text: "Don't free space by deleting things under `/usr`, `/var/lib` or `/boot`, or by removing packages you don't recognise. The system needs them, and the next update or reboot can fail."
  - type: caution
    text: "`du -sh *` skips hidden folders, so it missed 10G here (`.local` and `.cache`). And plain `sort` sorts sizes as text, putting `19G` before `2.8G`. Use `du -h -d 1` and `sort -h`."
avoid:
  - "Empty the Trash from the file manager, or with `rm -rf ~/.local/share/Trash/*`. `~/.cache` is safe to clear too: programs rebuild what they need, at the cost of a slower first start."
  - "Outside your home: `sudo apt clean` removes downloaded package files, `journalctl --disk-usage` shows how big the system logs are, and `docker system df` shows space used by Docker."
  - "If `df` says full but `du` can't find it, a deleted file may still be open: `sudo lsof +L1` lists files that are deleted but still held by a program. Restarting that program frees the space."
  - "Add `2>/dev/null` to hide `Permission denied` lines when you scan folders you don't own, like `sudo du -h -d 1 /var | sort -h`."
related: [find-files, cpu-ram-hog, root-owned-files, remove-package]
concepts: [file-descriptors, journald-logs, mounts-devices, filesystem-layout]
anatomy:
  "-h": "Human-readable sizes like `2.8G`. On `sort`, it means \"understand those sizes\", so 19G sorts after 2.8G."
  "-d": "Max depth: how many levels of folders to list."
  "1": "Only the folders directly inside `~`, each with its full size."
  "~": "Your home folder. Use `/` with `sudo` to scan the whole disk."
---

## The situation

A "Low Disk Space" warning pops up, an install fails with `No space left on device`, or the file manager shows a red bar. You need to know what's taking the space before you can decide what to delete.

## How it works

Two commands answer two different questions:

- **`df`** (disk free) asks each drive how full it is. It's instant, but it can't say what's inside.
- **`du`** (disk usage) walks a folder and adds up the size of everything in it. It's slower, but it names the folders.

Start with `df` to confirm which drive is full, then use `du` on the biggest folder, then on the biggest folder inside that, until you reach something you recognise. On a desktop the answer is almost always in your home folder: Downloads, the Trash, caches, virtual machines, or `node_modules` in old projects.

Every command in this scenario only reads. Deciding what to delete comes after, and deleting something big you no longer need is the whole fix.
