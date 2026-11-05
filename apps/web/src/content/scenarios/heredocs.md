---
number: 31
title: "Heredocs: cat <<'EOF' > file"
quote: "My agent wrote a whole file with cat <<'EOF' > .env.example, then a few lines, then EOF. How does that work, and why the quotes?"
module: decode-agent-commands
severity: modifies
primaryCommand: |-
  cat <<'EOF' > .env.example
  DATABASE_URL=postgres://app:CHANGE_ME@db:5432/shop
  STRIPE_SECRET_KEY=
  EOF
symptoms:
  - heredoc
  - here document
  - "<<EOF"
  - "<<'EOF'"
  - cat EOF
  - write a file from the terminal
  - multi-line text into a file
  - "> prompt after command"
  - "here-document delimited by end-of-file"
  - variables expanded in heredoc
  - "sudo cat > file permission denied"
  - "tee <<EOF"
before:
  kind: zones
  title: Several lines, one command
  caption: "Everything between the first line and the closing `EOF` is fed to `cat` as if you'd typed it."
  zones:
    - title: What you send
      items:
        - { text: "cat <<'EOF' > .env.example", tone: focus, note: "start, and where it goes" }
        - { text: "DATABASE_URL=postgres://app:CHANGE_ME@db:5432/shop", tone: base }
        - { text: "STRIPE_SECRET_KEY=", tone: base }
        - { text: "EOF", tone: focus, note: "end marker, alone on its line" }
after:
  kind: zones
  title: A new file with exactly those lines
  caption: "`cat` copies its input to its output, and `> .env.example` sends that into the file."
  zones:
    - title: .env.example
      items:
        - { text: "DATABASE_URL=postgres://app:CHANGE_ME@db:5432/shop", tone: good }
        - { text: "STRIPE_SECRET_KEY=", tone: good }
steps:
  - title: Write a file with a heredoc
    kind: modifies
    command: |-
      cat <<'EOF' > .env.example
      # Copy to .env and fill in
      DATABASE_URL=postgres://app:CHANGE_ME@db:5432/shop
      STRIPE_SECRET_KEY=
      HOME_DIR=$HOME
      EOF
    note: "Typed at a prompt, bash shows `>` at the start of each line until you type the closing `EOF`. Nothing is printed: `cat`'s output went into the file."
  - title: Quoted EOF keeps the text exactly
    kind: readonly
    command: cat .env.example
    output: |
      # Copy to .env and fill in
      DATABASE_URL=postgres://app:CHANGE_ME@db:5432/shop
      STRIPE_SECRET_KEY=
      HOME_DIR=$HOME
    note: "`$HOME` is still `$HOME`. The quotes in `<<'EOF'` work like single quotes for the whole block: no variables, no `$(…)`, no backticks."
  - title: Unquoted EOF expands
    kind: readonly
    command: |-
      cat <<EOF
      User: $USER
      Home: $HOME
      awk: $(readlink -f "$(which awk)")
      Price: \$5
      EOF
    output: |
      User: jd
      Home: /home/jd
      awk: /usr/bin/mawk
      Price: $5
    note: "Without quotes the block behaves like a double-quoted string: variables and `$(…)` are filled in, and `\\$` keeps a literal dollar sign. With no `>`, the result is printed."
  - title: Append instead of replacing
    kind: modifies
    command: |-
      cat <<'EOF' >> .gitignore
      .env
      *.bak
      EOF
    note: "Same rule as anywhere else: `>` replaces the file, `>>` adds to the end."
  - title: "See it while you write it: tee"
    kind: modifies
    command: |-
      tee README.md <<'EOF'
      # Shop
      Run `npm test` before pushing.
      EOF
    output: |
      # Shop
      Run `npm test` before pushing.
    note: "`tee` writes its input to the file and also prints it, so you see what went in. The quoted `'EOF'` matters here: unquoted, the backticks would have run `npm test`."
replay:
  context: "The same README with an unquoted EOF."
  commands:
    - { line: "$ cat <<EOF > README.md", type: input }
    - { line: "> # Shop", type: output }
    - { line: "> Run `npm test` before pushing.", type: output }
    - { line: "> EOF", type: output }
    - { line: "✗ checkout returns 200", type: output }
    - { line: "  expected 200, got 500: Stripe: No API key provided", type: output }
    - { line: "$ cat README.md", type: input }
    - { line: "# Shop", type: output }
    - { line: "Run ", type: output }
    - { line: "> shop@1.0.0 test", type: output }
    - { line: "> node test.js", type: output }
    - { line: "", type: output }
    - { line: "✓ cart adds items", type: output }
    - { line: "✓ cart totals include tax", type: output }
    - { line: "2 passed, 1 failed before pushing.", type: output }
cautions:
  - type: caution
    text: "Quote the marker (`<<'EOF'`) unless you want expansion. Unquoted, every `$VAR`, `$(…)` and backtick inside is run or replaced while the file is written. That breaks scripts and config files that are meant to contain them, and it runs commands you only meant to write down."
  - type: caution
    text: "The closing `EOF` must be alone on its line, with no spaces before or after it. An indented `  EOF` isn't recognised, so bash keeps reading: at a prompt you see `>` forever (Ctrl+D ends it with `warning: here-document at line 1 delimited by end-of-file (wanted 'EOF')`), and in a script the rest of the file ends up inside the heredoc."
  - type: caution
    text: "`sudo cat <<'EOF' > /etc/…` fails with `Permission denied`: the `>` is opened by your own shell before `sudo` starts. Use `sudo tee /etc/… <<'EOF'` (add `> /dev/null` to skip the echo). That's a system change, so read the block before running it."
avoid:
  - "`EOF` is only a convention. Any word works (`<<'END'`, `<<'JSON'`), as long as the closing line matches exactly."
  - "`<<-EOF` strips leading tabs (not spaces) from each line and from the closing marker, so a heredoc can be indented inside a script."
  - "Heredocs feed any program's stdin, not just `cat`: `python3 <<'EOF'` runs a Python snippet, `ssh server <<'EOF'` runs commands on another machine."
  - "For one line, `echo \"text\" > file` or `printf '%s\\n' \"text\" > file` is simpler."
related: [redirection, expansion-quoting, command-chaining, curl-pipe-bash, root-owned-files]
concepts: [standard-streams]
anatomy:
  "<<": "Start a heredoc: the following lines, up to one that is exactly `EOF`, become cat's input. The quotes mean nothing inside is expanded."
  ".env.example": "Where the text goes. `>` creates the file, or replaces it if it exists."
---

## The situation

Agents write files without an editor. Instead of a dozen `echo … >>` lines, they send one command with the whole file inside it: a config, a script, a Dockerfile. It's called a **heredoc** (here-document), and it shows up in nearly every setup guide.

## How it works

`<<WORD` tells the shell: "the lines that follow, up to a line that is exactly `WORD`, are this command's input." The program reads them on stdin, as if you'd typed them and pressed Ctrl+D.

- **`cat <<'EOF' > file`**: `cat` copies its input to its output, and `>` points the output at a file. The result is a file containing exactly those lines.
- **Quoted marker** (`<<'EOF'` or `<<"EOF"`): the text is taken literally, like single quotes.
- **Unquoted marker** (`<<EOF`): the text is expanded like a double-quoted string, so `$VAR`, `$(…)` and backticks are filled in first.

The redirection (`> file`, `>> file`) can go before or after the `<<'EOF'`: `cat > file <<'EOF'` is the same command.
