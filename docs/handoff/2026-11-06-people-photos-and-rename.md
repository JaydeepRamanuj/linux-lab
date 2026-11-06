# Handoff · 2026-11-06 · People photos, rename to linux-lab, new logo

**Task:** your three requests after Origins H4: photos of the people the Origins section mentions, renaming the app from ShellGyan to `linux-lab` everywhere, and a logo and favicon that represent the Linux ecosystem.

**Status:** committed on branch `origins/people-and-brand` (from `origins/phase-h4`) and pushed, no PR; review on its Vercel preview. Locally: 529 tests pass, `astro check` 0 errors and 0 warnings, and the build makes 166 pages with no `[content]` warnings. In the browser (desktop and 375px), the photos load in chapter sidebars and on Who's Who, the header fits five nav items at 375px, and nothing scrolls sideways.

## Photos

- **25 of the 28 people** have a photo, all from **Wikimedia Commons**: the image each person's Wikidata entry points to (property P18), so they're the community's chosen photo, not a guess from a web search. Licences are CC BY, CC BY-SA or public domain, all allowing reuse with credit.
- **No freely licensed photo exists** on Commons for Marc Ewing, Judd Vinet and Kristian Høgsberg; they show their initials.
- Files: `apps/web/public/people/<id>.jpg|png|gif`, about 320px wide, about 1 MB in total.
- `people.ts` has a `photo` for each: `src`, `author`, `license`, `licenseUrl`, `sourceUrl` (the Commons file page), plus `focus` and `zoom` so faces fill a small square frame (several originals are stage or group shots).
- **Credits** (required by CC BY/BY-SA): every photo's `title` names the author and licence, and a collapsed **Photo credits** list (author, licence link, Commons link) sits under the People sidebar on each chapter and under the gallery on Who's Who.
- **Who's Who** now opens "The people" with a gallery of all 28 (`<PeopleGallery />`, generated from `people.ts`), followed by the existing table of where each person appears. This answers the H3 question about a generated directory. The chapter's own sidebar people list was removed, since the gallery covers everyone.
- New build errors: a photo file missing from `public/`, or a photo without an author, licence or source URL.

**Please check:** the crop of each photo (the `focus`/`zoom` values are estimates); and author names, which come straight from Commons. A few were tidied where Commons' text was machine noise, such as "Unknown authorUnknown author" → "Unknown author".

## Rename to linux-lab

- **Brand:** `SITE_NAME = 'linux-lab'` in `data/site.ts`; the header, the page titles ("… · linux-lab"), the home page and the footer all read it.
- **Copy:** "ShellGyan rates …" and similar in 4 scenarios, 1 guide and 2 rule engine messages now say "linux-lab". Example paths `~/projects/shellgyan/…` are `~/projects/linux-lab/…`. The symlink scenario's `ls -l` size (36) is unchanged, because both names are nine characters.
- **Packages:** root package `linux-lab`; the core package is now `@linux-lab/core` (`packages/core/package.json`, the web app's dependency, 15 importing files, and the one entry in `pnpm-lock.yaml`, hand-edited and still in alphabetical order). **Watch the Vercel build:** if its install complains about the lockfile, running `pnpm install` once anywhere pnpm works and committing the lockfile fixes it.
- **Saved Explainer history:** the localStorage key is now `linux-lab:history:v1`. The first load copies anything under the old `shellgyan:history:v1` key across, then removes the old key, so no one loses history. Download filenames are `linux-lab-history-<date>.json`.
- **Not renamed:** `docs/` (plans and handoffs are a record of the past; `docs/shellgyan-plan.md` keeps its name).
- **Local only:** a junction `apps/web/node_modules/@linux-lab/core` → `packages/core` so the dev server resolves the new name without pnpm. `node_modules` isn't committed.

## Logo and favicon

`apps/web/public/favicon.svg` is option D of the five you were shown: a `>_` prompt (cyan chevron, light underscore) inside a small terminal window with three window dots, on the site's dark tile with an indigo outline. It replaced a first attempt (a penguin with a terminal belly) that you asked to make classier. The header shows the same SVG with the name in monospace.
