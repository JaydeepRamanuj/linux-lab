---
number: 30
title: "sed -i 's/a/b/g' and awk '{print $2}'"
quote: "We moved Postgres into Docker, and my agent ran sed -i 's/localhost:5432/db:5432/g' .env. Later it used awk '{print $2}' on a log. What do these do?"
module: decode-agent-commands
severity: modifies
primaryCommand: sed -i 's/localhost:5432/db:5432/g' .env
symptoms:
  - sed find and replace
  - "sed -i"
  - "s/old/new/g"
  - replace text in a file from the terminal
  - "sed: unknown option to `s'"
  - "sed: can't read s/…: No such file or directory"
  - awk print column
  - "awk '{print $2}'"
  - print one column
  - split lines into fields
  - "sed -i '' on Linux"
  - backup before sed
stateLabels: [Before, After sed -i]
before:
  kind: zones
  title: The app still points at localhost
  caption: "Postgres now runs in a container called `db`, so the database line in `.env` is wrong."
  zones:
    - title: .env
      items:
        - { text: "DATABASE_URL=postgres://app:secret@localhost:5432/shop", tone: bad, note: "needs db" }
        - { text: "REDIS_URL=redis://localhost:6379", tone: base, note: "stays local" }
        - { text: "STRIPE_SECRET_KEY=sk_test_51abc", tone: base }
        - { text: "PORT=3000", tone: base }
after:
  kind: zones
  title: One line changed, in place
  caption: "`sed -i` rewrote the file. Only text matching `localhost:5432` changed."
  zones:
    - title: .env
      items:
        - { text: "DATABASE_URL=postgres://app:secret@db:5432/shop", tone: good, note: changed }
        - { text: "REDIS_URL=redis://localhost:6379", tone: base, note: untouched }
        - { text: "STRIPE_SECRET_KEY=sk_test_51abc", tone: base }
        - { text: "PORT=3000", tone: base }
steps:
  - title: See which lines match
    kind: readonly
    command: grep -n "localhost:5432" .env
    output: |
      1:DATABASE_URL=postgres://app:secret@localhost:5432/shop
    note: "One line. That's the most `sed` can change with this pattern."
  - title: "Preview: sed without -i"
    kind: readonly
    command: sed 's/localhost:5432/db:5432/g' .env
    output: |
      DATABASE_URL=postgres://app:secret@db:5432/shop
      REDIS_URL=redis://localhost:6379
      STRIPE_SECRET_KEY=sk_test_51abc
      PORT=3000
    note: "Without `-i`, `sed` prints the edited text and leaves the file alone. This is exactly what `-i` would write."
  - title: Apply it, with a backup
    kind: modifies
    command: sed -i.bak 's/localhost:5432/db:5432/g' .env
    note: "`-i` writes the result back into `.env`. `.bak` straight after it (no space) keeps the original as `.env.bak`. Plain `-i`, as the agent ran it, keeps nothing."
  - title: Check before and after
    kind: readonly
    command: grep -n "5432" .env .env.bak
    output: |
      .env:1:DATABASE_URL=postgres://app:secret@db:5432/shop
      .env.bak:1:DATABASE_URL=postgres://app:secret@localhost:5432/shop
    note: "Delete `.env.bak` once the app works. Until then, `mv .env.bak .env` is the undo."
  - title: "What the g does"
    kind: readonly
    command: echo "localhost:5432 and localhost:6379" | sed 's/localhost/db/'
    output: |
      db:5432 and localhost:6379
    note: "Without `g`, only the first match on each line is replaced. With `s/localhost/db/g` the output is `db:5432 and db:6379`."
  - title: "awk: print one column"
    kind: readonly
    command: awk '{print $2}' logs/app.log
    output: |
      INFO
      ERROR
      INFO
      INFO
      WARN
      ERROR
      INFO
    note: "awk splits each line at spaces into fields: `$1` is the time, `$2` the level, `$3` the method. The single quotes keep the shell from replacing `$2` itself."
  - title: "awk: only some lines"
    kind: readonly
    command: awk '$2 == "ERROR" {print $1, $4}' logs/app.log
    output: |
      08:20:03 /api/checkout
      08:20:06 /api/checkout
    note: "A condition before the `{…}` picks the lines; the block says what to print. The comma prints a space between fields."
  - title: "awk: a different separator"
    kind: readonly
    command: awk -F= '{print $1}' .env
    output: |
      DATABASE_URL
      REDIS_URL
      STRIPE_SECRET_KEY
      PORT
    note: "`-F=` splits at `=` instead of spaces. You get the variable names without their values, which is safe to paste into a chat or an issue."
replay:
  context: "A broader pattern, run over the whole src folder."
  commands:
    - { line: "$ grep -rl \"localhost\" src | xargs sed -i 's/localhost/db/g'", type: input }
    - { line: "$ grep -rn '\"http' src", type: input }
    - { line: "src/config.ts:1:export const API_URL = \"http://db:3000\";", type: output }
    - { line: "(the API runs on this machine, not in the db container)", type: input }
cautions:
  - type: caution
    text: "`sed -i` has no undo, and with `xargs` or `find -exec` it edits every file in the list. Run the same `sed` without `-i` first, use the narrowest pattern that works (`localhost:5432`, not `localhost`), and commit or add `.bak` before editing many files."
  - type: caution
    text: "The pattern is a regular expression. `.` matches any character, so `s/1.0/2.0/` turns `version 100` into `version 2.0`. Write `1\\.0` for a literal dot."
avoid:
  - "A `/` in the text ends the pattern early: `s/usr/local/opt/` fails with `unknown option to s`. Pick another separator: `s|/usr/local|/opt|`."
  - "Instructions written for macOS use `sed -i '' …`. On Linux that `''` becomes the script, and you get `can't read s/…/…/: No such file or directory`. Use `-i` or `-i.bak`."
  - "Ubuntu's `awk` is `mawk`, which has no `-i inplace`. To change a file with awk, write to a new file and `mv` it over the old one."
  - "`sed -n '20,30p' file` prints lines 20 to 30; `sed '/^#/d' file` prints the file without comment lines. Neither touches the file."
related: [find-exec-xargs, find-files, redirection, watch-log]
concepts: [quoting-expansion]
anatomy:
  "-i": "In place: write the result back into the file. Without it, sed only prints."
  "'s/localhost:5432/db:5432/g'": "The script: substitute `localhost:5432` with `db:5432`, globally (every match on each line, not just the first)."
  ".env": "The file to edit."
---

## The situation

Agents use `sed` to change text in files without opening an editor, and `awk` to pull columns out of command output. Both use a tiny language in single quotes that's easy to skim past. With `-i`, `sed` rewrites files on disk.

## How it works

**`sed`** reads text line by line, runs its script on each line, and prints the result. The script you'll see most is `s/PATTERN/REPLACEMENT/FLAGS`:

- `PATTERN` is a regular expression, and `REPLACEMENT` is plain text (`&` means "what matched").
- `g` replaces every match on the line, not just the first.
- Any character can replace the `/`: `s|a|b|` and `s#a#b#` are the same command.

Without `-i`, the file is only read. With `-i`, sed writes its output to a new file and swaps it in for the original. With `-i.bak` it keeps the original under that suffix.

**`awk`** splits each line into fields and runs a small program on them. `'{print $2}'` means "for every line, print field 2". A condition in front (`$2 == "ERROR"`) limits it to matching lines, and `-F` changes what separates the fields. `awk` only reads, unless its program writes a file itself (`print > "out.txt"`) or runs a command (`system()`).
