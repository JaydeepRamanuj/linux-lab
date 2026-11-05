---
number: 16
title: Restart or Check a System Service
quote: "I edited my nginx config and now the site is down. How do I see what's wrong and restart it?"
module: processes-ports
severity: elevated
primaryCommand: sudo systemctl restart nginx
symptoms:
  - systemctl
  - restart service
  - service failed
  - service won't start
  - journalctl
  - check service status
  - enable at boot
  - "Job for nginx.service failed"
  - "Active: failed"
before:
  kind: zones
  title: Failed
  caption: A typo in the config made nginx refuse to start. systemd recorded why.
  zones:
    - title: nginx.service
      items:
        - { text: "Active: failed", tone: bad, note: "exit-code" }
    - title: Config
      items:
        - { text: "sites-enabled/default:24", tone: bad, note: "unexpected \"}\"" }
    - title: Starts at boot
      items:
        - { text: enabled, tone: base }
after:
  kind: zones
  title: Running
  caption: With the config fixed, a restart brings it back, and `enabled` means it starts after every reboot.
  zones:
    - title: nginx.service
      items:
        - { text: "Active: active (running)", tone: good }
    - title: Config
      items:
        - { text: "sites-enabled/default", tone: good, note: "test passed" }
    - title: Starts at boot
      items:
        - { text: enabled, tone: base }
steps:
  - title: List the services that failed
    kind: readonly
    command: systemctl --failed
    output: |2
        UNIT          LOAD   ACTIVE SUB    DESCRIPTION
      ● nginx.service loaded failed failed A high performance web server and a reverse proxy server

      LOAD   = Reflects whether the unit definition was properly loaded.
      ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
      SUB    = The low-level unit activation state, values depend on unit type.

      1 loaded units listed.
  - title: Check one service's status
    kind: readonly
    command: systemctl status nginx
    output: |
      × nginx.service - A high performance web server and a reverse proxy server
           Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
           Active: failed (Result: exit-code) since Wed 2026-11-04 09:12:40 IST; 2min ago
             Docs: man:nginx(8)
          Process: 4121 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=1/FAILURE)
              CPU: 9ms

      Nov 04 09:12:40 laptop nginx[4121]: 2026/11/04 09:12:40 [emerg] 4121#4121: unexpected "}" in /etc/nginx/sites-enabled/default:24
      Nov 04 09:12:40 laptop nginx[4121]: nginx: configuration file /etc/nginx/nginx.conf test failed
      Nov 04 09:12:40 laptop systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE
      Nov 04 09:12:40 laptop systemd[1]: nginx.service: Failed with result 'exit-code'.
      Nov 04 09:12:40 laptop systemd[1]: Failed to start nginx.service - A high performance web server and a reverse proxy server.
    note: "**Loaded** says where the unit file is and whether it starts at boot (`enabled`). **Active** is the state now. The last log lines usually contain the reason: here, line 24 of the site config. Press `q` if it opens in a pager."
  - title: Read more of its log
    kind: readonly
    command: journalctl -u nginx -n 20 --no-pager
    note: "`-u` picks the service, `-n 20` the last 20 lines. Add `-f` to follow new lines live, or `--since \"10 min ago\"`. On Ubuntu your user can read the system journal without `sudo`."
  - title: Fix the cause
    note: "Edit the file the log points to: `sudoedit /etc/nginx/sites-enabled/default`. Many services can check their config before you restart: for nginx that's `sudo nginx -t`. A failed check leaves the running version alone."
  - title: Restart it
    kind: elevated
    command: sudo systemctl restart nginx
    note: "Stops and starts the service. It prints nothing on success. On failure you get `Job for nginx.service failed because the control process exited with error code.`, which points you back to `status`."
  - title: Confirm it's running
    kind: readonly
    command: systemctl is-active nginx
    output: active
    note: "One word, handy in scripts: `active`, `failed`, `inactive`. `systemctl status nginx` gives the full picture."
replay:
  context: Restarting with a broken config, then after fixing it.
  commands:
    - { line: "$ sudo systemctl restart nginx", type: input }
    - { line: "Job for nginx.service failed because the control process exited with error code.", type: output }
    - { line: "See \"systemctl status nginx.service\" and \"journalctl -xeu nginx.service\" for details.", type: output }
    - { line: "$ sudoedit /etc/nginx/sites-enabled/default", type: input }
    - { line: "$ sudo systemctl restart nginx", type: input }
    - { line: "$ systemctl is-active nginx", type: input }
    - { line: "active", type: output }
cautions:
  - type: caution
    text: "`stop` and `disable` do different things. `stop` ends it now; it comes back at the next boot if it's enabled. `disable` stops it starting at boot; it keeps running now. `disable --now` does both."
  - type: danger
    text: "Don't stop services you don't recognise to free memory or \"speed things up\". Stopping `NetworkManager`, `gdm` or `systemd-logind` can cut your network or end your desktop session on the spot."
avoid:
  - "Many servers can reload their config without dropping connections: `sudo systemctl reload nginx`. If the config is broken, reload fails and the old config keeps running."
  - "Your own user services (`systemctl --user …`) need no `sudo`: PipeWire audio, Syncthing, and anything you set up yourself."
  - "`systemctl list-units --type=service` lists every service that's loaded, running or not."
related: [keep-running, frozen-app, apt-lock, watch-log]
concepts: [systemd-units, journald-logs]
anatomy:
  "restart": "Stop the service, then start it again."
  "nginx": "The service (unit) name. `nginx` is short for `nginx.service`."
---

## The situation

A service (a web server, database, Docker, printing or Bluetooth) stopped working, or you changed its config and need it to pick up the change. You want to know whether it's running, why it isn't, and how to restart it.

## How it works

On Ubuntu, Debian, Fedora and Arch, **systemd** starts and supervises background services. Each one is a **unit**, like `nginx.service`. `systemctl` talks to systemd:

- `status` shows whether it's running, whether it starts at boot, and its latest log lines.
- `start`, `stop` and `restart` act now. `enable` and `disable` control what happens at boot.

Everything a service prints goes into the **journal**, which you read with `journalctl -u name`. When a service fails, the reason is almost always in the last few lines there.

Changing a system service needs `sudo`, because it affects every user on the machine. That's why this scenario is elevated. Checking status and reading logs doesn't.
