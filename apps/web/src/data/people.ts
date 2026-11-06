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
  /** A freely licensed photo from Wikimedia Commons, served from /public/people. Credited wherever it shows. */
  photo?: PersonPhoto;
}

export interface PersonPhoto {
  src: string;
  author: string;
  license: string;
  licenseUrl?: string;
  /** The file's page on Wikimedia Commons. */
  sourceUrl: string;
  /** CSS object-position of the face, and how far to zoom in for a small square frame. */
  focus?: string;
  zoom?: number;
}

export const PEOPLE: Person[] = [
  {
    id: 'ken-thompson',
    name: 'Ken Thompson',
    knownFor: 'Wrote the first Unix, the B language, the original grep and, later, co-designed Go.',
    years: 'b. 1943',
    url: 'https://amturing.acm.org/award_winners/thompson_4588371.cfm',
    photo: {
      src: '/people/ken-thompson.jpg',
      author: 'Unknown author',
      license: 'Public domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ken_Thompson_02.jpg',
      focus: '50% 35%',
      zoom: 1.2
    }
  },
  {
    id: 'dennis-ritchie',
    name: 'Dennis Ritchie',
    knownFor: 'Created C, co-developed Unix and rewrote its kernel in C.',
    years: '1941–2011',
    url: 'https://www.nokia.com/bell-labs/about/dennis-m-ritchie/',
    photo: {
      src: '/people/dennis-ritchie.jpg',
      author: 'Denise Panyik-Dale',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dennis_Ritchie_2011.jpg',
      focus: '50% 22%',
      zoom: 1.4
    }
  },
  {
    id: 'doug-mcilroy',
    name: 'Doug McIlroy',
    knownFor: 'Head of the Bell Labs group behind Unix; pushed for pipes and the small-tools style.',
    years: 'b. 1932',
    url: 'https://www.cs.dartmouth.edu/~doug/',
    photo: {
      src: '/people/doug-mcilroy.jpg',
      author: 'Denise Panyik-Dale',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Douglas_McIlroy.jpeg',
      focus: '50% 28%',
      zoom: 1.3
    }
  },
  {
    id: 'brian-kernighan',
    name: 'Brian Kernighan',
    knownFor: 'Named Unix, co-wrote “The C Programming Language” and is the K in awk.',
    years: 'b. 1942',
    url: 'https://www.cs.princeton.edu/~bwk/',
    photo: {
      src: '/people/brian-kernighan.gif',
      author: 'Thiele41',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Brian_kernighan2.gif',
      focus: '60% 25%',
      zoom: 1.3
    }
  },
  {
    id: 'bill-joy',
    name: 'Bill Joy',
    knownFor: 'Led the early BSD releases at Berkeley and wrote vi and the C shell; co-founded Sun.',
    years: 'b. 1954',
    photo: {
      src: '/people/bill-joy.jpg',
      author: 'SqueakBox (English Wikipedia)',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bill_Joy_at_World_Economic_Forum_(Davos),_2003-01_(cropped).jpg',
      focus: '50% 35%',
      zoom: 1.2
    }
  },
  {
    id: 'richard-stallman',
    name: 'Richard Stallman',
    knownFor: 'Started GNU and the Free Software Foundation, wrote GNU Emacs and the first GCC, and the GPL.',
    years: 'b. 1953',
    url: 'https://stallman.org/',
    photo: {
      src: '/people/richard-stallman.jpg',
      author: 'Patafisik',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Richard_Stallman_Bologna_2024_abc1.jpg',
      focus: '50% 35%',
      zoom: 1.2
    }
  },
  {
    id: 'linus-torvalds',
    name: 'Linus Torvalds',
    knownFor: 'Wrote the Linux kernel in 1991 and still decides what goes into it. Also wrote git.',
    years: 'b. 1969',
    url: 'https://github.com/torvalds',
    photo: {
      src: '/people/linus-torvalds.jpg',
      author: 'Unknown author',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Linus_Torvalds_(cropped).jpg',
      focus: '50% 30%',
      zoom: 1.3
    }
  },
  {
    id: 'andrew-tanenbaum',
    name: 'Andrew Tanenbaum',
    knownFor: 'Wrote MINIX, the teaching Unix Linux started on, and argued for microkernels.',
    years: 'b. 1944',
    url: 'https://www.cs.vu.nl/~ast/',
    photo: {
      src: '/people/andrew-tanenbaum.png',
      author: 'GerardM; derivative work by Okoura',
      license: 'CC BY 2.5',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.5',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:AndrewTanenbaum2.png',
      focus: '50% 28%',
      zoom: 1.15
    }
  },
  {
    id: 'greg-kroah-hartman',
    name: 'Greg Kroah-Hartman',
    knownFor: 'Maintains the stable and long-term kernels, and the driver core.',
    url: 'http://www.kroah.com/',
    photo: {
      src: '/people/greg-kroah-hartman.jpg',
      author: 'Sebastian Oliva',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Greg-Kroah-Hartman.jpeg',
      focus: '50% 20%',
      zoom: 1.8
    }
  },
  {
    id: 'eric-raymond',
    name: 'Eric S. Raymond',
    knownFor: 'Wrote “The Cathedral and the Bazaar” and co-founded the Open Source Initiative.',
    years: 'b. 1957',
    url: 'http://www.catb.org/~esr/',
    photo: {
      src: '/people/eric-raymond.jpg',
      author: 'jerone2; derivative work by Bilby',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eric_S_Raymond_portrait.jpg',
      focus: '50% 28%',
      zoom: 1.3
    }
  },
  {
    id: 'bruce-perens',
    name: 'Bruce Perens',
    knownFor: 'Wrote the Open Source Definition from the Debian guidelines and co-founded the OSI.',
    years: 'b. 1958',
    url: 'https://perens.com/',
    photo: {
      src: '/people/bruce-perens.jpg',
      author: 'Manon Anne Ress',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bruce_perens_13jan09_tacd_MAR_1557x1188.JPG',
      focus: '62% 35%',
      zoom: 1.5
    }
  },
  {
    id: 'stephen-bourne',
    name: 'Stephen Bourne',
    knownFor: 'Wrote the Bourne shell for Seventh Edition Unix, the ancestor of every `sh` and of Bash.',
    photo: {
      src: '/people/stephen-bourne.jpg',
      author: 'Unknown',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Steve_Bourne_at_SDWest2005.hires.jpg',
      focus: '48% 30%',
      zoom: 2.4
    }
  },
  {
    id: 'brian-fox',
    name: 'Brian Fox',
    knownFor: 'Wrote Bash for the Free Software Foundation, as well as GNU Readline.',
    photo: {
      src: '/people/brian-fox.png',
      author: 'Lissa Liggett',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:BrianJFox.png',
      focus: '50% 30%',
      zoom: 1.15
    }
  },
  {
    id: 'christine-peterson',
    name: 'Christine Peterson',
    knownFor: 'Suggested the term “open source” in February 1998.',
    url: 'https://opensource.org/history',
    photo: {
      src: '/people/christine-peterson.jpg',
      author: 'Randy Stewart',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Christine_Peterson_2009.jpg',
      focus: '42% 20%',
      zoom: 1.9
    }
  },
  {
    id: 'eben-moglen',
    name: 'Eben Moglen',
    knownFor: 'The FSF’s long-time lawyer, who led the drafting of GPL version 3 with Stallman.',
    photo: {
      src: '/people/eben-moglen.jpg',
      author: 'Karora',
      license: 'Public domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eben_Moglen,_2010-08-05.jpg',
      focus: '50% 35%',
      zoom: 1.3
    }
  },
  {
    id: 'ian-murdock',
    name: 'Ian Murdock',
    knownFor: 'Founded Debian in 1993; the “ian” in its name.',
    years: '1973–2015',
    url: 'https://www.debian.org/intro/about',
    photo: {
      src: '/people/ian-murdock.jpg',
      author: 'Ilya Schurov',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ian_Murdock_interview_at_Holiday_Club_hotel_2008_(2).jpg',
      focus: '52% 30%',
      zoom: 1.6
    }
  },
  {
    id: 'patrick-volkerding',
    name: 'Patrick Volkerding',
    knownFor: 'Has maintained Slackware since 1993, the longest anyone has run a distribution.',
    url: 'https://www.slackware.com/',
    photo: {
      src: '/people/patrick-volkerding.jpg',
      author: 'Unknown',
      license: 'Public domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Patrick_Volkerding_at_Linuxworld_2000_in_New_York_City.jpg',
      focus: '58% 30%',
      zoom: 2.4
    }
  },
  {
    id: 'marc-ewing',
    name: 'Marc Ewing',
    knownFor: 'Created Red Hat Linux and co-founded Red Hat.'
  },
  {
    id: 'bob-young',
    name: 'Bob Young',
    knownFor: 'Co-founded Red Hat and ran its business side through the 1999 stock market listing.',
    photo: {
      src: '/people/bob-young.jpg',
      author: 'Joi',
      license: 'CC BY 2.5',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.5',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:BobYoungJI1.jpg',
      focus: '50% 40%',
      zoom: 1.4
    }
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
    url: 'https://ubuntu.com/about',
    photo: {
      src: '/people/mark-shuttleworth.jpg',
      author: 'Jonnymccullagh',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Markshuttleworth-dublin-20101116.jpg',
      focus: '50% 28%',
      zoom: 1.4
    }
  },
  {
    id: 'lennart-poettering',
    name: 'Lennart Poettering',
    knownFor: 'Started systemd (with Kay Sievers), PulseAudio and Avahi.',
    url: 'http://0pointer.de/blog/projects/systemd.html',
    photo: {
      src: '/people/lennart-poettering.jpg',
      author: 'Kushal Das',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lennart_poettering.jpg',
      focus: '50% 40%',
      zoom: 1.5
    }
  },
  {
    id: 'matthias-ettrich',
    name: 'Matthias Ettrich',
    knownFor: 'Started the KDE desktop project in 1996; earlier wrote LyX.',
    photo: {
      src: '/people/matthias-ettrich.jpg',
      author: 'Elian',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Matthias_Ettrich_LinuxTag_2005-06-23.jpg',
      focus: '48% 22%',
      zoom: 1.9
    }
  },
  {
    id: 'miguel-de-icaza',
    name: 'Miguel de Icaza',
    knownFor: 'Co-founded GNOME with Federico Mena in 1997; later Mono and Xamarin.',
    url: 'https://www.gnome.org/about/',
    photo: {
      src: '/people/miguel-de-icaza.jpg',
      author: 'Unknown',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Miguel_de_Icaza.jpg',
      focus: '55% 28%',
      zoom: 2.0
    }
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
    knownFor: 'One of the first kernel developers outside Finland; maintains ext4 and wrote much of ext2 and ext3.',
    photo: {
      src: '/people/theodore-tso.jpg',
      author: 'Valodzka (assumed)',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:TheodoreTsoPict.jpg',
      focus: '50% 30%',
      zoom: 1.15
    }
  },
  {
    id: 'alan-cox',
    name: 'Alan Cox',
    knownFor: 'Wrote much of early Linux networking and ran the main stable branch through the 2.2 era.',
    photo: {
      src: '/people/alan-cox.jpg',
      author: 'TariqueSani',
      license: 'CC BY-SA 2.5',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Alan_Cox_at_FOSS_2007.jpg',
      focus: '45% 40%',
      zoom: 1.3
    }
  },
  {
    id: 'solomon-hykes',
    name: 'Solomon Hykes',
    knownFor: 'Created Docker, which made Linux containers a mainstream tool.',
    photo: {
      src: '/people/solomon-hykes.jpg',
      author: 'TechCrunch',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:518392245AG185_TechCrunch_D_-_Solomon_Hykes.jpg',
      focus: '45% 30%',
      zoom: 1.8
    }
  }
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);
