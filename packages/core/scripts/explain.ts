// Dev helper: pnpm explain "<command>"   (or pipe a script in: pnpm explain < script.sh)
import { readFileSync } from 'node:fs';
import { createNodeAnalyzer, redact, SEVERITY_EMOJI } from '../src/node';

const input = process.argv.slice(2).join(' ') || (process.stdin.isTTY ? '' : readFileSync(0, 'utf8'));
if (!input.trim()) {
  console.error('Usage: pnpm explain "<command>"');
  process.exit(2);
}

const analyzer = await createNodeAnalyzer();
const a = analyzer.analyze(input);

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

console.log(`\n${SEVERITY_EMOJI[a.severity]} ${bold(a.severity.toUpperCase())}${a.cantVerify ? "  · can't verify contents" : ''}\n`);

for (const c of a.commands) {
  const indent = '  '.repeat(c.cmd.depth);
  const link = c.cmd.connector ? `${c.cmd.connector} ` : '';
  const via = c.cmd.origin === 'top' ? '' : dim(` (${c.cmd.origin})`);
  const wrap = c.wrappers.length ? dim(` [${c.wrappers.join(' → ')}]`) : '';
  console.log(`${indent}${SEVERITY_EMOJI[c.severity]} ${dim(link)}${c.cmd.text || dim('(redirect only)')}${wrap}${via}`);
  if (!c.findings.length) console.log(`${indent}   ${dim(c.basis.reason)}`);
  for (const f of c.findings) console.log(`${indent}   ${SEVERITY_EMOJI[f.severity]} ${f.message} ${dim(`[${f.ruleId}]`)}`);
}
for (const f of a.findings.filter((x) => x.commandIndex === null)) {
  console.log(`${SEVERITY_EMOJI[f.severity]} ${f.message} ${dim(`[${f.ruleId}]`)}`);
}

const e = a.effects;
const flags = Object.entries({ sudo: e.needsSudo, network: e.network, installs: e.installsSoftware, 'shell config': e.modifiesShellConfig })
  .filter(([, v]) => v)
  .map(([k]) => k);
console.log(`\n${dim('effects:')} ${flags.join(', ') || 'none'}${e.filesTouched.length ? dim('  touches: ') + e.filesTouched.join(', ') : ''}`);

const r = redact(input);
if (r.masked.length) console.log(`${dim('redacted for AI:')} ${r.masked.length} value(s) masked → ${r.text}`);
console.log();
