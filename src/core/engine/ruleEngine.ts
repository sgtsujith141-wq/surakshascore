import { SecurityRule } from '../rules/rule.interface';
import { ALL_BUILTIN_RULES } from '../rules';
import { SignalMap } from '../models/signal';
import { Finding, FindingEvidence } from '../models/finding';
import { Severity } from '../types/severity';
import { EvidenceTier } from '../types/evidenceTier';
import { ScoringConfig, DEFAULT_SCORING_CONFIG } from '../config/scoringConfig';

export interface RuleEngineOptions {
  readonly rules?: readonly SecurityRule[];
  readonly config?: ScoringConfig;
}

/**
 * Deterministic Rule Engine for evaluating security telemetry against rule definitions.
 * Pure logic: no side effects, no asynchronous operations, no network calls.
 */
export class DeterministicRuleEngine {
  private readonly rules: readonly SecurityRule[];
  private readonly config: ScoringConfig;

  constructor(options?: RuleEngineOptions) {
    this.rules = options?.rules ?? ALL_BUILTIN_RULES;
    this.config = options?.config ?? DEFAULT_SCORING_CONFIG;
  }

  /**
   * Evaluates all registered security rules against the provided signal map.
   *
   * @param signals Telemetry signals map.
   * @returns Array of open findings resulting from triggered rules.
   */
  evaluate(signals: SignalMap): readonly Finding[] {
    const findings: Finding[] = [];

    for (const rule of this.rules) {
      const result = rule.evaluate(signals);

      // If the rule was triggered and has sufficient evidence, create a finding
      if (result.triggered && !result.insufficientEvidence) {
        const severity: Severity = rule.defaultSeverity;
        const penalty = this.config.severityPenalties[severity] ?? 0;

        // Determine dominant evidence tier from the evidence signals
        let dominantTier = EvidenceTier.TIER_4_SELF_REPORTED;
        let latestTimestamp = new Date().toISOString();

        if (result.evidenceSignals.length > 0) {
          // Choose lowest numerical tier = highest verification level
          let minTierNum = 999;
          for (const s of result.evidenceSignals) {
            if (s.tier < minTierNum) {
              minTierNum = s.tier;
              dominantTier = s.tier;
            }
            if (s.timestamp) {
              latestTimestamp = s.timestamp;
            }
          }
        }

        const evidence: FindingEvidence = {
          tier: dominantTier,
          signals: result.evidenceSignals,
          rationale: result.rationale,
          observedAt: latestTimestamp,
        };

        const remediation = {
          ...rule.remediation,
          ...result.remediationOverride,
        };

        // Deterministic finding ID based on rule ID
        const finding: Finding = {
          id: `finding_${rule.id.toLowerCase()}`,
          ruleId: rule.id,
          category: rule.category,
          severity,
          status: 'open',
          title: result.title ?? rule.name,
          description: result.rationale,
          evidence,
          remediation,
          scoreDelta: penalty,
          deductionExplanation: `-${penalty} pts: ${result.title ?? rule.name}`,
        };

        findings.push(finding);
      }
    }

    return Object.freeze(findings);
  }

  /**
   * Retrieves the active rule set.
   */
  getRules(): readonly SecurityRule[] {
    return this.rules;
  }
}
