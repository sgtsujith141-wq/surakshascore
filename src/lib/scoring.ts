import {
  Category,
  Finding,
  Platform,
  Provenance,
  Severity,
  QualitativeGrade,
  CategoryScoreBreakdown,
  ScoreBreakdown,
  ALL_CATEGORIES,
} from '../types';
import { getUnscoreableCategories } from './capabilities';

/**
 * Default category weights (§6.1). Must sum to 1.0.
 */
export const DEFAULT_CATEGORY_WEIGHTS: Readonly<Record<Category, number>> = {
  device: 0.25,
  apps: 0.25,
  network: 0.15,
  account: 0.20,
  habits: 0.15,
};

/**
 * Severity deduction penalties applied to category score (§6.1).
 */
export const SEVERITY_PENALTIES: Readonly<Record<Severity, number>> = {
  critical: 40,
  high: 20,
  medium: 10,
  low: 5,
  info: 0,
};

/**
 * Confidence multipliers based on signal/finding provenance (§6.1).
 */
export const CONFIDENCE_MULTIPLIERS: Readonly<Record<Provenance, number>> = {
  VERIFIED: 1.0,
  PERMISSION_BASED: 0.85,
  SELF_REPORTED: 0.70,
  UNAVAILABLE: 0.0,
};

export function severityPenalty(severity: Severity): number {
  return SEVERITY_PENALTIES[severity] ?? 0;
}

export function confidenceMultiplier(provenance: Provenance): number {
  return CONFIDENCE_MULTIPLIERS[provenance] ?? 0;
}

/**
 * Derives qualitative rating grade from numeric score (§7.1).
 * 90-100: Excellent
 * 75-89: Good
 * 55-74: Needs Attention
 * <55: At Risk
 */
export function getQualitativeGrade(score: number): QualitativeGrade {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 55) return 'Needs Attention';
  return 'At Risk';
}

export interface ComputeScoreOptions {
  platform?: Platform;
  categoryWeights?: Partial<Record<Category, number>>;
  unscoreableCategories?: Category[];
}

/**
 * Deterministic Scoring Engine (Section 6 of PSS Engineering Spec v1.0).
 *
 * Formula:
 *   OverallScore = round( Σ over categories c of ( weight[c] * categoryScore[c] ) )
 *
 * Where:
 *   categoryScore[c] = max(0, 100 - Σ over open findings in c of (severityPenalty(severity) * confidenceMultiplier(provenance)))
 *
 * Weight Redistribution:
 *   If a category has 0 collectible signals on the target platform (e.g. `apps` on iOS),
 *   it is excluded and its weight is proportionally redistributed across scoreable categories.
 */
export function computeScore(
  findings: readonly Finding[],
  options?: ComputeScoreOptions
): ScoreBreakdown {
  const platform = options?.platform ?? 'android';
  const customWeights = options?.categoryWeights;
  
  // 1. Resolve unscoreable categories for this platform
  const detectedUnscoreable = options?.unscoreableCategories ?? getUnscoreableCategories(platform);
  const unscoreableSet = new Set<Category>(detectedUnscoreable);

  // 2. Base weights
  const baseWeights: Record<Category, number> = {
    ...DEFAULT_CATEGORY_WEIGHTS,
    ...customWeights,
  };

  // Filter only OPEN findings
  const openFindings = findings.filter((f) => f.status === 'open');

  // Group open findings by category
  const findingsByCategory: Record<Category, Finding[]> = {
    device: [],
    apps: [],
    network: [],
    account: [],
    habits: [],
  };

  for (const finding of openFindings) {
    findingsByCategory[finding.category]?.push(finding);
  }

  // 3. Compute scoreable total weight to determine proportional redistribution
  let totalScoreableWeight = 0;
  for (const cat of ALL_CATEGORIES) {
    if (!unscoreableSet.has(cat)) {
      totalScoreableWeight += baseWeights[cat];
    }
  }

  // Handle extreme edge case where all categories are unscoreable
  if (totalScoreableWeight <= 0) {
    totalScoreableWeight = 1.0;
  }

  const isRedistributed = unscoreableSet.size > 0;

  // 4. Compute Category Scores and adjusted weights
  const categoryScores: Partial<Record<Category, CategoryScoreBreakdown>> = {};
  let totalWeightedScore = 0;

  for (const cat of ALL_CATEGORIES) {
    const catFindings = findingsByCategory[cat] ?? [];
    const isScoreable = !unscoreableSet.has(cat);
    const originalWeight = baseWeights[cat];

    const adjustedWeight = isScoreable ? originalWeight / totalScoreableWeight : 0;

    // Calculate deductions
    let totalDeduction = 0;
    const provenanceCounts: Record<Provenance, number> = {
      VERIFIED: 0,
      PERMISSION_BASED: 0,
      SELF_REPORTED: 0,
      UNAVAILABLE: 0,
    };

    for (const f of catFindings) {
      const penalty = severityPenalty(f.severity);
      const mult = confidenceMultiplier(f.provenance);
      totalDeduction += penalty * mult;
      provenanceCounts[f.provenance] = (provenanceCounts[f.provenance] ?? 0) + 1;
    }

    const rawCategoryScore = 100 - totalDeduction;
    const clampedCategoryScore = Math.max(0, Math.min(100, Math.round(rawCategoryScore)));

    const pointContribution = isScoreable
      ? clampedCategoryScore * adjustedWeight
      : 0;

    if (isScoreable) {
      totalWeightedScore += pointContribution;
    }

    let reasonIfUnscoreable: string | undefined;
    if (!isScoreable) {
      reasonIfUnscoreable = `${cat.charAt(0).toUpperCase() + cat.slice(1)} category not scored — not available on ${platform.toUpperCase()}`;
    }

    categoryScores[cat] = {
      category: cat,
      score: clampedCategoryScore,
      weight: adjustedWeight,
      originalWeight,
      pointContribution: Math.round(pointContribution * 100) / 100,
      isScoreable,
      reasonIfUnscoreable,
      openFindingsCount: catFindings.length,
      findings: catFindings,
      provenanceCounts,
    };
  }

  const finalOverallScore = Math.max(0, Math.min(100, Math.round(totalWeightedScore)));
  const grade = getQualitativeGrade(finalOverallScore);

  // Generate plain-language explanation
  let explanation = `Your overall PSS is ${finalOverallScore}/100 (${grade}). `;
  if (openFindings.length === 0) {
    explanation += 'No open security findings were detected.';
  } else {
    explanation += `${openFindings.length} open finding(s) contributed to your score.`;
  }
  if (isRedistributed) {
    explanation += ` Weights were proportionally redistributed because ${Array.from(unscoreableSet).join(', ')} is unavailable on ${platform.toUpperCase()}.`;
  }

  return {
    overallScore: finalOverallScore,
    grade,
    categoryScores: categoryScores as Record<Category, CategoryScoreBreakdown>,
    totalOpenFindings: openFindings.length,
    unscoreableCategories: Array.from(unscoreableSet),
    weightRedistributed: isRedistributed,
    explanation,
  };
}
