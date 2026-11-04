---
number: 34
title: "Environment variables and .env: export, env and VAR=x cmd"
quote: "The agent ran PORT=4000 npm run dev and it worked. Then echo $PORT printed nothing, and my .env file seems to be ignored. Where do these variables live?"
module: decode-agent-commands
severity: modifies
primaryCommand: PORT=4000 npm run dev
symptoms:
  - environment variables
  - "VAR=value command"
  - PORT=4000 npm run dev
  - export not working
  - variable not set in child process
  - echo $VAR prints nothing
  - list environment variables
  - env command
  - .env file not loaded
  - load .env into shell
  - "set -a"
  - "export $(cat .env | xargs)"
  - "not a valid identifier"
  - sudo loses environment variables
stateLabels: [PORT=4000 npm run dev, export PORT=4000]
before:
  kind: zones
  title: Set for one command
  caption: "`PORT=4000` in front of a command goes into that command's environment only. Your shell never keeps it."
  zones:
    - title: Your shell
      empty: "No PORT"
      items: []
    - title: npm run dev
      items:
        - { text: "PORT=4000", tone: good, note: "for this run" }
    - title: Next command
      empty: "No PORT"
      items: []
after:
  kind: zones
  title: Exported from the shell
  caption: "`export` keeps it in your shell and passes it to every program you start from it, until you close the terminal."
  zones:
    - title: Your shell
      items:
        - { text: "PORT=4000", tone: focus, note: exported }
    - title: npm run dev
      items:
        - { text: "PORT=4000", tone: good, note: inherited }
    - title: Next command
      items:
        - { text: "PORT=4000", tone: good, note: inherited }
steps:
  - title: Nothing set yet
    kind: readonly
    command: 'echo "PORT is: $PORT"'
    output: |
      PORT is: 
    note: "An unset variable expands to nothing, with no error. The server falls back to its default, 3000."
  - title: Set it for one command
    kind: modifies
    command: PORT=4000 npm run dev
    output: |2

      > shop@1.0.0 dev
      > node server.js

      Listening on http://localhost:4000
    note: "`NAME=value` before a command puts the variable into that program's environment, and into everything it starts (`npm` → `node server.js`). Node reads it as `process.env.PORT`."
  - title: It didn't stick
    kind: readonly
    command: 'echo "PORT is: $PORT"'
    output: |
      PORT is: 
    note: "That's the point of the one-command form: it can't leak into anything else you run later."
  - title: A shell variable isn't passed on
    kind: readonly
    command: "PORT=4000; bash -c 'echo \"child sees: $PORT\"'"
    output: |
      child sees: 
    note: "With `;` after it, `PORT=4000` is a plain shell variable. Your shell has it (`echo $PORT` prints 4000), but the programs it starts don't. `bash -c` starts a new program, like `npm` would."
  - title: export passes it on
    kind: readonly
    command: "export PORT=4000; bash -c 'echo \"child sees: $PORT\"'"
    output: |
      child sees: 4000
    note: "`export` marks the variable for the environment, so every program started from this terminal gets a copy. A copy: a program can't change your shell's variables, and other terminals never see it."
  - title: List what's exported
    kind: readonly
    command: env | grep -E '^(PORT|HOME|USER)='
    output: |
      PORT=4000
      HOME=/home/jd
      USER=jd
    note: "`env` alone prints the whole environment, one `NAME=value` per line, in no particular order. Filter it with `grep`: it often holds tokens and keys."
  - title: A .env file is just a text file
    kind: readonly
    command: cat .env
    output: |
      PORT=4000
      DATABASE_URL=postgres://app:devpass@localhost:5432/shop
      STRIPE_SECRET_KEY=sk_test_51Hx1234example
    note: "Neither the shell nor Node reads `.env` by itself. Frameworks (Next.js, Vite) and libraries (`dotenv`) load it when your app starts. Plain `node server.js` doesn't, which is why the server ignored it."
  - title: Load it into this shell
    kind: modifies
    command: set -a; source .env; set +a
    note: "`source` runs the file as shell commands, so each line sets a variable. `set -a` exports every variable set until `set +a`. After this, `env | grep -E '^(PORT|DATABASE_URL)='` shows both, and `npm run dev` listens on 4000."
replay:
  context: "The agent's first try at loading .env, after someone added APP_NAME=\"My Shop\" to it."
  commands:
    - { line: "$ export $(cat .env | xargs)", type: input }
    - { line: "$ echo \"APP_NAME=[$APP_NAME]\"", type: input }
    - { line: "APP_NAME=[My]", type: output }
    - { line: "$ set -a; source .env; set +a", type: input }
    - { line: "$ echo \"APP_NAME=[$APP_NAME]\"", type: input }
    - { line: "APP_NAME=[My Shop]", type: output }
cautions:
  - type: danger
    text: "`source .env` runs the file as shell code. A line like `API_KEY=$(curl …)` runs `curl` the moment you source it. That's fine for your own `.env`. Read a downloaded or shared one first, or load it with a library that only parses `NAME=value`."
  - type: caution
    text: "`export $(cat .env | xargs)` breaks on real files. A quoted value with a space is cut at the space (the replay: `My Shop` became `My`, and `Shop` was exported as a variable with no value), and a `# comment` line fails with `export: '#': not a valid identifier`. Use `set -a; source .env; set +a`, or `node --env-file=.env server.js` on Node 20.6 and later."
  - type: caution
    text: "`env` and `printenv` print secrets. Don't paste their full output into a chat, an issue or an agent's prompt. Filter for the names you need."
avoid:
  - "No spaces around `=`. `PORT = 4000` runs a program called `PORT` with two arguments."
  - "`sudo` starts with a clean environment, so `sudo npm run dev` doesn't see your exported `PORT`. `sudo PORT=4000 npm run dev` sets it for that run."
  - "To make a variable permanent, put the `export` line in `~/.bashrc`. See the PATH scenario. For project settings, `.env` is the better place."
  - "`unset PORT` removes it from this shell. `env -u PORT cmd` runs one command without it."
related: [add-to-path, expansion-quoting, exit-codes, agent-cleanup, redirection]
anatomy:
  "PORT=4000": "Sets PORT in the environment of this one command. Your shell doesn't keep it."
  "dev": "`npm run dev` runs the `dev` script from package.json. It, and everything it starts, sees PORT=4000."
---

## The situation

Agents set variables in three different ways: `PORT=4000 npm run dev`, `export NODE_ENV=production`, and a `.env` file. They behave differently, so a value that works in one command is missing in the next, and a `.env` file seems to do nothing.

## How it works

Every running program has an **environment**: a list of `NAME=value` pairs it got from whoever started it. Your shell also has its own **shell variables**, which only it can see.

- `NAME=value` on its own line sets a shell variable. Programs you start don't get it.
- `export NAME=value` sets it and marks it for the environment. Every program you start from now on gets a copy.
- `NAME=value command` puts it into the environment of that one command only.

Copies only flow downward. A program can't change its parent's environment, which is why a script that runs `export` doesn't change your terminal (use `source` for that), and why a variable set in one terminal isn't in another.

`.env` files are a convention of app frameworks, not of the shell. Your app's code, or a library like `dotenv`, reads the file at startup. If a tool says a variable is missing, check whether that tool loads `.env` at all.
