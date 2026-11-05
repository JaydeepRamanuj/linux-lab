import type { Severity } from '@shellgyan/core/severity';

export interface SearchItem {
  type: 'scenario' | 'command' | 'guide';
  title: string;
  url: string;
  /** Short tag shown at the left: scenario number, command name or guide track. */
  badge: string;
  subtitle: string;
  /** Shown in mono under the title. Empty for guides, which show `subtitle` instead. */
  command: string;
  /** Symptoms, error messages and related words people actually type. */
  tags: string[];
  severity?: Severity;
}
