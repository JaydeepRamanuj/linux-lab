---
number: 5
title: "What &&, ||, ; and | Actually Do"
quote: "My agent ran npm run build && npm test || echo failed. What runs when?"
module: decode-agent-commands
severity: modifies
primaryCommand: npm run build && npm test || echo "failed"
symptoms:
  - "&&"
  - "||"
  - semicolon
  - pipe
  - chain commands
  - command chaining
  - what does && mean
  - exit code
stateLabels: [If the build fails, If everything passes]
before:
  kind: zones
  title: "build exits 1"
  caption: "`&&` skips the tests because the build failed; `||` then runs the echo."
  zones:
    - title: npm run build
      items:
        - { text: "exit 1", tone: bad, note: failed }
    - title: npm test
      items:
        - { text: skipped, tone: ghost, note: "&& needs success" }
    - title: echo "failed"
      items:
        - { text: runs, tone: caution, note: "|| runs on failure" }
after:
  kind: zones
  title: "all exit 0"
  caption: "Both succeed, so `||` has nothing to catch and the echo is skipped."
  zones:
    - title: npm run build
      items:
        - { text: "exit 0", tone: good }
    - title: npm test
      items:
        - { text: "exit 0", tone: good }
    - title: echo "failed"
      items:
        - { text: skipped, tone: ghost, note: "nothing failed" }
steps:
  - title: "&& runs the next command only on success"
    kind: modifies
    command: mkdir -p build && cd build
    note: "If `mkdir` fails, you don't end up running the next steps in the wrong folder."
  - title: "See it skip"
    kind: readonly
    command: false && echo "never printed"
    note: "`false` is a command that always fails. The echo doesn't run, and you see nothing."
  - title: "|| runs the next command only on failure"
    kind: readonly
    command: false || echo "runs because false failed"
    output: runs because false failed
  - title: "; runs the next command no matter what"
    kind: readonly
    command: false; echo "runs anyway"
    output: runs anyway
  - title: "| pipes output into the next command"
    kind: readonly
    command: ps aux | grep node
    output: |
      jd   48213  2.1  1.4 1203424 230112 pts/2  Sl+  09:14  0:12 node server.js
      jd   49002  0.0  0.0   9212   2304 pts/3  S+   09:31  0:00 grep node
    note: "`ps` prints every process; `grep` keeps the lines that mention node. Nothing touches a file: the data flows straight from one program to the next."
  - title: "Gotcha: a && b || c is not if/else"
    kind: modifies
    command: npm run build && npm test || echo "failed"
    note: "`echo` runs if the build fails, but also if the build passes and the tests fail. That's fine here, but for \"do X, otherwise do Y\" write a real `if`."
replay:
  context: The same chain, run once with a broken build and once after fixing it.
  commands:
    - { line: "$ npm run build && npm test || echo \"failed\"", type: input }
    - { line: "Error: Cannot find module './config'", type: output }
    - { line: "failed", type: output }
    - { line: "$ echo $?", type: input }
    - { line: "0", type: output }
    - { line: "(fix the import)", type: input }
    - { line: "$ npm run build && npm test || echo \"failed\"", type: input }
    - { line: "✓ Compiled successfully", type: output }
    - { line: "Tests: 42 passed, 42 total", type: output }
cautions:
  - type: caution
    text: "With `|| echo …` at the end the whole line exits 0, even when the build failed. CI and agents read that 0 as success. If something checks the exit code, drop the `|| echo`."
avoid:
  - "Read a chain left to right, and for each operator ask whether the previous command succeeded."
  - "`echo $?` prints the exit code of the last command. The exit codes scenario covers what the numbers mean, `|| true` and `set -e`."
related: [port-in-use, redirection, expansion-quoting, exit-codes]
concepts: [pressing-enter]
anatomy:
  '"failed"': "The text to print. Quoted, so it's passed as one argument."
---

## The situation

Coding agents chain commands constantly: `cd app && npm install`, `make || exit 1`, `cmd 2>&1 | tail`. The operators decide which commands actually run, and that matters most when something fails.

## How it works

Every command ends with an **exit code**: `0` means success, anything else means failure. The operators look only at that code:

- `a && b`: run `b` only if `a` succeeded.
- `a || b`: run `b` only if `a` failed.
- `a ; b`: run `b` after `a`, whatever happened. A newline works the same way.
- `a | b`: run both at the same time and send `a`'s output into `b`'s input. The pipeline's exit code is `b`'s.

They're evaluated left to right, and `&&` and `||` have equal priority. So `a && b || c` means "(`a && b`), and if that failed, `c`".
