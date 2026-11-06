// Build-time content checks. Runs once per build (from the scenario and command pages' getStaticPaths)
// and throws if any content is broken, so a bad scenario or command file fails `astro build` and shows
// up in the dev server instead of shipping silently.
//
// Errors (fail the build):
//   - two scenarios share a `number`
//   - a scenario's `related` slug, a command's `related` name, or a command's `scenarios` slug doesn't exist
//     (drafts count as missing: they have no page)
//   - a command file's `name` doesn't match its filename, or two commands share a name
//   - a step has a command but no `kind`
//   - a step's `kind` is milder than the rule engine's verdict for its command
//   - a scenario's `severity` isn't the most severe of its steps and its primary command
//   - a scenario's `anatomy` key matches no token of its primary command (step commands get no anatomy)
//   - guides (docs/guides-plan.md): two guides in a track share an `order`; a guide's `prerequisites`,
//     `commands` or `scenarios` entry doesn't exist; a scenario's or command's `concepts` slug isn't a
//     published guide; an `observe` command rates above readonly; the body's H2s aren't exactly
//     "The mental model" then "Under the hood"; the body links to a /s/, /g/, /c/ or /o/ page that doesn't exist
//   - origins (docs/origins-plan.md §3.5): a timeline event has a duplicate id, a bad date, no source URL, an
//     unknown category or era, a year outside its era, or an unknown chapter; two people share an id; two chapters
//     share an `order`; a chapter's `people`, `events`, `guides`, `commands` or `scenarios` entry doesn't exist;
//     `asOf` isn't an ISO date; the body doesn't start with "The short version" and end with "Why it matters
//     today"; the body links to a page that doesn't exist; a distro has a duplicate id, an unknown family or
//     parent, a parent founded after it, or a parent chain that loops
// Warnings (printed as `[content] …`; the plan's definition of done is zero of them):
//   - a scenario runs a program that has no command page
//   - a command page exists for a program a scenario runs, but doesn't list that scenario under `scenarios`
//   - a guide isn't linked from any scenario or command page (in either direction)
import { getCollection } from 'astro:content';
import { maxSeverity, rank } from '@shellgyan/core/severity';
import type { Severity } from '@shellgyan/core/severity';
import { buildAnatomy } from './anatomy';
import { TIMELINE, ERAS, TIMELINE_CATEGORIES, isValidEventDate, eventYear } from '../data/timeline';
import { PEOPLE } from '../data/people';
import { DISTROS, DISTRO_FAMILIES } from '../data/distros';

export interface ContentReport {
  errors: string[];
  warnings: string[];
}

// Programs that are shell syntax or builtins too basic to need their own page.
const NO_PAGE_NEEDED = new Set(['cd', 'true', 'false']);

// Programs documented on another command's page.
const COVERED_BY: Record<string, string> = { fg: 'jobs', bg: 'jobs', umask: 'chmod' };

/** A token that runs a file by path (`./deploy.sh`, `~/Applications/x.AppImage`), not a named program. */
const isPath = (program: string) => program.includes('/');

export async function collectContentReport(): Promise<ContentReport> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allScenarios = await getCollection('scenarios');
  const published = new Set(allScenarios.filter((s) => !s.data.draft).map((s) => s.id));
  const commands = await getCollection('commands');
  const commandByName = new Map(commands.map((c) => [c.data.name, c]));
  const allGuides = await getCollection('guides');
  const publishedGuides = new Set(allGuides.filter((g) => !g.data.draft).map((g) => g.id));
  const allChapters = await getCollection('origins');
  const publishedChapters = new Set(allChapters.filter((c) => !c.data.draft).map((c) => c.id));

  /** Does a site path written in a body (`/s/x`, `/g/x`, `/c/x`, `/o/x`) point at a real page? */
  const pageExists = (kind: string, slug: string) =>
    kind === 's' ? published.has(slug) : kind === 'g' ? publishedGuides.has(slug) : kind === 'o' ? publishedChapters.has(slug) : commandByName.has(slug);
  const bodyLinks = (body: string) => [...body.matchAll(/\]\(\/([scgo])\/([^)#\s/]+)\/?(?:#[^)\s]*)?\)/g)].map((m) => [m[1]!, m[2]!] as const);

  // Commands: names, links.
  const seenNames = new Map<string, string>();
  for (const c of commands) {
    const { name } = c.data;
    if (name !== c.id) errors.push(`command ${c.id}.yaml: name is "${name}", expected "${c.id}" (the filename)`);
    const other = seenNames.get(name);
    if (other) errors.push(`command ${c.id}.yaml: name "${name}" is already used by ${other}.yaml`);
    seenNames.set(name, c.id);
    for (const r of c.data.related) {
      if (r === name) errors.push(`command ${c.id}: lists itself in related`);
      else if (!commandByName.has(r)) errors.push(`command ${c.id}: related command "${r}" doesn't exist`);
    }
    for (const s of c.data.scenarios) {
      if (!published.has(s)) errors.push(`command ${c.id}: scenario "${s}" doesn't exist (or is a draft)`);
    }
    for (const g of c.data.concepts) {
      if (!publishedGuides.has(g)) errors.push(`command ${c.id}: concept guide "${g}" doesn't exist (or is a draft)`);
    }
  }

  // Scenarios: numbers, links, severities, command pages.
  const seenNumbers = new Map<number, string>();
  for (const scenario of allScenarios) {
    const s = scenario.data;
    const id = scenario.id;
    const other = seenNumbers.get(s.number);
    if (other) errors.push(`scenario ${id}: number ${s.number} is already used by ${other}`);
    seenNumbers.set(s.number, id);

    for (const r of s.related) {
      if (r === id) errors.push(`scenario ${id}: lists itself in related`);
      else if (!published.has(r)) errors.push(`scenario ${id}: related scenario "${r}" doesn't exist (or is a draft)`);
    }
    for (const g of s.concepts) {
      if (!publishedGuides.has(g)) errors.push(`scenario ${id}: concept guide "${g}" doesn't exist (or is a draft)`);
    }

    if (s.draft) continue;

    const programs = new Set<string>();
    const primary = await buildAnatomy(s.primaryCommand, s.anatomy);
    primary.tokens.filter((t) => t.kind === 'program').forEach((t) => programs.add(t.text));
    let expected: Severity = primary.severity;

    // Anatomy notes only attach to tokens of the primary command; a key that matches none is silently dropped.
    const tokenTexts = new Set(primary.tokens.map((t) => t.text));
    for (const key of Object.keys(s.anatomy)) {
      if (!tokenTexts.has(key)) {
        errors.push(`scenario ${id}: anatomy key ${JSON.stringify(key)} matches no token in primaryCommand (tokens: ${[...tokenTexts].map((t) => JSON.stringify(t)).join(', ')})`);
      }
    }

    for (const step of s.steps) {
      if (step.kind) expected = maxSeverity(expected, step.kind);
      if (!step.command) continue;
      if (!step.kind) {
        errors.push(`scenario ${id}: step "${step.title}" has a command but no kind`);
        continue;
      }
      const anatomy = await buildAnatomy(step.command, s.anatomy);
      anatomy.tokens.filter((t) => t.kind === 'program').forEach((t) => programs.add(t.text));
      if (rank(anatomy.severity) > rank(step.kind)) {
        errors.push(`scenario ${id}: step "${step.title}" is marked ${step.kind}, rule engine says ${anatomy.severity} for \`${step.command}\``);
      }
    }

    if (s.severity !== expected) {
      errors.push(`scenario ${id}: severity is ${s.severity}, but its most severe step or primary command is ${expected}`);
    }

    for (const program of programs) {
      if (isPath(program) || NO_PAGE_NEEDED.has(program)) continue;
      const name = COVERED_BY[program] ?? program;
      const page = commandByName.get(name);
      if (!page) warnings.push(`scenario ${id}: runs \`${program}\`, which has no command page`);
      else if (!page.data.scenarios.includes(id)) warnings.push(`command ${name}: doesn't list scenario "${id}" under scenarios`);
    }
  }

  // Guides: order within a track, links, body structure, observe commands.
  const seenOrders = new Map<string, string>();
  for (const guide of allGuides) {
    const g = guide.data;
    const id = guide.id;
    const key = `${g.track}#${g.order}`;
    const other = seenOrders.get(key);
    if (other) errors.push(`guide ${id}: order ${g.order} in track ${g.track} is already used by ${other}`);
    seenOrders.set(key, id);

    for (const p of g.prerequisites) {
      if (p === id) errors.push(`guide ${id}: lists itself in prerequisites`);
      else if (!publishedGuides.has(p)) errors.push(`guide ${id}: prerequisite guide "${p}" doesn't exist (or is a draft)`);
    }
    for (const c of g.commands) {
      if (!commandByName.has(c)) errors.push(`guide ${id}: command "${c}" doesn't exist`);
    }
    for (const sc of g.scenarios) {
      if (!published.has(sc)) errors.push(`guide ${id}: scenario "${sc}" doesn't exist (or is a draft)`);
    }

    if (g.draft) continue;

    const h2s = guideH2s(guide.body ?? '');
    if (h2s.join(' | ') !== GUIDE_BODY_H2S.join(' | ')) {
      errors.push(`guide ${id}: body H2s must be exactly ${GUIDE_BODY_H2S.map((h) => `"## ${h}"`).join(' then ')}; found ${h2s.length ? h2s.map((h) => `"## ${h}"`).join(', ') : 'none'}`);
    }

    // Site links written in the body or in widget text: [text](/s/slug), (/g/slug), (/c/name), (/o/slug).
    for (const [kind, slug] of bodyLinks(guide.body ?? '')) {
      if (!pageExists(kind, slug)) errors.push(`guide ${id}: body links to /${kind}/${slug}, which doesn't exist`);
    }

    for (const o of g.observe) {
      const anatomy = await buildAnatomy(o.command);
      if (anatomy.severity !== 'readonly') {
        errors.push(`guide ${id}: observe command \`${o.command}\` must be readonly, rule engine says ${anatomy.severity}`);
      }
    }

    const linked =
      g.scenarios.length > 0 ||
      g.commands.length > 0 ||
      allScenarios.some((sc) => !sc.data.draft && sc.data.concepts.includes(id)) ||
      commands.some((c) => c.data.concepts.includes(id));
    if (!linked) warnings.push(`guide ${id}: no scenario or command page links to it`);
  }

  // Origins (docs/origins-plan.md §3.5): timeline, people, chapters.
  const eventIds = new Set<string>();
  for (const e of TIMELINE) {
    const where = `timeline event ${e.id}`;
    if (eventIds.has(e.id)) errors.push(`${where}: id is used twice`);
    eventIds.add(e.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) errors.push(`${where}: id must be kebab-case (it's the anchor on /origins/timeline)`);
    if (!isValidEventDate(e.date)) errors.push(`${where}: date "${e.date}" isn't YYYY, YYYY-MM or YYYY-MM-DD`);
    if (!/^https?:\/\/\S+$/.test(e.source)) errors.push(`${where}: source "${e.source}" isn't a URL`);
    if (!TIMELINE_CATEGORIES.includes(e.category)) errors.push(`${where}: unknown category "${e.category}"`);
    const era = ERAS.find((x) => x.id === e.era);
    if (!era) errors.push(`${where}: unknown era "${e.era}"`);
    else if (isValidEventDate(e.date)) {
      const y = eventYear(e.date);
      if (y < era.from || (era.to !== null && y > era.to)) errors.push(`${where}: ${y} is outside the "${era.name}" era (${era.from}–${era.to ?? 'now'})`);
    }
    if (e.chapter && !publishedChapters.has(e.chapter)) errors.push(`${where}: chapter "${e.chapter}" doesn't exist (or is a draft)`);
  }

  const personIds = new Set<string>();
  for (const p of PEOPLE) {
    if (personIds.has(p.id)) errors.push(`person ${p.id}: id is used twice`);
    personIds.add(p.id);
  }

  const distroIds = new Set<string>();
  for (const d of DISTROS) {
    const where = `distro ${d.id}`;
    if (distroIds.has(d.id)) errors.push(`${where}: id is used twice`);
    distroIds.add(d.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id)) errors.push(`${where}: id must be kebab-case (it's used in /origins/distros#distro=…)`);
    if (!DISTRO_FAMILIES.includes(d.family)) errors.push(`${where}: unknown family "${d.family}"`);
    if (!/^https?:\/\/\S+$/.test(d.url)) errors.push(`${where}: url "${d.url}" isn't a URL`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.asOf)) errors.push(`${where}: asOf "${d.asOf}" isn't an ISO date`);
  }
  for (const d of DISTROS) {
    if (!d.parent) continue;
    const parent = DISTROS.find((x) => x.id === d.parent);
    if (!parent) {
      errors.push(`distro ${d.id}: parent "${d.parent}" isn't in data/distros.ts`);
      continue;
    }
    if (parent.founded > d.founded) errors.push(`distro ${d.id}: founded ${d.founded}, before its parent ${parent.id} (${parent.founded})`);
    // Walk up the parents; coming back to d, or taking more steps than there are distros, means a cycle.
    let cur: string | undefined = d.parent;
    for (let steps = 0; cur; steps++) {
      if (cur === d.id || steps > DISTROS.length) {
        errors.push(`distro ${d.id}: its parent chain loops back on itself`);
        break;
      }
      cur = DISTROS.find((x) => x.id === cur)?.parent;
    }
  }

  const seenChapterOrders = new Map<number, string>();
  for (const chapter of allChapters) {
    const c = chapter.data;
    const id = chapter.id;
    const where = `origins chapter ${id}`;
    const other = seenChapterOrders.get(c.order);
    if (other) errors.push(`${where}: order ${c.order} is already used by ${other}`);
    seenChapterOrders.set(c.order, id);

    for (const p of c.people) if (!personIds.has(p)) errors.push(`${where}: person "${p}" isn't in data/people.ts`);
    for (const ev of c.events) if (!eventIds.has(ev)) errors.push(`${where}: timeline event "${ev}" isn't in data/timeline.ts`);
    for (const g of c.guides) if (!publishedGuides.has(g)) errors.push(`${where}: guide "${g}" doesn't exist (or is a draft)`);
    for (const cm of c.commands) if (!commandByName.has(cm)) errors.push(`${where}: command "${cm}" doesn't exist`);
    for (const sc of c.scenarios) if (!published.has(sc)) errors.push(`${where}: scenario "${sc}" doesn't exist (or is a draft)`);
    if (c.asOf !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(c.asOf)) errors.push(`${where}: asOf "${c.asOf}" isn't an ISO date (YYYY-MM-DD)`);

    if (c.draft) continue;

    const h2s = guideH2s(chapter.body ?? '');
    if (h2s[0] !== ORIGINS_FIRST_H2) errors.push(`${where}: the body must start with "## ${ORIGINS_FIRST_H2}"; found ${h2s[0] ? `"## ${h2s[0]}"` : 'no H2'}`);
    if (h2s.at(-1) !== ORIGINS_LAST_H2) errors.push(`${where}: the last H2 must be "## ${ORIGINS_LAST_H2}"; found ${h2s.at(-1) ? `"## ${h2s.at(-1)}"` : 'no H2'}`);
    if (h2s.includes('Further reading')) errors.push(`${where}: don't write "## Further reading"; the page renders it from \`references\``);
    if (h2s.length < 3) errors.push(`${where}: needs at least one topic H2 between "${ORIGINS_FIRST_H2}" and "${ORIGINS_LAST_H2}"`);

    for (const [kind, slug] of bodyLinks(chapter.body ?? '')) {
      if (!pageExists(kind, slug)) errors.push(`${where}: body links to /${kind}/${slug}, which doesn't exist`);
    }
    for (const [, path] of (chapter.body ?? '').matchAll(/\]\((\/origins\/[^)#\s]*)/g)) {
      if (!ORIGINS_PAGES.includes(path!.replace(/\/$/, ''))) errors.push(`${where}: body links to ${path}, which isn't an Origins page`);
    }
  }

  return { errors, warnings };
}

/** The first and last H2 of an Origins chapter body (docs/origins-plan.md §3.1). */
export const ORIGINS_FIRST_H2 = 'The short version';
export const ORIGINS_LAST_H2 = 'Why it matters today';
/** Pages under /origins/ that exist in this phase. */
const ORIGINS_PAGES = ['/origins/timeline', '/origins/distros'];

/** The H2s a guide's MDX body must have, in order. The page renders the rest from frontmatter. */
export const GUIDE_BODY_H2S = ['The mental model', 'Under the hood'];

/** Top-level `## ` headings of a Markdown body, ignoring fenced code blocks. */
function guideH2s(body: string): string[] {
  const withoutFences = body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, '');
  return [...withoutFences.matchAll(/^## +(.+?)\s*#*\s*$/gm)].map((m) => m[1] ?? "");
}

let checked: Promise<void> | null = null;

/** Runs the checks once per process; throws with every error listed if any fail. */
export function assertContentValid(): Promise<void> {
  checked ??= collectContentReport().then(({ errors, warnings }) => {
    for (const w of warnings) console.warn(`[content] ${w}`);
    if (errors.length > 0) {
      throw new Error(`Content check failed with ${errors.length} error(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    }
  });
  return checked;
}
