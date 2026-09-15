import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../../src/core/engine/scoringEngine';
import { createPerfectProfile } from '../../src/mock/profiles/perfectProfile';
import { SignalMap } from '../../src/core/models/signal';
import { EvidenceTier } from '../../src/core/types/evidenceTier';

describe('Invariant: Open Critical Finding Prevents 100 Score (§8)', () => {
  it('strictly caps the score to maxScoreWithOpenCritical when one critical finding exists', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();

    // Inject ONLY 1 critical finding: Screen Lock Disabled in device_safety
    // device_safety weight is 0.20. Penalty is 40.
    // Device category score = 60. Weighted = 12.
    // All other 5 categories have 100 score (total weighted = 80).
    // Mathematical raw score = 80 + 12 = 92.
    // BUT invariant ceiling must cap the score at 79!
    const modifiedSignals: SignalMap = {
      ...signals,
      'device.screen_lock_secured': {
        id: 'device.screen_lock_secured',
        category: 'device_safety',
        tier: EvidenceTier.TIER_2_OS_API,
        status: 'AVAILABLE',
        value: false, // Critical finding!
        timestamp: new Date().toISOString(),
        source: 'keyguard_manager',
      },
    };

    const result = engine.evaluate(modifiedSignals);

    expect(result.openCriticalFindingsCount).toBe(1);
    expect(result.invariantsApplied).toContain('CRITICAL_FINDING_SCORE_CEILING');
    expect(result.overallScore).toBe(79); // Capped to 79!
    expect(result.overallScore).toBeLessThan(80);
    expect(result.grade).toBe('GOOD'); // Or FAIR/GOOD based on grade boundary (79 is GOOD)
    expect(result.scoreExplanation.invariantsTriggered).toHaveLength(1);
    expect(result.scoreExplanation.invariantsTriggered[0]?.scoreBefore).toBe(92);
    expect(result.scoreExplanation.invariantsTriggered[0]?.scoreAfter).toBe(79);
  });

  it('progressively caps score lower when multiple critical findings exist', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();

    // Inject 2 critical findings:
    // 1. device.screen_lock_secured = false
    // 2. account.two_factor_primary_email = 'none'
    const modifiedSignals: SignalMap = {
      ...signals,
      'device.screen_lock_secured': {
        id: 'device.screen_lock_secured',
        category: 'device_safety',
        tier: EvidenceTier.TIER_2_OS_API,
        status: 'AVAILABLE',
        value: false,
        timestamp: new Date().toISOString(),
        source: 'keyguard_manager',
      },
      'account.two_factor_primary_email': {
        id: 'account.two_factor_primary_email',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: 'none',
        timestamp: new Date().toISOString(),
        source: 'assessment_survey',
      },
    };

    const result = engine.evaluate(modifiedSignals);

    // Ceiling = 79 - (2 - 1) * 10 = 69
    expect(result.openCriticalFindingsCount).toBe(2);
    expect(result.overallScore).toBe(69);
    expect(result.grade).toBe('FAIR');
    expect(result.invariantsApplied).toContain('CRITICAL_FINDING_SCORE_CEILING');
  });

  it('allows 100 score when there are zero open critical findings', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();
    const result = engine.evaluate(signals);

    expect(result.openCriticalFindingsCount).toBe(0);
    expect(result.overallScore).toBe(100);
    expect(result.invariantsApplied).toHaveLength(0);
  });

  it('does not cap score if the calculated raw score is already lower than ceiling', () => {
    const engine = new ScoringEngine();
    const signals = createPerfectProfile();

    // Create a situation where score is heavily degraded anyway (< 50)
    // 1 Critical finding + multiple high findings across all categories
    const degradedSignals: SignalMap = {
      ...signals,
      'device.screen_lock_secured': {
        id: 'device.screen_lock_secured',
        category: 'device_safety',
        tier: EvidenceTier.TIER_2_OS_API,
        status: 'AVAILABLE',
        value: false, // Critical (-40)
        timestamp: new Date().toISOString(),
        source: 'test',
      },
      'account.password_manager_used': {
        id: 'account.password_manager_used',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: false, // High (-25)
        timestamp: new Date().toISOString(),
        source: 'test',
      },
      'phishing.opens_unverified_links': {
        id: 'phishing.opens_unverified_links',
        category: 'phishing_fraud',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: true, // High (-25)
        timestamp: new Date().toISOString(),
        source: 'test',
      },
    };

    const result = engine.evaluate(degradedSignals);

    // Calculated raw is already <= 79, so ceiling trigger is not needed
    expect(result.openCriticalFindingsCount).toBe(1);
    expect(result.overallScore).toBeLessThanOrEqual(79);
    expect(result.invariantsApplied).toHaveLength(0);
  });
});
