---
number: 32
title: "curl -fsSL … | bash: What Are You Running?"
quote: "The agent says to install nvm with curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash. Is that safe to paste?"
module: decode-agent-commands
severity: elevated
primaryCommand: curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
symptoms:
  - curl pipe bash
  - "curl | sh"
  - is curl bash safe
  - install script from the internet
  - what does -fsSL mean
  - read a script before running it
  - install nvm
  - "sudo -E bash -"
  - setup_22.x
  - download script and run it
  - bash -n syntax check
  - install script changed my .bashrc
stateLabels: ["curl … | bash", "Download, read, then run"]
before:
  kind: zones
  title: The script goes straight into bash
  caption: "`curl` downloads the text and `bash` runs each line as it arrives. Nothing is saved and nothing is shown."
  zones:
    - title: curl
      items:
        - { text: "install.sh, 495 lines", tone: base, note: "from the internet" }
    - title: You see
      empty: Nothing until it has run
      items: []
    - title: bash runs
      items:
        - { text: "git clone … ~/.nvm", tone: caution }
        - { text: "append to ~/.bashrc", tone: caution }
        - { text: "anything else in the file", tone: bad }
after:
  kind: zones
  title: The script is a file you can read
  caption: "Same script, same result, but you know what it does before you run it, and you can run it again later."
  zones:
    - title: Saved
      items:
        - { text: "install.sh", tone: good, note: "in the current folder" }
    - title: You checked
      items:
        - { text: "no sudo, nothing in /etc", tone: good }
        - { text: "clones into ~/.nvm", tone: good }
        - { text: "two lines added to ~/.bashrc", tone: good }
    - title: Then
      items:
        - { text: "bash install.sh", tone: focus }
steps:
  - title: Download it to a file instead
    kind: modifies
    command: curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh -o install.sh
    note: "Same URL, but `-o install.sh` saves it instead of handing it to `bash`. `-f` makes `curl` fail on a 404 instead of saving the error page, `-sS` hides the progress bar but keeps errors, `-L` follows redirects."
  - title: Look at the top
    kind: readonly
    command: head -n 5 install.sh
    output: |
      #!/usr/bin/env bash

      { # this ensures the entire script is downloaded #

      nvm_has() {
    note: "`#!/usr/bin/env bash` says what it's written for. The `{` matters for `curl | bash`: if the download stops halfway, bash runs nothing instead of the first half. Good installers wrap everything like this, or in a function called on the last line."
  - title: Search for the parts that change things
    kind: readonly
    command: grep -nE 'sudo|/etc/|git clone|>> ' install.sh
    output: |
      166:      command git clone "$(nvm_source)" --depth=1 "${INSTALL_DIR}" || {
      448:      command printf "${SOURCE_STR}" >> "$NVM_PROFILE"
      455:      command printf "$COMPLETION_STR" >> "$NVM_PROFILE"
    note: "No `sudo` and nothing under `/etc/`. It clones nvm with git, then appends (`>>`) to your shell profile, which is `~/.bashrc` on Ubuntu. That's the whole footprint. Also worth searching for: `rm -`, `curl`, `eval`, `chmod`."
  - title: Read the rest
    kind: readonly
    command: less install.sh
    note: "Space pages down, `/` searches, `q` quits. You don't need to follow every line. Check the URLs it downloads from, where it writes, and whether it asks for root. Line numbers from the `grep` help: in `less`, type `448g` to jump there."
  - title: Check it parses
    kind: readonly
    command: bash -n install.sh
    note: "No output means no syntax errors. `-n` reads the script without running any of it. It won't catch anything harmful, but it does catch a download that was cut off or an HTML error page saved by mistake."
  - title: Run the file you read
    kind: elevated
    command: bash install.sh
    note: "Now it runs the same script you checked, from the file. ShellGyan rates `bash install.sh` as modifies, because it can't see inside. This step is elevated because you've read the script and know it edits `~/.bashrc`, which runs in every new terminal. It prints `=> Downloading nvm from git to '/home/jd/.nvm'` and `=> Appending nvm source string to /home/jd/.bashrc`."
  - title: See what it added
    kind: readonly
    command: tail -n 4 ~/.bashrc
    output: |2

      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
      [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    note: "Exactly what lines 448 and 455 promised. Open a new terminal (or `source ~/.bashrc`) and `command -v nvm` prints `nvm`. To undo, delete these lines and the `~/.nvm` folder."
replay:
  context: "The Node.js page suggests a different one-liner: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -. Same habit: save it, then search it."
  commands:
    - { line: "$ curl -fsSL https://deb.nodesource.com/setup_22.x -o setup_22.x", type: input }
    - { line: "$ grep -n '/etc/apt' setup_22.x", type: input }
    - { line: "60:    rm -f /etc/apt/sources.list.d/nodesource.list || true", type: output }
    - { line: "61:    rm -f /etc/apt/sources.list.d/nodesource.sources || true", type: output }
    - { line: "83:    cat <<EOF | tee /etc/apt/sources.list.d/nodesource.sources > /dev/null", type: output }
    - { line: "93:    echo \"Package: nsolid\" | tee /etc/apt/preferences.d/nsolid > /dev/null", type: output }
    - { line: "98:    echo \"Package: nodejs\" | tee /etc/apt/preferences.d/nodejs > /dev/null", type: output }
    - { line: "$ grep -nE '^\\s*if ! apt' setup_22.x", type: input }
    - { line: "46:    if ! apt update -y; then", type: output }
    - { line: "51:    if ! apt install -y apt-transport-https ca-certificates curl gnupg; then", type: output }
    - { line: "103:    if ! apt update -y; then", type: output }
    - { line: "$ sudo bash setup_22.x", type: input }
cautions:
  - type: danger
    text: "`| sudo bash` (or `| sudo -E bash -`) runs the whole download as root. That script can change anything on the machine, and you saw none of it. The NodeSource one above adds an apt repository, a signing key and two pin files, then runs `apt update`. That's normal for an installer, but you should know it's happening. Save it, read it, then run it with `sudo bash file`."
  - type: caution
    text: "Pin the version when you can. The nvm URL has `v0.40.1` in it, so it serves the same file every time. URLs like `…/install.sh` or `…/latest/…` can change between the day you read the script and the day you run it again."
avoid:
  - "`bash <(curl -fsSL URL)` and `sh -c \"$(curl -fsSL URL)\"` are the same thing written differently: the script still runs unseen."
  - "`curl -fsSL URL | bash -s -- --yes` passes `--yes` to the script. Check what flags the script accepts, because `--yes` usually skips its own questions."
  - "Paste a saved script into ShellGyan's Explain page for a first pass. It flags `sudo`, writes under `/etc` and `~/.bashrc`, and nested downloads. It can't tell you whether the site is trustworthy."
  - "Prefer your package manager (`apt install`, `brew`, `npm i -g`) when it has the program. Use the script when the project's own docs say to."
related: [heredocs, add-to-path, expansion-quoting, install-deb, command-chaining]
concepts: [standard-streams]
anatomy:
  "-fsSL": "Fail on HTTP errors, no progress bar, but show errors, follow redirects."
  "https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh": "The script. `v0.40.1` pins a version, so this URL always serves the same file."
  "bash": "Reads the script from the pipe and runs it as you. Nothing is saved, so you can't read it first."
---

## The situation

Install instructions and agents love one-liners: `curl -fsSL https://… | bash`, `curl -LsSf https://… | sh`, `curl -fsSL https://… | sudo -E bash -`. They work, and most of them are fine. But the pipe means the script runs as it downloads, without you seeing a line of it. With `sudo`, it runs as root.

## How it works

`curl URL` prints the file it downloads. `|` connects that output to `bash`'s input, and `bash` with no file name runs whatever it reads from input, line by line. So `curl … | bash` is "download a program and run it", with no file left behind.

The risk isn't the pipe itself. It's running code you haven't read, from a URL you're trusting:

- **What it does.** An installer usually downloads something, puts it in a folder, and adds a line to `~/.bashrc` so it's on your `PATH`. Some also add apt repositories or need root.
- **Where it comes from.** The script is whatever that URL serves today. A pinned version (`v0.40.1`) is more trustworthy than a moving `latest`.
- **A cut-off download.** If the connection drops, `bash` may run half a script. Well-written installers guard against this with `{ … }` or a `main` function called on the last line.

Saving to a file costs one extra command and gives you all three answers: `curl -o`, read it, `bash file`.
