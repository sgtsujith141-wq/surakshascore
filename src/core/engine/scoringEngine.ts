import { SecurityCategory, ALL_SECURITY_CATEGORIES } from '../types/categories';
import { CategoryScore, CategoryHealthStatus } from '../models/categoryScore';
import { Finding } from '../models/finding';
import { SignalMap } from '../models/signal';
import { ScanResult, gradeForScore } from '../models/scanResult';
import { InvariantTrigger } from '../models/scoreExplanation';
import {
  ScoringConfig,
  DEFAULT_SCORING_CONFIG,
  validateScoringConfig,
} from '../config/scoringConfig';
import { DeterministicRuleEngine } from './ruleEngine';
import { CompletenessEngine } from './completenessEngine';
import { ExplanationEngine } from './explanationEngine';
import { SecurityRule } from '../rules/rule.interface';
import { ALL_BUILTIN_RULES } from '../rules';

export interface ScoringEngineOptions {
  readonly config?: ScoringConfig;
  readonly rules?: readonly SecurityRule[];
}

/**
 * PSS Scoring Engine (§8).
 * Deterministically computes category scores, overall digital hygiene score,
 * invariant enforcement, completeness metrics, and explainability deltas.
 */
export class ScoringEngine {
  private readonly config: ScoringConfig;
  private readonly ruleEngine: DeterministicRuleEngine;
  private readonly completenessEngine: CompletenessEngine;
  private readonly explanationEngine: ExplanationEngine;

  constructor(options?: ScoringEngineOptions) {
    const config = options?.config ?? DEFAULT_SCORING_CONFIG;
    const validation = validateScoringConfig(config);
    if (!validation.isValid) {
      throw new Error(
        `Invalid ScoringConfig provided to ScoringEngine:\n${validation.errors.join('\n')}`
      );
    }

    this.config = config;
    const rules = options?.rules ?? ALL_BUILTIN_RULES;
    this.ruleEngine = new DeterministicRuleEngine({ rules, config: this.config });
    this.completenessEngine = new CompletenessEngine();
    this.explanationEngine = new ExplanationEngine();
  }

  /**
   * Evaluates security signals and computes the full ScanResult.
   *
   * @param signals Map of observed telemetry signals.
   * @param scanId Optional scan identifier.
   * @returns Immutable ScanResult containing all scores, findings, and explanations.
   */
  evaluate(signals: SignalMap, scanId?: string): ScanResult {
    const timestamp = new Date().toISOString();
    const id = scanId ?? `scan_${Date.now()}`;

    // 1. Evaluate rules deterministically
    const findings = this.ruleEngine.evaluate(signals);

    // 2. Evaluate evidence completeness
    const completenessReport = this.completenessEngine.evaluateCompleteness(
      this.ruleEngine.getRules(),
      signals
    );

    // 3. Compute Category Scores
    const categoryScores: Partial<Record<SecurityCategory, CategoryScore>> = {};
    const findingsByCategory: Record<SecurityCategory, Finding[]> = {
      account_security: [],
      device_safety: [],
      phishing_fraud: [],
      privacy: [],
      backup_recovery: [],
      update_hygiene: [],
    };

    for (const finding of findings) {
      findingsByCategory[finding.category]?.push(finding);
    }

    // Determine weight normalization if enabled
    let totalActiveWeight = 0;
    for (const cat of ALL_SECURITY_CATEGORIES) {
      const catCompleteness = completenessReport.categories[cat];
      const isAvailable = (catCompleteness?.availableSignalsCount ?? 0) > 0;
      if (isAvailable || !this.config.renormalizeWeightsOnMissingCategories) {
        totalActiveWeight += this.config.categoryWeights[cat];
      }
    }

    // Guard against divide by zero if all categories have zero signals
    if (totalActiveWeight === 0) {
      totalActiveWeight = 1.0;
    }

    let preliminaryOverallScore = 0;

    for (const cat of ALL_SECURITY_CATEGORIES) {
      const catFindings = findingsByCategory[cat] ?? [];
      const catCompleteness = completenessReport.categories[cat];
      const rawWeight = this.config.categoryWeights[cat];

      const effectiveWeight = this.config.renormalizeWeightsOnMissingCategories
        ? rawWeight / totalActiveWeight
        : rawWeight;

      // Deduct penalties for each finding in this category
      let totalPenalty = 0;
      for (const f of catFindings) {
        totalPenalty += f.scoreDelta;
      }

      const rawScore = this.config.baseCategoryScore - totalPenalty;
      const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)));
      const weightedScore = Math.round(clampedScore * effectiveWeight * 100) / 100;

      preliminaryOverallScore += weightedScore;

      // Determine category health status
      let healthStatus: CategoryHealthStatus = 'healthy';
      if ((catCompleteness?.availableSignalsCount ?? 0) === 0 && (catCompleteness?.totalExpectedSignals ?? 0) > 0) {
        healthStatus = 'insufficient_evidence';
      } else if (catFindings.some((f) => f.severity === 'critical')) {
        healthStatus = 'critical';
      } else if (clampedScore < 70 || catFindings.some((f) => f.severity === 'high')) {
        healthStatus = 'warning';
      }

      categoryScores[cat] = {
        category: cat,
        score: clampedScore,
        rawScore,
        weight: effectiveWeight,
        weightedScore,
        evidenceCompleteness: catCompleteness?.completenessRatio ?? 1.0,
        signalCount: {
          total: catCompleteness?.totalExpectedSignals ?? 0,
          available: catCompleteness?.availableSignalsCount ?? 0,
          unavailable: catCompleteness?.unavailableSignalsCount ?? 0,
        },
        findings: Object.freeze(catFindings),
        status: healthStatus,
      };
    }

    // 4. Invariant Enforcement
    const invariantsTriggered: InvariantTrigger[] = [];
    const invariantsApplied: string[] = [];
    let finalScore = preliminaryOverallScore;

    const openCriticalFindings = findings.filter(
      (f) => f.severity === 'critical' && f.status === 'open'
    );
    const openCriticalCount = openCriticalFindings.length;

    // INVARIANT 1: "Open critical finding strictly prevents 100 score"
    if (openCriticalCount > 0 && this.config.invariants.enableCriticalFindingCap) {
      // Calculate ceiling: base ceiling minus progressive penalty for additional critical findings
      const ceiling = Math.max(
        0,
        this.config.invariants.maxScoreWithOpenCritical -
          (openCriticalCount - 1) * this.config.invariants.progressiveCriticalPenalty
      );

      if (finalScore > ceiling) {
        invariantsTriggered.push({
          invariantId: 'CRITICAL_FINDING_SCORE_CEILING',
          rule: 'Open critical finding prevents 100 score (capped at ceiling)',
          scoreBefore: Math.round(finalScore),
          scoreAfter: ceiling,
          reason: `Score capped from ${Math.round(finalScore)} to ${ceiling} due to ${openCriticalCount} open critical finding(s).`,
        });
        invariantsApplied.push('CRITICAL_FINDING_SCORE_CEILING');
        finalScore = ceiling;
      }
    }

    // Final bounding and rounding
    const roundedFinalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
    const grade = gradeForScore(roundedFinalScore);

    // 5. Generate Explanation
    const fullCategoryScores = categoryScores as Record<SecurityCategory, CategoryScore>;
    const scoreExplanation = this.explanationEngine.generateExplanation(
      this.config.baseCategoryScore,
      roundedFinalScore,
      fullCategoryScores,
      findings,
      invariantsTriggered
    );

    return Object.freeze({
      scanId: id,
      timestamp,
      overallScore: roundedFinalScore,
      grade,
      categoryScores: Object.freeze(fullCategoryScores),
      findings: Object.freeze(findings),
      openCriticalFindingsCount: openCriticalCount,
      overallEvidenceCompleteness: completenessReport.overallCompleteness,
      scoreExplanation,
      invariantsApplied: Object.freeze(invariantsApplied),
    });
  }

  /**
   * Retrieves the current active scoring configuration.
   */
  getConfig(): ScoringConfig {
    return this.config;
  }
}
