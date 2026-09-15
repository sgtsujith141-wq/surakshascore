import { SecurityCategory, ALL_SECURITY_CATEGORIES } from '../types/categories';
import { Severity } from '../types/severity';

/**
 * Invariant configuration options.
 */
export interface InvariantConfig {
  /**
   * Maximum allowed overall score when at least one open critical finding exists.
   * By specification, open critical findings strictly prevent a 100 score.
   * Default: 79 (ensuring a maximum grade of FAIR).
   */
  readonly maxScoreWithOpenCritical: number;
  /** Whether the critical finding score ceiling is enabled. */
  readonly enableCriticalFindingCap: boolean;
  /** Additional score ceiling deduction for each subsequent critical finding beyond the first. */
  readonly progressiveCriticalPenalty: number;
}

/**
 * Complete scoring engine configuration.
 */
export interface ScoringConfig {
  /** Configurable category weights. Must sum to 1.0. */
  readonly categoryWeights: Readonly<Record<SecurityCategory, number>>;
  /** Configurable severity deduction points applied to category base score. */
  readonly severityPenalties: Readonly<Record<Severity, number>>;
  /** Invariant enforcement configuration. */
  readonly invariants: InvariantConfig;
  /** Whether to renormalize weights across categories that have available evidence. */
  readonly renormalizeWeightsOnMissingCategories: boolean;
  /** Base starting score for each category before deductions. Default: 100. */
  readonly baseCategoryScore: number;
}

/**
 * Default standard weights specified in §8 and product roadmap.
 */
export const DEFAULT_CATEGORY_WEIGHTS: Readonly<Record<SecurityCategory, number>> = {
  account_security: 0.35,
  device_safety: 0.20,
  phishing_fraud: 0.20,
  privacy: 0.10,
  backup_recovery: 0.10,
  update_hygiene: 0.05,
};

/**
 * Default severity point penalties deducted from category base score.
 */
export const DEFAULT_SEVERITY_PENALTIES: Readonly<Record<Severity, number>> = {
  critical: 40,
  high: 25,
  medium: 15,
  low: 5,
  info: 0,
};

/**
 * Default invariant enforcement settings.
 */
export const DEFAULT_INVARIANT_CONFIG: InvariantConfig = {
  maxScoreWithOpenCritical: 79,
  enableCriticalFindingCap: true,
  progressiveCriticalPenalty: 10,
};

/**
 * Default complete configuration for the scoring engine.
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  categoryWeights: DEFAULT_CATEGORY_WEIGHTS,
  severityPenalties: DEFAULT_SEVERITY_PENALTIES,
  invariants: DEFAULT_INVARIANT_CONFIG,
  renormalizeWeightsOnMissingCategories: false,
  baseCategoryScore: 100,
};

/**
 * Validates a scoring configuration object to ensure mathematical consistency.
 */
export function validateScoringConfig(config: ScoringConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check category weights sum to 1.0 (with floating-point tolerance)
  let sum = 0;
  for (const cat of ALL_SECURITY_CATEGORIES) {
    const weight = config.categoryWeights[cat];
    if (weight === undefined || weight < 0) {
      errors.push(`Invalid or negative weight for category: ${cat}`);
    } else {
      sum += weight;
    }
  }

  if (Math.abs(sum - 1.0) > 0.001) {
    errors.push(`Category weights must sum to 1.0, but sum is ${sum.toFixed(4)}`);
  }

  // Check severity penalties are non-negative
  for (const [sev, penalty] of Object.entries(config.severityPenalties)) {
    if (penalty < 0) {
      errors.push(`Severity penalty for ${sev} cannot be negative: ${penalty}`);
    }
  }

  // Check invariant threshold bounds
  if (config.invariants.maxScoreWithOpenCritical < 0 || config.invariants.maxScoreWithOpenCritical >= 100) {
    errors.push(
      `maxScoreWithOpenCritical must be between 0 and 99, but received ${config.invariants.maxScoreWithOpenCritical}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
