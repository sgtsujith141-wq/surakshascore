import { describe, it, expect } from 'vitest';
import { CompletenessEngine } from '../../src/core/engine/completenessEngine';
import { ALL_BUILTIN_RULES } from '../../src/core/rules';
import { createPerfectProfile } from '../../src/mock/profiles/perfectProfile';
import { createUnavailableProfile } from '../../src/mock/profiles/unavailableProfile';
import { SignalMap } from '../../src/core/models/signal';
import { EvidenceTier } from '../../src/core/types/evidenceTier';

describe('Evidence Completeness (Task 7)', () => {
  const engine = new CompletenessEngine();

  it('calculates 100% (1.0) completeness when all expected signals are available', () => {
    const signals = createPerfectProfile();
    const report = engine.evaluateCompleteness(ALL_BUILTIN_RULES, signals);

    expect(report.overallCompleteness).toBe(1.0);
    expect(report.totalUnavailableSignals).toBe(0);
    expect(report.totalAvailableSignals).toBe(report.totalExpectedSignals);

    for (const cat of Object.values(report.categories)) {
      expect(cat.completenessRatio).toBe(1.0);
      expect(cat.unavailableSignalsCount).toBe(0);
      expect(cat.availableSignalsCount).toBe(cat.totalExpectedSignals);
    }
  });

  it('calculates 0% (0.0) completeness when all signals are UNAVAILABLE', () => {
    const unavailableSignals = createUnavailableProfile();
    const report = engine.evaluateCompleteness(ALL_BUILTIN_RULES, unavailableSignals);

    expect(report.overallCompleteness).toBe(0.0);
    expect(report.totalAvailableSignals).toBe(0);
    expect(report.totalUnavailableSignals).toBe(report.totalExpectedSignals);

    for (const cat of Object.values(report.categories)) {
      expect(cat.completenessRatio).toBe(0.0);
      expect(cat.availableSignalsCount).toBe(0);
    }
  });

  it('calculates exact partial completeness ratios when subset of signals is available', () => {
    // Only provide 1 available signal in account_security
    const partialSignals: SignalMap = {
      'account.two_factor_primary_email': {
        id: 'account.two_factor_primary_email',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: 'authenticator_app',
        timestamp: new Date().toISOString(),
        source: 'test',
      },
    };

    const report = engine.evaluateCompleteness(ALL_BUILTIN_RULES, partialSignals);

    expect(report.categories.account_security.totalExpectedSignals).toBe(3);
    expect(report.categories.account_security.availableSignalsCount).toBe(1);
    expect(report.categories.account_security.unavailableSignalsCount).toBe(2);
    expect(report.categories.account_security.completenessRatio).toBeCloseTo(0.333, 2);

    expect(report.categories.device_safety.availableSignalsCount).toBe(0);
    expect(report.categories.device_safety.completenessRatio).toBe(0.0);

    expect(report.totalAvailableSignals).toBe(1);
    expect(report.overallCompleteness).toBeLessThan(0.15);
  });

  it('accurately reports tier distribution breakdown', () => {
    const signals = createPerfectProfile();
    const report = engine.evaluateCompleteness(ALL_BUILTIN_RULES, signals);

    // In perfect profile, device.storage_encrypted is Tier 1
    const deviceCat = report.categories.device_safety;
    expect(deviceCat.tierBreakdown[EvidenceTier.TIER_1_HARDWARE]).toBeGreaterThanOrEqual(1);
    expect(deviceCat.tierBreakdown[EvidenceTier.TIER_2_OS_API]).toBeGreaterThanOrEqual(1);

    // Account signals are Tier 4 (self reported)
    const acctCat = report.categories.account_security;
    expect(acctCat.tierBreakdown[EvidenceTier.TIER_4_SELF_REPORTED]).toBe(3);
  });
});
