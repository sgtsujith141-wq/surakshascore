import { SecurityCategory } from '../types/categories';
import { Severity } from '../types/severity';
import { EvidenceTier } from '../types/evidenceTier';
import { Signal } from './signal';

export type FindingStatus = 'open' | 'resolved' | 'suppressed' | 'not_applicable';

export type RemediationEffort = 'low' | 'medium' | 'high';

/**
 * Actionable remediation guidance associated with a security finding.
 * Ranked using priority = impact * likelihood * easeOfFix.
 */
export interface RemediationGuidance {
  readonly title: string;
  readonly whyItMatters: string;
  readonly steps: readonly string[];
  readonly effort: RemediationEffort;
  readonly impact: number; // 1 to 10 scale (10 = highest impact)
  readonly likelihood: number; // 1 to 10 scale (10 = highest threat likelihood)
  readonly easeOfFix: number; // 1 to 10 scale (10 = simplest / fastest to fix)
  readonly priorityScore: number; // Product: impact * likelihood * easeOfFix
}

/**
 * Evidence backing a security finding.
 */
export interface FindingEvidence {
  readonly tier: EvidenceTier;
  readonly signals: readonly Signal[];
  readonly rationale: string;
  readonly observedAt: string;
}

/**
 * A concrete security finding identified by a deterministic rule.
 */
export interface Finding {
  readonly id: string;
  readonly ruleId: string;
  readonly category: SecurityCategory;
  readonly severity: Severity;
  readonly status: FindingStatus;
  readonly title: string;
  readonly description: string;
  readonly evidence: FindingEvidence;
  readonly remediation: RemediationGuidance;
  readonly scoreDelta: number;
  readonly deductionExplanation?: string;
}
