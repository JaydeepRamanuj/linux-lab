// Build-time only: runs the rule engine in Node and feeds lib/anatomyTokens.ts the command library
// from the content collection. Runs in Astro frontmatter, never in the browser.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import { createNodeAnalyzer } from '@linux-lab/core/node';
import type { Analysis, Analyzer } from '@linux-lab/core';
import { anatomyFromAnalysis, libraryFromEntries, protectPlaceholders } from './anatomyTokens';
import type { AnatomyData, CommandDocEntry, CommandLibrary } from './anatomyTokens';

export type { AnatomyData, AnatomyToken } from './anatomyTokens';

let analyzer: Promise<Analyzer> | null = null;
export function analyze(command: string): Promise<Analysis> {
  // This module gets bundled, so point the core at its real location to find the parser's .wasm files.
  analyzer ??= createNodeAnalyzer({ from: createRequire(join(process.cwd(), 'package.json')).resolve('@linux-lab/core/package.json') });
  return analyzer.then((a) => a.analyze(command));
}

/** The library fields anatomy needs, for every command entry. Also served as /commands.json. */
export async function commandDocEntries(): Promise<CommandDocEntry[]> {
  const entries = await getCollection('commands');
  return entries.map((e) => ({ name: e.data.name, summary: e.data.summary, flags: e.data.flags }));
}

let library: Promise<CommandLibrary> | null = null;

export async function buildAnatomy(command: string, overrides: Record<string, string> = {}): Promise<AnatomyData> {
  const { parsable, restore } = protectPlaceholders(command);
  library ??= commandDocEntries().then(libraryFromEntries);
  const [analysis, lib] = await Promise.all([analyze(parsable), library]);
  return anatomyFromAnalysis(command, analysis, lib, restore, overrides);
}
