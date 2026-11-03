import { createRequire } from 'node:module';
import { createAnalyzer } from './analyze';
import type { Analyzer } from './analyze';

export * from './index';

/** Analyzer for Node (CLI, hook, tests): loads the grammar from node_modules. */
export function createNodeAnalyzer(): Promise<Analyzer> {
  const require = createRequire(import.meta.url);
  return createAnalyzer({ bashWasm: require.resolve('tree-sitter-bash/tree-sitter-bash.wasm') });
}
