---
number: 4
title: "apt Says: Could Not Get Lock"
quote: "Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 2841 (unattended-upgr)"
module: packages
severity: elevated
primaryCommand: ps -p 2841 -o pid,etime,cmd
symptoms:
  - could not get lock
  - /var/lib/dpkg/lock-frontend
  - /var/lib/dpkg/lock
  - unattended-upgr
  - Unable to acquire the dpkg frontend lock
  - is another process using it
  - apt is locked
before:
  kind: zones
  title: Lock held
  caption: The automatic updater holds the dpkg lock, so your `apt install` has to wait.
  zones:
    - title: dpkg lock
      items:
        - { text: unattended-upgr (PID 2841), tone: caution, note: installing security updates }
    - title: Your terminal
      items:
        - { text: sudo apt install htop, tone: bad, note: "E: Could not get lock" }
after:
  kind: zones
  title: Lock released
  caption: The updater finished, released the lock, and your install goes through.
  zones:
    - title: dpkg lock
      items:
        - { text: sudo apt install htop, tone: good, note: holds it while installing }
    - title: Finished
      items:
        - { text: unattended-upgr (PID 2841), tone: ghost, note: exited normally }
steps:
  - title: See what holds the lock
    kind: readonly
    command: ps -p 2841 -o pid,etime,cmd
    output: |
      PID     ELAPSED CMD
      2841      03:12 /usr/bin/python3 /usr/bin/unattended-upgrade
    note: "Use the PID from the error message. `etime` is how long it has been running. A few minutes is normal for updates after boot."
  - title: Wait for it to finish
    note: "Give it a few minutes. It's installing updates, and stopping it halfway can leave packages half-configured. Re-run the `ps` command to check: once it prints only the header, the lock is free."
  - title: Run your command again
    kind: elevated
    command: sudo apt install htop
  - title: If an earlier install was interrupted, finish it
    kind: elevated
    command: sudo dpkg --configure -a
    note: "Only needed if apt tells you to, or if no apt or dpkg process is running and things still look broken. It completes any half-finished package setup."
replay:
  context: Installing a package right after boot, while automatic updates run.
  commands:
    - { line: "$ sudo apt install htop", type: input }
    - { line: "E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 2841 (unattended-upgr)", type: output }
    - { line: "$ ps -p 2841 -o pid,etime,cmd", type: input }
    - { line: "    PID     ELAPSED CMD", type: output }
    - { line: "   2841       03:12 /usr/bin/python3 /usr/bin/unattended-upgrade", type: output }
    - { line: "$ ps -p 2841 -o pid,etime,cmd", type: input }
    - { line: "    PID     ELAPSED CMD", type: output }
    - { line: "$ sudo apt install htop", type: input }
    - { line: "Setting up htop (3.3.0-4build1) ...", type: output }
cautions:
  - type: danger
    text: "Never delete the lock files (`sudo rm /var/lib/dpkg/lock*`) while apt or dpkg is running. Two installs writing the package database at once can corrupt it, and that's much harder to fix than waiting."
avoid:
  - "Right after boot, give automatic updates a few minutes before installing things."
  - "Don't close a terminal while `apt` is running. If you must stop it, use `Ctrl+C` and then run `sudo dpkg --configure -a`."
related: [fix-broken-install, system-service]
concepts: [what-is-a-package, file-descriptors, scheduled-tasks]
anatomy:
  "-p": "Only show the process with this ID."
  "2841": "The PID from the error message."
  "-o": "Choose which columns to show."
  "pid,etime,cmd": "Columns: process ID, time since it started, full command line."
---

## The situation

You run `sudo apt install …` or `apt upgrade` and it stops with "Could not get lock /var/lib/dpkg/lock-frontend". Often it names the process holding it, typically `unattended-upgr` or another `apt`.

## How it works

Only one program at a time may change installed packages, so `apt` and `dpkg` take a **lock** first. On Ubuntu, `unattended-upgrades` installs security updates in the background, especially shortly after boot, and holds that lock while it works.

The fix is almost always to wait. The lock is released when that process exits. Forcing it out (deleting lock files or killing the updater) is what turns a 3-minute wait into a broken package database.
