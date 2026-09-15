import { describe, it, expect } from 'vitest';
import {
  computeScore,
  DEFAULT_CATEGORY_WEIGHTS,
  SEVERITY_PENALTIES,
  CONFIDENCE_MULTIPLIERS,
  severityPenalty,
  confidenceMultiplier,
  getQualitativeGrade,
} from '../src/lib/scoring';
import { Finding, Category, Severity, Provenance } from '../src/types';

function createMockFinding(options: {
  id?: string;
  category: Category;
  severity: Severity;
  provenance?: Provenance;
  status?: Finding['status'];
}): Finding {
  return {
    id: options.id || `finding_${Math.random()}`,
    type: 'STALE_SECURITY_PATCH',
    category: options.category,
    severity: options.severity,
    provenance: options.provenance || 'VERIFIED',
    effort: 'quick',
    status: options.status || 'open',
    evidence: [],
    scanId: 'scan_1',
    firstSeenScanId: 'scan_1',
  };
}

describe('PSS Scoring Engine (§6)', () => {
  describe('Constants and Utilities', () => {
    it('has weights that sum to 1.0', () => {
      const sum = Object.values(DEFAULT_CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('returns correct severity penalties', () => {
      expect(SEVERITY_PENALTIES.critical).toBe(40);
      expect(SEVERITY_PENALTIES.high).toBe(20);
      expect(SEVERITY_PENALTIES.medium).toBe(10);
      expect(SEVERITY_PENALTIES.low).toBe(5);
      expect(SEVERITY_PENALTIES.info).toBe(0);

      expect(severityPenalty('critical')).toBe(40);
      expect(severityPenalty('high')).toBe(20);
      expect(severityPenalty('medium')).toBe(10);
      expect(severityPenalty('low')).toBe(5);
      expect(severityPenalty('info')).toBe(0);
    });

    it('returns correct confidence multipliers', () => {
      expect(CONFIDENCE_MULTIPLIERS.VERIFIED).toBe(1.0);
      expect(CONFIDENCE_MULTIPLIERS.PERMISSION_BASED).toBe(0.85);
      expect(CONFIDENCE_MULTIPLIERS.SELF_REPORTED).toBe(0.70);
      expect(CONFIDENCE_MULTIPLIERS.UNAVAILABLE).toBe(0.0);

      expect(confidenceMultiplier('VERIFIED')).toBe(1.0);
      expect(confidenceMultiplier('PERMISSION_BASED')).toBe(0.85);
      expect(confidenceMultiplier('SELF_REPORTED')).toBe(0.70);
      expect(confidenceMultiplier('UNAVAILABLE')).toBe(0.0);
    });

    it('maps qualitative grades accurately according to §7.1', () => {
      expect(getQualitativeGrade(100)).toBe('Excellent');
      expect(getQualitativeGrade(90)).toBe('Excellent');
      expect(getQualitativeGrade(89)).toBe('Good');
      expect(getQualitativeGrade(75)).toBe('Good');
      expect(getQualitativeGrade(74)).toBe('Needs Attention');
      expect(getQualitativeGrade(55)).toBe('Needs Attention');
      expect(getQualitativeGrade(54)).toBe('At Risk');
      expect(getQualitativeGrade(0)).toBe('At Risk');
    });
  });

  describe('Clean Device (Score 100)', () => {
    it('produces a perfect 100 score with no findings', () => {
      const result = computeScore([], { platform: 'android' });

      expect(result.overallScore).toBe(100);
      expect(result.grade).toBe('Excellent');
      expect(result.totalOpenFindings).toBe(0);
      expect(result.unscoreableCategories).toHaveLength(0);
      expect(result.weightRedistributed).toBe(false);

      for (const catScore of Object.values(result.categoryScores)) {
        expect(catScore.score).toBe(100);
        expect(catScore.openFindingsCount).toBe(0);
        expect(catScore.isScoreable).toBe(true);
      }
    });

    it('ignores findings that are fixed or ignored', () => {
      const findings: Finding[] = [
        createMockFinding({ category: 'device', severity: 'critical', status: 'fixed' }),
        createMockFinding({ category: 'apps', severity: 'high', status: 'ignored' }),
      ];

      const result = computeScore(findings, { platform: 'android' });
      expect(result.overallScore).toBe(100);
      expect(result.totalOpenFindings).toBe(0);
    });
  });

  describe('Mixed Severities', () => {
    it('calculates weighted score accurately across all categories', () => {
      // Device: 1 High (20 deduction) -> score 80 (weight 0.25 -> 20.0)
      // Apps: 1 Medium (10 deduction) -> score 90 (weight 0.25 -> 22.5)
      // Network: 1 Critical (40 deduction) -> score 60 (weight 0.15 -> 9.0)
      // Account: 1 Low (5 deduction) -> score 95 (weight 0.20 -> 19.0)
      // Habits: 1 Info (0 deduction) -> score 100 (weight 0.15 -> 15.0)
      // Total = 20 + 22.5 + 9 + 19 + 15 = 85.5 -> round = 86 ('Good')
      const findings: Finding[] = [
        createMockFinding({ category: 'device', severity: 'high', provenance: 'VERIFIED' }),
        createMockFinding({ category: 'apps', severity: 'medium', provenance: 'VERIFIED' }),
        createMockFinding({ category: 'network', severity: 'critical', provenance: 'VERIFIED' }),
        createMockFinding({ category: 'account', severity: 'low', provenance: 'VERIFIED' }),
        createMockFinding({ category: 'habits', severity: 'info', provenance: 'VERIFIED' }),
      ];

      const result = computeScore(findings, { platform: 'android' });

      expect(result.categoryScores.device.score).toBe(80);
      expect(result.categoryScores.apps.score).toBe(90);
      expect(result.categoryScores.network.score).toBe(60);
      expect(result.categoryScores.account.score).toBe(95);
      expect(result.categoryScores.habits.score).toBe(100);

      expect(result.overallScore).toBe(86);
      expect(result.grade).toBe('Good');
      expect(result.totalOpenFindings).toBe(5);
    });

    it('floors category score at 0 when deductions exceed 100', () => {
      const findings: Finding[] = [
        createMockFinding({ category: 'device', severity: 'critical', provenance: 'VERIFIED' }), // -40
        createMockFinding({ category: 'device', severity: 'critical', provenance: 'VERIFIED' }), // -40
        createMockFinding({ category: 'device', severity: 'critical', provenance: 'VERIFIED' }), // -40 (total -120)
      ];

      const result = computeScore(findings, { platform: 'android' });
      expect(result.categoryScores.device.score).toBe(0);
      expect(result.categoryScores.device.pointContribution).toBe(0);
    });
  });

  describe('SELF_REPORTED Confidence Discount', () => {
    it('applies 0.70 multiplier to SELF_REPORTED findings vs 1.0 to VERIFIED', () => {
      // 1 Critical finding in account category
      // If VERIFIED: 100 - 40 * 1.0 = 60
      // If SELF_REPORTED: 100 - 40 * 0.70 = 100 - 28 = 72
      const verifiedFinding = createMockFinding({
        category: 'account',
        severity: 'critical',
        provenance: 'VERIFIED',
      });
      const selfReportedFinding = createMockFinding({
        category: 'account',
        severity: 'critical',
        provenance: 'SELF_REPORTED',
      });

      const verifiedResult = computeScore([verifiedFinding], { platform: 'android' });
      const selfReportedResult = computeScore([selfReportedFinding], { platform: 'android' });

      expect(verifiedResult.categoryScores.account.score).toBe(60);
      expect(selfReportedResult.categoryScores.account.score).toBe(72);

      // Verify overall difference:
      // Verified: 0.20 * 60 + 0.80 * 100 = 12 + 80 = 92
      // Self-Reported: 0.20 * 72 + 0.80 * 100 = 14.4 + 80 = 94.4 -> 94
      expect(verifiedResult.overallScore).toBe(92);
      expect(selfReportedResult.overallScore).toBe(94);
    });
  });

  describe('Weight Redistribution (Unscoreable Category on Platform)', () => {
    it('redistributes weight proportionally when apps category is unscoreable on iOS', () => {
      // On iOS: `apps` category is unscoreable (0 collectible signals).
      // Base weights: device 0.25, apps 0.25, network 0.15, account 0.20, habits 0.15.
      // Scoreable total = 0.75.
      // Adjusted weights:
      //   device: 0.25 / 0.75 = 0.3333...
      //   network: 0.15 / 0.75 = 0.20
      //   account: 0.20 / 0.75 = 0.2666...
      //   habits: 0.15 / 0.75 = 0.20
      //
      // If device has 1 High finding (score 80) and other scoreable categories are 100:
      // Weighted sum = (0.25/0.75)*80 + (0.15/0.75)*100 + (0.20/0.75)*100 + (0.15/0.75)*100
      //              = 26.666 + 20 + 26.666 + 20 = 93.33 -> round = 93.
      const findings: Finding[] = [
        createMockFinding({ category: 'device', severity: 'high', provenance: 'VERIFIED' }),
      ];

      const result = computeScore(findings, { platform: 'ios' });

      expect(result.unscoreableCategories).toEqual(['apps']);
      expect(result.weightRedistributed).toBe(true);

      const appsScore = result.categoryScores.apps;
      expect(appsScore.isScoreable).toBe(false);
      expect(appsScore.weight).toBe(0);
      expect(appsScore.pointContribution).toBe(0);
      expect(appsScore.reasonIfUnscoreable).toContain('not available on IOS');

      expect(result.categoryScores.device.weight).toBeCloseTo(0.25 / 0.75, 4);
      expect(result.categoryScores.network.weight).toBeCloseTo(0.15 / 0.75, 4);
      expect(result.categoryScores.account.weight).toBeCloseTo(0.20 / 0.75, 4);
      expect(result.categoryScores.habits.weight).toBeCloseTo(0.15 / 0.75, 4);

      expect(result.overallScore).toBe(93);
      expect(result.grade).toBe('Excellent');
      expect(result.explanation).toContain('Weights were proportionally redistributed');
    });
  });
});
