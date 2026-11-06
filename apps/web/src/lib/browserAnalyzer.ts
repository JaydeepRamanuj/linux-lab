// The rule engine in the browser. Import this module dynamically (`import('./browserAnalyzer')`) so the parser
// and its .wasm files load only on pages that need them.
import { createAnalyzer } from '@linux-lab/core';
import type { Analysis } from '@linux-lab/core';
import parserWasm from 'web-tree-sitter/web-tree-sitter.wasm?url';
import bashWasm from 'tree-sitter-bash/tree-sitter-bash.wasm?url';
import { anatomyFromAnalysis, libraryFromEntries, protectPlaceholders } from './anatomyTokens';
import type { AnatomyData, CommandDocEntry, CommandLibrary } from './anatomyTokens';

export interface Explained {
  analysis: Analysis;
  anatomy: AnatomyData;
  library: CommandLibrary;
  /** Puts `<PLACEHOLDER>` tokens back into text from the analysis. */
  restore: (s: string) => string;
}

export interface BrowserExplainer {
  explain(command: string): Explained;
}

export async function createBrowserExplainer(): Promise<BrowserExplainer> {
  const [analyzer, library] = await Promise.all([
    createAnalyzer({ bashWasm, parserInit: { locateFile: () => parserWasm } }),
    // The library only adds notes, so the Explainer still works without it.
    fetch('/commands.json')
      .then((r) => (r.ok ? (r.json() as Promise<CommandDocEntry[]>) : []))
      .catch(() => [])
      .then(libraryFromEntries)
  ]);

  return {
    explain(command) {
      const { parsable, restore } = protectPlaceholders(command);
      const analysis = analyzer.analyze(parsable);
      return { analysis, anatomy: anatomyFromAnalysis(command, analysis, library, restore), library, restore };
    }
  };
}
