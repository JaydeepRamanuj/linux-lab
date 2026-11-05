---
number: 15
title: What Is Eating My CPU or RAM?
quote: "My laptop fan is screaming and everything is slow. What's using it all?"
module: processes-ports
severity: readonly
primaryCommand: ps aux --sort=-%cpu | head -4
symptoms:
  - high cpu
  - high memory
  - ram usage
  - laptop slow
  - fan loud
  - what is using cpu
  - top
  - htop
  - free -h
  - out of memory
before:
  kind: zones
  title: Something is busy
  caption: The machine is slow, but nothing on screen says why.
  zones:
    - title: CPU
      items:
        - { text: "busy", tone: bad, note: "fan loud" }
    - title: Memory
      items:
        - { text: "1.6 GiB used", tone: caution }
    - title: Culprit
      empty: unknown
      items: []
after:
  kind: zones
  title: Found it
  caption: Sorting processes by CPU and memory puts the culprits at the top.
  zones:
    - title: CPU
      items:
        - { text: "node build.js", tone: bad, note: "98.6% · one full core" }
    - title: Memory
      items:
        - { text: "chrome --type=renderer", tone: bad, note: "1.5 GB" }
    - title: Culprit
      items:
        - { text: "PID 3127 and 3128", tone: focus, note: "now you can decide" }
steps:
  - title: How much memory is really in use?
    kind: readonly
    command: free -h
    output: |2
                     total        used        free      shared  buff/cache   available
      Mem:            15Gi       1.6Gi        13Gi        15Mi       483Mi        14Gi
      Swap:             0B          0B          0B
    note: "Read **available**, not free. Linux uses spare memory as disk cache (`buff/cache`) and gives it back the moment a program needs it. Trouble starts when `available` gets close to 0 and swap fills up."
  - title: Top CPU users
    kind: readonly
    command: ps aux --sort=-%cpu | head -4
    output: |
      USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
      jd        3131  100  0.0   8056  4248 ?        R    07:57   0:00 ps aux --sort=-%cpu
      jd        3127 99.2  0.0   2568  1216 ?        R    07:57   0:03 node build.js
      jd        3128 98.5  6.9 1538704 1144148 ?     R    07:57   0:03 /opt/google/chrome/chrome --type=renderer
    note: "`%CPU` is per core, so 100 means one core fully busy, and a 4-core machine goes up to 400. `ps` lists itself at the top here: it was busy reading the process list. Ignore it."
  - title: Top memory users
    kind: readonly
    command: ps aux --sort=-%mem | head -2
    output: |
      USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
      jd        3128 46.4  9.3 1538704 1537536 ?     S    07:57   0:05 /opt/google/chrome/chrome --type=renderer
    note: "`head -2` keeps the header and the biggest one. `RSS` is the memory actually in use, in KiB: 1537536 KiB is about 1.5 GB. `VSZ` counts memory reserved but not used, so it looks scary and means little."
  - title: Watch it live
    kind: readonly
    command: top -o %CPU
    output: |
      top - 07:57:36 up 4 min,  0 user,  load average: 0.25, 0.19, 0.09
      Tasks:  93 total,   3 running,  90 sleeping,   0 stopped,   0 zombie
      %Cpu(s): 24.4 us, 24.4 sy,  0.0 ni, 46.7 id,  0.0 wa,  0.0 hi,  4.4 si,  0.0 st
      MiB Mem :  16091.2 total,  14204.7 free,   1632.0 used,    483.6 buff/cache
      MiB Swap:      0.0 total,      0.0 free,      0.0 used.  14459.1 avail Mem

        PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
       3127 jd        20   0    2568   1216   1116 R 100.0   0.0   0:04.19 node
       3128 jd        20   0 1538704   1.1g   1368 R 100.0   7.2   0:04.16 chrome
    note: "Refreshes every few seconds. Inside `top`: `P` sorts by CPU, `M` by memory, `c` shows full command lines, `q` quits. `wa` above 10% means processes are waiting on the disk, not the CPU."
  - title: A friendlier view
    kind: readonly
    command: htop
    note: "Colour bars per core, mouse support, F6 to sort, F9 to send a signal. Install it with `sudo apt install htop`."
replay:
  context: Finding the busy process, then checking it a few seconds later.
  commands:
    - { line: "$ ps -eo pid,%cpu,%mem,rss,etime,comm --sort=-%cpu | head -3", type: input }
    - { line: "  PID %CPU %MEM   RSS     ELAPSED COMMAND", type: output }
    - { line: " 3127 98.6  0.0  1216       00:12 node", type: output }
    - { line: " 3128 46.4  9.3 1537536     00:12 chrome", type: output }
cautions:
  - type: caution
    text: "`ps` shows CPU averaged over the process's whole life, while `top` shows the last few seconds. In the replay, chrome reads 46% in `ps` though it finished its work and sits idle. Use `top` to see what's busy now."
  - type: caution
    text: "Before killing a hog, check what it is. `node build.js` may be a build you started; a `chrome` renderer is one browser tab. Close the tab or stop the build normally first."
avoid:
  - "If one app keeps doing this, the frozen-app scenario covers stopping it."
  - "`free -h` with swap almost full and `available` near zero means you're out of memory. Linux will soon pick a process to kill (the OOM killer). `journalctl -k | grep -i oom` shows past kills."
  - "GNOME's System Monitor and KDE's System Monitor show the same numbers with a GUI."
related: [frozen-app, port-in-use, keep-running, disk-full]
concepts: [processes-basics, signals, proc-sys, kernel-user-space]
anatomy:
  "--sort=-%cpu": "Sort by CPU use, highest first (the `-` reverses the order)."
  "-4": "Only the first four lines: the header and the top three."
---

## The situation

The fan spins up, typing lags, the browser stutters. Something is using the CPU, the memory, or both, and you want to know what before you decide whether to close it.

## How it works

The kernel keeps per-process counters for CPU time and memory, and `ps` and `top` read them:

- **CPU** is shown per core: 100% is one core flat out. A process stuck at 100% for minutes is usually a loop that will never finish, or a build doing real work.
- **Memory** that counts is **RSS**, what the process actually holds in RAM. `free -h` shows the whole machine: **available** is what programs can still get.

`ps` takes one snapshot and sorts it, which is good for copying into a bug report. `top` and `htop` refresh live. These commands only read, so run them as often as you like.
