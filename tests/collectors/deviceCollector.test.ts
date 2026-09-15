import { describe, it, expect } from 'vitest';
import { collectDeviceSignals, calculateDaysSince } from '../../src/lib/collectors/deviceCollector';

describe('Device Collector (§4.2, §5.2)', () => {
  it('calculates days since date string properly', () => {
    const days = calculateDaysSince(new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString());
    expect(days).toBe(40);
  });

  it('generates STALE_SECURITY_PATCH finding on Android when patch is > 30 days old', async () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    const result = await collectDeviceSignals({
      platform: 'android',
      nativeBridge: {
        getSecurityPatchDate: async () => fortyDaysAgo,
      },
    });

    expect(result.signals.some((s) => s.id === 'device.securityPatch')).toBe(true);
    const staleFinding = result.findings.find((f) => f.type === 'STALE_SECURITY_PATCH');
    expect(staleFinding).toBeDefined();
    expect(staleFinding?.severity).toBe('low');
    expect(staleFinding?.provenance).toBe('VERIFIED');
  });

  it('generates SCREEN_LOCK_DISABLED finding when lock is disabled', async () => {
    const result = await collectDeviceSignals({
      platform: 'android',
      nativeBridge: {
        isScreenLockEnabled: async () => false,
      },
    });

    const lockFinding = result.findings.find((f) => f.type === 'SCREEN_LOCK_DISABLED');
    expect(lockFinding).toBeDefined();
    expect(lockFinding?.severity).toBe('critical');
  });

  it('generates WEAK_LOCK_TYPE when lock is pattern', async () => {
    const result = await collectDeviceSignals({
      platform: 'android',
      nativeBridge: {
        isScreenLockEnabled: async () => true,
        getScreenLockType: async () => 'pattern',
      },
    });

    const weakFinding = result.findings.find((f) => f.type === 'WEAK_LOCK_TYPE');
    expect(weakFinding).toBeDefined();
    expect(weakFinding?.severity).toBe('medium');
  });

  it('generates DEVELOPER_OPTIONS_ENABLED when active on Android', async () => {
    const result = await collectDeviceSignals({
      platform: 'android',
      nativeBridge: {
        isDeveloperOptionsEnabled: async () => true,
      },
    });

    const devFinding = result.findings.find((f) => f.type === 'DEVELOPER_OPTIONS_ENABLED');
    expect(devFinding).toBeDefined();
    expect(devFinding?.severity).toBe('medium');
  });

  it('generates UNKNOWN_SOURCES_ENABLED when sideloading is allowed', async () => {
    const result = await collectDeviceSignals({
      platform: 'android',
      nativeBridge: {
        isUnknownSourcesAllowed: async () => true,
      },
    });

    const sideloadFinding = result.findings.find((f) => f.type === 'UNKNOWN_SOURCES_ENABLED');
    expect(sideloadFinding).toBeDefined();
    expect(sideloadFinding?.severity).toBe('high');
  });

  it('marks patch as UNAVAILABLE on iOS without creating spurious findings', async () => {
    const result = await collectDeviceSignals({
      platform: 'ios',
    });

    const patchSignal = result.signals.find((s) => s.id === 'device.securityPatch');
    expect(patchSignal?.provenance).toBe('UNAVAILABLE');
    expect(result.findings.some((f) => f.type === 'STALE_SECURITY_PATCH')).toBe(false);
  });
});
