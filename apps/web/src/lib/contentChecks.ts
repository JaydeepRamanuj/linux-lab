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
//     "The mental model" then "Under the hood"; the body links to a /s/, /g/ or /c/ page that doesn't exist
// Warnings (printed as `[content] …`; the plan's definition of done is zero of them):
//   - a scenario runs a program that has no command page
//   - a command page exists for a program a scenario runs, but doesn't list that scenario under `scenarios`
//   - a guide isn't linked from any scenario or command page (in either direction)
import { getCollection } from 'astro:content';
import { maxSeverity, rank } from '@shellgyan/core/severity';
import type { Severity } from '@shellgyan/core/severity';
import { buildAnatomy } from './anatomy';

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

    // Site links written in the body or in widget text: [text](/s/slug), (/g/slug), (/c/name).
    for (const [, kind, slug] of (guide.body ?? '').matchAll(/\]\(\/([scg])\/([^)#\s/]+)\/?(?:#[^)\s]*)?\)/g)) {
      const ok = kind === 's' ? published.has(slug!) : kind === 'g' ? publishedGuides.has(slug!) : commandByName.has(slug!);
      if (!ok) errors.push(`guide ${id}: body links to /${kind}/${slug}, which doesn't exist`);
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

  return { errors, warnings };
}

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
