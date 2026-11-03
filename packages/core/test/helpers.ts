import { beforeAll } from 'vitest';
import { createNodeAnalyzer } from '../src/node';
import type { Analysis, Analyzer } from '../src/node';

let analyzer: Analyzer;

export function useAnalyzer() {
  beforeAll(async () => {
    analyzer ??= await createNodeAnalyzer();
  });
  return (source: string): Analysis => analyzer.analyze(source);
}
