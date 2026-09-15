import { describe, it, expect } from 'vitest';
import { MockSignalProvider, MockProfilePreset } from '../../src/mock/mockSignalProvider';
import { ScoringEngine } from '../../src/core/engine/scoringEngine';

describe('MockSignalProvider (Task 12)', () => {
  const provider = new MockSignalProvider();
  const engine = new ScoringEngine();

  const presets: MockProfilePreset[] = [
    'perfect',
    'critical_risk',
    'student',
    'elder',
    'unavailable',
  ];

  it.each(presets)('generates valid, evaluatable signals for preset: %s', (preset) => {
    const signals = provider.getProfile(preset);
    expect(signals).toBeDefined();
    expect(Object.keys(signals).length).toBeGreaterThan(0);

    const result = engine.evaluate(signals);
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.categoryScores).toBeDefined();
    expect(result.scoreExplanation).toBeDefined();
  });

  it('supports custom signal overrides on top of presets', () => {
    const customSignals = provider.getCustomProfile('perfect', {
      'account.two_factor_primary_email': {
        id: 'account.two_factor_primary_email',
        category: 'account_security',
        tier: 4,
        status: 'AVAILABLE',
        value: 'none',
        timestamp: new Date().toISOString(),
        source: 'override',
      },
    });

    const result = engine.evaluate(customSignals);
    expect(result.openCriticalFindingsCount).toBe(1);
    expect(result.overallScore).toBe(79); // Capped by invariant
  });
});
