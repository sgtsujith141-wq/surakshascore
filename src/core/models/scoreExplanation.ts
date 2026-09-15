import { SecurityCategory } from '../types/categories';
import { Severity } from '../types/severity';
import { RemediationGuidance } from './finding';

/**
 * Score change breakdown per category.
 */
export interface CategoryDelta {
  readonly category: SecurityCategory;
  readonly initialScore: number;
  readonly totalDeductions: number;
  readonly finalScore: number;
  readonly weight: number;
  readonly contribution: number;
}

/**
 * Detailed point deduction caused by a specific finding.
 */
export interface FindingDeduction {
  readonly findingId: string;
  readonly ruleId: string;
  readonly title: string;
  readonly severity: Severity;
  readonly category: SecurityCategory;
  readonly deduction: number;
  readonly rationale: string;
}

/**
 * Log of an architectural invariant applied during score computation.
 */
export interface InvariantTrigger {
  readonly invariantId: string;
  readonly rule: string;
  readonly scoreBefore: number;
  readonly scoreAfter: number;
  readonly reason: string;
}

/**
 * Complete, transparent explanation of the overall score derivation.
 */
export interface ScoreExplanation {
  readonly baseScore: number;
  readonly finalScore: number;
  readonly categoryDeltas: readonly CategoryDelta[];
  readonly topDeductions: readonly FindingDeduction[];
  readonly invariantsTriggered: readonly InvariantTrigger[];
  readonly summary: string;
  readonly prioritizedActions: readonly RemediationGuidance[];
}
