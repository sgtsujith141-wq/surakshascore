import { SecurityCategory, ALL_SECURITY_CATEGORIES } from '../types/categories';
import { CategoryScore } from '../models/categoryScore';
import { Finding, RemediationGuidance } from '../models/finding';
import {
  ScoreExplanation,
  CategoryDelta,
  FindingDeduction,
  InvariantTrigger,
} from '../models/scoreExplanation';
import { gradeForScore } from '../models/scanResult';
import { severityRank } from '../types/severity';

export class ExplanationEngine {
  /**
   * Generates a fully transparent, explainable breakdown of the score derivation.
   */
  generateExplanation(
    baseScore: number,
    finalScore: number,
    categoryScores: Readonly<Record<SecurityCategory, CategoryScore>>,
    findings: readonly Finding[],
    invariantsTriggered: readonly InvariantTrigger[]
  ): ScoreExplanation {
    // 1. Calculate category deltas
    const categoryDeltas: CategoryDelta[] = [];
    for (const cat of ALL_SECURITY_CATEGORIES) {
      const catScore = categoryScores[cat];
      if (catScore) {
        const totalDeductions = Math.max(0, baseScore - catScore.score);
        categoryDeltas.push({
          category: cat,
          initialScore: baseScore,
          totalDeductions,
          finalScore: catScore.score,
          weight: catScore.weight,
          contribution: catScore.weightedScore,
        });
      }
    }

    // 2. Extract and sort finding deductions
    const deductions: FindingDeduction[] = findings.map((f) => ({
      findingId: f.id,
      ruleId: f.ruleId,
      title: f.title,
      severity: f.severity,
      category: f.category,
      deduction: f.scoreDelta,
      rationale: f.description,
    }));

    // Sort deductions: highest severity first, then largest deduction first
    deductions.sort((a, b) => {
      const rankDiff = severityRank(a.severity) - severityRank(b.severity);
      if (rankDiff !== 0) return rankDiff;
      return b.deduction - a.deduction;
    });

    // 3. Extract and prioritize remediation actions
    // Formula: priorityScore = impact * likelihood * easeOfFix
    const actions: RemediationGuidance[] = findings.map((f) => f.remediation);
    // Deduplicate actions by title if multiple findings produce identical remediation
    const uniqueActionsMap = new Map<string, RemediationGuidance>();
    for (const action of actions) {
      if (!uniqueActionsMap.has(action.title)) {
        uniqueActionsMap.set(action.title, action);
      }
    }
    const prioritizedActions = Array.from(uniqueActionsMap.values());
    prioritizedActions.sort((a, b) => b.priorityScore - a.priorityScore);

    // 4. Construct plain-English summary
    const grade = gradeForScore(finalScore);
    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const highCount = findings.filter((f) => f.severity === 'high').length;

    let summary = `Your overall SurakshaScore is ${finalScore}/100 (${grade}). `;

    if (criticalCount > 0) {
      const topCritical = findings.find((f) => f.severity === 'critical');
      summary += `There ${criticalCount === 1 ? 'is 1 critical security finding' : `are ${criticalCount} critical security findings`} that require immediate attention (e.g. "${topCritical?.title}"). `;
    } else if (highCount > 0) {
      const topHigh = findings.find((f) => f.severity === 'high');
      summary += `There ${highCount === 1 ? 'is 1 high-priority finding' : `are ${highCount} high-priority findings`} identified (e.g. "${topHigh?.title}"). `;
    } else if (findings.length > 0) {
      summary += `Minor recommendations were identified to improve your digital safety. `;
    } else {
      summary += `All observed security controls are in place and properly configured. `;
    }

    if (invariantsTriggered.length > 0) {
      summary += `Score adjustments applied: ${invariantsTriggered.map((inv) => inv.reason).join(' ')}`;
    }

    return {
      baseScore,
      finalScore,
      categoryDeltas: Object.freeze(categoryDeltas),
      topDeductions: Object.freeze(deductions),
      invariantsTriggered: Object.freeze(invariantsTriggered),
      summary,
      prioritizedActions: Object.freeze(prioritizedActions),
    };
  }
}
