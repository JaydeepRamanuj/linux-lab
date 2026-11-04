import type { ReactNode } from 'react';
import { Check, Copy, CircleHelp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CATEGORY_ICONS, SEVERITY } from '../../lib/theme';
import type { Severity } from '../../lib/theme';
import { useCopy } from '../../lib/useCopy';

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] || CircleHelp;
  return <Icon className={className} />;
}

export function SeverityBadge({ severity, long = false }: { severity: Severity; long?: boolean }) {
  const s = SEVERITY[severity] ?? SEVERITY.readonly;
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border label-caps ${s.badge}`}>
      <Icon className={`h-3 w-3 ${severity === 'readonly' ? 'fill-current h-2 w-2' : ''}`} strokeWidth={2.5} />
      {long ? s.long : s.label}
    </span>
  );
}

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
  compact = false
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        copy(text);
      }}
      aria-label={copied ? 'Copied' : `Copy: ${text}`}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg text-xs transition ${
        compact ? 'p-1.5 text-outline hover:text-on-surface hover:bg-white/5' : 'btn-ghost px-3 py-1.5'
      } ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-safe" /> : <Copy className="h-3.5 w-3.5 text-tertiary" />}
      {!compact && <span className={copied ? 'text-safe' : ''}>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

const OPERATORS = new Set(['&&', '||', '|', ';', '&', '>', '>>', '<', '2>', '2>&1', '&>']);

// Syntax-tint a shell command. The first word of each command (start of line or after an operator)
// is the program; `sudo` is flagged. Cosmetic only: the real parse lives in packages/core.
function tokenClass(tok: string, prev: string | null): string | null {
  if (tok === '' || /^\s+$/.test(tok)) return null;
  if (tok.startsWith('#')) return 'text-outline italic';
  if (tok === 'sudo') return 'text-elevated font-semibold';
  if (OPERATORS.has(tok)) return 'text-secondary';
  if (prev === null || OPERATORS.has(prev) || prev === 'sudo') return 'text-tertiary font-semibold';
  if (/^<.*>\^?$/.test(tok) || /^".*"$/.test(tok)) return 'text-outline';
  return 'text-on-surface';
}

// Syntax-tint a shell command: programs in cyan, operators violet, placeholders muted.
/** One line to show where a command must fit on one row (cards, chips). A heredoc shows its first line and `…`. */
export const commandPreview = (command: string) => (command.includes('\n') ? `${command.split('\n')[0]} …` : command);

export function CommandText({ command, className = '' }: { command: string; className?: string }) {
  const parts: ReactNode[] = [];
  let prevWord: string | null = null;
  command.split(/(\s+)/).forEach((tok, i) => {
    const cls = tokenClass(tok, prevWord);
    if (cls === null) {
      parts.push(tok);
      return;
    }
    parts.push(
      <span key={i} className={cls}>
        {tok}
      </span>
    );
    prevWord = tok;
  });
  return <code className={`font-mono ${className}`}>{parts}</code>;
}

// A single "$ command" line in a sunken well with a copy button.
export function CommandWell({
  command,
  size = 'md',
  label,
  className = ''
}: {
  command: string;
  size?: 'md' | 'lg';
  label?: string;
  className?: string;
}) {
  const big = size === 'lg';
  // A heredoc spans several lines: keep its line breaks (and scroll sideways) instead of joining it into one line.
  const multiline = command.includes('\n');
  const wrap = multiline
    ? big ? 'whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal' : 'whitespace-pre'
    : big ? 'whitespace-pre-wrap break-all sm:whitespace-nowrap sm:break-normal' : 'whitespace-nowrap';
  return (
    <div className={`well flex min-w-0 max-w-full ${multiline ? 'items-start' : 'items-center'} gap-3 ${big ? 'p-4 sm:p-5' : 'px-4 py-3'} ${className}`}>
      <div className={`flex ${multiline ? 'items-start' : 'items-center'} gap-3 min-w-0 flex-1 overflow-x-auto no-scrollbar ${big ? 'text-[15px]' : 'text-[13px]'}`}>
        <span className="font-mono text-secondary select-none">$</span>
        <CommandText command={command} className={wrap} />
      </div>
      <CopyButton text={command} label={label} compact={!label && !big} />
    </div>
  );
}

export function SectionTitle({
  icon: Icon,
  iconClass = 'text-primary',
  title,
  subtitle,
  right
}: {
  icon?: LucideIcon;
  iconClass?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${iconClass}`} />}
          <h2 className="text-[22px] font-semibold text-on-surface">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// Render inline `code` spans inside plain prose strings. As in Markdown, ``double backticks`` (with a space inside
// each end) wrap code that itself contains a backtick: `` `cmd` `` shows `cmd` with its backticks.
export function Prose({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(``.+?``|`[^`]+`)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        const code = p.startsWith('``') && p.endsWith('``') && p.length > 4 ? p.slice(2, -2).replace(/^ (.*) $/, '$1') : p.startsWith('`') && p.endsWith('`') && p.length > 1 ? p.slice(1, -1) : null;
        return code === null ? (
          p
        ) : (
          <code key={i} className="font-mono text-[0.85em] text-primary bg-surface-high px-1.5 py-0.5 rounded">
            {code}
          </code>
        );
      })}
    </span>
  );
}
