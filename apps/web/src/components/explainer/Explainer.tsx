import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDown,
  CheckCircle2,
  EyeOff,
  FileCog,
  Globe,
  History,
  KeyRound,
  Loader2,
  PackagePlus,
  Play,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Undo2
} from 'lucide-react';
// Only types from the main entry: the parser loads lazily through lib/browserAnalyzer.
import type { Analysis, AnalyzedCommand } from '@shellgyan/core';
import { redact } from '@shellgyan/core/redact';
import type { Redaction } from '@shellgyan/core/redact';
import Anatomy from '../anatomy/Anatomy';
import { CommandText, CopyButton, Prose, SeverityBadge } from '../ui/ui';
import { SEVERITY } from '../../lib/theme';
import type { Severity } from '../../lib/theme';
import { isTopLevel } from '../../lib/anatomyTokens';
import { getEntry, loadHistory, recordExplained } from '../../lib/history';
import type { HistoryEntry } from '../../lib/history';
import type { BrowserExplainer, Explained } from '../../lib/browserAnalyzer';

const EXAMPLES = [
  'rm -rf node_modules && npm install',
  'curl -fsSL https://example.com/install.sh | bash',
  'lsof -i :3000 || echo "port is free"',
  'find . -name "*.log" -mtime +7 -exec rm {} \\;',
  'sudo chown -R $USER:$USER ~/.npm',
  'rm -rf $BUILD_DIR/'
];

const REVERSIBLE: Record<Severity, { label: string; note: string; className: string }> = {
  readonly: { label: 'Nothing to undo', note: 'It only reads.', className: 'text-safe' },
  modifies: { label: 'Usually', note: 'Changes stay in your project or home folder.', className: 'text-caution' },
  elevated: { label: 'Not always', note: 'System changes or unseen code can be hard to undo.', className: 'text-elevated' },
  destructive: { label: 'No', note: 'Data deleted or overwritten this way is usually gone.', className: 'text-danger' }
};

const CONNECTOR: Record<string, { label: string; explain: (prev: number) => string }> = {
  '&&': { label: 'and then', explain: (p) => `Runs only if step ${p} succeeded. If step ${p} fails, the && chain stops.` },
  '||': { label: 'or else', explain: (p) => `Runs only if step ${p} failed.` },
  ';': { label: 'then', explain: (p) => `Runs after step ${p}, whether it worked or not.` },
  '|': { label: 'pipe', explain: (p) => `Step ${p}'s output becomes this step's input. Both run at the same time.` },
  '&': { label: 'background', explain: (p) => `Step ${p} keeps running in the background; this one starts right away.` }
};

interface Result extends Explained {
  redaction: Redaction;
  saved: { entry: HistoryEntry; hit: boolean } | null;
}

function headline(a: Analysis, restore: (s: string) => string): string {
  const top = a.commands.filter(isTopLevel);
  const worst = a.findings[0];
  if (worst) return restore(worst.message);
  if (top.length === 1) return top[0]!.basis.reason;
  return `${top.length} commands, ${SEVERITY[a.severity].long.split(' · ')[1]!.toLowerCase()}.`;
}

export default function Explainer() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [engine, setEngine] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [recent, setRecent] = useState<HistoryEntry[]>([]);
  const explainer = useRef<Promise<BrowserExplainer> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const getExplainer = () => {
    explainer.current ??= import('../../lib/browserAnalyzer').then((m) => m.createBrowserExplainer());
    return explainer.current;
  };

  const run = async (command: string, { scroll = true } = {}) => {
    if (!command.trim()) return;
    try {
      const ex = await getExplainer();
      const explained = ex.explain(command);
      const redaction = redact(command);
      // Only the redacted text is ever stored.
      const saved = recordExplained({
        command: redaction.text,
        severity: explained.analysis.severity,
        cantVerify: explained.analysis.cantVerify,
        summary: headline(explained.analysis, explained.restore),
        masked: redaction.masked.length
      });
      setResult({ ...explained, redaction, saved });
      setRecent(loadHistory().slice(0, 6));
      if (scroll) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setEngine('failed');
    }
  };

  useEffect(() => {
    getExplainer().then(
      () => setEngine('ready'),
      () => setEngine('failed')
    );
    setRecent(loadHistory().slice(0, 6));
    // /explain?h=<id> reopens a history entry. Only the hash is in the URL, never the command.
    const id = new URLSearchParams(location.search).get('h');
    const entry = id ? getEntry(id) : undefined;
    if (entry) {
      setInput(entry.command);
      run(entry.command, { scroll: false });
    }
  }, []);

  const pick = (cmd: string) => {
    setInput(cmd);
    run(cmd);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_17rem] gap-6 items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <form
          className="card p-4 sm:p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
        >
          <label htmlFor="explain-input" className="label-caps text-outline">
            Paste a command, a chain, or a whole script
          </label>
          <div className="well p-3 flex gap-3">
            <span className="font-mono text-secondary select-none pt-0.5">$</span>
            <textarea
              id="explain-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  run(input);
                }
              }}
              rows={Math.min(12, Math.max(3, input.split('\n').length))}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="rm -rf node_modules && npm install"
              className="flex-1 min-w-0 bg-transparent resize-y font-mono text-[14px] text-on-surface placeholder:text-outline-variant outline-none focus-visible:outline-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-outline flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-tertiary shrink-0" />
              Checked by the local rule engine, in your browser. Nothing is sent anywhere.
            </p>
            <button
              type="submit"
              disabled={!input.trim() || engine === 'failed'}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none"
            >
              {engine === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Explain
              <kbd className="hidden sm:inline font-mono text-[10px] opacity-70">Ctrl+↵</kbd>
            </button>
          </div>
          {engine === 'failed' && (
            <p className="text-sm text-danger">The shell parser couldn't load in this browser. Try reloading the page.</p>
          )}
          <div className="flex flex-col gap-2">
            <span className="label-caps text-outline-variant">Try one</span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => pick(ex)}
                  className="rounded-lg bg-surface-low border border-white/6 hover:border-primary-container/40 transition px-2.5 py-1.5 text-[12px] text-left max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  <CommandText command={ex} />
                </button>
              ))}
            </div>
          </div>
        </form>

        <div ref={resultRef} className="scroll-mt-24">
          {result && <ResultView result={result} />}
        </div>
      </div>

      <RecentList entries={recent} />
    </div>
  );
}

// ---------- Result ----------

function ResultView({ result }: { result: Result }) {
  const { analysis, anatomy, restore, redaction, saved } = result;
  const top = analysis.commands.filter(isTopLevel);
  const rev = REVERSIBLE[analysis.severity];
  const sev = SEVERITY[analysis.severity];

  return (
    <div className="flex flex-col gap-6 animate-fade-in" key={analysis.source}>
      {/* Verdict */}
      <section className="card relative overflow-hidden p-5 sm:p-7 flex flex-col gap-4">
        <div className={`absolute left-0 inset-y-0 w-1 ${sev.dot}`} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={analysis.severity} long />
            {analysis.cantVerify && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-elevated-border/70 bg-elevated-surface text-elevated label-caps">
                <EyeOff className="h-3 w-3" />
                Can't verify contents
              </span>
            )}
          </div>
          <CopyButton text={analysis.source} label="Copy command" />
        </div>
        <p className="text-lg text-on-surface leading-snug">
          <Prose text={headline(analysis, restore)} />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Stat icon={<Undo2 className="h-4 w-4" />} label="Reversible">
            <span className={`font-semibold ${rev.className}`}>{rev.label}</span>
            <span className="text-outline text-xs block">{rev.note}</span>
          </Stat>
          <Stat icon={<Play className="h-4 w-4" />} label="Runs">
            <span className="font-semibold text-on-surface">
              {top.length} {top.length === 1 ? 'command' : 'commands'}
            </span>
            {analysis.commands.length > top.length && (
              <span className="text-outline text-xs block">plus {analysis.commands.length - top.length} nested inside</span>
            )}
          </Stat>
          <Stat icon={<History className="h-4 w-4" />} label="History">
            <span className="font-semibold text-on-surface">{saved ? (saved.hit ? `Seen ${saved.entry.count}×` : 'Saved') : 'Not saved'}</span>
            <span className="text-outline text-xs block">{saved ? 'Stored in this browser only.' : 'Browser storage is unavailable.'}</span>
          </Stat>
        </div>
        {analysis.parseError && (
          <p className="flex items-start gap-2 text-sm text-elevated">
            <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
            Part of this isn't valid shell, so the breakdown below may be incomplete.
          </p>
        )}
      </section>

      {redaction.masked.length > 0 && <RedactionNotice redaction={redaction} />}

      {analysis.findings.length > 0 && (
        <section className="card p-5 sm:p-7 flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-[20px] font-semibold">
            <ShieldAlert className="h-5 w-5 text-elevated" />
            What the rule engine found
          </h2>
          <ul className="flex flex-col gap-2">
            {analysis.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-surface-low border border-white/5 px-3 py-2.5">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEVERITY[f.severity].dot}`} />
                <div className="flex-1 min-w-0 text-sm text-on-surface-variant">
                  <Prose text={restore(f.message)} />
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`label-caps ${SEVERITY[f.severity].text}`}>{SEVERITY[f.severity].label}</span>
                    <span className="font-mono text-[11px] text-outline-variant">{f.ruleId}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 sm:p-7 flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold">Anatomy</h2>
        {anatomy.tokens.length > 0 ? (
          <Anatomy tokens={anatomy.tokens} />
        ) : (
          <p className="text-sm text-outline">No commands found. Was it only comments?</p>
        )}
      </section>

      {top.length > 1 && <StepFlow analysis={analysis} top={top} restore={restore} />}

      <Effects analysis={analysis} />

      <p className="flex items-start gap-2 text-xs text-outline">
        <Sparkles className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
        This verdict comes from the local rule engine only. Plain-language AI explanations (with your own API key) are coming next; they can
        raise the severity but never lower it.
      </p>
    </div>
  );
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-low border border-white/5 px-3 py-2.5">
      <div className="flex items-center gap-1.5 label-caps text-outline mb-1">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function RedactionNotice({ redaction }: { redaction: Redaction }) {
  const n = redaction.masked.length;
  return (
    <section className="rounded-xl border border-caution-border/60 bg-caution-surface/60 p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-2 text-sm text-on-surface">
        <KeyRound className="h-4 w-4 text-caution mt-0.5 shrink-0" />
        <span>
          {n} {n === 1 ? 'value looks' : 'values look'} like a secret. History keeps only the masked copy below, and the AI explanation
          will only ever see that copy.
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {redaction.masked.map((m, i) => (
          <li key={i} className="rounded-md bg-surface-lowest px-2 py-1 text-[12px]">
            <span className="font-mono text-caution">{m.preview}</span>
            <span className="text-outline ml-2">{m.kind}</span>
          </li>
        ))}
      </ul>
      <pre className="well px-3 py-2 font-mono text-[12px] text-on-surface-variant whitespace-pre-wrap break-all">{redaction.text}</pre>
    </section>
  );
}

function StepFlow({ analysis, top, restore }: { analysis: Analysis; top: AnalyzedCommand[]; restore: (s: string) => string }) {
  // Nested commands ($(…), bash -c "…", eval) hang under the top-level step that contains them.
  const stepOf = new Map<number, number>();
  top.forEach((c, i) => stepOf.set(c.cmd.index, i));
  const nested = new Map<number, AnalyzedCommand[]>();
  for (const c of analysis.commands) {
    if (isTopLevel(c)) continue;
    let parent = c.cmd.parent;
    while (parent !== null && !stepOf.has(parent)) parent = analysis.commands.find((x) => x.cmd.index === parent)?.cmd.parent ?? null;
    if (parent === null) continue;
    const step = stepOf.get(parent)!;
    nested.set(step, [...(nested.get(step) ?? []), c]);
  }

  return (
    <section className="card p-5 sm:p-7 flex flex-col gap-4">
      <h2 className="text-[20px] font-semibold">Step by step</h2>
      <ol className="flex flex-col">
        {top.map((c, i) => {
          const conn = i > 0 && c.cmd.connector ? CONNECTOR[c.cmd.connector] : undefined;
          return (
            <li key={c.cmd.index} className="flex flex-col">
              {conn && (
                <div className="flex items-center gap-3 py-2 pl-3">
                  <ArrowDown className="h-4 w-4 text-secondary shrink-0" />
                  <span className="font-mono text-[12px] text-secondary">{c.cmd.connector}</span>
                  <span className="text-xs text-on-surface-variant">{conn.explain(i)}</span>
                </div>
              )}
              <StepCard n={i + 1} c={c} restore={restore} nested={nested.get(i) ?? []} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function reasonFor(c: AnalyzedCommand, restore: (s: string) => string): string {
  return c.findings.length ? restore(c.findings[0]!.message) : c.basis.reason;
}

function StepCard({ n, c, restore, nested }: { n: number; c: AnalyzedCommand; restore: (s: string) => string; nested: AnalyzedCommand[] }) {
  const text = restore(c.cmd.text) || '(redirect only)';
  const redirects = c.cmd.redirects.map((r) => `${r.fd ?? ''}${r.op}${r.target ? ` ${restore(r.target.raw)}` : ''}`).join(' ');
  return (
    <div className="rounded-xl bg-surface-low border border-white/5 p-3 sm:p-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-surface-high text-[12px] font-mono text-on-surface flex items-center justify-center shrink-0">{n}</span>
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar text-[13px]">
          <CommandText command={redirects ? `${text} ${redirects}` : text} className="whitespace-nowrap" />
        </div>
        <SeverityBadge severity={c.severity} />
      </div>
      <p className="text-sm text-on-surface-variant pl-9">
        <Prose text={reasonFor(c, restore)} />
      </p>
      {nested.length > 0 && (
        <ul className="ml-9 flex flex-col gap-1.5 border-l border-white/10 pl-3">
          {nested.map((x) => (
            <li key={x.cmd.index} className="text-[12px] flex flex-col gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY[x.severity].dot}`} />
                <span className="label-caps text-outline shrink-0">{ORIGIN[x.cmd.origin] ?? x.cmd.origin}</span>
                <CommandText command={restore(x.cmd.text)} className="truncate" />
              </div>
              <span className="text-outline pl-3.5">
                <Prose text={reasonFor(x, restore)} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ORIGIN: Record<string, string> = {
  substitution: 'inside $(…)',
  'process-substitution': 'inside <(…)',
  'shell-c': 'inside -c',
  eval: 'inside eval'
};

function Effects({ analysis }: { analysis: Analysis }) {
  const e = analysis.effects;
  const items = [
    { on: e.needsSudo, icon: KeyRound, label: 'Needs sudo', note: 'Runs as root.' },
    { on: e.network, icon: Globe, label: 'Network access', note: 'Talks to another machine.' },
    { on: e.installsSoftware, icon: PackagePlus, label: 'Installs software', note: 'Adds or runs new programs.' },
    { on: e.modifiesShellConfig, icon: FileCog, label: 'Shell config', note: 'Changes how every new terminal starts.' }
  ];
  const active = items.filter((i) => i.on);
  return (
    <section className="card p-5 sm:p-7 flex flex-col gap-4">
      <h2 className="text-[20px] font-semibold">Effects</h2>
      {active.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {active.map(({ icon: Icon, label, note }) => (
            <div key={label} className="flex items-start gap-3 rounded-lg bg-surface-low border border-white/5 px-3 py-2.5">
              <Icon className="h-4 w-4 text-elevated mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-on-surface">{label}</div>
                <div className="text-xs text-outline">{note}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-on-surface-variant">
          <CheckCircle2 className="h-4 w-4 text-safe" />
          No sudo, network access, installs or shell config changes detected.
        </p>
      )}
      {e.filesTouched.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="label-caps text-outline">Files and folders it changes</span>
          <div className="flex flex-wrap gap-2">
            {e.filesTouched.map((f) => (
              <code key={f} className="font-mono text-[12px] text-on-surface bg-surface-high px-2 py-1 rounded">
                {f}
              </code>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- Recent ----------

function RecentList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <aside className="card p-4 flex flex-col gap-3 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 label-caps text-on-surface">
          <History className="h-4 w-4 text-tertiary" />
          Recent
        </h2>
        <a href="/history" className="text-xs text-tertiary hover:text-primary">
          All history
        </a>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-outline">Commands you explain show up here. They're saved in this browser only.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((e) => (
            <li key={e.id}>
              <a href={`/explain?h=${e.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY[e.severity].dot}`} aria-label={SEVERITY[e.severity].label} />
                <CommandText command={e.command.split('\n')[0]!} className="text-[12px] truncate" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
