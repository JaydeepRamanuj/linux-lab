import type { Severity } from '@shellgyan/core/severity';

export interface SearchItem {
  type: 'scenario' | 'command';
  title: string;
  url: string;
  /** Short tag shown at the left: scenario number or command name. */
  badge: string;
  subtitle: string;
  command: string;
  /** Symptoms, error messages and related words people actually type. */
  tags: string[];
  severity?: Severity;
}
