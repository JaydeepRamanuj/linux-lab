---
number: 22
title: Watch a Log File Live
quote: "Checkout fails somewhere in the API. I want to watch the log while I click through it."
module: files-permissions
severity: readonly
primaryCommand: tail -f logs/app.log
symptoms:
  - watch log
  - follow log
  - live log
  - tail -f
  - tail -F
  - log stopped updating
  - "has become inaccessible"
  - filter log for errors
  - less +F
before:
  kind: zones
  title: The log keeps growing
  caption: Opening it in an editor shows a snapshot. New lines arrive every second.
  zones:
    - title: logs/app.log
      items:
        - { text: "INFO  GET /api/products 200", tone: base }
        - { text: "WARN  slow query … (812ms)", tone: caution }
        - { text: "ERROR POST /api/checkout 500", tone: bad }
        - { text: "… new lines being written", tone: ghost }
after:
  kind: zones
  title: Following the end
  caption: "`tail -f` prints the last lines, then each new one the moment it's written."
  zones:
    - title: Terminal
      items:
        - { text: "08:20:03 ERROR POST /api/checkout 500", tone: bad, note: live }
        - { text: "08:20:03 INFO  GET /health 200", tone: base, note: live }
        - { text: "▌ waiting for more", tone: focus, note: "Ctrl+C to stop" }
steps:
  - title: Look at the latest lines
    kind: readonly
    command: tail -n 5 logs/app.log
    output: |
      08:20:02 INFO  POST /api/cart 201 22ms
      08:20:03 ERROR POST /api/checkout 500 Stripe: No API key provided
      08:20:03 INFO  GET /health 200 1ms
      08:20:04 INFO  GET /api/products 200 14ms
      08:20:04 INFO  GET /api/cart 200 9ms
    note: "The last 5 lines, then back to the prompt. Without `-n`, `tail` shows 10."
  - title: Follow it
    kind: readonly
    command: tail -f logs/app.log
    output: |
      …
      08:20:05 WARN  slow query: SELECT * FROM orders (812ms)
      08:20:05 INFO  POST /api/cart 201 22ms
      08:20:06 ERROR POST /api/checkout 500 Stripe: No API key provided
      08:20:06 INFO  GET /health 200 1ms
      08:20:07 INFO  GET /api/products 200 14ms
    note: "It prints the last 10 lines and keeps going: each new line appears as it's written. Reproduce the bug in the app and watch. Ctrl+C stops `tail`, not the app."
  - title: Only the lines you care about
    kind: readonly
    command: tail -f logs/app.log | grep -iE "error|warn"
    output: |
      08:20:30 ERROR POST /api/checkout 500 Stripe: No API key provided
      08:20:32 WARN  slow query: SELECT * FROM orders (812ms)
      08:20:33 ERROR POST /api/checkout 500 Stripe: No API key provided
    note: "`grep` passes through only matching lines. `-i` ignores case, `-E` allows `|` for \"or\"."
  - title: Keep following when the log is rotated
    kind: readonly
    command: tail -F logs/app.log
    output: |
      …
      08:20:13 INFO  GET /api/products 200 14ms
      tail: 'logs/app.log' has become inaccessible: No such file or directory
      tail: 'logs/app.log' has appeared;  following new file
      08:20:14 INFO  GET /api/cart 200 9ms
    note: "Capital `-F` follows the *name*. When the log is renamed to `app.log.1` and a new `app.log` starts, it switches to the new file. Lowercase `-f` keeps watching the renamed one and goes quiet."
  - title: "Or: follow, then scroll back"
    kind: readonly
    command: less +F logs/app.log
    note: "Follows like `tail -f`. Press Ctrl+C to stop following and scroll or search (`/ERROR`); Shift+F to follow again; `q` to quit."
  - title: "For system services: the journal"
    kind: readonly
    command: journalctl -f -u nginx
    note: "Services run by systemd log to the journal, not to a file you can `tail`. `-f` follows it the same way."
replay:
  context: "Following from the last two lines while checkout is retried, then stopping."
  commands:
    - { line: "$ tail -n 2 -f logs/app.log", type: input }
    - { line: "08:20:36 ERROR POST /api/checkout 500 Stripe: No API key provided", type: output }
    - { line: "08:20:37 INFO  GET /health 200 1ms", type: output }
    - { line: "08:20:37 INFO  GET /api/products 200 14ms", type: output }
    - { line: "08:20:38 INFO  GET /api/cart 200 9ms", type: output }
    - { line: "08:20:38 WARN  slow query: SELECT * FROM orders (812ms)", type: output }
    - { line: "08:20:39 INFO  POST /api/cart 201 22ms", type: output }
    - { line: "08:20:39 ERROR POST /api/checkout 500 Stripe: No API key provided", type: output }
    - { line: "08:20:40 INFO  GET /health 200 1ms", type: output }
    - { line: "^C", type: output }
cautions:
  - type: caution
    text: "If `tail -f` suddenly goes quiet while the app is clearly busy, the log was probably rotated. Restart with `tail -F`, which is the safer default for any long-running watch."
  - type: caution
    text: "Adding another command after `grep` (`tail -f log | grep error | cut …`) can make output appear in bursts or not at all, because `grep` buffers when it isn't writing to the screen. Use `grep --line-buffered` in the middle of a pipe."
avoid:
  - "System logs in `/var/log` (like `/var/log/nginx/error.log`) are often readable only by root or the `adm` group: `sudo tail -f /var/log/nginx/error.log`."
  - "`grep -c ERROR logs/app.log` counts matching lines so far, which is handy for checking whether a fix made errors stop."
  - "To watch several logs at once: `tail -f logs/app.log logs/worker.log` labels each block with its file name."
related: [keep-running, system-service, find-files, sed-awk]
anatomy:
  "-f": "Follow: after printing the end, keep the file open and print each new line as it's written."
  "logs/app.log": "The file to watch. Several files work too."
---

## The situation

Something fails in a running program: a server, a build, a background job. Its log file has the answer, but it's long and still growing. You want to see new lines as they happen, while you reproduce the problem.

## How it works

`tail` prints the end of a file. With **`-f`** (follow) it doesn't exit: it keeps the file open and prints each line the moment the program appends it. It only reads, so it can't affect the program or the log.

Pipe it into `grep` to see only errors, or open the log in `less +F` when you also want to scroll back and search.

Long-running programs often **rotate** logs: rename `app.log` to `app.log.1` and start a fresh `app.log`. Lowercase `-f` follows the open file, so it keeps watching the old one. Capital **`-F`** follows the name and reopens it, which is what you want for anything you watch for more than a few minutes.
