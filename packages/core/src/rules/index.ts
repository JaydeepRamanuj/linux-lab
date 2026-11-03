import { fileRules } from './files';
import { remoteRules } from './remote';
import { systemRules, sourceRules } from './system';
import type { Rule } from './types';

export const RULES: Rule[] = [...fileRules, ...remoteRules, ...systemRules];
export { sourceRules };
export { baseSeverity } from './base';
export type { Basis } from './base';
export type { Hit, Rule, RuleContext, SourceRule } from './types';
export { SHELLS } from './remote';
