// The Origins timeline (docs/origins-plan.md §3.2 and §5.1). One typed array, so the build can check it
// (lib/contentChecks.ts) and chapters can show a strip of their own events.
//
// Rules: `date` is only as precise as `source` says ('YYYY', 'YYYY-MM' or 'YYYY-MM-DD'). Every event has a
// primary source where one could be reached. `why` is one line.

export const TIMELINE_CATEGORIES = ['unix', 'gnu', 'kernel', 'distros', 'ecosystem'] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<TimelineCategory, string> = {
  unix: 'Unix',
  gnu: 'GNU',
  kernel: 'Kernel',
  distros: 'Distros',
  ecosystem: 'Ecosystem'
};

export const ERA_IDS = ['unix', 'gnu', 'kernel-born', 'distros-business', 'everywhere'] as const;
export type EraId = (typeof ERA_IDS)[number];

export interface Era {
  id: EraId;
  name: string;
  from: number;
  /** Last year of the era; null for "until now". */
  to: number | null;
  summary: string;
}

// Eras overlap where history does; each event belongs to one.
export const ERAS: Era[] = [
  { id: 'unix', name: 'Unix', from: 1969, to: 1983, summary: 'A small system at Bell Labs becomes the model for how an operating system can be put together.' },
  { id: 'gnu', name: 'GNU', from: 1983, to: 1991, summary: 'Richard Stallman sets out to write a free Unix-compatible system, piece by piece, and a licence to keep it free.' },
  { id: 'kernel-born', name: 'The kernel is born', from: 1991, to: 1998, summary: 'A student in Helsinki writes the kernel GNU was missing, and thousands of people on the internet help.' },
  { id: 'distros-business', name: 'Distros and business', from: 1993, to: 2004, summary: 'Projects and companies package the kernel and GNU into complete systems you can install.' },
  { id: 'everywhere', name: 'Linux everywhere', from: 2005, to: null, summary: 'Linux runs most servers, every top supercomputer, most phones and the cloud.' }
];

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  why: string;
  category: TimelineCategory;
  era: EraId;
  /** Origins chapter slug that tells this part of the story. */
  chapter?: string;
  source: string;
}

const RITCHIE_HIST = 'https://www.nokia.com/bell-labs/about/dennis-m-ritchie/hist.html';
const MCILROY_READER = 'https://www.cs.dartmouth.edu/~doug/reader.pdf';
const GNU_PROJECT = 'https://www.gnu.org/gnu/thegnuproject.html';
const KERNEL_ARCHIVE = 'https://www.kernel.org/pub/linux/kernel';

export const TIMELINE: TimelineEvent[] = [
  // Era 1: Unix
  {
    id: 'unix-pdp7',
    date: '1969',
    title: 'Ken Thompson writes the first Unix on a PDP-7',
    why: 'With Bell Labs pulling out of Multics, Thompson built a small system of his own: a filesystem, processes and a shell.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: RITCHIE_HIST
  },
  {
    id: 'unix-first-manual',
    date: '1971-11-03',
    title: 'The first Unix Programmer’s Manual',
    why: 'The First Edition, by now on the PDP-11. Every command got a page with the same headings, the pattern `man` pages still follow.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: 'https://www.nokia.com/bell-labs/about/dennis-m-ritchie/1stEdman.html'
  },
  {
    id: 'unix-pipes',
    date: '1972',
    title: 'Pipes arrive, at Doug McIlroy’s insistence',
    why: 'Connecting one program’s output to the next one’s input turned small tools into a way of working.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: RITCHIE_HIST
  },
  {
    id: 'unix-in-c',
    date: '1973',
    title: 'The kernel is rewritten in C',
    why: 'An operating system in a high-level language could be moved to new hardware, which made Unix portable.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: RITCHIE_HIST
  },
  {
    id: 'unix-cacm-paper',
    date: '1974',
    title: '“The UNIX Time-Sharing System” is published',
    why: 'Ritchie and Thompson’s paper in Communications of the ACM made the system known outside Bell Labs.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: RITCHIE_HIST
  },
  {
    id: 'bsd-first',
    date: '1978',
    title: 'Berkeley ships its first software distribution (1BSD)',
    why: 'Add-ons for Unix from the University of California at Berkeley: the start of the BSD line, which lives on in FreeBSD and parts of macOS.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: 'https://www.tuhs.org/Archive/Distributions/UCB/'
  },
  {
    id: 'unix-v7',
    date: '1979',
    title: 'Seventh Edition Unix and the Bourne shell',
    why: 'The first portable edition and the last common ancestor of nearly every later Unix. `sh` scripts start here.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: MCILROY_READER
  },
  {
    id: 'bsd-42',
    date: '1983',
    title: '4.2BSD brings TCP/IP and sockets',
    why: 'The networking code and the socket API every networked program on Linux still uses.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: 'https://www.tuhs.org/Archive/Distributions/UCB/'
  },
  {
    id: 'unix-turing',
    date: '1983',
    title: 'Thompson and Ritchie receive the Turing Award',
    why: 'Computing’s highest honour, for the theory of operating systems and the implementation of Unix.',
    category: 'unix',
    era: 'unix',
    chapter: 'unix',
    source: 'https://amturing.acm.org/award_winners/thompson_4588371.cfm'
  },

  // Era 2: GNU
  {
    id: 'gnu-announced',
    date: '1983-09-27',
    title: 'Richard Stallman announces GNU',
    why: 'A plan for a complete Unix-compatible system that anyone could use, share and change.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: 'https://www.gnu.org/gnu/initial-announcement.html'
  },
  {
    id: 'gnu-work-starts',
    date: '1984-01',
    title: 'Stallman leaves MIT and starts writing GNU',
    why: 'He quit so that MIT couldn’t claim the work and stop it being distributed as free software.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: GNU_PROJECT
  },
  {
    id: 'gnu-manifesto',
    date: '1985',
    title: 'The GNU Manifesto',
    why: 'The case for free software, written to ask for help and money to build GNU.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: 'https://www.gnu.org/gnu/manifesto.html'
  },
  {
    id: 'fsf-founded',
    date: '1985',
    title: 'The Free Software Foundation is founded',
    why: 'A charity to fund GNU, employ programmers and sell tapes of the software.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: GNU_PROJECT
  },
  {
    id: 'gcc-1',
    date: '1987-05-23',
    title: 'GCC 1.0',
    why: 'A free C compiler good enough to replace the vendors’ own. Linux was built with it from day one.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: 'https://gcc.gnu.org/releases.html'
  },
  {
    id: 'gpl-v1',
    date: '1989-02',
    title: 'GNU General Public License, version 1',
    why: 'One licence for all GNU programs: copy and change freely, but pass the same freedom on.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: 'https://www.gnu.org/licenses/old-licenses/gpl-1.0.html'
  },
  {
    id: 'hurd-started',
    date: '1990',
    title: 'Work starts on the Hurd, GNU’s kernel',
    why: 'By 1990 GNU had almost everything except a kernel. The Hurd’s design on top of Mach proved slow to finish.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: GNU_PROJECT
  },
  {
    id: 'gpl-v2',
    date: '1991-06',
    title: 'GPL version 2',
    why: 'The version Linux has used since 1992, and still does.',
    category: 'gnu',
    era: 'gnu',
    chapter: 'gnu-free-software',
    source: 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html'
  },

  // Era 3: the kernel is born
  {
    id: 'linux-announced',
    date: '1991-08-25',
    title: 'Linus Torvalds announces his hobby kernel',
    why: 'A post to comp.os.minix: “just a hobby, won’t be big and professional like gnu”.',
    category: 'kernel',
    era: 'kernel-born',
    chapter: 'linux-kernel',
    source: 'https://groups.google.com/g/comp.os.minix/c/dlNtH7RRrGA/m/SwRavCzVE7gJ'
  },
  {
    id: 'linux-001',
    date: '1991',
    title: 'Linux 0.01: “a free minix-like kernel”',
    why: 'The first public source code, for 386 PCs. Built with GCC 1.40 and shipped with a bash binary to test.',
    category: 'kernel',
    era: 'kernel-born',
    chapter: 'linux-kernel',
    source: `${KERNEL_ARCHIVE}/Historic/old-versions/RELNOTES-0.01`
  },
  {
    id: 'tanenbaum-debate',
    date: '1992-01-29',
    title: '“LINUX is obsolete”',
    why: 'Andrew Tanenbaum, MINIX’s author, argues that microkernels have won and Linux is a step backwards. Torvalds replies within hours.',
    category: 'kernel',
    era: 'kernel-born',
    chapter: 'linux-kernel',
    source: 'https://groups.google.com/g/comp.os.minix/c/wlhw16QWltI'
  },
  {
    id: 'linux-gpl',
    date: '1992-02-01',
    title: 'Linux moves to the GPL',
    why: 'Announced with 0.12. The old licence banned selling it; the GPL let anyone distribute it, for money too.',
    category: 'kernel',
    era: 'kernel-born',
    chapter: 'linux-kernel',
    source: `${KERNEL_ARCHIVE}/Historic/old-versions/RELNOTES-0.12`
  },
  {
    id: 'linux-1-0',
    date: '1994-03',
    title: 'Linux 1.0',
    why: 'The first version called stable, with networking. The kernel was two and a half years old.',
    category: 'kernel',
    era: 'kernel-born',
    chapter: 'linux-kernel',
    source: `${KERNEL_ARCHIVE}/v1.0/`
  },
  {
    id: 'linux-2-0',
    date: '1996-06',
    title: 'Linux 2.0',
    why: 'Support for machines with several processors (SMP) and for more than one CPU architecture.',
    category: 'kernel',
    era: 'kernel-born',
    chapter: 'linux-kernel',
    source: `${KERNEL_ARCHIVE}/v2.0/`
  },
  {
    id: 'cathedral-bazaar',
    date: '1997',
    title: '“The Cathedral and the Bazaar”',
    why: 'Eric Raymond’s essay on why the Linux way of developing in the open works.',
    category: 'ecosystem',
    era: 'kernel-born',
    chapter: 'gnu-free-software',
    source: 'http://www.catb.org/~esr/writings/cathedral-bazaar/'
  },
  {
    id: 'open-source-coined',
    date: '1998-02-03',
    title: 'The term “open source” is coined',
    why: 'Suggested by Christine Peterson at a meeting in Palo Alto, soon after Netscape said it would release its source.',
    category: 'ecosystem',
    era: 'kernel-born',
    chapter: 'gnu-free-software',
    source: 'https://opensource.org/history'
  },
  {
    id: 'osi-founded',
    date: '1998-02',
    title: 'The Open Source Initiative is founded',
    why: 'Eric Raymond and Bruce Perens start the OSI to promote “open source” to business.',
    category: 'ecosystem',
    era: 'kernel-born',
    chapter: 'gnu-free-software',
    source: 'https://opensource.org/history'
  },

  // Later kernel milestones told in chapter 3. The rest of eras 4 and 5 come with Phases H2 and H3.
  {
    id: 'kernel-bitkeeper',
    date: '2002',
    title: 'The kernel moves to BitKeeper',
    why: 'Patches by email no longer scaled. A proprietary tool, free of charge for the kernel, did.',
    category: 'kernel',
    era: 'distros-business',
    chapter: 'linux-kernel',
    source: 'https://git-scm.com/book/en/v2/Getting-Started-A-Short-History-of-Git'
  },
  {
    id: 'linux-2-6',
    date: '2003-12',
    title: 'Linux 2.6',
    why: 'There was never a 2.7: odd-numbered development branches ended with 2.5, and new work now goes into the main tree.',
    category: 'kernel',
    era: 'distros-business',
    chapter: 'linux-kernel',
    source: `${KERNEL_ARCHIVE}/v2.6/`
  },
  {
    id: 'git-born',
    date: '2005-04-07',
    title: 'Torvalds writes git',
    why: 'BitKeeper’s free licence was withdrawn. Git’s first commit came days later; it now hosts most of the world’s code.',
    category: 'kernel',
    era: 'everywhere',
    chapter: 'linux-kernel',
    source: 'https://github.com/git/git/commit/e83c5163316f89bfbde7d9ab23ca2e25604af290'
  },
  {
    id: 'linux-3-0',
    date: '2011-07',
    title: 'Linux 3.0',
    why: 'Not a big change: the number moved for the kernel’s 20th year. Since then a new major number means the minor one got large.',
    category: 'kernel',
    era: 'everywhere',
    chapter: 'linux-kernel',
    source: `${KERNEL_ARCHIVE}/v3.x/`
  }
];

export const timelineEventById = (id: string) => TIMELINE.find((e) => e.id === id);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '1991' → '1991', '1991-08' → 'Aug 1991', '1991-08-25' → '25 Aug 1991'. */
export function formatEventDate(date: string): string {
  const [y, m, d] = date.split('-');
  if (!m) return y!;
  const month = MONTHS[Number(m) - 1];
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}

export const eventYear = (date: string) => Number(date.slice(0, 4));

/** True for 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD' naming a real day. */
export function isValidEventDate(date: string): boolean {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(date);
  if (!m) return false;
  const [, y, mo, d] = m;
  if (mo && (Number(mo) < 1 || Number(mo) > 12)) return false;
  if (d) {
    const dt = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    if (dt.getUTCDate() !== Number(d)) return false;
  }
  return true;
}

/** Events sorted by date; a less precise date sorts before more precise ones in the same period. */
export function sortedTimeline(events: TimelineEvent[] = TIMELINE): TimelineEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}
