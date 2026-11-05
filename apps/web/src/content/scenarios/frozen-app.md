---
number: 12
title: "Frozen App: Find It and Kill It"
quote: "Obsidian froze. The window won't close and clicking X does nothing."
module: processes-ports
severity: modifies
primaryCommand: kill -9 2893
symptoms:
  - app frozen
  - not responding
  - force quit
  - window won't close
  - kill app
  - kill -9
  - pgrep
  - xkill
  - "Force Quit"
before:
  kind: zones
  title: Frozen
  caption: The main process stopped responding, and the polite "please quit" (SIGTERM) is ignored.
  zones:
    - title: Window
      items:
        - { text: Obsidian, tone: bad, note: "not responding" }
    - title: Processes
      items:
        - { text: "2893 obsidian", tone: bad, note: main }
        - { text: "2895 obsidian --type=zygote", tone: base }
        - { text: "2896 obsidian --type=gpu-process", tone: base }
        - { text: "2897 obsidian --type=renderer", tone: base }
after:
  kind: zones
  title: Gone
  caption: "`kill -9` ends a process without asking it, and `pkill` sweeps up the helpers it left behind."
  zones:
    - title: Window
      empty: closed
      items: []
    - title: Processes
      items:
        - { text: "2893 obsidian", tone: ghost, note: "kill -9" }
        - { text: "2895–2897 helpers", tone: ghost, note: "pkill -9" }
steps:
  - title: Find its processes
    kind: readonly
    command: pgrep -a obsidian
    output: |
      2893 /home/jd/Applications/obsidian
      2895 /home/jd/Applications/obsidian --type=zygote
      2896 /home/jd/Applications/obsidian --type=gpu-process
      2897 /home/jd/Applications/obsidian --type=renderer --enable-crash-reporter
    note: "`pgrep` searches process names; `-a` prints the full command line. Apps built on Electron or Chrome run several processes. The one without `--type=` is the main one."
  - title: Look at the main one
    kind: readonly
    command: ps -o pid,stat,%cpu,%mem,cmd -p 2893
    output: |2
        PID STAT %CPU %MEM CMD
       2893 S     0.0  0.0 /home/jd/Applications/obsidian
    note: "`STAT` tells you what it's doing: `R` running, `S` sleeping (waiting), `T` stopped, `D` stuck waiting for the disk or network, `Z` already dead (zombie). A frozen app is often `S` or `R` at 100% CPU."
  - title: Ask it to quit
    kind: modifies
    command: kill 2893
    note: "Plain `kill` sends SIGTERM, the same request as closing the window. A healthy app saves and exits. Give it a few seconds."
  - title: Check whether it listened
    kind: readonly
    command: pgrep -a obsidian
    output: |
      2893 /home/jd/Applications/obsidian
      2895 /home/jd/Applications/obsidian --type=zygote
      2896 /home/jd/Applications/obsidian --type=gpu-process
      2897 /home/jd/Applications/obsidian --type=renderer --enable-crash-reporter
    note: "Still there: a frozen app isn't processing requests, including this one."
  - title: Force it
    kind: modifies
    command: kill -9 2893
    note: "SIGKILL is handled by the kernel, not the app, so it can't be ignored. The app gets no chance to save: unsaved work in it is lost."
  - title: Sweep up the helpers
    kind: modifies
    command: pkill -9 obsidian
    note: "Here the helpers outlived the main process. `pkill` signals every process whose name matches. Check the name with `pgrep` first: `pkill` doesn't ask."
  - title: Confirm it's gone
    kind: readonly
    command: pgrep -a obsidian
    note: "No output (exit code 1): nothing left. Start the app again normally."
replay:
  context: The same steps, run against a process that ignores SIGTERM.
  commands:
    - { line: "$ kill 2893", type: input }
    - { line: "$ pgrep obsidian", type: input }
    - { line: "2893", type: output }
    - { line: "2895", type: output }
    - { line: "2896", type: output }
    - { line: "2897", type: output }
    - { line: "$ kill -9 2893", type: input }
    - { line: "$ pgrep obsidian", type: input }
    - { line: "2895", type: output }
    - { line: "2896", type: output }
    - { line: "2897", type: output }
    - { line: "$ pkill -9 obsidian", type: input }
    - { line: "$ pgrep obsidian", type: input }
cautions:
  - type: caution
    text: "Always try plain `kill` first and wait a few seconds. `-9` skips the app's cleanup, which can leave lock files or half-written data, and the app may complain about them next time."
  - type: danger
    text: "Don't `sudo kill` or `sudo pkill` a desktop app: if `kill` says \"Operation not permitted\", the PID is someone else's process, so check you have the right one. And never `kill -9 -1`: that ends every process you own, your whole desktop session included."
avoid:
  - "On GNOME, pressing Alt+F2, typing `xkill` (on Xorg) or using System Monitor gets the same result with the mouse."
  - "If the whole desktop is frozen, switch to a text console with Ctrl+Alt+F3, log in, and use `pgrep`/`kill` from there. Ctrl+Alt+F1 or F2 brings you back."
  - "A process in state `D` can't be killed, even with `-9`, until the disk or network call it's waiting for returns. Unplugging a hung network drive often frees it."
related: [cpu-ram-hog, port-in-use, stopped-job]
concepts: [signals, processes-basics, system-calls]
anatomy:
  "-9": "SIGKILL: the kernel ends the process immediately. It can't be caught or ignored."
  "2893": "The process ID (PID) of the main process, from `pgrep`."
---

## The situation

An app stopped responding. The window is grey or blank, clicking X does nothing, or the "not responding" dialog keeps coming back. You want it gone so you can start it again.

## How it works

Every running program is a **process** with a number, its **PID**. You stop a process by sending it a **signal**:

- **SIGTERM** (15, the default for `kill`) is a request. The app can save, clean up and exit. A frozen app never gets round to handling it.
- **SIGKILL** (9) goes to the kernel, which removes the process on the spot. Nothing the app does can block it, which is why it works on frozen apps, and why unsaved work is lost.

Modern apps are usually several processes. Killing the main one normally takes the helpers with it, but not always, so check with `pgrep` afterwards. `pkill name` signals every process with that name in one go, so check what the name matches first.
