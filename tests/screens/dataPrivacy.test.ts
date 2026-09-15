import { describe, it, expect } from 'vitest';
import { PLATFORM_CAPABILITY_MATRIX } from '../../src/lib/capabilities';

describe('Data & Privacy & iOS Degradation (§10, §4.2)', () => {
  it('ensures all signals have explicit Android and iOS support declared', () => {
    const signalEntries = Object.values(PLATFORM_CAPABILITY_MATRIX);
    expect(signalEntries.length).toBeGreaterThanOrEqual(10);

    for (const entry of signalEntries) {
      expect(entry.platforms.android).toBeDefined();
      expect(entry.platforms.ios).toBeDefined();
      expect(typeof entry.platforms.android.supported).toBe('boolean');
      expect(typeof entry.platforms.ios.supported).toBe('boolean');
    }
  });

  it('verifies that apps category signals are marked unsupported on iOS for privacy sandbox', () => {
    const appsSignals = Object.values(PLATFORM_CAPABILITY_MATRIX).filter((s) => s.category === 'apps');
    expect(appsSignals.length).toBeGreaterThan(0);

    for (const appSignal of appsSignals) {
      expect(appSignal.platforms.ios.supported).toBe(false);
      expect(appSignal.platforms.ios.status).toBe('unsupported');
    }
  });

  it('verifies security patch is marked unsupported on iOS with proper notes', () => {
    const patchSignal = PLATFORM_CAPABILITY_MATRIX['device.securityPatch'];
    expect(patchSignal).toBeDefined();
    expect(patchSignal?.platforms.ios.supported).toBe(false);
    expect(patchSignal?.platforms.ios.notes).toContain('iOS');
  });
});
