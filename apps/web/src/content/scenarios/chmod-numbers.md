---
number: 21
title: "Read chmod Numbers: What 755 and 644 Mean"
quote: "The docs say chmod 755 the script and 644 everything else. What do those numbers actually mean?"
module: files-permissions
severity: modifies
primaryCommand: chmod 755 deploy.sh
symptoms:
  - chmod 755
  - chmod 644
  - chmod 600
  - chmod 777
  - permission numbers
  - octal permissions
  - rwxr-xr-x
  - what does 755 mean
  - umask
  - "UNPROTECTED PRIVATE KEY FILE"
before:
  kind: zones
  title: "755, digit by digit"
  caption: "Each digit is one group of people. Add up what they're allowed: read 4, write 2, execute 1."
  zones:
    - title: "Owner: 7"
      items:
        - { text: "read 4", tone: good }
        - { text: "write 2", tone: good }
        - { text: "execute 1", tone: good }
    - title: "Group: 5"
      items:
        - { text: "read 4", tone: good }
        - { text: "write", tone: ghost }
        - { text: "execute 1", tone: good }
    - title: "Others: 5"
      items:
        - { text: "read 4", tone: good }
        - { text: "write", tone: ghost }
        - { text: "execute 1", tone: good }
after:
  kind: zones
  title: The four numbers you'll actually use
  caption: "Folders need `x` to be opened, which is why they get 755 when files get 644."
  zones:
    - title: Files
      items:
        - { text: "644  rw-r--r--", tone: base, note: "normal files" }
        - { text: "755  rwxr-xr-x", tone: good, note: "scripts and programs" }
        - { text: "600  rw-------", tone: focus, note: "secrets, SSH keys" }
    - title: Folders
      items:
        - { text: "755  rwxr-xr-x", tone: good, note: "everyone can open" }
        - { text: "700  rwx------", tone: focus, note: "only you" }
steps:
  - title: See the numbers
    kind: readonly
    command: stat -c "%a %A %n" deploy.sh index.html .env css
    output: |
      664 -rw-rw-r-- deploy.sh
      664 -rw-rw-r-- index.html
      664 -rw-rw-r-- .env
      775 drwxrwxr-x css
    note: "`%a` is the number, `%A` the same thing as letters. Read the letters in threes after the first character (`-` file, `d` folder): owner, group, others."
  - title: Why new files start as 664
    kind: readonly
    command: umask
    output: "0002"
    note: "New files start from 666 and folders from 777, minus the umask. Ubuntu's 002 takes write away from others: 664 and 775. Your group is just you on Ubuntu, so group write is harmless."
  - title: "Scripts: 755"
    kind: modifies
    command: chmod 755 deploy.sh
    note: "7 = 4+2+1 = rwx for you; 5 = 4+1 = r-x for everyone else. Anyone can run it, only you can change it."
  - title: "Normal files: 644"
    kind: modifies
    command: chmod 644 index.html
    note: "6 = 4+2 = rw- for you, 4 = r-- for everyone else."
  - title: "Secrets: 600"
    kind: modifies
    command: chmod 600 .env
    note: "Only you can read or write it. SSH insists on this for private keys, and refuses them with `UNPROTECTED PRIVATE KEY FILE!` otherwise."
  - title: Check
    kind: readonly
    command: stat -c "%a %A %n" deploy.sh index.html .env css
    output: |
      755 -rwxr-xr-x deploy.sh
      644 -rw-r--r-- index.html
      600 -rw------- .env
      775 drwxrwxr-x css
replay:
  context: "chmod -R 644 on a folder, run as a normal user."
  commands:
    - { line: "$ chmod -R 644 css", type: input }
    - { line: "chmod: cannot access 'css/main.css': Permission denied", type: output }
    - { line: "$ ls -l css", type: input }
    - { line: "ls: cannot access 'css/main.css': Permission denied", type: output }
    - { line: "total 0", type: output }
    - { line: "-????????? ? ? ? ?            ? main.css", type: output }
    - { line: "$ chmod 755 css", type: input }
cautions:
  - type: danger
    text: "`chmod 777` (or `-R 777`) lets every user and every program on the machine change the file. It hides a permission problem instead of fixing it, and SSH, sudo and web servers refuse to use files set that way."
  - type: caution
    text: "`chmod -R 644 folder` takes `x` off the folders too, and a folder without `x` can't be opened, so `chmod` locks itself out halfway (see the replay). For a whole tree use `chmod -R u=rwX,go=rX folder`: capital `X` adds execute only to folders and to files that already had it."
avoid:
  - "`+x`, `u+w`, `go-r` change one permission and leave the rest alone. Numbers set all nine at once. Use letters for small fixes and numbers when you know the result you want."
  - "A leading fourth digit (`chmod 2775`, `1777`) sets special bits such as setgid and sticky. `/tmp` is 1777: everyone can write, but only the owner can delete."
  - "`ls -l` and `stat` show the same thing. `stat -c %a file` is the quickest way to get the number."
related: [permission-denied-script, root-owned-files, safe-mv-cp]
concepts: [permissions-model, setuid-capabilities]
anatomy:
  "755": "Owner 7 (rwx), group 5 (r-x), others 5 (r-x). Each digit adds up read 4, write 2, execute 1."
  "deploy.sh": "The file to change. Its contents aren't touched, only its permission bits."
---

## The situation

A README, an error message or an AI assistant tells you to `chmod 755` something, or `chmod 600` your SSH key. You want to know what the number means before you run it, and which number to use next time.

## How it works

Every file has nine permission bits: **read**, **write** and **execute** for three groups of people, the **owner**, the file's **group**, and **others** (everyone else). `ls -l` shows them as letters, `rwxr-xr-x`, and `chmod` takes them as three digits.

Each digit is the sum of what's allowed: **read = 4**, **write = 2**, **execute = 1**. So 7 is all three, 6 is read and write, 5 is read and execute, 4 is read only and 0 is nothing. `755` means owner 7, group 5, others 5.

For folders, the letters mean something slightly different: **read** lists the names, **write** creates and deletes files inside, and **execute** lets you enter the folder at all. That's why folders and scripts get 755 when ordinary files get 644. Changing permissions never changes a file's contents.
