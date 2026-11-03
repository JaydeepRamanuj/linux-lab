import { describe, expect, it } from 'vitest';
import { canonPath } from '../src/node';
import { useAnalyzer } from './helpers';

const analyze = useAnalyzer();

describe('parsing into simple commands', () => {
  it('splits chains with their connectors', () => {
    const a = analyze('a && b || c; d & e');
    expect(a.commands.map((c) => [c.program, c.cmd.connector])).toEqual([
      ['a', null],
      ['b', '&&'],
      ['c', '||'],
      ['d', ';'],
      ['e', '&']
    ]);
  });

  it('records pipeline position', () => {
    const a = analyze('ps aux | grep node | wc -l');
    expect(a.commands.map((c) => c.cmd.pipeline)).toEqual([
      { id: 0, index: 0, length: 3 },
      { id: 0, index: 1, length: 3 },
      { id: 0, index: 2, length: 3 }
    ]);
  });

  it('finds commands inside $(…) with depth and parent', () => {
    const a = analyze('kill $(lsof -t -i :3000)');
    const lsof = a.commands.find((c) => c.program === 'lsof')!;
    expect(lsof.cmd.depth).toBe(1);
    expect(lsof.cmd.origin).toBe('substitution');
    expect(lsof.cmd.parent).toBe(0);
  });

  it('attaches redirects, including ones nested in a heredoc', () => {
    const a = analyze("cat <<'EOF' > out.txt\nhello\nEOF");
    expect(a.commands[0]!.cmd.redirects.map((r) => [r.op, r.target?.value ?? null])).toEqual([
      ['<<', null],
      ['>', 'out.txt']
    ]);
  });

  it.each(['a && b > f', 'a | b > f', 'a; b > f'])('binds the redirect in %s to the last command only', (src) => {
    const a = analyze(src);
    expect(a.commands.map((c) => c.cmd.redirects.length)).toEqual([0, 1]);
  });

  it('applies a group redirect to every command in the group', () => {
    const a = analyze('{ a; b; } > f');
    expect(a.commands.map((c) => c.cmd.redirects.length)).toEqual([1, 1]);
  });

  it('tracks quoting and variables on words', () => {
    const [rm] = analyze('rm -rf "$DIR"/build $X').commands;
    const [quoted, bare] = rm!.operands;
    expect(quoted).toMatchObject({ value: '$DIR/build', quoted: true, unquotedVar: false, startsWithExpansion: true, vars: ['DIR'] });
    expect(bare).toMatchObject({ value: '$X', unquotedVar: true });
  });

  it('keeps comments out of the command list', () => {
    expect(analyze('ls # rm -rf /').commands).toHaveLength(1);
  });
});

describe('normalisation', () => {
  it('unwraps sudo, env, nohup and nice', () => {
    const [c] = analyze('sudo -u bob env FOO=1 nohup nice -n 10 rm -rf x').commands;
    expect(c!.program).toBe('rm');
    expect(c!.sudo).toBe(true);
    expect(c!.wrappers).toEqual(['sudo', 'env', 'nohup', 'nice']);
  });

  it('merges short flags and maps long ones', () => {
    const [c] = analyze('rm -r -f --interactive=never x').commands;
    expect([...c!.short].sort()).toEqual(['f', 'i', 'r']);
    expect(c!.long.has('interactive')).toBe(true);
  });

  it('treats everything after -- as operands', () => {
    const [c] = analyze('rm -- -rf').commands;
    expect(c!.short.size).toBe(0);
    expect(c!.operands.map((w) => w.value)).toEqual(['-rf']);
  });

  it('marks xargs targets as unknown', () => {
    const c = analyze('find . -name x | xargs -0 rm').commands[1]!;
    expect(c.program).toBe('rm');
    expect(c.viaXargs).toBe(true);
  });
});

describe('canonPath', () => {
  it.each([
    ['/', '/', false],
    ['//', '/', false],
    ['/tmp/../', '/', false],
    ['/*', '/', true],
    ['~', '~', false],
    ['~/', '~', false],
    ['$HOME', '~', false],
    ['${HOME}/docs/', '~/docs', false],
    ['~/*', '~', true],
    ['*', '.', true],
    ['./dist/', 'dist', false],
    ['$PWD', '.', false],
    ['$DIR/', '$DIR', false]
  ])('%s → %s (glob %s)', (input, path, glob) => {
    expect(canonPath(input)).toEqual({ path, glob });
  });
});
