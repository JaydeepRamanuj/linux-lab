---
number: 25
title: Install a .deb File
quote: "I downloaded pixelpad_2.3.1_amd64.deb from the app's website. How do I install it?"
module: packages
severity: elevated
primaryCommand: sudo apt install ./pixelpad_2.3.1_amd64.deb
symptoms:
  - install a .deb file
  - how to install deb
  - .deb downloaded from website
  - amd64.deb
  - dpkg -i
  - "E: Unable to locate package"
  - "Download is performed unsandboxed as root"
  - "couldn't be accessed by user '_apt'"
  - install app not in apt
before:
  kind: zones
  title: Downloaded
  caption: "The .deb is just a file in Downloads. It needs one library your system doesn't have yet."
  zones:
    - title: ~/Downloads
      items:
        - { text: pixelpad_2.3.1_amd64.deb, tone: focus, note: 2.3 MB }
    - title: Installed
      empty: no pixelpad yet
      items: []
    - title: Needs
      items:
        - { text: libc++1, tone: caution, note: not installed }
after:
  kind: zones
  title: Installed
  caption: "apt installed the app and pulled in what it needs from Ubuntu's archive, in one go."
  zones:
    - title: ~/Downloads
      items:
        - { text: pixelpad_2.3.1_amd64.deb, tone: ghost, note: "safe to delete" }
    - title: Installed
      items:
        - { text: pixelpad 2.3.1, tone: good, note: /usr/bin/pixelpad }
    - title: Needs
      items:
        - { text: libc++1, tone: good, note: "+ 3 libraries it needs" }
steps:
  - title: Go to the download
    kind: readonly
    command: cd ~/Downloads
  - title: Look inside before installing
    kind: readonly
    command: dpkg -I pixelpad_2.3.1_amd64.deb
    output: |2
       new Debian package, version 2.0.
       size 2301254 bytes: control archive=380 bytes.
           415 bytes,    11 lines      control
       Package: pixelpad
       Version: 2.3.1
       Architecture: amd64
       Maintainer: Pixelpad Team <support@pixelpad.example>
       Installed-Size: 2276
       Depends: libc6 (>= 2.34), libgtk-3-0t64 | libgtk-3-0, libnss3, libasound2t64 | libasound2, libc++1 (>= 14)
       Section: graphics
       Priority: optional
       Homepage: https://pixelpad.example
       Description: Sketch and annotate images
        Pixelpad is a small drawing app for quick sketches and screenshots.
    note: "Three lines matter. **Package** is the name you'll use to remove it later. **Architecture** must match your machine: `dpkg --print-architecture` prints `amd64` on a normal PC. **Depends** is what apt will fetch for you; `a | b` means either will do."
  - title: Install it with apt
    kind: elevated
    command: sudo apt install ./pixelpad_2.3.1_amd64.deb
    output: |
      Reading package lists... Done
      Building dependency tree... Done
      Note, selecting 'pixelpad' instead of './pixelpad_2.3.1_amd64.deb'
      The following additional packages will be installed:
        libc++1 libc++1-18 libc++abi1-18 libunwind-18
      The following NEW packages will be installed:
        libc++1 libc++1-18 libc++abi1-18 libunwind-18 pixelpad
      0 upgraded, 5 newly installed, 0 to remove and 0 not upgraded.
      Need to get 421 kB/2723 kB of archives.
      After this operation, 3834 kB of additional disk space will be used.
      Do you want to continue? [Y/n] y
      Get:1 /home/jd/Downloads/pixelpad_2.3.1_amd64.deb pixelpad amd64 2.3.1 [2301 kB]
      …
      Setting up libc++1:amd64 (1:18.0-59~exp2) ...
      Setting up pixelpad (2.3.1) ...
      N: Download is performed unsandboxed as root as file '/home/jd/Downloads/pixelpad_2.3.1_amd64.deb' couldn't be accessed by user '_apt'. - pkgAcquire::Run (13: Permission denied)
    note: "The `./` makes apt treat it as a file. apt reads the .deb's Depends, downloads what's missing from Ubuntu's archive (the 421 kB), then installs everything in the right order. The final `N:` line is a harmless notice: apt's download helper runs as a restricted user that can't read your home folder, so apt read the file as root instead."
  - title: Find and run it
    kind: readonly
    command: dpkg -L pixelpad | grep bin/
    output: /usr/bin/pixelpad
    note: "`dpkg -L` lists every file the package installed. Anything in a `bin/` folder is a command you can type: here, `pixelpad`. Most desktop apps also add themselves to the app menu."
  - title: Updates
    note: "A .deb from a website doesn't update itself unless the vendor also adds an apt repository (Chrome and VS Code do: look in `/etc/apt/sources.list.d/`). Otherwise, download the new version and install it the same way: apt upgrades it in place and keeps your settings."
replay:
  context: Two common ways it goes wrong.
  commands:
    - { line: "$ sudo apt install pixelpad_2.3.1_amd64.deb", type: input }
    - { line: "Reading package lists... Done", type: output }
    - { line: "Building dependency tree... Done", type: output }
    - { line: "E: Unable to locate package pixelpad_2.3.1_amd64.deb", type: output }
    - { line: "$ sudo dpkg -i pixelpad_2.3.1_amd64.deb", type: input }
    - { line: "Unpacking pixelpad (2.3.1) ...", type: output }
    - { line: "dpkg: dependency problems prevent configuration of pixelpad:", type: output }
    - { line: " pixelpad depends on libc++1 (>= 14); however:", type: output }
    - { line: "  Package libc++1 is not installed.", type: output }
    - { line: "Errors were encountered while processing:", type: output }
    - { line: " pixelpad", type: output }
cautions:
  - type: danger
    text: "Installing a .deb runs its setup scripts as root, with full access to your system. Only install .deb files from the project's official site or release page, never from a link in a forum post or a mirror you don't recognise."
  - type: caution
    text: "Without `./`, apt looks for a package *called* `pixelpad_2.3.1_amd64.deb` in Ubuntu's archive and fails with \"Unable to locate package\". `dpkg -i` installs the file but doesn't fetch dependencies, which leaves a broken install (see the replay)."
avoid:
  - "Already used `dpkg -i` and got dependency errors? `sudo apt --fix-broken install` finishes the job."
  - "To uninstall, use the **Package** name from step 2, not the file name: `sudo apt remove pixelpad`."
  - "Check apt first: `apt search pixelpad`. A package from Ubuntu's archive (or the vendor's own apt repository) gets updates with `sudo apt upgrade`."
  - "Fedora and openSUSE use .rpm files instead: `sudo dnf install ./app.rpm`. Arch users usually get the app from the AUR."
related: [fix-broken-install, remove-package, appimage-install, extract-archive, curl-pipe-bash]
concepts: [filesystem-layout]
anatomy:
  "install": "Install packages and everything they depend on."
  "./pixelpad_2.3.1_amd64.deb": "The downloaded file. The `./` (or any path with a `/`) tells apt it's a file, not a package name to look up."
---

## The situation

An app isn't in Ubuntu's archive, so its website offers a `.deb` download. Double-clicking it may open the wrong program or do nothing, and a guide says to use `dpkg -i`, which then complains about dependencies.

## How it works

A `.deb` is a package file: the program's files plus a small **control** section with its name, version, architecture and **Depends**, the other packages it needs. Ubuntu's own packages are .deb files too. A downloaded one just comes from somewhere else.

There are two tools that can install it:

- **`dpkg -i file.deb`** installs that one file. It checks dependencies but can't download them, so if any are missing it stops halfway and leaves a broken install.
- **`apt install ./file.deb`** treats the file as one more package in its plan. It downloads missing dependencies from Ubuntu's archive and installs everything in order.

Use apt. The `./` matters: it's how apt knows you mean a file in the current folder, not a package from the archive. Installing software for the whole system needs `sudo`, which is why this scenario is elevated.
