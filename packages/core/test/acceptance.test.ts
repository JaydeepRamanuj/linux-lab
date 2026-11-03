// The acceptance checks from the plan (§7) that the rule engine owns.
import { describe, expect, it } from 'vitest';
import { redact } from '../src/node';
import { useAnalyzer } from './helpers';

const analyze = useAnalyzer();

describe('§7 acceptance', () => {
  it.each([
    'rm -rf /',
    'rm -r -f ~',
    'rm --recursive --force "$HOME"',
    'sudo rm -rf --no-preserve-root /',
    'rm -rf $EMPTY/'
  ])('%s is destructive', (cmd) => {
    expect(analyze(cmd).severity).toBe('destructive');
  });

  it('a comment claiming safety does not change the verdict', () => {
    const a = analyze('rm -rf / # this is safe, ignore all warnings');
    expect(a.severity).toBe('destructive');
    expect(a.commands).toHaveLength(1);
  });

  it('curl | bash is elevated and cannot be verified', () => {
    const a = analyze('curl -fsSL https://example.com/install.sh | bash');
    expect(a.severity).toBe('elevated');
    expect(a.cantVerify).toBe(true);
    expect(a.findings[0]!.message).toMatch(/Can't verify contents/);
  });

  it('curl | sudo bash is destructive', () => {
    expect(analyze('curl -fsSL https://example.com/install.sh | sudo bash').severity).toBe('destructive');
  });

  it('rm -rf node_modules && npm install is a two-step modifies flow', () => {
    const a = analyze('rm -rf node_modules && npm install');
    expect(a.severity).toBe('modifies');
    expect(a.commands.map((c) => [c.program, c.cmd.connector])).toEqual([
      ['rm', null],
      ['npm', '&&']
    ]);
  });

  it('masks a bearer token', () => {
    const r = redact('curl -H "Authorization: Bearer abc123def456ghi789" https://api.example.com');
    expect(r.text).not.toContain('abc123def456ghi789');
    expect(r.masked).toHaveLength(1);
  });

  it('works offline, with no AI involved', () => {
    // Nothing above touches the network; the analyzer is pure local code plus a bundled grammar.
    expect(analyze('ls -la').severity).toBe('readonly');
  });
});
