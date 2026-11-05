import { LifeBuoy, Activity, FolderLock, Package, Bot, AlertTriangle, ShieldAlert, X, Circle, SquareTerminal, FolderTree, KeyRound, GitFork, Cpu, ServerCog, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Severity } from '@shellgyan/core/severity';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  LifeBuoy,
  Activity,
  FolderLock,
  Package,
  Bot,
  // Guide tracks
  SquareTerminal,
  FolderTree,
  KeyRound,
  GitFork,
  Cpu,
  ServerCog,
  Network
};

export type Accent = 'indigo' | 'purple' | 'orange' | 'emerald' | 'rose' | 'cyan';

// Per-category accent classes, spelled out so Tailwind can see them.
export const ACCENTS: Record<Accent, { text: string; bg: string; ring: string; dot: string }> = {
  indigo: { text: 'text-primary', bg: 'bg-primary-container/15', ring: 'border-primary-container/30', dot: 'bg-primary' },
  purple: { text: 'text-secondary', bg: 'bg-secondary/10', ring: 'border-secondary/30', dot: 'bg-secondary' },
  orange: { text: 'text-caution', bg: 'bg-caution/10', ring: 'border-caution/30', dot: 'bg-caution' },
  emerald: { text: 'text-safe', bg: 'bg-safe/10', ring: 'border-safe/30', dot: 'bg-safe' },
  rose: { text: 'text-danger', bg: 'bg-danger/10', ring: 'border-danger/30', dot: 'bg-danger' },
  cyan: { text: 'text-tertiary', bg: 'bg-tertiary/10', ring: 'border-tertiary/30', dot: 'bg-tertiary' }
};

// The four severity levels (plan §5.3) are defined once, in the rule engine.
export { SEVERITY_LEVELS } from '@shellgyan/core/severity';
export type { Severity };

export const SEVERITY: Record<
  Severity,
  { label: string; long: string; Icon: LucideIcon; badge: string; text: string; dot: string }
> = {
  readonly: {
    label: 'Read-only',
    long: 'Read-only · Only inspects',
    Icon: Circle,
    badge: 'bg-safe-surface text-safe border-safe-border/70',
    text: 'text-safe',
    dot: 'bg-safe'
  },
  modifies: {
    label: 'Modifies',
    long: 'Modifies · Changes your files, recoverable',
    Icon: AlertTriangle,
    badge: 'bg-caution-surface text-caution border-caution-border/70',
    text: 'text-caution',
    dot: 'bg-caution'
  },
  elevated: {
    label: 'Elevated',
    long: 'Elevated · System, sudo or remote code',
    Icon: ShieldAlert,
    badge: 'bg-elevated-surface text-elevated border-elevated-border/70',
    text: 'text-elevated',
    dot: 'bg-elevated'
  },
  destructive: {
    label: 'Destructive',
    long: 'Destructive · Data loss likely',
    Icon: X,
    badge: 'bg-danger-surface text-danger border-danger-border/70',
    text: 'text-danger',
    dot: 'bg-danger'
  }
};
