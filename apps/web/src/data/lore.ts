// Names & lore (docs/origins-plan.md §3.4 and §5.3): where command and project names come from, and the jargon
// around Linux. Every entry has a `source`: an external URL, or a page on this site for jargon the site itself
// defines. The build checks ids, sources and the command/guide/chapter links (lib/contentChecks.ts).
// Entries whose usual story had no source we could reach (cron, root, /usr, the name Linux) are left out for now.

export type LoreKind = 'name-origin' | 'jargon';

export const LORE_KIND_LABEL: Record<LoreKind, string> = {
  'name-origin': 'Name origins',
  jargon: 'Jargon'
};

export interface LoreEntry {
  id: string;
  term: string;
  kind: LoreKind;
  /** One to three sentences. Prose: `code`, **bold** and [links](/g/x) work. */
  explanation: string;
  /** Command page this explains the name of; that page shows the entry as "Name origin". */
  command?: string;
  guide?: string;
  chapter?: string;
  /** URL, or a site path such as /o/what-is-a-distro. */
  source: string;
}

const MCILROY_READER = 'https://www.cs.dartmouth.edu/~doug/reader.pdf';
const RITCHIE_HIST = 'https://www.nokia.com/bell-labs/about/dennis-m-ritchie/hist.html';

export const LORE: LoreEntry[] = [
  // Name origins
  {
    id: 'grep',
    term: 'grep',
    kind: 'name-origin',
    explanation: 'From the `ed` editor command `g/re/p`: **g**lobally search for a **r**egular **e**xpression and **p**rint the matching lines. Ken Thompson lifted the regular expression code out of `ed` when someone needed to search a file too big for the editor.',
    command: 'grep',
    chapter: 'unix',
    source: MCILROY_READER
  },
  {
    id: 'sed',
    term: 'sed',
    kind: 'name-origin',
    explanation: 'The **s**tream **ed**itor: it applies editing commands to a stream of text instead of a file open in an editor. It grew out of `gres`, a global-substitution tool inspired by grep, and was written by Lee McMahon for Seventh Edition Unix.',
    command: 'sed',
    chapter: 'unix',
    source: MCILROY_READER
  },
  {
    id: 'awk',
    term: 'awk',
    kind: 'name-origin',
    explanation: 'The initials of its three authors at Bell Labs: Alfred **A**ho, Peter **W**einberger and Brian **K**ernighan. Not an abbreviation of anything else.',
    command: 'awk',
    chapter: 'unix',
    source: MCILROY_READER
  },
  {
    id: 'bash',
    term: 'bash',
    kind: 'name-origin',
    explanation: 'The **B**ourne **A**gain **SH**ell: a free replacement for Stephen Bourne’s shell, written by Brian Fox for GNU, and a pun on being "born again".',
    command: 'bash',
    chapter: 'gnu-free-software',
    source: 'https://www.gnu.org/gnu/thegnuproject.html'
  },
  {
    id: 'tar',
    term: 'tar',
    kind: 'name-origin',
    explanation: 'Short for **t**ape **ar**chiver. Archives were first written to magnetic tape; the name stayed when tar started writing to files and pipes.',
    command: 'tar',
    source: 'https://www.gnu.org/software/tar/manual/html_node/What-tar-Does.html'
  },
  {
    id: 'shell',
    term: 'shell',
    kind: 'name-origin',
    explanation: 'The name, and the idea of a command interpreter that is an ordinary program, came from Multics. It’s the outer layer around the kernel that you interact with.',
    guide: 'pressing-enter',
    chapter: 'unix',
    source: MCILROY_READER
  },
  {
    id: 'rc',
    term: 'rc (as in .bashrc)',
    kind: 'name-origin',
    explanation: 'From **runcom**, “run commands”, a program on MIT’s CTSS that ran a short script of commands. Early Unix called command files runcoms; the name survives in `/etc/rc`, `.bashrc`, `.vimrc` and every other `rc` file.',
    guide: 'shell-startup-files',
    source: MCILROY_READER
  },
  {
    id: 'unix',
    term: 'Unix',
    kind: 'name-origin',
    explanation: 'Suggested by Brian Kernighan in 1970, in what Dennis Ritchie called a “somewhat treacherous pun” on Multics, the large system Bell Labs had just left.',
    chapter: 'unix',
    source: RITCHIE_HIST
  },
  {
    id: 'gnu',
    term: 'GNU',
    kind: 'name-origin',
    explanation: 'A recursive acronym for “GNU’s Not Unix”, following a hacker tradition. Pronounced as one syllable with a hard g.',
    chapter: 'gnu-free-software',
    source: 'https://www.gnu.org/gnu/thegnuproject.html'
  },
  {
    id: 'debian',
    term: 'Debian',
    kind: 'name-origin',
    explanation: 'From the names of its founder, Ian Murdock, and his wife, Debra: Deb plus Ian.',
    chapter: 'what-is-a-distro',
    source: 'https://www.debian.org/intro/about'
  },
  {
    id: 'ubuntu',
    term: 'Ubuntu',
    kind: 'name-origin',
    explanation: 'An African word that Canonical translates as “humanity to others”, often summed up as “I am what I am because of who we all are”.',
    chapter: 'distro-families',
    source: 'https://ubuntu.com/about'
  },
  {
    id: 'tux',
    term: 'Tux',
    kind: 'name-origin',
    explanation: 'The Linux penguin, drawn by Larry Ewing with the GIMP image editor in 1996, after Linus Torvalds suggested a penguin as the kernel’s mascot.',
    chapter: 'linux-kernel',
    source: 'https://isc.tamu.edu/~lewing/linux/'
  },
  {
    id: 'daemon',
    term: 'daemon',
    kind: 'name-origin',
    explanation: 'A program that runs in the background waiting for something to do. The word came from Project MAC at MIT and is usually traced to Maxwell’s demon, the physics thought experiment of a being that works unseen. “Disk And Execution MONitor” is a later invention.',
    guide: 'systemd-units',
    source: 'http://www.catb.org/jargon/html/D/daemon.html'
  },
  {
    id: 'tarball',
    term: 'tarball',
    kind: 'name-origin',
    explanation: 'An archive made with `tar`, usually compressed (`.tar.gz`, `.tar.xz`). The Jargon File suggests the name plays on the “tar baby” of the Uncle Remus stories.',
    command: 'tar',
    source: 'http://www.catb.org/jargon/html/T/tarball.html'
  },
  {
    id: 'shebang',
    term: 'shebang (#!)',
    kind: 'name-origin',
    explanation: 'The `#!` at the start of a script, which tells the kernel which interpreter to run it with. Probably “sharp bang” or “shell bang”, helped along by the slang “the whole shebang”.',
    guide: 'pressing-enter',
    source: 'http://www.catb.org/jargon/html/S/shebang.html'
  },

  // Jargon
  {
    id: 'userland',
    term: 'userland',
    kind: 'jargon',
    explanation: 'Everything outside the kernel: the C library, shells, commands, services and applications. In use among Unix kernel hackers since at least 1985. Also called user space.',
    guide: 'kernel-user-space',
    source: 'http://www.catb.org/jargon/html/U/userland.html'
  },
  {
    id: 'upstream-downstream',
    term: 'upstream / downstream',
    kind: 'jargon',
    explanation: 'Upstream is the project that writes the software (GNOME, the kernel); downstream is whoever packages or builds on it (a distribution, or a distribution built on another). Fixes ideally go upstream so everyone gets them.',
    chapter: 'what-is-a-distro',
    source: '/o/what-is-a-distro'
  },
  {
    id: 'backport',
    term: 'backport',
    kind: 'jargon',
    explanation: 'Taking a fix from a newer version of a program and applying it to the older version a stable distribution ships, so it stays safe without changing behaviour.',
    chapter: 'what-is-a-distro',
    source: '/o/what-is-a-distro'
  },
  {
    id: 'lts',
    term: 'LTS',
    kind: 'jargon',
    explanation: '**L**ong-**t**erm **s**upport: a release that gets security fixes for years. Ubuntu says it coined the term in 2006 for every fourth release; the kernel’s longterm releases and RHEL work the same way.',
    chapter: 'what-is-a-distro',
    source: 'https://ubuntu.com/about'
  },
  {
    id: 'distro',
    term: 'distro',
    kind: 'jargon',
    explanation: 'Short for distribution: a kernel, userland, package manager, thousands of packages and the choices that tie them together, released as one system you can install.',
    chapter: 'what-is-a-distro',
    source: '/o/what-is-a-distro'
  },
  {
    id: 'rolling-release',
    term: 'rolling release',
    kind: 'jargon',
    explanation: 'A distribution with no versions: packages are updated continuously as upstream releases them, instead of being frozen into a release every year or two. Arch and openSUSE Tumbleweed are the best known.',
    chapter: 'distro-families',
    source: 'https://en.opensuse.org/Portal:Tumbleweed'
  },
  {
    id: 'copyleft',
    term: 'copyleft',
    kind: 'jargon',
    explanation: 'Using copyright to keep software free: anyone may copy and change it, but whoever distributes it, changed or not, must pass on the same freedoms. The GPL is the best-known copyleft licence.',
    chapter: 'licenses',
    source: 'https://www.gnu.org/licenses/gpl-3.0.html'
  },
  {
    id: 'pid-1',
    term: 'PID 1',
    kind: 'jargon',
    explanation: 'The first process the kernel starts, which starts everything else and adopts orphaned processes. On most distributions it’s systemd. “Rethinking PID 1” was the title of the post that announced systemd.',
    guide: 'systemd-units',
    chapter: 'stack-shifts',
    source: 'http://0pointer.de/blog/projects/systemd.html'
  },
  {
    id: 'rtfm',
    term: 'RTFM',
    kind: 'jargon',
    explanation: '“Read the f… manual.” Used to brush off a question the answer to which is in the man page, or, more politely, to say you already have. `man` and `--help` come first.',
    source: 'http://www.catb.org/jargon/html/R/RTFM.html'
  },
  {
    id: 'bikeshedding',
    term: 'bikeshedding',
    kind: 'jargon',
    explanation: 'Arguing at length over a trivial decision because everyone can have an opinion on it, while hard decisions pass with little discussion. Made famous in open source by Poul-Henning Kamp’s 1999 FreeBSD email about the colour of a bike shed.',
    source: 'https://bikeshed.org/'
  },
  {
    id: 'foo-bar',
    term: 'foo, bar',
    kind: 'jargon',
    explanation: 'Placeholder names for anything in examples: files, variables, hosts. The pair is usually traced to the military slang FUBAR.',
    source: 'http://www.catb.org/jargon/html/F/foo.html'
  },
  {
    id: 'unix-like',
    term: 'Unix-like',
    kind: 'jargon',
    explanation: 'A system that works like Unix and follows POSIX, but isn’t certified to use the UNIX trademark. Linux and the BSDs are Unix-like.',
    chapter: 'standards',
    source: '/o/standards'
  }
];

export const loreForCommand = (name: string) => LORE.filter((l) => l.command === name);
