import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { createAnalyzer } from './analyze';
import type { Analyzer } from './analyze';

export * from './index';

export interface NodeAnalyzerOptions {
  /**
   * A file inside this package (or any folder that can resolve its dependencies) to look up the
   * .wasm files from. Defaults to this module. Bundlers move this module, so a bundled caller
   * passes the package's real location, e.g. `require.resolve('@linux-lab/core/package.json')`.
   */
  from?: string;
}

/** Analyzer for Node (CLI, hook, tests, build scripts): loads the grammar from node_modules. */
export function createNodeAnalyzer(options: NodeAnalyzerOptions = {}): Promise<Analyzer> {
  const require = createRequire(options.from ?? import.meta.url);
  const runtimeDir = dirname(require.resolve('web-tree-sitter/web-tree-sitter.wasm'));
  return createAnalyzer({
    bashWasm: require.resolve('tree-sitter-bash/tree-sitter-bash.wasm'),
    parserInit: { locateFile: (file: string) => join(runtimeDir, file) }
  });
}
