---
number: 19
title: Find Files by Name or Content
quote: "I downloaded an invoice last month and I can't find it. And somewhere in this project there's code that reads STRIPE_SECRET_KEY."
module: files-permissions
severity: readonly
primaryCommand: find ~ -iname "*invoice*"
symptoms:
  - find a file
  - where is my file
  - search by name
  - search file contents
  - which file contains
  - find text in files
  - grep -r
  - ripgrep
  - rg
  - locate
  - "find: paths must precede expression"
before:
  kind: zones
  title: Somewhere in here
  caption: You know part of the name, or a word that's inside the file, but not where it is.
  zones:
    - title: ~ (home)
      items:
        - { text: "Documents/  Downloads/  Pictures/  projects/", tone: base }
        - { text: "invoice…?", tone: ghost, note: "name, any case" }
    - title: ~/projects/shop
      items:
        - { text: "src/  scripts/  node_modules/", tone: base }
        - { text: "STRIPE_SECRET_KEY…?", tone: ghost, note: "inside a file" }
after:
  kind: zones
  title: Found, with paths
  caption: "`find` matches names; `grep -r` and `rg` match what's inside the files."
  zones:
    - title: By name (find -iname)
      items:
        - { text: "Documents/taxes/2025/Invoice-Acme-0042.pdf", tone: good }
        - { text: "Downloads/invoice-2026-10.pdf", tone: good }
        - { text: "Downloads/INVOICE_hosting_sept.pdf", tone: good }
    - title: By content (rg)
      items:
        - { text: "src/payments/checkout.ts:3", tone: good }
        - { text: "scripts/seed.sh:2", tone: good }
        - { text: "node_modules/…", tone: ghost, note: skipped }
steps:
  - title: Find by name, any case
    kind: readonly
    command: find ~ -iname "*invoice*"
    output: |
      /home/jd/Documents/taxes/2025/Invoice-Acme-0042.pdf
      /home/jd/Downloads/invoice-2026-10.pdf
      /home/jd/Downloads/INVOICE_hosting_sept.pdf
      /home/jd/Pictures/invoice-template.odt
    note: "`*` matches anything, so this is \"any name containing invoice\". `-iname` ignores case; `-name` would have missed two of these."
  - title: Narrow it by type and date
    kind: readonly
    command: find ~/Downloads -name "*.pdf" -mtime -7
    output: |
      /home/jd/Downloads/invoice-2026-10.pdf
      /home/jd/Downloads/boarding-pass.pdf
    note: "PDFs modified in the last 7 days. `-mtime +30` would mean older than 30 days; `-size +100M` filters by size."
  - title: Search inside files
    kind: readonly
    command: grep -rn "STRIPE_SECRET_KEY" .
    output: |
      ./src/payments/checkout.ts:3:const key = process.env.STRIPE_SECRET_KEY;
      ./src/payments/checkout.ts:4:if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
      ./scripts/seed.sh:2:# Needs STRIPE_SECRET_KEY in .env
      ./node_modules/stripe/lib/stripe.js:1:module.exports = function (k) { if (!k) throw new Error('Pass STRIPE_SECRET_KEY'); };
      ./.env.example:1:STRIPE_SECRET_KEY=sk_test_replace_me
    note: "Run from the project folder. `-r` searches every file below `.`, `-n` adds line numbers. Each line reads `file:line:text`."
  - title: Skip node_modules
    kind: readonly
    command: grep -rn --exclude-dir=node_modules "STRIPE_SECRET_KEY" .
    output: |
      ./src/payments/checkout.ts:3:const key = process.env.STRIPE_SECRET_KEY;
      ./src/payments/checkout.ts:4:if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
      ./scripts/seed.sh:2:# Needs STRIPE_SECRET_KEY in .env
      ./.env.example:1:STRIPE_SECRET_KEY=sk_test_replace_me
    note: "In a real project, `node_modules` would bury your own code under thousands of matches. `-l` instead of `-n` prints only the file names."
  - title: "Or: the faster tool"
    kind: readonly
    command: rg -n STRIPE_SECRET_KEY
    output: |
      scripts/seed.sh
      2:# Needs STRIPE_SECRET_KEY in .env

      src/payments/checkout.ts
      3:const key = process.env.STRIPE_SECRET_KEY;
      4:if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    note: "ripgrep searches the current folder by default and skips whatever `.gitignore` lists, so `node_modules` is gone without asking. It also skips hidden files: `.env.example` is missing until you add `--hidden`. Install with `sudo apt install ripgrep`."
replay:
  context: "Forgetting the quotes, from inside ~/Downloads."
  commands:
    - { line: "$ cd ~/Downloads", type: input }
    - { line: "$ find ~ -name *invoice*", type: input }
    - { line: "/home/jd/Downloads/invoice-2026-10.pdf", type: output }
    - { line: "$ find ~ -name \"*invoice*\"", type: input }
    - { line: "/home/jd/Downloads/invoice-2026-10.pdf", type: output }
    - { line: "/home/jd/Pictures/invoice-template.odt", type: output }
cautions:
  - type: caution
    text: "Always quote the pattern: `\"*invoice*\"`. Unquoted, the shell expands `*invoice*` against the current folder first. Here it became `invoice-2026-10.pdf`, so `find` searched for that one name only. With two matches you get `find: paths must precede expression` instead."
  - type: caution
    text: "`rg` silently skips hidden and git-ignored files. If you know something is there and it doesn't show up, add `--hidden`, or `-uu` to search everything."
avoid:
  - "Searching from `/` prints a `Permission denied` line for every folder you can't read. Add `2>/dev/null` to hide them, or search your home folder instead."
  - "`locate invoice` answers instantly from a database that's rebuilt daily, so it misses files from today. On Ubuntu it's in the `plocate` package."
  - "To find files by name the fast way, `rg --files | rg -i invoice` lists every file in a project and filters the names."
  - "The file manager's search (Ctrl+F in GNOME Files) finds names too, and it's fine for one-off searches in your home folder."
related: [disk-full, command-chaining, safe-mv-cp, find-exec-xargs]
anatomy:
  "~": "Where to start: your home folder and everything below it."
  "-iname": "Match the file name, ignoring upper and lower case."
  "\"*invoice*\"": "Any name containing \"invoice\". The quotes stop the shell from expanding `*` before `find` sees it."
---

## The situation

You need a file and only half remember it: part of its name, roughly when you saved it, or a word that's inside it. Or you're in a codebase and need every place that uses a setting, a function or an error message.

## How it works

Searching by **name** and searching by **content** are different jobs:

- **`find`** walks a folder tree and tests each file's name, type, size or date. It never opens the files, so it's fast enough to run over your whole home folder.
- **`grep -r`** opens every file under a folder and prints the lines that match. **`rg`** (ripgrep) does the same, much faster, and skips what you almost never want to search: git-ignored folders like `node_modules`, hidden files and binaries.

Both only read. `find` can also act on what it finds (`-delete`, `-exec`), which is where it stops being read-only, so run it without those first and check the list.
