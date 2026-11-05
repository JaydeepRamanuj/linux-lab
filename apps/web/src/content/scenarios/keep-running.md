---
number: 13
title: Keep a Process Running After Closing the Terminal
quote: "I started a long job over SSH. When my laptop slept, the connection dropped and the job died."
module: processes-ports
severity: modifies
primaryCommand: nohup ./train.sh > train.log 2>&1 &
symptoms:
  - keep running after logout
  - process dies when terminal closes
  - ssh disconnect kills process
  - nohup
  - tmux
  - screen
  - run in background
  - SIGHUP
  - detach
before:
  kind: zones
  title: Tied to the terminal
  caption: "When the terminal or SSH session closes, everything started from it gets SIGHUP (\"hang up\") and exits."
  zones:
    - title: Terminal / SSH session
      items:
        - { text: bash, tone: base }
    - title: Its children
      items:
        - { text: ./train.sh, tone: bad, note: "dies with the session" }
    - title: Output
      items:
        - { text: "on screen only", tone: ghost, note: "lost on disconnect" }
after:
  kind: zones
  title: On its own
  caption: "`nohup` makes the job ignore the hang-up and sends its output to a file, so it outlives the session."
  zones:
    - title: Terminal / SSH session
      empty: closed
      items: []
    - title: Its children
      items:
        - { text: ./train.sh, tone: good, note: "still running" }
    - title: Output
      items:
        - { text: train.log, tone: focus, note: "read it any time" }
steps:
  - title: Start it so it survives a hang-up
    kind: modifies
    command: nohup ./train.sh > train.log 2>&1 &
    output: "[1] 2945"
    note: "`nohup` makes the job ignore SIGHUP. `> train.log 2>&1` sends normal output and errors to a file, because the screen it was writing to will be gone. `&` gives you the prompt back. The shell prints the job number and PID."
  - title: Check it's running
    kind: readonly
    command: jobs -l
    output: "[1]+  2945 Running                 nohup ./train.sh > train.log 2>&1 &"
    note: "`jobs` only lists jobs from this terminal. After you reconnect, use `pgrep -a train.sh` instead."
  - title: Read the latest output
    kind: readonly
    command: tail -n 3 train.log
    output: |
      epoch 3/500  loss=0.897
      epoch 4/500  loss=0.896
      epoch 5/500  loss=0.895
  - title: Watch it live
    kind: readonly
    command: tail -f train.log
    note: "`-f` keeps printing new lines as they're written. Ctrl+C stops `tail`, not the job."
  - title: "Or: start it inside tmux"
    kind: readonly
    command: tmux new -s train
    note: "`tmux` opens a terminal that lives on the machine, not in your window. Run `./train.sh` in it as usual. You can come back to it later and see the live screen, which `nohup` can't do."
  - title: Detach and leave it running
    note: "Press Ctrl+B, let go, then press D. You're back in your normal shell, and the job keeps running inside tmux. Closing the terminal or losing SSH now does the same thing."
  - title: See what's still running in tmux
    kind: readonly
    command: tmux ls
    output: "train: 1 windows (created Wed Nov  4 07:56:15 2026)"
  - title: Come back to it
    kind: readonly
    command: tmux attach -t train
    note: "The screen is exactly as you left it, with the job still printing. Detach again with Ctrl+B D."
replay:
  context: Starting a training script with nohup, then checking on it.
  commands:
    - { line: "$ nohup ./train.sh > train.log 2>&1 &", type: input }
    - { line: "[1] 2945", type: output }
    - { line: "$ jobs -l", type: input }
    - { line: "[1]+  2945 Running                 nohup ./train.sh > train.log 2>&1 &", type: output }
    - { line: "$ tail -n 3 train.log", type: input }
    - { line: "epoch 3/500  loss=0.897", type: output }
    - { line: "epoch 4/500  loss=0.896", type: output }
    - { line: "epoch 5/500  loss=0.895", type: output }
cautions:
  - type: caution
    text: "Without a redirect, `nohup` writes output to `nohup.out` in the current folder and prints `nohup: ignoring input and appending output to 'nohup.out'`. It's easy to fill a disk with a chatty job, so pick the log file yourself."
  - type: caution
    text: "`&` alone isn't enough. A background job still gets SIGHUP when the terminal closes, and dies with it."
avoid:
  - "Forgot to use `nohup` on a job that's already running? Press Ctrl+Z, then run `bg` and `disown -h %1`. It keeps running, but its output still goes to the terminal that's about to close."
  - "To stop a `nohup` job later: `pgrep -a train.sh` for its PID, then `kill PID`."
  - "For something that should always run, including after a reboot (a bot, a server), make it a systemd service instead: see the system service scenario."
  - "`tmux` isn't always installed: `sudo apt install tmux`. `screen` is an older tool that does the same job."
related: [stopped-job, system-service, frozen-app, watch-log]
concepts: [jobs-sessions, signals, systemd-units]
anatomy:
  "./train.sh": "The script to run, from the current folder."
  "train.log": "The file that collects the job's output."
---

## The situation

A training run, a big download, a migration or a build takes hours. You start it in a terminal, close the window or lose SSH, and come back to find it died the moment the session ended.

## How it works

When a terminal closes, it sends **SIGHUP** ("hang-up", from modem days) to the shell, which passes it on to every job it started. Most programs exit when they get it. The job also loses the screen it was printing to.

There are two fixes:

- **`nohup cmd > log 2>&1 &`** makes the job ignore SIGHUP and writes its output to a file. It's simple and always available. You check on it by reading the log.
- **`tmux`** runs a whole terminal session on the machine itself. Your window is just a view of it: close the view and the session carries on, then re-attach later and see the live screen. It's better for anything interactive, or when you want to come back and look.
