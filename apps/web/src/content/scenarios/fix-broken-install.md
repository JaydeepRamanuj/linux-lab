---
number: 23
title: Fix a Broken Install
quote: "Every apt install now fails with \"unmet dependencies\" and tells me to run apt --fix-broken install."
module: packages
severity: elevated
primaryCommand: sudo apt --fix-broken install
symptoms:
  - unmet dependencies
  - "E: Unmet dependencies"
  - "You might want to run 'apt --fix-broken install' to correct these"
  - "but it is not going to be installed"
  - "dependency problems - leaving unconfigured"
  - "dpkg was interrupted, you must manually run 'sudo dpkg --configure -a'"
  - broken packages
  - apt -f install
  - half-installed package
  - dpkg -i dependency problems
before:
  kind: zones
  title: Stuck halfway
  caption: "`dpkg -i` unpacked the app, then stopped: one library it needs isn't installed. Until that's settled, apt refuses to install anything else."
  zones:
    - title: Package database
      items:
        - { text: pixelpad 2.3.1, tone: bad, note: "unpacked, not configured" }
    - title: Its dependencies
      items:
        - { text: libc++1, tone: bad, note: not installed }
    - title: Your next install
      items:
        - { text: sudo apt install htop, tone: bad, note: "E: Unmet dependencies" }
after:
  kind: zones
  title: Settled
  caption: apt installed the missing library (and the three it needs), then finished setting up the app. Other installs work again.
  zones:
    - title: Package database
      items:
        - { text: pixelpad 2.3.1, tone: good, note: installed }
    - title: Its dependencies
      items:
        - { text: libc++1, tone: good, note: "+ libc++1-18, libc++abi1-18, libunwind-18" }
    - title: Your next install
      items:
        - { text: sudo apt install htop, tone: good, note: works }
steps:
  - title: Read the error
    kind: elevated
    command: sudo apt install htop
    output: |
      Reading package lists... Done
      Building dependency tree... Done
      You might want to run 'apt --fix-broken install' to correct these.
      The following packages have unmet dependencies:
       htop : Depends: libnl-3-200 (>= 3.2.7) but it is not going to be installed
              Depends: libnl-genl-3-200 (>= 3.2.7) but it is not going to be installed
       pixelpad : Depends: libc++1 (>= 14) but it is not going to be installed
      E: Unmet dependencies. Try 'apt --fix-broken install' with no packages (or specify a solution).
    note: "Look for a package you didn't ask for: `pixelpad`. That's the broken one. The `htop` lines are a side effect: while anything is broken, apt won't plan any install, so every package's dependencies show up as \"not going to be installed\"."
  - title: Ask dpkg what's unfinished
    kind: readonly
    command: dpkg --audit
    output: |
      The following packages have been unpacked but not yet configured.
      They must be configured using dpkg --configure or the configure
      menu option in dselect for them to work:
       pixelpad             Sketch and annotate images
    note: "When everything is fine, this prints nothing. \"Unpacked but not yet configured\" means the files are on disk but setup never finished."
  - title: Let apt fix it
    kind: elevated
    command: sudo apt --fix-broken install
    output: |
      Reading package lists... Done
      Building dependency tree... Done
      Reading state information... Done
      Correcting dependencies... Done
      The following additional packages will be installed:
        libc++1 libc++1-18 libc++abi1-18 libunwind-18
      The following NEW packages will be installed:
        libc++1 libc++1-18 libc++abi1-18 libunwind-18
      0 upgraded, 4 newly installed, 0 to remove and 0 not upgraded.
      1 not fully installed or removed.
      Need to get 421 kB of archives.
      After this operation, 1503 kB of additional disk space will be used.
      Do you want to continue? [Y/n] y
      …
      Setting up libunwind-18:amd64 (1:18.1.3-1ubuntu1) ...
      Setting up libc++abi1-18:amd64 (1:18.1.3-1ubuntu1) ...
      Setting up libc++1-18:amd64 (1:18.1.3-1ubuntu1) ...
      Setting up libc++1:amd64 (1:18.0-59~exp2) ...
      Setting up pixelpad (2.3.1) ...
      Processing triggers for libc-bin (2.39-0ubuntu8.9) ...
    note: "With no package names, apt only does what it takes to make the database consistent. Read the plan before you press `y`: here it only **installs** things. If it says **REMOVED**, see the caution below. `sudo apt -f install` is the same command."
  - title: Check it's settled
    kind: readonly
    command: dpkg -l pixelpad
    output: |
      Desired=Unknown/Install/Remove/Purge/Hold
      | Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
      |/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
      ||/ Name           Version      Architecture Description
      +++-==============-============-============-=================================
      ii  pixelpad       2.3.1        amd64        Sketch and annotate images
    note: "`ii` means installed and configured. Before the fix this line started with `iU`: wanted installed, only Unpacked. `dpkg --audit` now prints nothing, and `sudo apt install htop` works again."
  - title: "If the message says \"dpkg was interrupted\""
    kind: elevated
    command: sudo dpkg --configure -a
    note: "A different cause: an install or upgrade was cut off (closed terminal, power loss, `Ctrl+C`). This finishes setting up every half-installed package. If apt or dpkg is still running, wait for it first (see the apt lock scenario). Then run `sudo apt --fix-broken install` in case anything is still missing."
replay:
  context: How it got broken. The app's website said to install the .deb with dpkg.
  commands:
    - { line: "$ sudo dpkg -i pixelpad_2.3.1_amd64.deb", type: input }
    - { line: "Selecting previously unselected package pixelpad.", type: output }
    - { line: "Preparing to unpack pixelpad_2.3.1_amd64.deb ...", type: output }
    - { line: "Unpacking pixelpad (2.3.1) ...", type: output }
    - { line: "dpkg: dependency problems prevent configuration of pixelpad:", type: output }
    - { line: " pixelpad depends on libc++1 (>= 14); however:", type: output }
    - { line: "  Package libc++1 is not installed.", type: output }
    - { line: "dpkg: error processing package pixelpad (--install):", type: output }
    - { line: " dependency problems - leaving unconfigured", type: output }
    - { line: "Errors were encountered while processing:", type: output }
    - { line: " pixelpad", type: output }
    - { line: "$ sudo apt --fix-broken install", type: input }
    - { line: "Correcting dependencies... Done", type: output }
    - { line: "Setting up pixelpad (2.3.1) ...", type: output }
cautions:
  - type: danger
    text: "If `--fix-broken` plans to **REMOVE** packages, stop and read the list. When a dependency can't be installed at all (an old .deb that wants `libappindicator1`, which Ubuntu 24.04 doesn't have), apt's fix is to remove the broken app. Losing that one app is fine. If the list has anything else, especially `ubuntu-desktop` or `python3`, answer `n` and look for a newer build of the app."
  - type: caution
    text: "Don't make the error go away with `dpkg --force-depends`, `--force-all`, or by editing or deleting files in `/var/lib/dpkg`. They hide the problem in the package database, and every later install trips over it."
avoid:
  - "Install downloaded .deb files with `sudo apt install ./file.deb` instead of `dpkg -i`. apt fetches the dependencies first, so nothing is left half-installed."
  - "If you'd rather not keep the app, `sudo apt remove pixelpad` also clears the error: apt accepts removing the broken package as the fix."
  - "Don't close the terminal while apt or dpkg is running. An interrupted upgrade is the other common way to end up here."
related: [install-deb, apt-lock, remove-package]
anatomy:
  "--fix-broken": "Repair the package database: install what's missing, or remove what can't be satisfied. Short form: `-f`."
  "install": "With no package names, it installs nothing new of its own choosing: only what the fix needs."
---

## The situation

An install was interrupted, or you installed a downloaded .deb with `dpkg -i`. Now every `apt install` fails with "Unmet dependencies" and suggests `apt --fix-broken install`, even for packages that have nothing to do with it.

## How it works

`apt` works out what to install. **`dpkg`** does the installing, one package at a time: it **unpacks** the files, then **configures** the package (runs its setup). `dpkg` checks dependencies, but it never downloads anything. When a dependency is missing, it unpacks the package and stops before configuring it.

That leaves the package database inconsistent: a package that's wanted but can't work. apt refuses to plan any other change until that's settled, which is why an unrelated `apt install htop` fails too.

`apt --fix-broken install` with no package names asks apt for the smallest change that makes the database consistent. Usually that means installing the missing dependencies, after which dpkg finishes configuring the stuck package. If a dependency doesn't exist in your Ubuntu version, the only consistent state is one without the broken package. That's why you read the plan before you press `y`.
