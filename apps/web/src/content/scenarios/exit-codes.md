---
number: 35
title: "Exit Codes: $?, set -e and || true"
quote: "The agent ran npm test || true and said everything passed. The output shows a failed test. What does || true do, and how do I tell if a command actually worked?"
module: decode-agent-commands
severity: modifies
primaryCommand: npm test || true
symptoms:
  - exit code
  - "echo $?"
  - "what does || true mean"
  - command failed but script continued
  - set -e
  - "set -euo pipefail"
  - pipefail
  - PIPESTATUS
  - exit status 1
  - exit code 127
  - exit code 126
  - exit code 130
  - exit code 137
  - grep returns 1
  - script stops on first error
stateLabels: [npm test, npm test || true]
before:
  kind: zones
  title: The failure is reported
  caption: "`npm test` exits with 1 because a test failed. `&&` chains stop and CI marks the job red."
  zones:
    - title: npm test
      items:
        - { text: "2 passed, 1 failed", tone: bad }
    - title: "$?"
      items:
        - { text: "1", tone: bad, note: failure }
after:
  kind: zones
  title: The failure is swallowed
  caption: "`|| true` runs `true` when the test fails, and `true` always exits 0. The output still says failed; the exit code no longer does."
  zones:
    - title: npm test
      items:
        - { text: "2 passed, 1 failed", tone: bad }
    - title: "|| true"
      items:
        - { text: "runs true", tone: caution }
    - title: "$?"
      items:
        - { text: "0", tone: caution, note: "looks like success" }
steps:
  - title: 0 means success
    kind: readonly
    command: ls notes.txt; echo $?
    output: |
      notes.txt
      0
    note: "Every command ends with a number from 0 to 255. `$?` holds the last one. 0 is success; anything else is some kind of failure."
  - title: Anything else means it failed
    kind: readonly
    command: ls missing.txt; echo $?
    output: |
      ls: cannot access 'missing.txt': No such file or directory
      2
    note: "Each program picks its own non-zero codes. `ls` uses 2 for a missing file. `man ls` lists what each code means, under \"Exit status\"."
  - title: Not every non-zero is an error
    kind: readonly
    command: grep -q TODO src/app.js; echo $?
    output: |
      1
    note: "`grep` returns 1 for \"no match\" and 2 for a real error (like a missing file). `-q` prints nothing, so scripts use only the code: `if grep -q TODO src/app.js; then …`."
  - title: A failing test run exits 1
    kind: modifies
    command: npm test; echo $?
    output: |2

      > shop@1.0.0 test
      > node test.js

      ✓ cart adds items
      ✓ cart totals include tax
      ✗ checkout returns 200
        expected 200, got 500: Stripe: No API key provided
      2 passed, 1 failed
      1
    note: "Test runners exit 1 when any test fails. That's what CI checks, and what stops `npm test && git push`."
  - title: "|| true hides it"
    kind: modifies
    command: npm test || true; echo $?
    output: |2

      > shop@1.0.0 test
      > node test.js

      ✓ cart adds items
      ✓ cart totals include tax
      ✗ checkout returns 200
        expected 200, got 500: Stripe: No API key provided
      2 passed, 1 failed
      0
    note: "`||` runs the right side only when the left side fails. `true` does nothing and exits 0, so the whole line exits 0. Agents add it so a script keeps going. It's fine for a step that's allowed to fail (`rm old.log || true`), but not for tests."
  - title: A pipe reports the last command
    kind: modifies
    command: npm test 2>/dev/null | tail -n 1; echo "${PIPESTATUS[@]}"
    output: |
      2 passed, 1 failed
      1 0
    note: "`$?` after a pipe is the last command's code, here `tail`'s 0. `PIPESTATUS` holds one code per command in the last pipeline: `npm test` exited 1, `tail` exited 0. Read it right after the pipe, because the next command replaces it."
  - title: "set -e: stop at the first failure"
    kind: readonly
    command: bash -ec 'ls missing.txt; echo "after ls"'; echo $?
    output: |
      ls: cannot access 'missing.txt': No such file or directory
      2
    note: "`-e` (as in `set -e` at the top of a script) makes bash exit as soon as a command fails, with that command's code. `after ls` never runs. Without `-e`, scripts carry on after errors."
  - title: "|| true opts one command out"
    kind: readonly
    command: bash -ec 'ls missing.txt || true; echo "after ls"'; echo $?
    output: |
      ls: cannot access 'missing.txt': No such file or directory
      after ls
      0
    note: "This is why agents write `|| true` in scripts that use `set -e`: a failure followed by `||` doesn't stop the script. Check what it's attached to before accepting it."
replay:
  context: "A CI script starts with set -euo pipefail. Here's what pipefail changes for a piped test run."
  commands:
    - { line: "$ npm test 2>/dev/null | tail -n 1; echo $?", type: input }
    - { line: "2 passed, 1 failed", type: output }
    - { line: "0", type: output }
    - { line: "$ set -o pipefail", type: input }
    - { line: "$ npm test 2>/dev/null | tail -n 1; echo $?", type: input }
    - { line: "2 passed, 1 failed", type: output }
    - { line: "1", type: output }
cautions:
  - type: caution
    text: "`cmd || true` and `cmd 2>/dev/null || true` turn every failure into success, including ones you'd want to know about. When an agent reports \"all green\", look for `|| true` on the test, lint or type-check line, and read the output above the exit code."
  - type: caution
    text: "Don't run `set -e` in your interactive terminal. The first command that fails closes the whole terminal. Use it in scripts, or try it inside `bash -ec '…'` as above."
avoid:
  - "Codes worth knowing: 1 general failure, 2 misuse or missing file, 126 found but not executable (`Permission denied`), 127 command not found, 130 stopped with Ctrl+C, 137 killed with SIGKILL (often out of memory). Above 128 means \"killed by signal (code − 128)\"."
  - "`set -u` makes an unset variable an error instead of an empty string, which catches typos like `$PROT`. `set -o pipefail` makes a pipe fail if any part fails. `set -euo pipefail` is all three."
  - "`if cmd; then … fi` and `cmd && next` test the exit code, not the output. A program that prints \"error\" but exits 0 counts as success."
  - "`exit 3` ends a script with code 3. `bash -c 'exit 3'; echo $?` prints `3`."
related: [command-chaining, redirection, env-vars, expansion-quoting]
anatomy:
  "test": "`npm test` runs the test script. It exits 1 if any test fails."
  "||": "Run the next command only if the previous one failed (non-zero exit code)."
  "true": "Does nothing and exits 0. After `||` it turns the failure into success."
---

## The situation

Agents chain commands with `&&` and `||`, end lines with `|| true`, and start scripts with `set -euo pipefail`. All of them depend on one number every command returns when it finishes. If you don't check it, a failed step can look like it worked.

## How it works

When a program ends, it returns an **exit code** (exit status) to the shell: 0 for success, 1–255 for failure. The output is for you; the code is for the shell and for scripts.

- `$?` holds the last command's code. Any command, even `echo`, replaces it.
- `a && b` runs `b` only if `a` exited 0. `a || b` runs `b` only if `a` didn't.
- `if a; then …` branches on `a`'s code.
- A pipeline's code is the last command's, unless `set -o pipefail` is on. `PIPESTATUS` has all of them.
- `set -e` exits a script at the first failing command, except where the failure is tested: in `if`, or before `&&` or `||`.

So `npm test || true` reads: "run the tests, and if they fail, run `true` instead". The line's code is always 0. The only record of the failure is the output.
