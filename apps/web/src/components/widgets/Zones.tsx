// "Zones" before/after panel: columns (e.g. ~/Downloads, ~/Applications, menu entries) holding chips.
// Carried over from GitGyan as the generic state view until the dedicated widgets
// (FileTree, PermissionGrid, ProcessTable, ...) exist.

export type ChipTone = 'base' | 'good' | 'bad' | 'focus' | 'caution' | 'ghost';

export interface ZonesSpec {
  kind: 'zones';
  title?: string;
  caption?: string;
  zones: { title: string; empty?: string; items: { text: string; tone?: ChipTone; note?: string }[] }[];
}

const CHIP_TONES: Record<ChipTone, string> = {
  base: 'bg-surface-high/70 border-white/5 text-on-surface-variant',
  good: 'bg-tertiary-container/20 border-tertiary/30 text-tertiary',
  bad: 'bg-danger-surface border-danger/40 text-danger',
  focus: 'bg-primary-deep/20 border-primary/30 text-primary',
  caution: 'bg-caution-surface border-caution/40 text-caution',
  ghost: 'bg-transparent border-dashed border-outline-variant text-outline'
};

export default function Zones({ spec }: { spec: ZonesSpec }) {
  // Stagger chips across all zones in reading order.
  const offsets: number[] = [];
  spec.zones.reduce((n, zone) => {
    offsets.push(n);
    return n + zone.items.length;
  }, 0);
  return (
    <div className={`grid gap-2 ${spec.zones.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {spec.zones.map((zone, zi) => (
        <div key={zone.title} className="rounded-lg bg-surface-container/50 border border-white/5 p-2.5 min-w-0">
          <div className="label-caps text-outline mb-2 text-[10px]! truncate">{zone.title}</div>
          <div className="space-y-1.5">
            {zone.items.length === 0 && (
              <div className="text-[11px] font-mono text-outline/70 italic px-1 py-1.5">{zone.empty ?? 'empty'}</div>
            )}
            {zone.items.map((item, ii) => {
              const delay = ((offsets[zi] ?? 0) + ii + 1) * 90;
              return (
                <div
                  key={item.text}
                  className={`animate-fade-in rounded-md border px-2 py-1.5 font-mono text-[11px] leading-snug break-words ${
                    CHIP_TONES[item.tone ?? 'base']
                  }`}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {item.text}
                  {item.note && <div className="text-[10px] opacity-75 mt-0.5 font-sans">{item.note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
