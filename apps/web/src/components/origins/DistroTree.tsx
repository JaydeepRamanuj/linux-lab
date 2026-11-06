// The distro family tree (docs/origins-plan.md §5.2): one collapsible card per family, each an indented tree
// drawn from `parent` links, with founding years. Works the same at every width, so a phone gets per-family
// lists instead of a wide diagram.
//
// Full mode (/origins/distros, hydrated): filters for family, release model and "active only" (non-matching
// distros are dimmed, not removed, so the tree keeps its shape), and a detail panel for the selected distro. The
// selection is kept in the URL hash (#distro=ubuntu). Compact mode (embedded in a chapter, static): every distro
// links to its detail on /origins/distros.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X, GitBranch } from 'lucide-react';
import { Prose } from '../ui/ui';
import { ACCENTS } from '../../lib/theme';
import type { Accent } from '../../lib/theme';
import { DISTRO_FAMILIES, FAMILY_LABEL, FAMILY_SUMMARY, RELEASE_MODEL_LABEL } from '../../data/distros';
import type { Distro, DistroFamily, ReleaseModel } from '../../data/distros';

export const FAMILY_ACCENT: Record<DistroFamily, Accent> = {
  debian: 'rose',
  redhat: 'orange',
  arch: 'cyan',
  suse: 'emerald',
  slackware: 'indigo',
  gentoo: 'purple',
  independent: 'indigo'
};

const STATUS_LABEL = { active: 'Active', discontinued: 'Discontinued', changed: 'Changed' } as const;
const HASH_PREFIX = '#distro=';

interface Props {
  distros: Distro[];
  /** Static, linked version for chapters: no filters, no panel. */
  compact?: boolean;
}

export default function DistroTree({ distros, compact = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [family, setFamily] = useState<DistroFamily | 'all'>('all');
  const [model, setModel] = useState<ReleaseModel | 'all'>('all');
  const [activeOnly, setActiveOnly] = useState(false);
  // The phone bottom sheet is portalled into <body>: <main>'s fade-in leaves a transform, which would make
  // `position: fixed` relative to <main> instead of the screen.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const byId = new Map(distros.map((d) => [d.id, d]));

  useEffect(() => {
    if (compact) return;
    const sync = () => {
      const h = window.location.hash;
      const id = h.startsWith(HASH_PREFIX) ? h.slice(HASH_PREFIX.length) : null;
      setSelected(id && byId.has(id) ? id : null);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  const select = (id: string | null) => {
    setSelected(id);
    window.history.replaceState(null, '', id ? `${HASH_PREFIX}${id}` : window.location.pathname + window.location.search);
  };

  const matches = (d: Distro) => (model === 'all' || d.releaseModel === model) && (!activeOnly || d.status === 'active');
  const children = (id: string, fam: DistroFamily) =>
    distros.filter((d) => d.parent === id && d.family === fam).sort((a, b) => a.founded - b.founded || a.name.localeCompare(b.name));
  const crossFamily = (id: string, fam: DistroFamily) => distros.filter((d) => d.parent === id && d.family !== fam);
  const roots = (fam: DistroFamily) =>
    distros.filter((d) => d.family === fam && (!d.parent || byId.get(d.parent)?.family !== fam)).sort((a, b) => a.founded - b.founded);

  const families = DISTRO_FAMILIES.filter((f) => family === 'all' || f === family).filter((f) => roots(f).length > 0);
  const current = selected ? byId.get(selected) : undefined;
  const shown = distros.filter((d) => (family === 'all' || d.family === family) && matches(d)).length;

  const renderNode = (d: Distro, fam: DistroFamily) => {
    const kids = children(d.id, fam);
    const others = crossFamily(d.id, fam);
    const accent = ACCENTS[FAMILY_ACCENT[fam]];
    const dim = !matches(d);
    const isSel = selected === d.id;
    const label = (
      <>
        <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'active' ? accent.dot : 'bg-outline-variant'}`} aria-hidden="true" />
        <span className="font-medium text-on-surface leading-snug min-w-0 break-words">{d.name}</span>
        <span className="font-mono text-[11px] text-outline shrink-0">{d.founded}</span>
        {d.status !== 'active' && <span className="label-caps text-outline-variant shrink-0">{STATUS_LABEL[d.status]}</span>}
      </>
    );
    const cls = `w-full min-w-0 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition ${dim ? 'opacity-35' : ''} ${
      isSel ? 'bg-surface-high ring-1 ring-primary-container/60' : 'hover:bg-surface-container'
    }`;
    return (
      <li key={d.id}>
        {compact ? (
          <a href={`/origins/distros${HASH_PREFIX}${d.id}`} className={cls}>
            {label}
          </a>
        ) : (
          <button type="button" className={cls} aria-pressed={isSel} onClick={() => select(isSel ? null : d.id)}>
            {label}
          </button>
        )}
        {others.length > 0 && (
          <p className="ml-6 text-[11px] text-outline">
            Also the base of {others.map((o, i) => (
              <span key={o.id}>
                {i > 0 && ', '}
                <span className="text-on-surface-variant">{o.name}</span> ({FAMILY_LABEL[o.family]})
              </span>
            ))}
          </p>
        )}
        {kids.length > 0 && (
          <ul className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
            {kids.map((k) => renderNode(k, fam))}
          </ul>
        )}
      </li>
    );
  };

  const tree = (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2`}>
      {families.map((f) => {
        const accent = ACCENTS[FAMILY_ACCENT[f]];
        const count = distros.filter((d) => d.family === f).length;
        return (
          <details key={f} open className="group/fam card p-4 min-w-0 self-start">
            <summary className="cursor-pointer list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
              <GitBranch className={`h-4 w-4 shrink-0 ${accent.text}`} />
              <span className="font-display font-semibold text-on-surface">{FAMILY_LABEL[f]}</span>
              <span className="font-mono text-[11px] text-outline">{count}</span>
              <span className="ml-auto text-outline transition group-open/fam:rotate-90" aria-hidden="true">
                ›
              </span>
            </summary>
            {!compact && (
              <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
                <Prose text={FAMILY_SUMMARY[f]} />
              </p>
            )}
            <ul className="mt-3 space-y-0.5">
              {roots(f).map((r) => (
                <li key={r.id} className="list-none">
                  {r.parent && byId.get(r.parent) && (
                    <p className="text-[11px] text-outline px-2">
                      Based on {byId.get(r.parent)!.name} ({FAMILY_LABEL[byId.get(r.parent)!.family]})
                    </p>
                  )}
                  <ul>{renderNode(r, f)}</ul>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <figure className="not-prose my-6 space-y-3">
        {tree}
        <figcaption className="text-xs text-outline">
          Founding years are first public releases. Grey dots are discontinued or changed. <a href="/origins/distros" className="text-tertiary underline underline-offset-3">Open the full tree</a> for filters and details.
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by family">
          <Chip label="All families" active={family === 'all'} onClick={() => setFamily('all')} />
          {DISTRO_FAMILIES.map((f) => (
            <Chip key={f} label={FAMILY_LABEL[f]} accent={FAMILY_ACCENT[f]} active={family === f} onClick={() => setFamily(f)} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          <label className="flex items-center gap-2 text-on-surface-variant">
            Release model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ReleaseModel | 'all')}
              className="rounded-lg bg-surface-low border border-white/10 px-2 py-1 text-on-surface"
            >
              <option value="all">Any</option>
              {(Object.keys(RELEASE_MODEL_LABEL) as ReleaseModel[]).map((m) => (
                <option key={m} value={m}>
                  {RELEASE_MODEL_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-on-surface-variant">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="accent-primary" />
            Active only
          </label>
          <span className="font-mono text-[11px] text-outline ml-auto">
            {shown} of {distros.length} match
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-5 items-start">
        {tree}
        {current ? (
          <Detail variant="side" d={current} parent={current.parent ? byId.get(current.parent) : undefined} kids={distros.filter((x) => x.parent === current.id)} onSelect={select} />
        ) : (
          <aside className="hidden lg:block card p-5 text-sm text-on-surface-variant lg:sticky lg:top-24">Pick a distribution to see its package format, release model, init system and what it’s known for.</aside>
        )}
      </div>
      {mounted &&
        current &&
        createPortal(
          <Detail variant="sheet" d={current} parent={current.parent ? byId.get(current.parent) : undefined} kids={distros.filter((x) => x.parent === current.id)} onSelect={select} />,
          document.body
        )}
    </div>
  );
}

function Chip({ label, active, accent, onClick }: { label: string; active: boolean; accent?: Accent; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${
        active ? 'bg-surface-high border-primary-container/50 text-on-surface font-semibold' : 'bg-surface-low border-white/8 text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {accent && <span className={`w-2 h-2 rounded-full ${ACCENTS[accent].dot}`} aria-hidden="true" />}
      {label}
    </button>
  );
}

function Detail({ d, parent, kids, onSelect, variant }: { d: Distro; parent?: Distro; kids: Distro[]; onSelect: (id: string | null) => void; variant: 'side' | 'sheet' }) {
  const rows: [string, string][] = [
    ['Family', FAMILY_LABEL[d.family]],
    ['First release', String(d.founded)],
    ['Packages', `${d.packageFormat} · ${d.packageManager}`],
    ['Release model', RELEASE_MODEL_LABEL[d.releaseModel]],
    ['Init system', d.init],
    ['Status', STATUS_LABEL[d.status]]
  ];
  return (
    <aside
      aria-label={`${d.name} details`}
      className={
        variant === 'side'
          ? 'hidden lg:block card p-5 space-y-4 lg:sticky lg:top-24'
          : 'lg:hidden card bg-surface-low! p-5 space-y-4 fixed inset-x-3 bottom-3 z-50 max-h-[70vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.6)]'
      }
    >
      <div className="flex items-start gap-3">
        <h2 className="flex-1 text-xl font-semibold text-on-surface">{d.name}</h2>
        <button type="button" onClick={() => onSelect(null)} aria-label="Close details" className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-white/5">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        <Prose text={d.note} />
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-outline">{k}</dt>
            <dd className="text-on-surface">{v}</dd>
          </div>
        ))}
        {parent && (
          <div className="contents">
            <dt className="text-outline">Based on</dt>
            <dd>
              <button type="button" onClick={() => onSelect(parent.id)} className="text-tertiary hover:underline underline-offset-3">
                {parent.name}
              </button>
            </dd>
          </div>
        )}
        {kids.length > 0 && (
          <div className="contents">
            <dt className="text-outline">Base of</dt>
            <dd className="flex flex-wrap gap-x-2">
              {kids.map((k) => (
                <button key={k.id} type="button" onClick={() => onSelect(k.id)} className="text-tertiary hover:underline underline-offset-3">
                  {k.name}
                </button>
              ))}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-tertiary hover:underline underline-offset-3">
          <ExternalLink className="h-3.5 w-3.5" />
          Project site
        </a>
        <span className="font-mono text-[11px] text-outline">as of {d.asOf}</span>
      </div>
    </aside>
  );
}
