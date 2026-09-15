import { SecurityCategory } from '../types/categories';
import { Finding } from './finding';

export type CategoryHealthStatus =
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'insufficient_evidence';

/**
 * Detailed score representation for a single security category.
 */
export interface CategoryScore {
  readonly category: SecurityCategory;
  /** Final calculated score for this category (clamped 0 to 100). */
  readonly score: number;
  /** Raw score before bounds clamping or adjustments. */
  readonly rawScore: number;
  /** Configured weight for this category (e.g. 0.35). */
  readonly weight: number;
  /** Weighted score contribution to overall score (score * weight). */
  readonly weightedScore: number;
  /** Evidence completeness ratio for this category (0.0 to 1.0). */
  readonly evidenceCompleteness: number;
  /** Signal availability counts for this category. */
  readonly signalCount: {
    readonly total: number;
    readonly available: number;
    readonly unavailable: number;
  };
  /** Findings associated with this category. */
  readonly findings: readonly Finding[];
  /** High-level health status for this category. */
  readonly status: CategoryHealthStatus;
}
