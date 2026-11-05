---
number: 14
title: "Ctrl+Z Stopped My Program: Where Did It Go?"
quote: "I pressed Ctrl+Z to stop my dev server. Now port 8000 is still in use and the server doesn't respond."
module: processes-ports
severity: modifies
primaryCommand: fg
symptoms:
  - ctrl+z
  - stopped
  - "[1]+ Stopped"
  - there are stopped jobs
  - suspended
  - fg
  - bg
  - jobs
  - address already in use after ctrl+z
before:
  kind: zones
  title: Paused, not stopped
  caption: "Ctrl+Z pauses the program. It keeps its memory and its port, but runs no code."
  zones:
    - title: Terminal
      items:
        - { text: "$ prompt", tone: base, note: "looks finished" }
    - title: Job 1
      items:
        - { text: python3 -m http.server 8000, tone: caution, note: Stopped }
    - title: Port 8000
      items:
        - { text: held by job 1, tone: bad, note: "Address already in use" }
after:
  kind: zones
  title: Brought back and quit properly
  caption: "`fg` resumes it in the foreground. Ctrl+C then quits it for real and frees the port."
  zones:
    - title: Terminal
      items:
        - { text: "$ prompt", tone: base }
    - title: Job 1
      empty: no jobs
      items: []
    - title: Port 8000
      items:
        - { text: free, tone: good }
steps:
  - title: List this terminal's jobs
    kind: readonly
    command: jobs -l
    output: "[1]+  3090 Stopped                 python3 -m http.server 8000"
    note: "`[1]` is the job number, `3090` the PID. `+` marks the current job, the one `fg` and `bg` use if you don't give a number."
  - title: Bring it back to the foreground
    kind: modifies
    command: fg
    output: python3 -m http.server 8000
    note: "`fg` prints the command and resumes it, connected to your keyboard again. With several jobs, pick one: `fg %2`."
  - title: Quit it the right way
    note: "Press Ctrl+C. That's \"stop\" (SIGINT); Ctrl+Z was only \"pause\". The server prints `Keyboard interrupt received, exiting.` and the port is free."
  - title: "Or: let it keep running in the background"
    kind: modifies
    command: bg %1
    output: "[1]+ python3 -m http.server 8000 &"
    note: "The job runs again, but the prompt stays yours. Its output still appears in this terminal, mixed with whatever you type."
  - title: "Or: end it without bringing it back"
    kind: modifies
    command: kill %1
    note: "`%1` means job 1 of this terminal, so there's no need to look up the PID. Bash also wakes the job up so it can receive the signal."
  - title: Check nothing is left
    kind: readonly
    command: jobs
    output: "[1]+  Terminated              python3 -m http.server 8000"
    note: "Bash reports the ending once. After that, `jobs` prints nothing."
replay:
  context: The real sequence, from Ctrl+Z to the port error and back.
  commands:
    - { line: "$ python3 -m http.server 8000", type: input }
    - { line: "Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...", type: output }
    - { line: "^Z", type: output }
    - { line: "[1]+  Stopped                 python3 -m http.server 8000", type: output }
    - { line: "$ python3 -m http.server 8000 2>&1 | tail -n 1", type: input }
    - { line: "OSError: [Errno 98] Address already in use", type: output }
    - { line: "$ fg", type: input }
    - { line: "python3 -m http.server 8000", type: output }
    - { line: "^C", type: output }
    - { line: "Keyboard interrupt received, exiting.", type: output }
    - { line: "$ jobs", type: input }
cautions:
  - type: caution
    text: "Typing `exit` with a stopped job prints `There are stopped jobs.` and stays open. Typing `exit` a second time closes the shell anyway, and the stopped job can be left behind, still paused and still holding its port. Deal with the job first."
  - type: caution
    text: "Ctrl+Z on an editor like `vim` or `nano` doesn't save anything. Your unsaved changes are waiting in the paused editor: `fg` to get back to them."
avoid:
  - "Ctrl+C quits, Ctrl+Z pauses, Ctrl+D ends input (and closes the shell at an empty prompt)."
  - "`jobs` only knows this terminal's jobs. From another terminal, find it with `pgrep -a` or `ps aux | grep` and look for `T` (stopped) in the STAT column."
  - "A stopped job in another terminal can be resumed or ended by PID: `kill -CONT PID` resumes it, `kill PID` ends it."
related: [keep-running, port-in-use, frozen-app]
concepts: [jobs-sessions, signals]
anatomy:
  "fg": "Resume the current job in the foreground: running again, and reading your keyboard."
---

## The situation

You pressed Ctrl+Z instead of Ctrl+C, or pressed it on purpose to get your prompt back. The program vanished from the screen, but it's still there somehow: the port is taken, the file is locked, or `exit` complains about stopped jobs.

## How it works

The shell keeps a small table of **jobs**: programs started from this terminal. **Ctrl+Z** sends SIGTSTP, which pauses the foreground job. It's frozen in place with its memory, open files and network ports intact, and the shell hands you the prompt.

- `jobs` lists them, `fg` resumes one in the foreground, `bg` resumes one in the background.
- `%1`, `%2` refer to jobs by number, and work anywhere a PID does in this shell: `kill %1`, `fg %2`.

A stopped job does nothing until you resume or end it. That's why a paused server still blocks its port but never answers requests.
