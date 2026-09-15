import { describe, it, expect } from 'vitest';
import { DeterministicRuleEngine } from '../../src/core/engine/ruleEngine';
import { createPerfectProfile } from '../../src/mock/profiles/perfectProfile';
import { createUnavailableProfile } from '../../src/mock/profiles/unavailableProfile';
import { SignalMap } from '../../src/core/models/signal';
import { EvidenceTier } from '../../src/core/types/evidenceTier';

describe('DeterministicRuleEngine (Task 4 & Requirements)', () => {
  it('is completely deterministic: identical signals produce identical findings', () => {
    const engine = new DeterministicRuleEngine();
    const signals = createPerfectProfile();

    const modifiedSignals: SignalMap = {
      ...signals,
      'account.two_factor_primary_email': {
        id: 'account.two_factor_primary_email',
        category: 'account_security',
        tier: EvidenceTier.TIER_4_SELF_REPORTED,
        status: 'AVAILABLE',
        value: 'none',
        timestamp: '2026-08-16T10:00:00.000Z',
        source: 'test',
      },
    };

    const run1 = engine.evaluate(modifiedSignals);
    const run2 = engine.evaluate(modifiedSignals);
    const run3 = engine.evaluate(modifiedSignals);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
    expect(run1).toHaveLength(1);
    expect(run1[0]?.ruleId).toBe('RULE_ACCT_NO_2FA_PRIMARY');
  });

  it('gracefully handles UNAVAILABLE signals without throwing or triggering false positives', () => {
    const engine = new DeterministicRuleEngine();
    const unavailableSignals = createUnavailableProfile();

    const findings = engine.evaluate(unavailableSignals);

    // When signals are unavailable, NO false positive findings must be triggered
    expect(findings).toHaveLength(0);
  });

  it('gracefully handles empty signal map', () => {
    const engine = new DeterministicRuleEngine();
    const emptySignals: SignalMap = {};

    const findings = engine.evaluate(emptySignals);
    expect(findings).toHaveLength(0);
  });

  it('gracefully handles PERMISSION_DENIED or NOT_SUPPORTED signals', () => {
    const engine = new DeterministicRuleEngine();
    const signals: SignalMap = {
      'device.screen_lock_secured': {
        id: 'device.screen_lock_secured',
        category: 'device_safety',
        tier: EvidenceTier.TIER_2_OS_API,
        status: 'PERMISSION_DENIED',
        value: null,
        timestamp: new Date().toISOString(),
        source: 'android_api',
      },
      'device.storage_encrypted': {
        id: 'device.storage_encrypted',
        category: 'device_safety',
        tier: EvidenceTier.TIER_1_HARDWARE,
        status: 'NOT_SUPPORTED',
        value: null,
        timestamp: new Date().toISOString(),
        source: 'android_api',
      },
    };

    const findings = engine.evaluate(signals);
    expect(findings).toHaveLength(0);
  });
});
