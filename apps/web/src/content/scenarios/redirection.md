---
number: 27
title: "Redirection: >, >>, 2>&1 and /dev/null"
quote: "My agent ran npm test > test.log 2>&1 and the terminal stayed empty. Where did the output go, and what's 2>&1?"
module: decode-agent-commands
severity: modifies
primaryCommand: npm test > test.log 2>&1
symptoms:
  - redirect output to a file
  - what does 2>&1 mean
  - "2>&1"
  - "> vs >>"
  - append to file
  - /dev/null
  - hide errors
  - stderr stdout
  - save output to a file
  - output not showing in terminal
  - file is empty after sort
  - tee
  - "cannot overwrite existing file"
stateLabels: [Without redirection, With > test.log 2>&1]
before:
  kind: zones
  title: Both streams go to the screen
  caption: "A program has two outputs. Normally both end up in your terminal, mixed together."
  zones:
    - title: npm test
      items:
        - { text: "stdout (1)", tone: base, note: "normal output" }
        - { text: "stderr (2)", tone: bad, note: errors }
    - title: Terminal
      items:
        - { text: "✓ cart adds items", tone: base }
        - { text: "✗ checkout returns 200", tone: bad }
after:
  kind: zones
  title: Both streams go into the file
  caption: "`> test.log` sends stdout to the file; `2>&1` sends stderr to the same place."
  zones:
    - title: Terminal
      empty: Nothing printed
      items: []
    - title: test.log
      items:
        - { text: "✓ cart adds items", tone: good, note: stdout }
        - { text: "✗ checkout returns 200", tone: good, note: stderr }
        - { text: "2 passed, 1 failed", tone: good }
steps:
  - title: See the two streams
    kind: readonly
    command: ls notes.txt missing.txt
    output: |
      ls: cannot access 'missing.txt': No such file or directory
      notes.txt
    note: "`notes.txt` is normal output (stdout). The complaint about `missing.txt` is an error (stderr). They look the same on screen, but they're separate streams."
  - title: "> sends stdout to a file"
    kind: modifies
    command: ls notes.txt missing.txt > out.txt
    output: |
      ls: cannot access 'missing.txt': No such file or directory
    note: "The error still shows: `>` only catches stdout. `cat out.txt` prints `notes.txt`."
  - title: "> replaces, >> appends"
    kind: modifies
    command: echo "first run" > out.txt && echo "second run" >> out.txt && cat out.txt
    output: |
      first run
      second run
    note: "`>` empties the file before the command starts, then writes. The old `notes.txt` line is gone. `>>` adds to the end and keeps what was there."
  - title: "2>&1 sends errors to the same place"
    kind: modifies
    command: npm test > test.log 2>&1
    note: "No output at all: everything went into `test.log`. `2>&1` reads \"send stream 2 (stderr) to wherever stream 1 (stdout) goes right now\", and `> test.log` has already pointed stream 1 at the file."
  - title: Read what it saved
    kind: readonly
    command: cat test.log
    output: |2

      > shop@1.0.0 test
      > node test.js

      ✓ cart adds items
      ✓ cart totals include tax
      ✗ checkout returns 200
        expected 200, got 500: Stripe: No API key provided
      2 passed, 1 failed
    note: "The failure is in there too. Without `2>&1` the two `✗` lines would have gone to the screen and been missing from the log."
  - title: "/dev/null throws output away"
    kind: readonly
    command: ls notes.txt missing.txt 2>/dev/null
    output: |
      notes.txt
    note: "`/dev/null` is a bin that discards whatever is written to it. `2>/dev/null` hides errors; `> /dev/null 2>&1` hides everything, and you only learn the exit code."
  - title: "Watch it and keep it: tee"
    kind: modifies
    command: npm test 2>&1 | tee test.log
    output: |2

      > shop@1.0.0 test
      > node test.js

      ✓ cart adds items
      ✓ cart totals include tax
      ✗ checkout returns 200
        expected 200, got 500: Stripe: No API key provided
      2 passed, 1 failed
    note: "`2>&1 |` puts both streams into the pipe, and `tee` prints them while writing the same lines to `test.log`. Agents often use `2>&1 | tail -n 20` the same way, to keep only the end."
replay:
  context: "The order of 2>&1 matters. Here it comes first, before the file is set up."
  commands:
    - { line: "$ npm test 2>&1 > test.log", type: input }
    - { line: "✗ checkout returns 200", type: output }
    - { line: "  expected 200, got 500: Stripe: No API key provided", type: output }
    - { line: "$ cat test.log", type: input }
    - { line: "> shop@1.0.0 test", type: output }
    - { line: "> node test.js", type: output }
    - { line: "✓ cart adds items", type: output }
    - { line: "✓ cart totals include tax", type: output }
    - { line: "2 passed, 1 failed", type: output }
    - { line: "$ npm test > test.log 2>&1", type: input }
cautions:
  - type: danger
    text: "Never redirect a file into itself: `sort notes.txt > notes.txt` leaves `notes.txt` empty. The shell empties the file for `>` before `sort` starts reading, so `sort` reads nothing. Write to a new file and rename it, or use the program's own option (`sort -o notes.txt notes.txt`, `sed -i`)."
  - type: caution
    text: "`>` replaces a file without asking. Before running a line someone else wrote, check every `>` for what it points at. `set -o noclobber` makes bash refuse instead (`bash: notes.txt: cannot overwrite existing file`); `>|` overrides it once."
avoid:
  - "`&> file` is bash's short form of `> file 2>&1`. You'll see both; they do the same thing."
  - "`2>&1 | tail` and `| tail` look alike, but without `2>&1` the errors skip the pipe and print immediately, before everything else."
  - "After `cmd | tee log`, `echo $?` reports `tee`'s exit code, not the command's. It's usually 0 even when the tests failed."
  - "`< file` is the other direction: it feeds a file into a program's input, like `sort < names.txt`."
related: [command-chaining, heredocs, expansion-quoting, exit-codes, watch-log]
anatomy:
  ">": "Send stdout (stream 1) into a file instead of the terminal."
  "2>&1": "Send stderr (stream 2) to wherever stdout points now: the same file."
  "test.log": "The file stdout goes to. Created if it doesn't exist, emptied if it does."
---

## The situation

Agents redirect output all the time: `npm test > test.log 2>&1`, `cmd 2>/dev/null`, `build 2>&1 | tail -n 50`. If you don't know the symbols, it's hard to tell where the output went, or why a file you had is suddenly empty.

## How it works

Every program starts with three numbered streams:

- **0, stdin:** where it reads input from. Usually your keyboard.
- **1, stdout:** normal output.
- **2, stderr:** errors and warnings.

Both outputs go to the terminal unless you redirect them, so they look like one stream. Redirections are processed left to right, before the program starts:

- `> file` points stdout at a file and empties it first. `>> file` appends instead.
- `2> file` does the same for stderr.
- `2>&1` points stderr wherever stdout points **at that moment**. That's why `> file 2>&1` catches both, and `2>&1 > file` doesn't.
- `| next` connects stdout to the next program's stdin. Add `2>&1` before the `|` to send errors through too.
- `/dev/null` is a special file that throws away everything written to it.
