---
number: 3
title: "Permission Denied When Running a Script"
quote: "bash: ./deploy.sh: Permission denied"
module: files-permissions
severity: modifies
primaryCommand: chmod +x deploy.sh
symptoms:
  - permission denied
  - "./script.sh: Permission denied"
  - can't run script
  - not executable
  - chmod +x
  - bad interpreter
before:
  kind: zones
  title: "-rw-rw-r--  (664)"
  caption: "Everyone can read the script, but nobody can execute it."
  zones:
    - title: Owner (jd)
      items:
        - { text: read, tone: good }
        - { text: write, tone: good }
        - { text: execute, tone: bad, note: missing }
    - title: Group (jd)
      items:
        - { text: read, tone: good }
        - { text: write, tone: good }
        - { text: execute, tone: ghost }
    - title: Others
      items:
        - { text: read, tone: good }
        - { text: execute, tone: ghost }
after:
  kind: zones
  title: "-rwxrwxr-x  (775)"
  caption: "`chmod +x` adds execute for owner, group and others (limited by your umask)."
  zones:
    - title: Owner (jd)
      items:
        - { text: read, tone: good }
        - { text: write, tone: good }
        - { text: execute, tone: good, note: added }
    - title: Group (jd)
      items:
        - { text: read, tone: good }
        - { text: write, tone: good }
        - { text: execute, tone: good, note: added }
    - title: Others
      items:
        - { text: read, tone: good }
        - { text: execute, tone: good, note: added }
steps:
  - title: Look at the permissions
    kind: readonly
    command: ls -l deploy.sh
    output: "-rw-rw-r-- 1 jd jd 312 Nov  3 10:12 deploy.sh"
    note: "Read the first column in groups of three after the leading `-`: owner `rw-`, group `rw-`, others `r--`. No `x` anywhere."
  - title: Add execute permission
    kind: modifies
    command: chmod +x deploy.sh
    note: "Only changes the permission bits. The contents of the script are untouched."
  - title: Check again
    kind: readonly
    command: ls -l deploy.sh
    output: "-rwxrwxr-x 1 jd jd 312 Nov  3 10:12 deploy.sh"
  - title: Run it
    kind: modifies
    command: ./deploy.sh
    note: "The `./` matters: the current folder isn't in `PATH`, so plain `deploy.sh` gives \"command not found\"."
replay:
  context: A freshly cloned repo whose deploy script lost its execute bit.
  commands:
    - { line: "$ ./deploy.sh", type: input }
    - { line: "bash: ./deploy.sh: Permission denied", type: output }
    - { line: "$ ls -l deploy.sh", type: input }
    - { line: "-rw-rw-r-- 1 jd jd 312 Nov  3 10:12 deploy.sh", type: output }
    - { line: "$ chmod +x deploy.sh", type: input }
    - { line: "$ ./deploy.sh", type: input }
    - { line: "Deploying build 4f2a91c… done", type: output }
cautions:
  - type: danger
    text: "Don't reach for `sudo ./deploy.sh` or `chmod 777`. `sudo` runs the whole script as root, and `777` lets every user on the machine edit it. `+x` is all that's missing."
  - type: caution
    text: "Still \"Permission denied\" after `chmod +x`? The file may be on a drive mounted with `noexec` (common for `/tmp` and USB sticks). Run it with `bash deploy.sh` instead, or move it."
avoid:
  - "Commit the execute bit so teammates get it too: `git update-index --chmod=+x deploy.sh`."
  - "If you see `bad interpreter: /bin/bash^M`, the file has Windows line endings. Fix it with `sed -i 's/\\r$//' deploy.sh`."
  - "You can always run a script without the bit: `bash deploy.sh` reads the file instead of executing it."
related: [appimage-install, chmod-numbers, root-owned-files]
concepts: [permissions-model, pressing-enter]
anatomy:
  "+x": "Add (+) execute permission (x). Who gets it is limited by your umask, usually everyone."
---

## The situation

You try to run a script, `./deploy.sh` or `./install.sh`, and the shell answers `Permission denied`. You own the file and it looks fine.

## How it works

Every file has three sets of permissions, for the **owner**, the **group** and **others**. Each set can **r**ead, **w**rite and e**x**ecute. To run a file as a program it needs `x`. Files from downloads, zip archives, email attachments and some git setups arrive without it.

`chmod +x` adds the execute bit without touching anything else. In octal, `chmod 755` gives the same result for most scripts: `7` (rwx) for you, `5` (r-x) for everyone else.
