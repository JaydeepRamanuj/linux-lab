// "Layers": a vertical stack (user space over kernel over hardware, the network stack) with a highlighted path
// through it. Static: rendered at build time, no JavaScript. Guides plan §5.
import { Prose } from '../ui/ui';

export type LayerTone = 'user' | 'kernel' | 'hardware' | 'base';

export interface LayersSpec {
  title?: string;
  caption?: string;
  /** Short label for the highlighted path, shown in the legend (e.g. "Your command's path"). */
  pathLabel?: string;
  layers: {
    name: string;
    detail?: string;
    /** Small mono chips inside the layer (program names, files, syscalls). */
    chips?: string[];
    tone?: LayerTone;
    /** Part of the highlighted path. */
    highlight?: boolean;
    /** Label for the boundary below this layer (e.g. "system call"). */
    edge?: string;
  }[];
}

const TONES: Record<LayerTone, { box: string; name: string }> = {
  user: { box: 'bg-primary-deep/10 border-primary/20', name: 'text-primary' },
  kernel: { box: 'bg-secondary/8 border-secondary/25', name: 'text-secondary' },
  hardware: { box: 'bg-surface-high/60 border-white/8', name: 'text-on-surface-variant' },
  base: { box: 'bg-surface-container/60 border-white/6', name: 'text-on-surface' }
};

export default function Layers({ spec }: { spec: LayersSpec }) {
  const lit = spec.layers.map((l) => Boolean(l.highlight));
  const first = lit.indexOf(true);
  const last = lit.lastIndexOf(true);
  const onPath = (i: number) => first !== -1 && i >= first && i <= last;

  return (
    <figure className="not-prose well p-4 sm:p-5 my-6 space-y-3">
      {(spec.title || spec.pathLabel) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {spec.title && <figcaption className="label-caps text-outline">{spec.title}</figcaption>}
          {spec.pathLabel && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-tertiary">
              <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(76,215,246,0.7)]" />
              {spec.pathLabel}
            </span>
          )}
        </div>
      )}
      <ol className="space-y-0" aria-label={spec.title ?? 'Layers'}>
        {spec.layers.map((layer, i) => {
          const tone = TONES[layer.tone ?? 'base'];
          const pathBelow = onPath(i) && i < last;
          return (
            <li key={layer.name} className="grid grid-cols-[1.25rem_1fr] gap-x-3">
              {/* Path rail: a dot on highlighted layers, a line between them. */}
              <div className="relative flex justify-center" aria-hidden="true">
                {onPath(i) && i > first && <span className="absolute top-0 h-1/2 w-0.5 bg-tertiary/60" />}
                {pathBelow && <span className="absolute bottom-0 h-1/2 w-0.5 bg-tertiary/60" />}
                <span
                  className={`relative mt-[1.1rem] w-2.5 h-2.5 rounded-full self-start ${
                    layer.highlight ? 'bg-tertiary shadow-[0_0_10px_rgba(76,215,246,0.75)]' : 'bg-outline-variant'
                  }`}
                />
              </div>
              <div
                className={`rounded-xl border px-3.5 py-3 min-w-0 ${tone.box} ${layer.highlight ? 'ring-1 ring-tertiary/40' : ''}`}
              >
                <div className={`font-display font-semibold text-[15px] ${tone.name}`}>
                  {layer.name}
                  {layer.highlight && <span className="sr-only"> (on the path)</span>}
                </div>
                {layer.detail && (
                  <p className="text-[13px] text-on-surface-variant leading-relaxed mt-1">
                    <Prose text={layer.detail} />
                  </p>
                )}
                {layer.chips && layer.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {layer.chips.map((c) => (
                      <span key={c} className="rounded-md border border-white/6 bg-surface-lowest/70 px-2 py-0.5 font-mono text-[11px] text-on-surface-variant break-all">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {i < spec.layers.length - 1 && (
                <>
                  <div className="relative flex justify-center" aria-hidden="true">
                    {pathBelow && <span className="absolute inset-y-0 w-0.5 bg-tertiary/60" />}
                  </div>
                  <div className="flex items-center gap-2 py-1.5 min-h-3">
                    {layer.edge && (
                      <>
                        <span className="h-px w-4 border-t border-dashed border-outline-variant shrink-0" />
                        <span className={`font-mono text-[11px] ${pathBelow ? 'text-tertiary' : 'text-outline'}`}>
                          <Prose text={layer.edge} />
                        </span>
                        <span className="h-px flex-1 border-t border-dashed border-outline-variant" />
                      </>
                    )}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {spec.caption && (
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <Prose text={spec.caption} />
        </p>
      )}
    </figure>
  );
}
