---
number: 2
title: Port 3000 Is Already in Use
quote: "EADDRINUSE: something is already running on my port"
module: processes-ports
severity: modifies
primaryCommand: lsof -i :3000 && kill <PID>
symptoms:
  - EADDRINUSE
  - address already in use
  - port busy
  - port 3000
  - port 8080
  - Something is already running on port
  - dev server won't start
before:
  kind: zones
  title: Port taken
  caption: Yesterday's dev server never stopped. It still owns port 3000, so the new one can't bind to it.
  zones:
    - title: Port 3000
      items:
        - { text: node (PID 48213), tone: bad, note: "old dev server, tab closed" }
    - title: Your terminal
      items:
        - { text: npm run dev, tone: caution, note: "Error: EADDRINUSE" }
after:
  kind: zones
  title: Port free
  caption: The old process is gone and the new server starts on 3000.
  zones:
    - title: Port 3000
      items:
        - { text: node (PID 51022), tone: good, note: new dev server }
    - title: Stopped
      items:
        - { text: node (PID 48213), tone: ghost, note: "exited after SIGTERM" }
steps:
  - title: Find what's using the port
    kind: readonly
    command: lsof -i :3000
    output: |
      COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
      node    48213 jd     23u  IPv6 412907      0t0  TCP *:3000 (LISTEN)
    note: "The `PID` column is the process ID: `48213` here. `COMMAND` tells you what it is."
  - title: Or ask ss, if lsof isn't installed
    kind: readonly
    command: ss -ltnp 'sport = :3000'
    output: |
      State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
      LISTEN 0      511                *:3000            *:*     users:(("node",pid=48213,fd=23))
    note: "`-l` listening, `-t` TCP, `-n` numbers instead of names, `-p` show the process."
  - title: Ask it to stop
    kind: modifies
    command: kill 48213
    note: "Plain `kill` sends SIGTERM: a polite request. Node, Python and most servers shut down cleanly."
  - title: Check that the port is free
    kind: readonly
    command: lsof -i :3000
    note: "No output means nothing is listening any more. Start your server again."
  - title: Only if it refuses, force it
    kind: modifies
    command: kill -9 48213
    note: "SIGKILL can't be caught or ignored, so the process gets no chance to save anything or clean up. Use it only when plain `kill` didn't work after a few seconds."
replay:
  context: A dev server from yesterday is still holding port 3000.
  commands:
    - { line: "$ npm run dev", type: input }
    - { line: "Error: listen EADDRINUSE: address already in use :::3000", type: output }
    - { line: "$ lsof -i :3000", type: input }
    - { line: "node    48213 jd   23u  IPv6 412907  0t0  TCP *:3000 (LISTEN)", type: output }
    - { line: "$ kill 48213", type: input }
    - { line: "$ lsof -i :3000", type: input }
    - { line: "$ npm run dev", type: input }
    - { line: "  ▲ Next.js 15.0.3  - Local: http://localhost:3000", type: output }
cautions:
  - type: caution
    text: "`lsof -i :3000` lists every process with a connection on port 3000, not only the server. A browser tab or a test runner talking to your dev server shows up too, as an `ESTABLISHED` line. Kill only the PID on the `(LISTEN)` line."
avoid:
  - "Stop dev servers with `Ctrl+C` before closing the terminal tab. Closing the tab doesn't always stop them."
  - "Shortcut once you trust it: `kill $(lsof -t -i :3000 -sTCP:LISTEN)`. `-t` prints only PIDs, and `-sTCP:LISTEN` keeps only the listener. Without it, the PIDs of connected clients are killed too."
  - "If something you didn't start owns the port (like a system service), `sudo lsof -i :3000` shows it; pick another port instead of killing it."
related: [command-chaining, stopped-job, frozen-app]
concepts: [ports-sockets, processes-basics, interfaces-ip]
anatomy:
  "<PID>": "The process ID from the lsof output (48213 in this example)."
  ":3000": "The port to look up. Without a host, lsof matches it on every address."
---

## The situation

You start your dev server and it dies immediately with `EADDRINUSE` or "address already in use". Another process already owns that port. Usually it's the same server from earlier, still running in a closed tab or in the background.

## How it works

A port can have only one listener at a time. To free it, find the process that holds it and stop that process.

`lsof` means "list open files", and on Linux network sockets count as files, so `lsof -i :3000` shows who has port 3000 open. `kill` doesn't only kill: it sends a **signal**. The default, `SIGTERM`, asks the process to exit. `-9` (`SIGKILL`) makes the kernel end it on the spot.
