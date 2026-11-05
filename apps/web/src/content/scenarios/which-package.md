---
number: 26
title: Which Package Gives Me This Command?
quote: "A guide says to run ifconfig, but I get command not found. What do I install? And where did rg come from?"
module: packages
severity: readonly
primaryCommand: apt-file search bin/ifconfig
symptoms:
  - which package provides a command
  - what package do I install for
  - "Command 'ifconfig' not found, but can be installed with"
  - ifconfig command not found
  - apt-file
  - which package owns this file
  - dpkg -S
  - "dpkg-query: no path found matching pattern"
  - where did this program come from
before:
  kind: zones
  title: Two questions
  caption: "A command you don't have, and one you have but can't place. Each has its own lookup."
  zones:
    - title: Not installed
      items:
        - { text: ifconfig, tone: bad, note: "command not found" }
    - title: Installed, origin unknown
      items:
        - { text: rg, tone: caution, note: "/usr/bin/rg, from where?" }
        - { text: awk, tone: caution, note: "/usr/bin/awk, from where?" }
after:
  kind: zones
  title: Answered
  caption: "apt-file searches every package in the archive. dpkg -S searches what's installed."
  zones:
    - title: Not installed
      items:
        - { text: ifconfig, tone: good, note: "in net-tools" }
    - title: Installed, origin unknown
      items:
        - { text: rg, tone: good, note: "from ripgrep" }
        - { text: awk, tone: good, note: "→ mawk, from mawk" }
steps:
  - title: Search every package for the file
    kind: readonly
    command: apt-file search bin/ifconfig
    output: "net-tools: /sbin/ifconfig"
    note: "`apt-file` searches a list of every file in every package in Ubuntu's archive, installed or not. Search for `bin/` plus the command name: a plain `apt-file search ifconfig` also matches man pages and Python files, 49 lines from 34 packages. One-time setup: `sudo apt install apt-file`, then `sudo apt-file update` to download the file lists (tens of MB)."
  - title: Check the package before installing
    kind: readonly
    command: apt show net-tools
    output: |
      Package: net-tools
      Version: 2.10-0.1ubuntu4.4
      Priority: optional
      Section: net
      Origin: Ubuntu
      …
      Download-Size: 204 kB
      APT-Sources: http://archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages
      Description: NET-3 networking toolkit
       This package includes the important tools for controlling the network
       subsystem of the Linux kernel.  This includes arp, ifconfig, netstat,
       rarp, nameif and route.  …
    note: "Make sure it's what you want: **Origin: Ubuntu** and a description that fits. Then `sudo apt install net-tools`. (For this one, the modern built-in replacement is `ip a`.)"
  - title: Which package installed a command you have?
    kind: readonly
    command: dpkg -S "$(which rg)"
    output: "ripgrep: /usr/bin/rg"
    note: "`which` prints the full path, and `dpkg -S` finds the installed package that owns that file. Give it the full path: `dpkg -S bin/rg` matches any path *containing* that text, so it also reports `grep: /usr/bin/rgrep`."
  - title: When dpkg -S finds nothing, follow the link
    kind: readonly
    command: dpkg -S "$(readlink -f "$(which awk)")"
    output: "mawk: /usr/bin/mawk"
    note: "`/usr/bin/awk` isn't a file any package owns. It's a link, managed by the **alternatives** system, to whichever awk is installed. `readlink -f` follows the links to the real program. If even the real path isn't found, the program didn't come from apt: anything in `/usr/local/bin` or `~/.local/bin` was installed by hand, by `pip`, or by `make install`."
replay:
  context: Ubuntu's own hint, and the alternatives link that confuses dpkg -S.
  commands:
    - { line: "$ ifconfig", type: input }
    - { line: "Command 'ifconfig' not found, but can be installed with:", type: output }
    - { line: "sudo apt install net-tools", type: output }
    - { line: "$ dpkg -S \"$(which awk)\"", type: input }
    - { line: "dpkg-query: no path found matching pattern /usr/bin/awk", type: output }
    - { line: "$ ls -l /usr/bin/awk", type: input }
    - { line: "lrwxrwxrwx 1 root root 21 Apr  8  2024 /usr/bin/awk -> /etc/alternatives/awk", type: output }
    - { line: "$ dpkg -S \"$(readlink -f \"$(which awk)\")\"", type: input }
    - { line: "mawk: /usr/bin/mawk", type: output }
cautions:
  - type: caution
    text: "These lookups match file names, nothing more. On Ubuntu 24.04, `apt-file search --regexp 'bin/convert$'` (exactly `convert`, not `convert2gpx` and 57 others) names only `graphicsmagick-imagemagick-compat`, but most guides that say `convert` mean ImageMagick (package `imagemagick`), which installs it as `convert-im6.q16` behind an alternatives link. Read `apt show` before installing, and prefer the package the guide names."
avoid:
  - "Ubuntu's \"Command '…' not found, but can be installed with\" hint comes from its own list of commands in the archive, so try the command first. When it suggests several packages, `apt show` each before choosing."
  - "The reverse question, \"what did this package install?\", is `dpkg -L <package>`. Add `| grep bin/` to see just the commands."
  - "Fedora: `dnf provides '*/bin/ifconfig'` and `rpm -qf /usr/bin/rg`. Arch: `pacman -F ifconfig` and `pacman -Qo /usr/bin/rg`."
related: [command-not-found, install-deb, remove-package]
concepts: [what-is-a-package]
anatomy:
  "search": "Find packages that contain a file whose path includes this text."
  "bin/ifconfig": "The command name with `bin/` in front, so it only matches programs, not man pages or docs."
---

## The situation

A guide or an error tells you to run a command you don't have, like `ifconfig`, `mkpasswd` or `7z`, and you need to know which package to install. Or the reverse: you have a command and want to know which package it came from, to update it, read its docs, or remove it.

## How it works

Every package comes with a list of the files it installs. Both questions are lookups in those lists:

- **Not installed yet:** `apt-file` keeps a copy of the file lists for *every* package in Ubuntu's archive, and `apt-file search` looks through them. It isn't installed by default.
- **Already installed:** dpkg keeps the file lists of installed packages, and `dpkg -S /full/path` tells you which one owns that file. No setup needed.

Two things make `dpkg -S` come up empty. The path is a **symlink** that no package owns (the alternatives system's `awk`, `java` and `editor` work this way; `readlink -f` finds the real file). Or the program **didn't come from a package** at all: it was installed by hand into `/usr/local` or your home folder.

Everything in this scenario only reads. Installing what you find is the separate `sudo apt install` step.
