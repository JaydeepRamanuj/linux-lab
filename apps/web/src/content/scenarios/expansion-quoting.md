---
number: 28
title: "Expansion and Quoting: $VAR, \"$VAR\" and $(…)"
quote: "The agent's script works until a file name has a space in it. It keeps telling me to \"quote the variable\". What difference do quotes make?"
module: decode-agent-commands
severity: readonly
primaryCommand: cat "$file"
symptoms:
  - quote variables
  - "\"$VAR\" vs $VAR"
  - single vs double quotes
  - "$(…)"
  - command substitution
  - variable not expanding
  - file name with spaces
  - "No such file or directory with spaces"
  - "${VAR}"
  - empty variable
  - word splitting
  - glob expansion
stateLabels: [cat $file, cat "$file"]
before:
  kind: zones
  title: Unquoted, split at the space
  caption: "The shell replaces `$file` with its value, then splits it at spaces. `cat` gets two arguments."
  zones:
    - title: "$file holds"
      items:
        - { text: "Q3 report.txt", tone: base }
    - title: cat receives
      items:
        - { text: "Q3", tone: bad, note: "No such file" }
        - { text: "report.txt", tone: bad, note: "No such file" }
after:
  kind: zones
  title: Quoted, one argument
  caption: "Inside double quotes the value is still filled in, but it stays in one piece."
  zones:
    - title: "$file holds"
      items:
        - { text: "Q3 report.txt", tone: base }
    - title: cat receives
      items:
        - { text: "Q3 report.txt", tone: good, note: "one file" }
steps:
  - title: "$VAR is replaced by its value"
    kind: readonly
    command: echo $HOME
    output: |
      /home/jd
    note: "Before `echo` runs, the shell swaps `$HOME` for the variable's value. `echo` never sees the `$`."
  - title: "Double quotes expand, single quotes don't"
    kind: readonly
    command: 'echo "Home: $HOME" && echo ''Home: $HOME'''
    output: |
      Home: /home/jd
      Home: $HOME
    note: "Use double quotes when you want the value, and single quotes when you mean the characters exactly as written, like a `sed` or `awk` script, or a password with `$` in it."
  - title: "$(…) is replaced by a command's output"
    kind: readonly
    command: echo "awk is really $(readlink -f "$(which awk)")"
    output: |
      awk is really /usr/bin/mawk
    note: "Command substitution. The shell runs the innermost command first (`which awk` → `/usr/bin/awk`), then `readlink -f` on that, then puts the result into the string. Quotes inside `$(…)` are separate from the ones outside, so nesting them like this is fine."
  - title: "Store a name with a space"
    kind: readonly
    command: file="Q3 report.txt"
    note: "No spaces around `=`. `file = \"…\"` would try to run a program called `file`."
  - title: "Unquoted: the value is split"
    kind: readonly
    command: cat $file
    output: |
      cat: Q3: No such file or directory
      cat: report.txt: No such file or directory
    note: "After expansion, the shell splits the value at spaces, so `cat` looks for two files. Neither exists."
  - title: "Quoted: one argument"
    kind: readonly
    command: cat "$file"
    output: |
      Revenue up 12%
      Churn down 3%
    note: "The rule of thumb: put double quotes around every `$VAR` and `$(…)` unless you know you want the splitting."
  - title: "Braces mark where the name ends"
    kind: readonly
    command: echo "[$file_backup]" && echo "[${file}_backup]"
    output: |
      []
      [Q3 report.txt_backup]
    note: "`$file_backup` is a different, unset variable, and an unset variable is silently empty. `${file}` says exactly where the name stops."
  - title: "Wildcards expand too, unless quoted"
    kind: readonly
    command: echo *.txt && echo "*.txt"
    output: |
      Q3 report.txt notes.txt todo.txt
      *.txt
    note: "Unquoted, `*.txt` becomes the list of matching file names before the program runs. That's why `find -name` patterns need quotes."
replay:
  context: "A loop over $(ls) splits names the same way."
  commands:
    - { line: "$ for f in $(ls); do echo \"[$f]\"; done", type: input }
    - { line: "[Q3]", type: output }
    - { line: "[report.txt]", type: output }
    - { line: "[notes.txt]", type: output }
    - { line: "[todo.txt]", type: output }
    - { line: "$ for f in *; do echo \"[$f]\"; done", type: input }
    - { line: "[Q3 report.txt]", type: output }
    - { line: "[notes.txt]", type: output }
    - { line: "[todo.txt]", type: output }
cautions:
  - type: danger
    text: "An unset or misspelled variable expands to nothing, without an error. `rm -rf \"$BUILD_DIR/\"` with `BUILD_DIR` unset becomes `rm -rf \"/\"`. Write `\"${BUILD_DIR:?}\"` to make the shell stop with an error instead, or `set -u` at the top of a script."
  - type: caution
    text: "Inside double quotes, `$`, backticks and `\\` still mean something. `echo \"Cost: $5\"` prints `Cost: ` because `$5` is an (empty) variable. Use single quotes, or escape it: `\"Cost: \\$5\"`."
avoid:
  - "Backticks (`` `cmd` ``) are the old spelling of `$(cmd)`. Same result, but they're hard to nest and easy to misread. Agents and modern scripts use `$(…)`."
  - "`~` only expands unquoted at the start of a word: `\"~/notes\"` is a folder literally named `~`. Use `\"$HOME/notes\"` inside quotes."
  - "To loop over files, use `for f in *` or `find … -print0`, not `$(ls)`. A glob gives each name as one piece."
  - "`printenv HOME` or `echo \"$HOME\"` shows a variable's value; `declare -p file` shows it with quotes, so trailing spaces are visible."
related: [redirection, command-chaining, find-files, heredocs, env-vars, agent-cleanup]
concepts: [pressing-enter, quoting-expansion]
anatomy:
  '"$file"': "The variable `file`, in double quotes: its value is filled in but stays one argument, spaces and all."
---

## The situation

Agent-written commands are full of `$VAR`, `"$VAR"`, `'…'` and `$(…)`. They usually work, until a value contains a space, a `*`, or nothing at all. Then a command that looked fine reads the wrong files, or `rm` gets a path you never meant.

## How it works

Before a command runs, the shell rewrites it. In order, the steps that matter:

1. **Expansion.** `$VAR` and `${VAR}` become the variable's value. `$(cmd)` runs `cmd` and becomes its output, with trailing newlines removed. `~` becomes your home folder.
2. **Word splitting.** Any expanded text that isn't inside double quotes is split at spaces, tabs and newlines into separate arguments.
3. **Globbing.** Unquoted words with `*`, `?` or `[…]` become the list of matching file names.

Quotes control the last two:

- **Double quotes** (`"…"`) allow step 1 but stop steps 2 and 3. The value is filled in and stays one argument.
- **Single quotes** (`'…'`) stop everything. What you typed is what the program gets.
- **No quotes:** all three steps happen.

The program only ever sees the final arguments. It can't tell whether you typed quotes or how many spaces there were.
