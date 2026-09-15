import { SecurityCategory, ALL_SECURITY_CATEGORIES } from '../types/categories';
import { EvidenceTier } from '../types/evidenceTier';
import { SignalMap, Signal } from '../models/signal';
import { SecurityRule } from '../rules/rule.interface';

export interface CategoryCompleteness {
  readonly category: SecurityCategory;
  readonly totalExpectedSignals: number;
  readonly availableSignalsCount: number;
  readonly unavailableSignalsCount: number;
  readonly completenessRatio: number; // 0.0 to 1.0
  readonly tierBreakdown: Readonly<Record<EvidenceTier, number>>;
}

export interface CompletenessReport {
  readonly overallCompleteness: number; // 0.0 to 1.0
  readonly totalExpectedSignals: number;
  readonly totalAvailableSignals: number;
  readonly totalUnavailableSignals: number;
  readonly categories: Readonly<Record<SecurityCategory, CategoryCompleteness>>;
}

/**
 * Calculates evidence completeness ratios based on registered rules and provided signals.
 */
export class CompletenessEngine {
  /**
   * Evaluates evidence completeness across all categories.
   *
   * @param rules The active security rules being evaluated.
   * @param signals The signal map containing available/unavailable telemetry.
   */
  evaluateCompleteness(
    rules: readonly SecurityRule[],
    signals: SignalMap
  ): CompletenessReport {
    // Collect expected signal IDs per category from rules
    const expectedSignalsByCategory: Record<SecurityCategory, Set<string>> = {
      account_security: new Set(),
      device_safety: new Set(),
      phishing_fraud: new Set(),
      privacy: new Set(),
      backup_recovery: new Set(),
      update_hygiene: new Set(),
    };

    for (const rule of rules) {
      const categorySet = expectedSignalsByCategory[rule.category];
      if (categorySet) {
        for (const signalId of rule.requiredSignalIds) {
          categorySet.add(signalId);
        }
      }
    }

    // Also include any other signals provided directly in the map
    for (const signal of Object.values(signals)) {
      const categorySet = expectedSignalsByCategory[signal.category];
      if (categorySet) {
        categorySet.add(signal.id);
      }
    }

    const categoriesResult: Partial<Record<SecurityCategory, CategoryCompleteness>> = {};
    let totalExpected = 0;
    let totalAvailable = 0;
    let totalUnavailable = 0;

    for (const cat of ALL_SECURITY_CATEGORIES) {
      const expectedSet = expectedSignalsByCategory[cat] ?? new Set();
      const expectedList = Array.from(expectedSet);
      const totalCount = expectedList.length;

      let availableCount = 0;
      let unavailableCount = 0;
      const tierCounts: Record<EvidenceTier, number> = {
        [EvidenceTier.TIER_1_HARDWARE]: 0,
        [EvidenceTier.TIER_2_OS_API]: 0,
        [EvidenceTier.TIER_3_HEURISTIC]: 0,
        [EvidenceTier.TIER_4_SELF_REPORTED]: 0,
      };

      for (const signalId of expectedList) {
        const sig: Signal | undefined = signals[signalId];
        if (sig && sig.status === 'AVAILABLE') {
          availableCount++;
          tierCounts[sig.tier] = (tierCounts[sig.tier] || 0) + 1;
        } else {
          unavailableCount++;
        }
      }

      const ratio = totalCount > 0 ? availableCount / totalCount : 1.0;

      categoriesResult[cat] = {
        category: cat,
        totalExpectedSignals: totalCount,
        availableSignalsCount: availableCount,
        unavailableSignalsCount: unavailableCount,
        completenessRatio: Math.round(ratio * 1000) / 1000,
        tierBreakdown: tierCounts,
      };

      totalExpected += totalCount;
      totalAvailable += availableCount;
      totalUnavailable += unavailableCount;
    }

    const overallRatio = totalExpected > 0 ? totalAvailable / totalExpected : 1.0;

    return {
      overallCompleteness: Math.round(overallRatio * 1000) / 1000,
      totalExpectedSignals: totalExpected,
      totalAvailableSignals: totalAvailable,
      totalUnavailableSignals: totalUnavailable,
      categories: categoriesResult as Record<SecurityCategory, CategoryCompleteness>,
    };
  }
}
