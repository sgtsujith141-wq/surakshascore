import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../../src/core/engine/scoringEngine';
import { createPerfectProfile } from '../../src/mock/profiles/perfectProfile';
import {
  DEFAULT_SCORING_CONFIG,
  ScoringConfig,
  validateScoringConfig,
} from '../../src/core/config/scoringConfig';
import { SignalMap } from '../../src/core/models/signal';
import { EvidenceTier } from '../../src/core/types/evidenceTier';

describe('ScoringEngine (§8)', () => {
  it('computes a perfect score of 100 for a completely secure profile', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();
    const result = engine.evaluate(signals);

    expect(result.overallScore).toBe(100);
    expect(result.grade).toBe('EXCELLENT');
    expect(result.openCriticalFindingsCount).toBe(0);
    expect(result.findings).toHaveLength(0);
    expect(result.invariantsApplied).toHaveLength(0);

    for (const cat of Object.values(result.categoryScores)) {
      expect(cat.score).toBe(100);
      expect(cat.findings).toHaveLength(0);
      expect(cat.status).toBe('healthy');
    }
  });

  it('correctly applies category weights and severity penalties', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();

    // Inject 1 High finding in account_security (password_manager_used = false)
    // Default penalty for High is 25.
    // Account score becomes 100 - 25 = 75.
    // Account weight = 0.35 -> Weighted account contribution = 75 * 0.35 = 26.25
    // Other categories are 100:
    // Device (0.20): 20, Phishing (0.20): 20, Privacy (0.10): 10, Backup (0.10): 10, Updates (0.05): 5
    // Total raw = 26.25 + 20 + 20 + 10 + 10 + 5 = 91.25 -> rounded = 91
    const modifiedSignals: SignalMap = {
      ...signals,
      'account.password_manager_used': {
        id: 'account.password_manager_used',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: false,
        timestamp: new Date().toISOString(),
        source: 'test',
      },
    };

    const result = engine.evaluate(modifiedSignals);

    expect(result.categoryScores.account_security.score).toBe(75);
    expect(result.categoryScores.account_security.findings).toHaveLength(1);
    expect(result.categoryScores.device_safety.score).toBe(100);
    expect(result.overallScore).toBe(91);
    expect(result.grade).toBe('EXCELLENT');
  });

  it('clamps category score to 0 when deductions exceed base score', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();

    // Add multiple critical and high findings to account_security:
    // No 2FA (Critical: -40), Password Reuse (Critical: -40), No Password Manager (High: -25)
    // Total penalty = 105 -> clamped to 0
    const modifiedSignals: SignalMap = {
      ...signals,
      'account.two_factor_primary_email': {
        id: 'account.two_factor_primary_email',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: 'none',
        timestamp: new Date().toISOString(),
        source: 'test',
      },
      'account.password_reuse': {
        id: 'account.password_reuse',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: 'frequent',
        timestamp: new Date().toISOString(),
        source: 'test',
      },
      'account.password_manager_used': {
        id: 'account.password_manager_used',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: false,
        timestamp: new Date().toISOString(),
        source: 'test',
      },
    };

    const result = engine.evaluate(modifiedSignals);

    expect(result.categoryScores.account_security.rawScore).toBe(-5);
    expect(result.categoryScores.account_security.score).toBe(0);
    expect(result.categoryScores.account_security.weightedScore).toBe(0);
    expect(result.categoryScores.account_security.status).toBe('critical');
  });

  it('supports custom configurable weights and penalties', () => {
    const customConfig: ScoringConfig = {
      categoryWeights: {
        account_security: 0.50,
        device_safety: 0.50,
        phishing_fraud: 0.0,
        privacy: 0.0,
        backup_recovery: 0.0,
        update_hygiene: 0.0,
      },
      severityPenalties: {
        critical: 50,
        high: 30,
        medium: 20,
        low: 10,
        info: 0,
      },
      invariants: {
        maxScoreWithOpenCritical: 70,
        enableCriticalFindingCap: true,
        progressiveCriticalPenalty: 5,
      },
      renormalizeWeightsOnMissingCategories: false,
      baseCategoryScore: 100,
    };

    const engine = new ScoringEngine({ config: customConfig });
    const signals = createPerfectProfile();

    const modifiedSignals: SignalMap = {
      ...signals,
      'account.password_manager_used': {
        id: 'account.password_manager_used',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: false, // High penalty = 30 in custom config
        timestamp: new Date().toISOString(),
        source: 'test',
      },
    };

    const result = engine.evaluate(modifiedSignals);

    // Account score: 100 - 30 = 70. Weight: 0.50 -> 35
    // Device score: 100. Weight: 0.50 -> 50
    // Total = 35 + 50 = 85
    expect(result.categoryScores.account_security.score).toBe(70);
    expect(result.categoryScores.device_safety.score).toBe(100);
    expect(result.overallScore).toBe(85);
  });

  it('throws an error if invalid configuration weights do not sum to 1.0', () => {
    const invalidConfig: ScoringConfig = {
      ...DEFAULT_SCORING_CONFIG,
      categoryWeights: {
        ...DEFAULT_SCORING_CONFIG.categoryWeights,
        account_security: 0.80, // Sum will be 1.45
      },
    };

    expect(() => new ScoringEngine({ config: invalidConfig })).toThrow(
      /Category weights must sum to 1.0/
    );
  });

  it('validates config integrity with validateScoringConfig', () => {
    const valid = validateScoringConfig(DEFAULT_SCORING_CONFIG);
    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateScoringConfig({
      ...DEFAULT_SCORING_CONFIG,
      invariants: {
        ...DEFAULT_SCORING_CONFIG.invariants,
        maxScoreWithOpenCritical: 150, // Invalid bounds
      },
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });
});
