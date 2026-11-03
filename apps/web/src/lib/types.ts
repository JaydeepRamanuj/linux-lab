import type { Severity } from './theme';

// Shapes shared by scenario content and the components that render it.
// These become the Zod content schemas in M2; keep the two in sync.

export interface WalkthroughStep {
  title: string;
  /** What the step does to the machine. Omit for manual steps and editor steps. */
  kind?: Severity;
  command?: string;
  /** Plain-language note shown under the command. Inline `code` is supported. */
  note?: string;
  output?: string;
  /** A file the user edits by hand instead of running a command. */
  editor?: { file: string; content: string };
}

export interface ReplayLine {
  line: string;
  type: 'input' | 'output';
}

export interface ReplayExample {
  context: string;
  commands: ReplayLine[];
}
