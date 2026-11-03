import { useState, useRef, useEffect } from 'react';
import {
  FolderOpen, Layers, GitCommitHorizontal, Cloud, FileCode2, Pencil, Plus, Undo2, Check, Upload, Inbox, CloudOff,
  BookOpen, Compass, GitBranch, RefreshCw, GraduationCap, Camera, Trash2
} from 'lucide-react';
import Diagram from './Diagram';
import { CommandText } from './ui';

const FILE_NAMES = ['index.js', 'style.css', 'utils.js'];
const INITIAL_COMMIT = { id: 'a1b2c3d', message: 'Initial commit', files: FILE_NAMES };

// Each file tracks two independent facts, exactly like Git:
//   idx — the staged (index) version differs from HEAD
//   wt  — the working-tree version differs from the index
const cleanFiles = () => Object.fromEntries(FILE_NAMES.map((f) => [f, { idx: false, wt: false }]));
const randomHash = () => Math.random().toString(16).slice(2, 9).padEnd(7, '0');

const HELP_LINES = [
  'Supported commands:',
  '  git status                 git add <file> | git add .',
  '  git commit -m "message"    git restore --staged <file>',
  '  git restore <file>         git reset | git reset --hard',
  '  git log                    git push',
  '  git diff                   clear | help',
  'Tip: click the pencil next to a file to "edit" it.'
];

function ZoneCard({ accent, icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className="card p-5 flex flex-col min-h-80 relative overflow-hidden">
      <div className={`absolute top-0 inset-x-0 h-0.5 ${accent}`} />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-on-surface-variant" />
        <h3 className="font-semibold text-on-surface">{title}</h3>
      </div>
      <p className="text-xs text-outline mt-1 mb-4 leading-relaxed">{subtitle}</p>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">{children}</div>
      {footer && <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">{footer}</div>}
    </div>
  );
}

function EmptyZone({ icon: Icon, text }) {
  return (
    <div className="h-full min-h-28 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-outline-variant/60 p-4">
      <Icon className="h-6 w-6 text-outline-variant mb-2" />
      <span className="text-xs text-outline">{text}</span>
    </div>
  );
}

function ZoneButton({ onClick, children, tone = 'ghost', disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-mono transition disabled:opacity-30 disabled:pointer-events-none ${
        tone === 'primary' ? 'btn-primary font-semibold' : 'btn-ghost'
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Concept: HEAD playground ----------

const HEAD_STATES = {
  main: {
    cmd: 'git switch main',
    head: 'ref: refs/heads/main',
    branch: 'main',
    tone: 'text-primary',
    title: 'Attached to main',
    text: 'HEAD points at the branch name main, which points at C3. A new commit would move main forward, and HEAD with it.'
  },
  feature: {
    cmd: 'git switch feature',
    head: 'ref: refs/heads/feature',
    branch: 'feature',
    tone: 'text-safe',
    title: 'Attached to feature',
    text: 'HEAD now follows feature (C4). New commits extend feature; main does not move.'
  },
  detached: {
    cmd: 'git switch --detach C2',
    head: '9e1f2a3… (C2 directly)',
    branch: '(no branch)',
    tone: 'text-danger',
    title: 'Detached HEAD',
    text: 'HEAD points straight at commit C2, not at a branch. You can look around and even commit, but those commits belong to no branch. Create one (git switch -c name) before switching away, or they become hard to find.'
  },
  reset: {
    cmd: 'git reset --hard C1',
    head: 'ref: refs/heads/main',
    branch: 'main',
    tone: 'text-caution',
    title: 'Branch moved back',
    text: 'On main, reset --hard moved the main pointer (and HEAD with it) back to C1. C3 is no longer on any branch and is only reachable via the reflog. C2 survives because feature still contains it.'
  }
};

function headGraph(state) {
  const r = (cond, ref) => (cond ? [ref] : []);
  return {
    kind: 'graph',
    caption: HEAD_STATES[state].title,
    nodes: [
      { id: 'C1', x: 0, tone: state === 'reset' ? 'focus' : 'base', refs: r(state === 'reset', 'HEAD→main') },
      { id: 'C2', x: 1, tone: state === 'detached' ? 'bad' : 'base', refs: r(state === 'detached', 'HEAD') },
      {
        id: 'C3', x: 2, tone: state === 'reset' ? 'ghost' : state === 'main' ? 'focus' : 'base',
        note: state === 'reset' ? 'reflog only' : undefined,
        refs: state === 'main' ? ['HEAD→main'] : state === 'reset' ? [] : ['main']
      },
      { id: 'C4', x: 2, y: 1, tone: state === 'feature' ? 'good' : 'base', refs: [state === 'feature' ? 'HEAD→feature' : 'feature'] }
    ],
    edges: [['C1', 'C2'], ['C2', 'C3', state === 'reset' ? 'ghost' : undefined], ['C2', 'C4']]
  };
}

function HeadPlayground() {
  const [state, setState] = useState('main');
  const s = HEAD_STATES[state];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full animate-fade-in">
      <div className="lg:col-span-2 space-y-4 text-sm text-on-surface-variant leading-relaxed">
        <h3 className="text-lg font-semibold text-on-surface">HEAD is “you are here”</h3>
        <p>
          <strong className="text-on-surface">HEAD</strong> is a pointer to what you currently have checked out. Usually it
          points at a <em>branch name</em>, and the branch points at a commit. Git uses HEAD to decide which snapshot is in your
          working directory and what the parent of your next commit will be.
        </p>
        <ul className="space-y-2">
          <li><code className="font-mono text-primary">git switch &lt;branch&gt;</code>: HEAD follows another branch.</li>
          <li><code className="font-mono text-safe">git commit</code>: the current branch moves forward, and HEAD comes along.</li>
          <li><code className="font-mono text-caution">git reset &lt;commit&gt;</code>: moves the current branch (and HEAD) to another commit.</li>
          <li><code className="font-mono text-danger">git switch --detach &lt;commit&gt;</code>: HEAD points at a commit directly.</li>
        </ul>
      </div>
      <div className="lg:col-span-3 well p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(HEAD_STATES).map(([key, v]) => (
            <button
              key={key}
              type="button"
              onClick={() => setState(key)}
              aria-pressed={state === key}
              className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] border transition ${
                state === key ? 'bg-primary-deep/30 border-primary/60 text-primary' : 'bg-surface-container border-white/5 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {v.cmd}
            </button>
          ))}
        </div>
        <div key={state} className="rounded-lg bg-surface-container/40 p-3">
          <Diagram spec={headGraph(state)} />
        </div>
        <div className={`font-display font-semibold ${s.tone}`}>{s.title}</div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{s.text}</p>
        <div className="rounded-lg bg-surface-container/60 p-3 font-mono text-[12px] space-y-1.5">
          <div className="flex justify-between gap-3">
            <span className="text-outline">cat .git/HEAD</span>
            <span className="text-caution text-right">{s.head}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-outline">current branch</span>
            <span className={s.branch.startsWith('(') ? 'text-danger' : 'text-on-surface'}>{s.branch}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const BRANCH_GRAPH = {
  kind: 'graph',
  caption: 'After git switch -c feature and one commit',
  nodes: [
    { id: 'C1', x: 0 }, { id: 'C2', x: 1 }, { id: 'C3', x: 2, refs: ['main'] },
    { id: 'C4', x: 3, y: 1, tone: 'good', note: 'new commit', refs: ['HEAD→feature'] }
  ],
  edges: [['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4']]
};

function Concepts() {
  const [tab, setTab] = useState('commit');
  const tabs = [
    { id: 'commit', label: 'What is a commit?', icon: Camera },
    { id: 'head', label: 'Understanding HEAD', icon: Compass },
    { id: 'branch', label: 'What is a branch?', icon: GitBranch },
    { id: 'sync', label: 'Fetch, pull & push', icon: RefreshCw }
  ];
  return (
    <section className="card p-5 sm:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-[22px] font-semibold">Core concepts</h2>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-surface-low border border-white/5 overflow-x-auto no-scrollbar" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] whitespace-nowrap transition ${
              tab === id ? 'bg-surface-high text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-64">
        {tab === 'commit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
            <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
              <h3 className="text-lg font-semibold text-on-surface">A snapshot, not a diff</h3>
              <p>
                A commit records the <strong className="text-on-surface">complete state of every tracked file</strong> as it
                was in the staging area, plus who made it, when, why (the message), and a pointer to its parent commit(s).
                Unchanged files are stored once and shared between commits, so snapshots stay cheap.
              </p>
              <p>
                The commit’s ID (hash) is computed from all of that content. Change anything, including the message, and you
                get a different hash. That is why amend, rebase and reset “rewrite history”.
              </p>
            </div>
            <div className="well p-5 font-mono text-[12px] space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="label-caps text-outline">git cat-file -p HEAD</span>
                <span className="text-tertiary">9f3e4b7</span>
              </div>
              <div className="space-y-1 text-on-surface-variant">
                <div><span className="text-outline">tree</span>      4b825dc… <span className="text-outline-variant"># full snapshot</span></div>
                <div><span className="text-outline">parent</span>    a1b2c3d…</div>
                <div><span className="text-outline">author</span>    Jane Doe &lt;jane@example.com&gt;</div>
                <div><span className="text-outline">committer</span> Jane Doe &lt;jane@example.com&gt;</div>
              </div>
              <div className="pt-2 border-t border-white/5 text-on-surface">feat: build login module</div>
            </div>
          </div>
        )}

        {tab === 'head' && <HeadPlayground />}

        {tab === 'branch' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
            <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
              <h3 className="text-lg font-semibold text-on-surface">Branches are lightweight pointers</h3>
              <p>
                A branch is just a <strong className="text-on-surface">name that points at one commit</strong>, stored as a tiny
                file containing a hash. Creating one copies nothing, which is why branching in Git is instant.
              </p>
              <p>
                When you commit, the branch HEAD is attached to moves forward to the new commit automatically. Other branches
                stay where they are.
              </p>
            </div>
            <div className="well p-4 space-y-2">
              <Diagram spec={BRANCH_GRAPH} />
              <p className="text-xs text-outline text-center">{BRANCH_GRAPH.caption}</p>
            </div>
          </div>
        )}

        {tab === 'sync' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
            <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
              <h3 className="text-lg font-semibold text-on-surface">Syncing is always explicit</h3>
              <p>Git is distributed: your clone is a full repository. Nothing moves between it and the remote until you ask.</p>
              <ul className="space-y-2">
                <li>
                  <code className="font-mono text-secondary">git fetch</code>: downloads new commits and updates
                  remote-tracking refs like <code className="font-mono">origin/main</code>. Your branches and files are untouched,
                  so it is always safe.
                </li>
                <li>
                  <code className="font-mono text-caution">git pull</code>: fetch, then integrate into your current branch by
                  merge (default) or rebase (<code className="font-mono">--rebase</code>). This is where conflicts can happen.
                </li>
                <li>
                  <code className="font-mono text-primary">git push</code>: uploads your commits and moves the remote branch.
                  It is rejected if the remote has commits you don’t have.
                </li>
              </ul>
            </div>
            <div className="well p-5 font-mono text-[12px] space-y-2">
              <div className="flex justify-between label-caps text-outline pb-2 border-b border-white/5">
                <span>Command</span>
                <span>Direction</span>
              </div>
              {[
                ['git push', 'text-primary', 'local branch → remote'],
                ['git fetch', 'text-secondary', 'remote → origin/* refs'],
                ['git pull', 'text-caution', 'remote → origin/* → your branch']
              ].map(([cmd, tone, dir]) => (
                <div key={cmd} className="flex justify-between items-center rounded-md bg-surface-container px-3 py-2">
                  <span className={`font-semibold ${tone}`}>{cmd}</span>
                  <span className="text-on-surface-variant text-[11px]">{dir}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Sandbox ----------

export default function GitBasics() {
  const [files, setFiles] = useState(cleanFiles);
  const [commits, setCommits] = useState([INITIAL_COMMIT]);
  const [pushedCount, setPushedCount] = useState(1); // first N commits exist on origin/main
  const [logs, setLogs] = useState([
    { text: 'Welcome to the GitGyan sandbox. Nothing here touches a real repository.', type: 'info' },
    { text: 'Edit a file with the pencil icon, then try: git status, git add ., git commit -m "msg", git push', type: 'info' }
  ]);
  const [input, setInput] = useState('');
  const screenRef = useRef(null);

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const out = (...entries) => setLogs((prev) => [...prev, ...entries.map((e) => (typeof e === 'string' ? { text: e, type: 'output' } : e))]);
  const echo = (cmd) => ({ text: cmd, type: 'input' });

  const head = commits[commits.length - 1];
  const ahead = commits.length - pushedCount;
  const stagedFiles = FILE_NAMES.filter((f) => files[f].idx);
  const modifiedFiles = FILE_NAMES.filter((f) => files[f].wt);

  const updateFiles = (fn) => setFiles((prev) => Object.fromEntries(FILE_NAMES.map((f) => [f, fn(f, prev[f])])));

  const editFile = (name) => {
    updateFiles((f, st) => (f === name ? { ...st, wt: true } : st));
    out(echo(`vim ${name}   # (simulated edit)`), `Saved ${name}.`);
  };

  const gitAdd = (target = '.') => {
    const cmd = `git add ${target}`;
    const affected = target === '.' ? modifiedFiles : modifiedFiles.filter((f) => f === target);
    if (target !== '.' && !FILE_NAMES.includes(target)) {
      out(echo(cmd), { text: `fatal: pathspec '${target}' did not match any files`, type: 'error' });
      return;
    }
    updateFiles((f, st) => (affected.includes(f) ? { idx: true, wt: false } : st));
    out(echo(cmd));
    if (affected.length === 0) out({ text: '(nothing changed, so nothing new to stage)', type: 'info' });
  };

  const gitCommit = (message = 'update files', all = false) => {
    const cmd = `git commit ${all ? '-am' : '-m'} "${message}"`;
    // -a stages every modified tracked file first
    const toCommit = all ? FILE_NAMES.filter((f) => files[f].idx || files[f].wt) : stagedFiles;
    if (toCommit.length === 0) {
      const dirty = modifiedFiles.length > 0;
      out(
        echo(cmd),
        'On branch main',
        dirty ? 'Changes not staged for commit. Use "git add" first.' : 'nothing to commit, working tree clean',
        ...(dirty ? [{ text: 'no changes added to commit', type: 'error' }] : [])
      );
      return;
    }
    const id = randomHash();
    setCommits((prev) => [...prev, { id, message, files: toCommit }]);
    updateFiles((f, st) => (all ? { idx: false, wt: false } : { ...st, idx: false }));
    out(echo(cmd), `[main ${id}] ${message}`, ` ${toCommit.length} file${toCommit.length > 1 ? 's' : ''} changed`);
  };

  const gitRestore = (target, staged) => {
    const cmd = `git restore ${staged ? '--staged ' : ''}${target}`;
    const names = target === '.' ? FILE_NAMES : [target];
    if (!names.every((n) => FILE_NAMES.includes(n))) {
      out(echo(cmd), { text: `error: pathspec '${target}' did not match any file(s) known to git`, type: 'error' });
      return;
    }
    if (staged) {
      // Unstage: staged changes go back to being working-tree changes.
      updateFiles((f, st) => (names.includes(f) && st.idx ? { idx: false, wt: true } : st));
    } else {
      // Discard working-tree edits (back to the index version). Destructive.
      updateFiles((f, st) => (names.includes(f) ? { ...st, wt: false } : st));
    }
    out(echo(cmd));
  };

  const gitReset = (hard) => {
    const cmd = hard ? 'git reset --hard' : 'git reset';
    if (hard) {
      setFiles(cleanFiles());
      out(echo(cmd), `HEAD is now at ${head.id} ${head.message}`);
    } else {
      const unstaged = stagedFiles;
      updateFiles((f, st) => (st.idx ? { idx: false, wt: true } : st));
      out(echo(cmd), ...(unstaged.length ? ['Unstaged changes after reset:', ...unstaged.map((f) => `M\t${f}`)] : []));
    }
  };

  const gitPush = () => {
    const cmd = 'git push origin main';
    if (ahead === 0) {
      out(echo(cmd), 'Everything up-to-date');
      return;
    }
    const from = commits[pushedCount - 1].id;
    setPushedCount(commits.length);
    out(
      echo(cmd),
      `Enumerating objects: ${ahead * 4}, done.`,
      `Writing objects: 100% (${ahead * 3}/${ahead * 3}), done.`,
      'To github.com:you/gitgyan-sandbox.git',
      `   ${from}..${head.id}  main -> main`
    );
  };

  const gitStatus = () => {
    const lines = [echo('git status'), 'On branch main'];
    lines.push(
      ahead > 0
        ? `Your branch is ahead of 'origin/main' by ${ahead} commit${ahead > 1 ? 's' : ''}.\n  (use "git push" to publish your local commits)`
        : "Your branch is up to date with 'origin/main'."
    );
    if (stagedFiles.length) {
      lines.push('\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)');
      stagedFiles.forEach((f) => lines.push({ text: `\tmodified:   ${f}`, type: 'success' }));
    }
    if (modifiedFiles.length) {
      lines.push('\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)');
      modifiedFiles.forEach((f) => lines.push({ text: `\tmodified:   ${f}`, type: 'error' }));
    }
    if (!stagedFiles.length && !modifiedFiles.length) lines.push('\nnothing to commit, working tree clean');
    out(...lines);
  };

  const gitLog = () => {
    const lines = [echo('git log --oneline')];
    [...commits].reverse().forEach((c, i) => {
      const idx = commits.length - 1 - i;
      const decos = [];
      if (idx === commits.length - 1) decos.push('HEAD -> main');
      if (idx === pushedCount - 1) decos.push('origin/main');
      lines.push({ text: `${c.id} ${decos.length ? `(${decos.join(', ')}) ` : ''}${c.message}`, type: 'output' });
    });
    out(...lines);
  };

  const gitDiff = (staged) => {
    const list = staged ? stagedFiles : modifiedFiles;
    out(echo(staged ? 'git diff --staged' : 'git diff'));
    if (!list.length) return;
    list.forEach((f) =>
      out(`diff --git a/${f} b/${f}`, { text: `-  // old line in ${f}`, type: 'error' }, { text: `+  // edited line in ${f}`, type: 'success' })
    );
  };

  const run = (raw) => {
    const cmd = raw.trim().replace(/\s+/g, ' ');
    if (!cmd) return;
    if (cmd === 'clear') return setLogs([]);
    if (cmd === 'help') return out(echo('help'), ...HELP_LINES.map((t) => ({ text: t, type: 'info' })));
    if (cmd === 'git status') return gitStatus();
    if (cmd === 'git add') return out(echo(cmd), { text: 'Nothing specified, nothing added. Maybe you wanted to say \'git add .\'?', type: 'error' });
    if (cmd === 'git add -A' || cmd === 'git add --all') return gitAdd('.');
    if (cmd.startsWith('git add ')) return gitAdd(cmd.slice(8));
    const commitMatch = cmd.match(/^git commit -(a?)m (["'])(.+)\2$/);
    if (commitMatch) return gitCommit(commitMatch[3], commitMatch[1] === 'a');
    if (cmd === 'git commit') return out(echo(cmd), { text: 'Use -m "message" here (a real git would open your editor).', type: 'info' });
    if (cmd.startsWith('git restore --staged ')) return gitRestore(cmd.slice(21), true);
    if (cmd.startsWith('git restore ')) return gitRestore(cmd.slice(12), false);
    if (cmd === 'git reset' || cmd === 'git reset --mixed') return gitReset(false);
    if (cmd === 'git reset --hard') return gitReset(true);
    if (cmd === 'git push' || cmd === 'git push origin main' || cmd === 'git push origin') return gitPush();
    if (cmd === 'git log' || cmd === 'git log --oneline') return gitLog();
    if (cmd === 'git diff') return gitDiff(false);
    if (cmd === 'git diff --staged' || cmd === 'git diff --cached') return gitDiff(true);
    out(echo(cmd), { text: `Not supported in this sandbox: ${cmd}`, type: 'error' }, { text: 'Type "help" for the list of commands.', type: 'info' });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    run(input);
    setInput('');
  };

  const fileBadge = (st) => {
    if (st.wt && st.idx) return { text: 'Staged + modified', cls: 'bg-caution/15 text-caution' };
    if (st.wt) return { text: 'Modified', cls: 'bg-caution/15 text-caution' };
    if (st.idx) return { text: 'Staged', cls: 'bg-safe/15 text-safe' };
    return { text: 'Clean', cls: 'bg-surface-highest text-outline' };
  };

  const pushedCommits = commits.slice(0, pushedCount);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Intro */}
      <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-white/8 bg-linear-to-br from-surface-high via-surface-container to-surface-container shadow-xl animate-fade-in">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-tertiary-container/20 border border-tertiary/30 flex items-center justify-center shrink-0">
            <GraduationCap className="h-7 w-7 text-tertiary" />
          </div>
          <div className="space-y-2">
            <span className="label-caps text-tertiary">Git basics sandbox</span>
            <h1 className="text-2xl sm:text-3xl font-bold">Watch files move through Git’s four areas</h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
              Edit a file in the <strong className="text-caution">working directory</strong>, stage it in the{' '}
              <strong className="text-safe">staging area</strong>, commit it to your{' '}
              <strong className="text-primary">local repository</strong>, and push it to the{' '}
              <strong className="text-secondary">remote</strong>. Use the buttons or type real commands in the terminal below.
            </p>
          </div>
        </div>
      </section>

      {/* Four zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ZoneCard
          accent="bg-caution"
          icon={FolderOpen}
          title="1. Working directory"
          subtitle="The files on your disk. Edits live here until you stage them."
          footer={
            <>
              <ZoneButton onClick={() => gitAdd('.')} disabled={!modifiedFiles.length} tone="primary">
                <Plus className="h-3.5 w-3.5" /> git add .
              </ZoneButton>
              <ZoneButton onClick={() => gitRestore('.', false)} disabled={!modifiedFiles.length}>
                <Trash2 className="h-3.5 w-3.5" /> restore
              </ZoneButton>
            </>
          }
        >
          {FILE_NAMES.map((name) => {
            const st = files[name];
            const badge = fileBadge(st);
            return (
              <div
                key={name}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border font-mono text-xs transition ${
                  st.wt ? 'bg-caution-surface/60 border-caution/30 text-caution' : 'bg-surface-low border-white/5 text-on-surface-variant'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <FileCode2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{name}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-sans font-bold ${badge.cls}`}>{badge.text}</span>
                  <button
                    type="button"
                    onClick={() => editFile(name)}
                    aria-label={`Edit ${name}`}
                    title="Simulate editing this file"
                    className="p-1 rounded text-outline hover:text-on-surface hover:bg-white/5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            );
          })}
        </ZoneCard>

        <ZoneCard
          accent="bg-safe"
          icon={Layers}
          title="2. Staging area"
          subtitle="Also called the index: exactly what the next commit will contain."
          footer={
            <>
              <ZoneButton onClick={() => gitReset(false)} disabled={!stagedFiles.length}>
                <Undo2 className="h-3.5 w-3.5" /> unstage
              </ZoneButton>
              <ZoneButton onClick={() => gitCommit()} disabled={!stagedFiles.length} tone="primary">
                <Check className="h-3.5 w-3.5" /> commit
              </ZoneButton>
            </>
          }
        >
          {stagedFiles.length === 0 ? (
            <EmptyZone icon={Inbox} text="Nothing staged" />
          ) : (
            stagedFiles.map((name) => (
              <div key={name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-safe-surface/60 border border-safe/30 text-safe font-mono text-xs animate-fade-in">
                <span className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4" />
                  {name}
                </span>
                <span className="text-[9px] uppercase font-sans font-bold">staged</span>
              </div>
            ))
          )}
        </ZoneCard>

        <ZoneCard
          accent="bg-primary"
          icon={GitCommitHorizontal}
          title="3. Local repository"
          subtitle="Your commit history, saved in .git on your machine."
          footer={
            <ZoneButton onClick={gitPush} disabled={ahead === 0} tone="primary">
              <Upload className="h-3.5 w-3.5" /> git push {ahead > 0 && `(${ahead})`}
            </ZoneButton>
          }
        >
          {[...commits].reverse().map((c, i) => {
            const local = commits.length - 1 - i >= pushedCount;
            return (
              <div
                key={c.id}
                className={`px-3 py-2.5 rounded-lg border text-xs animate-fade-in ${
                  local ? 'bg-primary-deep/15 border-primary/30' : 'bg-surface-low border-white/5'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className={local ? 'text-primary' : 'text-outline'}>{c.id}</span>
                  <span className="flex gap-1">
                    {i === 0 && <span className="px-1.5 rounded bg-primary-container text-surface-lowest text-[9px] font-bold">HEAD → main</span>}
                    <span className={`px-1.5 rounded text-[9px] uppercase font-sans font-bold ${local ? 'bg-primary/15 text-primary' : 'bg-surface-highest text-outline'}`}>
                      {local ? 'not pushed' : 'pushed'}
                    </span>
                  </span>
                </div>
                <div className="text-on-surface mt-1">{c.message}</div>
              </div>
            );
          })}
        </ZoneCard>

        <ZoneCard accent="bg-secondary" icon={Cloud} title="4. Remote (origin)" subtitle="The shared copy on GitHub/GitLab that teammates pull from.">
          {pushedCommits.length === 0 ? (
            <EmptyZone icon={CloudOff} text="No commits on the remote yet" />
          ) : (
            [...pushedCommits].reverse().map((c, i) => (
              <div key={c.id} className="px-3 py-2.5 rounded-lg bg-secondary/5 border border-secondary/20 text-xs animate-fade-in">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-secondary">{c.id}</span>
                  {i === 0 && <span className="px-1.5 rounded bg-surface-high text-secondary text-[9px]">origin/main</span>}
                </div>
                <div className="text-on-surface-variant mt-1">{c.message}</div>
              </div>
            ))
          )}
          {ahead > 0 && (
            <p className="text-[11px] text-caution font-mono pt-1">origin/main is {ahead} commit{ahead > 1 ? 's' : ''} behind your main</p>
          )}
        </ZoneCard>
      </div>

      {/* Terminal */}
      <section className="rounded-xl bg-surface-lowest border border-white/5 overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]">
        <div className="h-10 px-4 bg-surface-high/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger/80" />
            <span className="w-3 h-3 rounded-full bg-caution/80" />
            <span className="w-3 h-3 rounded-full bg-safe/80" />
            <span className="ml-2 font-mono text-[11px] text-outline">sandbox — main</span>
          </div>
          <span className="font-mono text-[11px] text-outline">type “help”</span>
        </div>
        <div ref={screenRef} className="h-72 overflow-y-auto p-4 sm:p-5 font-mono text-[12.5px] leading-relaxed">
          {logs.map((log, i) =>
            log.type === 'input' ? (
              <div key={i} className="flex gap-2 text-on-surface mt-1 first:mt-0">
                <span className="text-secondary select-none">$</span>
                <CommandText command={log.text} />
              </div>
            ) : (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  { error: 'text-danger', success: 'text-safe', info: 'text-tertiary' }[log.type] ?? 'text-on-surface-variant'
                }`}
              >
                {log.text}
              </div>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 pt-3 border-t border-white/5">
          {['git status', 'git add .', 'git commit -m "my change"', 'git log', 'git diff', 'git push'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => run(c)}
              className="px-2 py-1 rounded-md bg-surface-container border border-white/5 hover:border-primary-container/40 text-[11px] font-mono text-on-surface-variant hover:text-on-surface transition"
            >
              {c}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2 p-3">
          <span className="font-mono text-secondary pl-1">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Sandbox command"
            placeholder='git commit -m "message"'
            className="flex-1 bg-transparent font-mono text-[13px] text-on-surface placeholder:text-outline-variant focus:outline-none"
          />
          <button type="submit" className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold">
            Run
          </button>
        </form>
      </section>

      <Concepts />
    </div>
  );
}
