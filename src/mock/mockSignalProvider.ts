import { SignalMap, Signal } from '../core/models/signal';
import { createPerfectProfile } from './profiles/perfectProfile';
import { createCriticalRiskProfile } from './profiles/criticalRiskProfile';
import { createStudentProfile } from './profiles/studentProfile';
import { createElderProfile } from './profiles/elderProfile';
import { createUnavailableProfile } from './profiles/unavailableProfile';

export type MockProfilePreset =
  | 'perfect'
  | 'critical_risk'
  | 'student'
  | 'elder'
  | 'unavailable';

/**
 * MockSignalProvider (strictly for testing, preview, and local development).
 * Does NOT generate fake security results in production code.
 */
export class MockSignalProvider {
  /**
   * Generates a predefined signal profile.
   */
  getProfile(preset: MockProfilePreset, timestamp?: string): SignalMap {
    const ts = timestamp ?? new Date().toISOString();
    switch (preset) {
      case 'perfect':
        return createPerfectProfile(ts);
      case 'critical_risk':
        return createCriticalRiskProfile(ts);
      case 'student':
        return createStudentProfile(ts);
      case 'elder':
        return createElderProfile(ts);
      case 'unavailable':
        return createUnavailableProfile(ts);
      default:
        return createPerfectProfile(ts);
    }
  }

  /**
   * Merges custom signal overrides onto a preset profile.
   */
  getCustomProfile(preset: MockProfilePreset, overrides: Record<string, Signal>): SignalMap {
    const base = this.getProfile(preset);
    const combined: Record<string, Signal> = { ...base };
    for (const [key, val] of Object.entries(overrides)) {
      if (val) {
        combined[key] = val;
      }
    }
    return Object.freeze(combined);
  }
}
