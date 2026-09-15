import { SecurityCategory } from '../types/categories';
import { CategoryScore } from './categoryScore';
import { Finding } from './finding';
import { ScoreExplanation } from './scoreExplanation';

export type ScoreGrade =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'CRITICAL';

/**
 * Derives the letter grade based on overall score.
 */
export function gradeForScore(score: number): ScoreGrade {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 55) return 'FAIR';
  if (score >= 35) return 'POOR';
  return 'CRITICAL';
}

/**
 * Result of a complete security scan evaluation.
 */
export interface ScanResult {
  readonly scanId: string;
  readonly timestamp: string;
  readonly overallScore: number;
  readonly grade: ScoreGrade;
  readonly categoryScores: Readonly<Record<SecurityCategory, CategoryScore>>;
  readonly findings: readonly Finding[];
  readonly openCriticalFindingsCount: number;
  readonly overallEvidenceCompleteness: number;
  readonly scoreExplanation: ScoreExplanation;
  readonly invariantsApplied: readonly string[];
}
