---
number: 24
title: Remove a Package and Its Leftovers
quote: "I uninstalled nginx, but /etc/nginx is still there and apt keeps saying a package is no longer required."
module: packages
severity: elevated
primaryCommand: sudo apt purge --autoremove nginx
symptoms:
  - uninstall a package
  - remove a package completely
  - apt remove vs purge
  - "is no longer required"
  - "Use 'sudo apt autoremove' to remove it"
  - config files left after uninstall
  - /etc folder still there after remove
  - rc packages
  - autoremove
  - leftover dependencies
before:
  kind: zones
  title: After a plain apt remove
  caption: "`apt remove nginx` removed one package. A dependency it pulled in, and the config in /etc, stayed behind."
  zones:
    - title: Installed
      items:
        - { text: nginx, tone: ghost, note: removed }
        - { text: nginx-common, tone: caution, note: "automatic, no longer required" }
    - title: System config
      items:
        - { text: /etc/nginx/, tone: caution, note: "kept: nginx.conf, sites-available/…" }
    - title: Your home folder
      items:
        - { text: "~", tone: base, note: "apt never touches it" }
after:
  kind: zones
  title: After purge --autoremove
  caption: "The package, the dependency nothing else needs, and their config files are gone."
  zones:
    - title: Installed
      items:
        - { text: nginx, tone: ghost, note: purged }
        - { text: nginx-common, tone: ghost, note: purged }
    - title: System config
      items:
        - { text: /etc/nginx/, tone: ghost, note: deleted }
    - title: Your home folder
      items:
        - { text: "~", tone: base, note: unchanged }
stateLabels: [Remove, Purge]
steps:
  - title: See what's installed
    kind: readonly
    command: apt list --installed 'nginx*'
    output: |
      Listing... Done
      nginx-common/noble-updates,now 1.24.0-2ubuntu7.19 all [installed,automatic]
      nginx/noble-updates,now 1.24.0-2ubuntu7.19 amd64 [installed]
    note: "`automatic` means apt installed it only because another package needed it. Once nothing needs it, `autoremove` offers to remove it. Quote the pattern, so the shell doesn't try to match `nginx*` against file names in the current folder."
  - title: Remove it, its config, and its unused dependencies
    kind: elevated
    command: sudo apt purge --autoremove nginx
    output: |
      Reading package lists... Done
      Building dependency tree... Done
      Reading state information... Done
      The following packages will be REMOVED:
        nginx* nginx-common*
      0 upgraded, 0 newly installed, 2 to remove and 0 not upgraded.
      After this operation, 1602 kB disk space will be freed.
      Do you want to continue? [Y/n] y
      (Reading database ... 56371 files and directories currently installed.)
      Removing nginx (1.24.0-2ubuntu7.19) ...
      Removing nginx-common (1.24.0-2ubuntu7.19) ...
      (Reading database ... 56330 files and directories currently installed.)
      Purging configuration files for nginx-common (1.24.0-2ubuntu7.19) ...
    note: "The `*` after a name means its config files go too. Read the REMOVED list before you press `y`: it should only hold what you meant to remove. `--autoremove` also takes any *other* packages that are no longer needed, so the list can be longer than you expect."
  - title: Check it's gone
    kind: readonly
    command: ls /etc/nginx
    output: "ls: cannot access '/etc/nginx': No such file or directory"
  - title: Find leftovers from earlier removes
    kind: readonly
    command: dpkg -l | grep '^rc'
    output: |
      rc  nginx-common                         1.24.0-2ubuntu7.19                   all          small, powerful, scalable web/proxy server - common files
    note: "`rc` means **r**emoved, but its **c**onfig files are still there. Every plain `apt remove` you've ever run leaves one of these lines (if the package had config files)."
  - title: Purge all of them
    kind: elevated
    command: sudo apt purge '~c'
    output: |
      The following packages will be REMOVED:
        nginx-common*
      0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.
      After this operation, 0 B of additional disk space will be used.
      Do you want to continue? [Y/n] y
      …
      Purging configuration files for nginx-common (1.24.0-2ubuntu7.19) ...
    note: "`~c` is an apt pattern: every package in the `rc` state. Quote it: unquoted, the shell may turn `~c` into the home folder of a user called `c`. \"0 B\" is right: the programs are already gone, only config files are deleted."
replay:
  context: The usual path. A plain remove, then autoremove, and the config is still there.
  commands:
    - { line: "$ sudo apt remove nginx", type: input }
    - { line: "The following package was automatically installed and is no longer required:", type: output }
    - { line: "  nginx-common", type: output }
    - { line: "Use 'sudo apt autoremove' to remove it.", type: output }
    - { line: "The following packages will be REMOVED:", type: output }
    - { line: "  nginx", type: output }
    - { line: "Removing nginx (1.24.0-2ubuntu7.19) ...", type: output }
    - { line: "$ sudo apt autoremove", type: input }
    - { line: "The following packages will be REMOVED:", type: output }
    - { line: "  nginx-common", type: output }
    - { line: "Removing nginx-common (1.24.0-2ubuntu7.19) ...", type: output }
    - { line: "$ ls /etc/nginx", type: input }
    - { line: "fastcgi.conf    koi-win     proxy_params     snippets", type: output }
    - { line: "fastcgi_params  mime.types  scgi_params      uwsgi_params", type: output }
    - { line: "koi-utf         nginx.conf  sites-available  win-utf", type: output }
cautions:
  - type: danger
    text: "Read the REMOVED list every time. Removing something other packages depend on takes them with it. `sudo apt remove python3` removes everything built on Python: on a minimal Ubuntu install that's already 40 packages, including `software-properties-common` (where `add-apt-repository` comes from), and on a desktop it's many more. Preview without changing anything with `apt remove -s python3`. If the list is long, or names something you didn't expect, answer `n`."
  - type: caution
    text: "Purge deletes the system config in `/etc`, including your edits. For a server like nginx, copy your site config somewhere first if you might want it back. Purging a database server can also delete its data in `/var/lib`: back it up first."
avoid:
  - "apt never touches your home folder, even with purge. App settings and caches live in `~/.config/<app>`, `~/.local/share/<app>` and `~/.cache/<app>`. Delete those yourself for a truly clean slate."
  - "If `autoremove` offers to remove something you use, mark it as wanted: `sudo apt-mark manual <package>`. apt then treats it as something you installed yourself."
  - "Snaps and Flatpaks are separate: `sudo snap remove <name>`, or `flatpak uninstall <name>` then `flatpak uninstall --unused`."
  - "Removed a .deb you installed from a file? Use the package name from `dpkg -I`, not the file name: `sudo apt remove pixelpad`."
related: [install-deb, fix-broken-install, which-package, disk-full]
concepts: [what-is-a-package, app-formats]
anatomy:
  "purge": "Remove the package and its system config files in /etc. `remove` keeps the config."
  "--autoremove": "Also remove dependencies that nothing needs any more."
  "nginx": "The package name, as `apt list` shows it. It isn't always the same as the command's name."
---

## The situation

You installed something to try it, and now you want it gone, properly. Or you already ran `apt remove` and noticed that its folder in `/etc` is still there, and apt keeps nagging that a package "is no longer required".

## How it works

Removing a package leaves three kinds of leftovers, and each needs its own command:

- **Dependencies.** Installing nginx also installed `nginx-common`, marked **automatic**. Removing nginx leaves it behind. `autoremove` removes automatic packages that nothing needs any more.
- **System config** in `/etc`. `remove` keeps it on purpose, so a reinstall picks up your settings. The package stays in the `rc` state. `purge` deletes the config as well.
- **Your own files** in your home folder: settings, caches, documents. No apt command touches them.

`sudo apt purge --autoremove nginx` handles the first two in one go. For packages you removed earlier with plain `remove`, `dpkg -l | grep '^rc'` lists what's left, and `sudo apt purge '~c'` cleans it all up.

Removing packages changes the system for every user, so it needs `sudo`. That's why this scenario is elevated.
