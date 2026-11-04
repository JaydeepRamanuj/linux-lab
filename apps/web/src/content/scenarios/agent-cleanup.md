---
number: 33
title: "Agent cleanup: rm -rf node_modules, mkdir -p and npx"
quote: "The agent wants to run rm -rf node_modules package-lock.json && npm install, then mkdir -p and a couple of npx commands. Which of these can I wave through?"
module: decode-agent-commands
severity: modifies
primaryCommand: rm -rf node_modules package-lock.json && npm install
symptoms:
  - rm -rf node_modules
  - is it safe to delete node_modules
  - delete package-lock.json
  - reinstall dependencies
  - npm ci vs npm install
  - mkdir -p
  - "mkdir: cannot create directory: No such file or directory"
  - what is npx
  - "Need to install the following packages"
  - "Ok to proceed? (y)"
  - npx tsc wrong package
  - "This is not the tsc command you are looking for"
  - rm -rf with empty variable
stateLabels: [Before the cleanup, After rm -rf node_modules && npm ci]
before:
  kind: zones
  title: A project with a confused node_modules
  caption: "`node_modules` is generated. `package.json` and `package-lock.json` are the source of truth."
  zones:
    - title: You wrote (keep)
      items:
        - { text: "package.json", tone: base, note: "what you depend on" }
        - { text: "package-lock.json", tone: base, note: "exact versions" }
        - { text: "src/", tone: base }
    - title: Generated (safe to delete)
      items:
        - { text: "node_modules/", tone: caution, note: "4.5M, 68 packages" }
after:
  kind: zones
  title: Rebuilt from the lockfile
  caption: "Same versions as before, freshly installed. Nothing you wrote was touched."
  zones:
    - title: You wrote (kept)
      items:
        - { text: "package.json", tone: good }
        - { text: "package-lock.json", tone: good, note: unchanged }
        - { text: "src/", tone: good }
    - title: Generated
      items:
        - { text: "node_modules/", tone: good, note: "68 packages, reinstalled" }
steps:
  - title: Make sure you're in the project
    kind: readonly
    command: ls
    output: |
      node_modules  package-lock.json  server.js  test.js
      notes.txt     package.json       src
    note: "`rm -rf` with a relative path deletes from wherever you are. You want to see `package.json` next to `node_modules` before you delete anything."
  - title: See what you're deleting
    kind: readonly
    command: du -sh node_modules
    output: |
      4.5M	node_modules
    note: "Only downloaded packages live here. Real projects are often hundreds of megabytes, which is why `rm -rf` (no questions, no trash) is the normal way to remove it."
  - title: Delete node_modules
    kind: modifies
    command: rm -rf node_modules
    note: "No output. `-r` goes into folders, `-f` doesn't ask. This is safe because `npm` can rebuild it exactly. Notice what's missing: `package-lock.json` stays."
  - title: Reinstall exactly what the lockfile says
    kind: modifies
    command: npm ci
    output: |2

      added 68 packages, and audited 69 packages in 491ms

      found 0 vulnerabilities
    note: "`npm ci` installs the versions in `package-lock.json` and nothing else. It also deletes `node_modules` first, so on its own it does the whole cleanup. `npm install` would also work, but may update the lockfile."
  - title: "mkdir -p for nested folders"
    kind: modifies
    command: mkdir -p src/components/ui
    note: "Without `-p`, this fails with `mkdir: cannot create directory 'src/components/ui': No such file or directory`, because `src/components` doesn't exist yet. `-p` creates each missing parent, and says nothing if the folder is already there. That's why agents always add it."
  - title: "npx runs a package's command"
    kind: modifies
    command: npx tsc --noEmit
    output: |
      Need to install the following packages:
      tsc@2.0.4
      Ok to proceed? (y) n

      npm error canceled
    note: "`npx NAME` runs `node_modules/.bin/NAME` if the project has it. If not, it offers to download a package called NAME from npm and run it. Here that's the wrong one: the `tsc` package is a deprecated stub that only prints \"This is not the tsc command you are looking for\". The compiler lives in the `typescript` package. Answer `n` when the name in the prompt isn't what you expected."
  - title: Install the right package, then npx uses it
    kind: modifies
    command: npm install --save-dev typescript
    output: |2

      added 2 packages, and audited 71 packages in 2s

      found 0 vulnerabilities
    note: "Now `typescript` is in `package.json`, and it put a `tsc` command in `node_modules/.bin`. `npx tsc --noEmit` runs that one, with no prompt."
  - title: See what npx can run without downloading
    kind: readonly
    command: ls node_modules/.bin
    output: |
      mime  tsc
    note: "Every command your installed packages provide. If the name is here, `npx` uses it. If not, `npx` goes to the npm registry."
replay:
  context: "An agent's cleanup script uses a variable for the folder. Before letting it run, swap rm for echo to see the real command."
  commands:
    - { line: "$ echo rm -rf \"$OUT_DIR/\"", type: input }
    - { line: "rm -rf /", type: output }
    - { line: "$ echo rm -rf \"${OUT_DIR:?}/\"", type: input }
    - { line: "bash: OUT_DIR: parameter null or not set", type: output }
    - { line: "$ OUT_DIR=dist", type: input }
    - { line: "$ rm -rf \"${OUT_DIR:?}/\"", type: input }
cautions:
  - type: danger
    text: "`rm -rf \"$OUT_DIR/\"` with an empty or unset `OUT_DIR` is `rm -rf /`. Modern `rm` refuses `/` itself, but `\"$OUT_DIR\"/*` has no such guard. Write `${OUT_DIR:?}` so the shell stops when the variable is empty, as in the replay. Also check spaces: `rm -rf node_modules /` is two targets, and the second is the whole disk."
  - type: caution
    text: "Deleting `package-lock.json` isn't cleanup. Without it, `npm install` picks the newest versions `package.json` allows, so you can end up with different dependencies than everyone else on the project. Delete `node_modules` and run `npm ci`. Remove the lockfile only when you mean to re-resolve everything, and review the diff afterwards."
avoid:
  - "`npx --yes` (or `-y`) answers the install prompt for you. Agents add it so they don't get stuck, which also means a mistyped package name gets downloaded and run. Check the name when an agent uses `-y`."
  - "`npx create-vite@latest` and similar always download the newest release. That's intended for project generators, which you run once."
  - "`npm cache clean --force` is rarely needed. npm checks its cache, so deleting `node_modules` fixes almost everything a cache wipe would."
  - "`mkdir -p` never complains, so a typo like `src/compnents` quietly creates a second folder. Run `ls src` after."
related: [expansion-quoting, find-exec-xargs, disk-full, env-vars, command-chaining]
anatomy:
  "node_modules": "Downloaded dependencies. Generated by npm, safe to delete."
  "package-lock.json": "The exact version of every dependency. Deleting it means `npm install` re-resolves them all."
  "install": "`npm install` installs dependencies. Without a lockfile, it picks the newest allowed versions and writes a new one."
---

## The situation

When a build or install misbehaves, agents reach for the same reset: delete `node_modules`, maybe `package-lock.json`, reinstall, create any missing folders with `mkdir -p`, then run tools through `npx`. Most of it is harmless, but each piece has one way to go wrong.

## How it works

**`rm -rf` on generated folders.** `node_modules`, `dist`, `build`, `.next` and `coverage` are rebuilt by your tools, so deleting them loses nothing. ShellGyan rates `rm -rf node_modules` as modifies for that reason. What makes `rm -rf` dangerous is the target: `~`, `/`, `..`, or a variable that turns out to be empty. Read the path, not the flags.

**`npm ci` vs `npm install`.** `package-lock.json` records the exact version of every package. `npm ci` installs exactly those and fails if the lockfile and `package.json` disagree. `npm install` resolves versions again where it needs to and may rewrite the lockfile.

**`mkdir -p`** creates the folder and every missing parent, and succeeds if it already exists. It's safe to run twice, which is why scripts use it.

**`npx NAME`** looks for `NAME` in the project's `node_modules/.bin`, then on your `PATH` (globally installed tools). If it isn't found, it offers to download the npm package called `NAME` into a cache and run it. The command and the package don't always share a name (`tsc` comes from `typescript`), so a missing dependency can lead you to an unrelated package.
