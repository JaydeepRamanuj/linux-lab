// People in the Origins section (docs/origins-plan.md §3.4). Chapters list them by id in `people`; the build
// fails on an unknown id. Phase H3 completes the list for the "Who's who" chapter.

export interface Person {
  id: string;
  name: string;
  /** One line: what they did that this section cares about. */
  knownFor: string;
  /** e.g. "1941–2011" or "b. 1953". */
  years?: string;
  /** Their own page or the most official one about them. */
  url?: string;
}

export const PEOPLE: Person[] = [
  {
    id: 'ken-thompson',
    name: 'Ken Thompson',
    knownFor: 'Wrote the first Unix, the B language, the original grep and, later, co-designed Go.',
    years: 'b. 1943',
    url: 'https://amturing.acm.org/award_winners/thompson_4588371.cfm'
  },
  {
    id: 'dennis-ritchie',
    name: 'Dennis Ritchie',
    knownFor: 'Created C, co-developed Unix and rewrote its kernel in C.',
    years: '1941–2011',
    url: 'https://www.nokia.com/bell-labs/about/dennis-m-ritchie/'
  },
  {
    id: 'doug-mcilroy',
    name: 'Doug McIlroy',
    knownFor: 'Head of the Bell Labs group behind Unix; pushed for pipes and the small-tools style.',
    years: 'b. 1932',
    url: 'https://www.cs.dartmouth.edu/~doug/'
  },
  {
    id: 'brian-kernighan',
    name: 'Brian Kernighan',
    knownFor: 'Named Unix, co-wrote “The C Programming Language” and is the K in awk.',
    years: 'b. 1942',
    url: 'https://www.cs.princeton.edu/~bwk/'
  },
  {
    id: 'bill-joy',
    name: 'Bill Joy',
    knownFor: 'Led the early BSD releases at Berkeley and wrote vi and the C shell; co-founded Sun.',
    years: 'b. 1954'
  },
  {
    id: 'richard-stallman',
    name: 'Richard Stallman',
    knownFor: 'Started GNU and the Free Software Foundation, wrote GNU Emacs and the first GCC, and the GPL.',
    years: 'b. 1953',
    url: 'https://stallman.org/'
  },
  {
    id: 'linus-torvalds',
    name: 'Linus Torvalds',
    knownFor: 'Wrote the Linux kernel in 1991 and still decides what goes into it. Also wrote git.',
    years: 'b. 1969',
    url: 'https://github.com/torvalds'
  },
  {
    id: 'andrew-tanenbaum',
    name: 'Andrew Tanenbaum',
    knownFor: 'Wrote MINIX, the teaching Unix Linux started on, and argued for microkernels.',
    years: 'b. 1944',
    url: 'https://www.cs.vu.nl/~ast/'
  },
  {
    id: 'greg-kroah-hartman',
    name: 'Greg Kroah-Hartman',
    knownFor: 'Maintains the stable and long-term kernels, and the driver core.',
    url: 'http://www.kroah.com/'
  },
  {
    id: 'eric-raymond',
    name: 'Eric S. Raymond',
    knownFor: 'Wrote “The Cathedral and the Bazaar” and co-founded the Open Source Initiative.',
    years: 'b. 1957',
    url: 'http://www.catb.org/~esr/'
  },
  {
    id: 'bruce-perens',
    name: 'Bruce Perens',
    knownFor: 'Wrote the Open Source Definition from the Debian guidelines and co-founded the OSI.',
    years: 'b. 1958',
    url: 'https://perens.com/'
  },
  {
    id: 'stephen-bourne',
    name: 'Stephen Bourne',
    knownFor: 'Wrote the Bourne shell for Seventh Edition Unix, the ancestor of every `sh` and of Bash.'
  },
  {
    id: 'brian-fox',
    name: 'Brian Fox',
    knownFor: 'Wrote Bash for the Free Software Foundation, as well as GNU Readline.'
  },
  {
    id: 'christine-peterson',
    name: 'Christine Peterson',
    knownFor: 'Suggested the term “open source” in February 1998.',
    url: 'https://opensource.org/history'
  },
  {
    id: 'eben-moglen',
    name: 'Eben Moglen',
    knownFor: 'The FSF’s long-time lawyer, who led the drafting of GPL version 3 with Stallman.'
  },
  {
    id: 'ian-murdock',
    name: 'Ian Murdock',
    knownFor: 'Founded Debian in 1993; the “ian” in its name.',
    years: '1973–2015',
    url: 'https://www.debian.org/intro/about'
  },
  {
    id: 'patrick-volkerding',
    name: 'Patrick Volkerding',
    knownFor: 'Has maintained Slackware since 1993, the longest anyone has run a distribution.',
    url: 'https://www.slackware.com/'
  },
  {
    id: 'marc-ewing',
    name: 'Marc Ewing',
    knownFor: 'Created Red Hat Linux and co-founded Red Hat.'
  },
  {
    id: 'bob-young',
    name: 'Bob Young',
    knownFor: 'Co-founded Red Hat and ran its business side through the 1999 stock market listing.'
  },
  {
    id: 'judd-vinet',
    name: 'Judd Vinet',
    knownFor: 'Created Arch Linux and its package manager, pacman.',
    url: 'https://wiki.archlinux.org/title/Arch_Linux'
  },
  {
    id: 'mark-shuttleworth',
    name: 'Mark Shuttleworth',
    knownFor: 'Founded Canonical and Ubuntu in 2004, with a team of Debian developers.',
    url: 'https://ubuntu.com/about'
  },
  {
    id: 'lennart-poettering',
    name: 'Lennart Poettering',
    knownFor: 'Started systemd (with Kay Sievers), PulseAudio and Avahi.',
    url: 'http://0pointer.de/blog/projects/systemd.html'
  },
  {
    id: 'matthias-ettrich',
    name: 'Matthias Ettrich',
    knownFor: 'Started the KDE desktop project in 1996; earlier wrote LyX.'
  },
  {
    id: 'miguel-de-icaza',
    name: 'Miguel de Icaza',
    knownFor: 'Co-founded GNOME with Federico Mena in 1997; later Mono and Xamarin.',
    url: 'https://www.gnome.org/about/'
  },
  {
    id: 'kristian-hogsberg',
    name: 'Kristian Høgsberg',
    knownFor: 'Started Wayland in 2008 while working on X at Red Hat.',
    url: 'https://wayland.freedesktop.org/'
  },
  {
    id: 'theodore-tso',
    name: 'Theodore Ts’o',
    knownFor: 'One of the first kernel developers outside Finland; maintains ext4 and wrote much of ext2 and ext3.'
  },
  {
    id: 'alan-cox',
    name: 'Alan Cox',
    knownFor: 'Wrote much of early Linux networking and ran the main stable branch through the 2.2 era.'
  },
  {
    id: 'solomon-hykes',
    name: 'Solomon Hykes',
    knownFor: 'Created Docker, which made Linux containers a mainstream tool.'
  }
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);
