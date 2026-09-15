import { SecurityCategory } from '../types/categories';
import { Severity } from '../types/severity';
import { RemediationGuidance } from '../models/finding';
import { Signal, SignalMap } from '../models/signal';

export interface RuleEvaluationResult {
  /** True if a security weakness was detected. */
  readonly triggered: boolean;
  /** True if required signals were unavailable or insufficient to reach a verdict. */
  readonly insufficientEvidence?: boolean;
  /** Specific finding title override if contextual. */
  readonly title?: string;
  /** Concrete explanation of what was detected based on observed signals. */
  readonly rationale: string;
  /** The signals that were used in reaching this verdict. */
  readonly evidenceSignals: readonly Signal[];
  /** Optional override for remediation steps tailored to the observed signal values. */
  readonly remediationOverride?: Partial<RemediationGuidance>;
}

/**
 * Interface that all deterministic security rules must implement.
 */
export interface SecurityRule {
  readonly id: string;
  readonly category: SecurityCategory;
  readonly name: string;
  readonly description: string;
  readonly defaultSeverity: Severity;
  readonly requiredSignalIds: readonly string[];
  readonly remediation: RemediationGuidance;

  /**
   * Pure evaluation function. Must be deterministic with no side effects or network calls.
   * If any required signal is UNAVAILABLE or missing, must return insufficientEvidence = true
   * and triggered = false (never producing false positives).
   */
  evaluate(signals: SignalMap): RuleEvaluationResult;
}
