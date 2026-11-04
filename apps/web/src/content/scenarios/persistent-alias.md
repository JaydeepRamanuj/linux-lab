---
number: 10
title: Create a Shell Alias That Sticks
quote: "I made an alias, and it was gone the next time I opened a terminal."
module: everyday-rescue
severity: elevated
primaryCommand: echo "alias gs='git status'" >> ~/.bash_aliases
symptoms:
  - alias
  - alias not saved
  - alias disappears
  - permanent alias
  - .bash_aliases
  - shortcut command
  - ll
  - unalias
before:
  kind: zones
  title: Typed at the prompt
  caption: An alias typed at the prompt lives only in that shell. Close the terminal and it's gone.
  zones:
    - title: This terminal
      items:
        - { text: "gs → git status", tone: caution, note: "until you close it" }
    - title: New terminal
      items:
        - { text: "gs: command not found", tone: bad }
    - title: ~/.bash_aliases
      empty: does not exist
      items: []
after:
  kind: zones
  title: Saved in ~/.bash_aliases
  caption: "Ubuntu's `~/.bashrc` loads `~/.bash_aliases` at startup, so every terminal gets the alias."
  zones:
    - title: This terminal
      items:
        - { text: "gs → git status", tone: good, note: "after source" }
    - title: New terminal
      items:
        - { text: "gs → git status", tone: good }
    - title: ~/.bash_aliases
      items:
        - { text: "alias gs='git status'", tone: focus }
steps:
  - title: See the aliases you already have
    kind: readonly
    command: alias
    output: |
      alias alert='notify-send --urgency=low -i "$([ $? = 0 ] && echo terminal || echo error)" "$(history|tail -n1|sed -e '\''s/^\s*[0-9]\+\s*//;s/[;&|]\s*alert$//'\'')"'
      alias egrep='egrep --color=auto'
      alias fgrep='fgrep --color=auto'
      alias grep='grep --color=auto'
      alias l='ls -CF'
      alias la='ls -A'
      alias ll='ls -alF'
      alias ls='ls --color=auto'
    note: "These come with Ubuntu's default `~/.bashrc`. That's why `ll` works out of the box and `ls` output is coloured."
  - title: Try the alias in this terminal
    kind: readonly
    command: alias gs='git status'
    note: "No spaces around `=`. The quotes keep `git status` together as one value. This only lasts until you close the terminal, so it's a safe way to try a name out."
  - title: Check what the name means now
    kind: readonly
    command: type gs
    output: "gs is aliased to `git status'"
  - title: Check that ~/.bashrc loads ~/.bash_aliases
    kind: readonly
    command: grep -n bash_aliases ~/.bashrc
    output: |
      101:# ~/.bash_aliases, instead of adding them here directly.
      104:if [ -f ~/.bash_aliases ]; then
      105:    . ~/.bash_aliases
    note: "Ubuntu and Debian ship this. If you get no output, your distro doesn't load the file: append the alias to `~/.bashrc` instead."
  - title: Save it
    kind: elevated
    command: echo "alias gs='git status'" >> ~/.bash_aliases
    note: "`>>` appends and creates the file if it doesn't exist. Double quotes outside, single quotes inside, so the line is written exactly as you'd type it. Marked elevated because the file runs in every new terminal."
  - title: Load it into this terminal
    kind: modifies
    command: source ~/.bashrc
    note: "New terminals pick it up on their own."
replay:
  context: Saving an alias twice with different values. The last definition wins.
  commands:
    - { line: "$ echo \"alias gs='git status'\" >> ~/.bash_aliases", type: input }
    - { line: "$ echo \"alias gs='git status -sb'\" >> ~/.bash_aliases", type: input }
    - { line: "$ source ~/.bashrc", type: input }
    - { line: "$ type gs", type: input }
    - { line: "gs is aliased to `git status -sb'", type: output }
cautions:
  - type: caution
    text: "Use `>>`, never `>`. A single `>` empties the file first and throws away every alias you saved before."
  - type: caution
    text: "Don't give an alias the name of a real command unless you mean to change it everywhere. `alias rm='rm -i'` is fine for you, but scripts and other machines won't have it, and you may come to rely on a prompt that isn't there."
avoid:
  - "To run the real command and skip an alias for one call, put a backslash in front: `\\ls`, or use `command ls`."
  - "`unalias gs` removes an alias from the current terminal. To remove it for good, delete its line from `~/.bash_aliases` too."
  - "Aliases can't take arguments in the middle. For that, write a function in the same file: `mkcd() { mkdir -p \"$1\" && cd \"$1\"; }`."
  - "Aliases don't apply inside scripts. A script that needs a shortcut should spell the command out."
related: [add-to-path, command-not-found]
anatomy:
  "\"alias gs='git status'\"": "The line to write, quoted as one argument to `echo`."
  "~/.bash_aliases": "The file Ubuntu's `~/.bashrc` loads at startup for your aliases."
---

## The situation

You typed `alias gs='git status'`, it worked, and the next day it was gone. Or you copied a handy alias from a blog post and want to keep it.

## How it works

An alias is a text substitution: when the first word you type is an alias name, the shell swaps in its value before running anything. Aliases live in the memory of one shell process. Every new terminal is a new shell that starts with only what its startup files define.

For bash, the startup file is `~/.bashrc`. Ubuntu and Debian's version also loads `~/.bash_aliases` if it exists, which keeps your additions in a small file of their own instead of mixed into the long default config. Zsh users put aliases in `~/.zshrc`.

If you define the same alias twice, the last definition wins.
