import { describe, it, expect } from 'vitest';
import { collectAppsSignals } from '../../src/lib/collectors/appsCollector';
import { analyzeAppPermissions } from '../../src/lib/rules/appPermissions';
import { InstalledApp } from '../../src/types';

describe('Apps Collector & Permission Engine (§4.2, §5.2, §7.5)', () => {
  const sampleTorchApp: InstalledApp = {
    packageName: 'com.utility.flashflashlight',
    appName: 'Bright Torch Flashlight',
    versionName: '1.2.0',
    versionCode: 12,
    targetSdkVersion: 34,
    isSystemApp: false,
    installSource: 'com.android.vending',
    category: 'utility',
    requestedPermissions: [
      'android.permission.INTERNET',
      'android.permission.READ_SMS',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    grantedPermissions: [
      'android.permission.INTERNET',
      'android.permission.READ_SMS',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  };

  it('detects unexpected permissions for utility category', () => {
    const analysis = analyzeAppPermissions(sampleTorchApp, 'scan_1');

    expect(analysis.unexpectedPermissions.length).toBeGreaterThanOrEqual(2);
    expect(analysis.unexpectedPermissions.some((p) => p.permission.includes('READ_SMS'))).toBe(true);
    expect(analysis.unexpectedPermissions.some((p) => p.permission.includes('ACCESS_FINE_LOCATION'))).toBe(true);

    const unexpectedPermFinding = analysis.findings.find((f) => f.type === 'APP_UNEXPECTED_PERMISSION');
    expect(unexpectedPermFinding).toBeDefined();
    expect(unexpectedPermFinding?.severity).toBe('high');
  });

  it('detects suspicious combo: SMS + Internet', () => {
    const analysis = analyzeAppPermissions(sampleTorchApp, 'scan_1');

    expect(analysis.suspiciousCombos.some((c) => c.ruleId === 'COMBO_SMS_INTERNET')).toBe(true);
    const comboFinding = analysis.findings.find((f) => f.type === 'APP_SUSPICIOUS_PERMISSION_COMBO');
    expect(comboFinding).toBeDefined();
    expect(comboFinding?.severity).toBe('critical');
    expect(comboFinding?.title).toContain('SMS Interception & Network Exfiltration');
  });

  it('calculates degraded per-app risk score for high-risk app', () => {
    const analysis = analyzeAppPermissions(sampleTorchApp, 'scan_1');
    // Base 100 - (15*2 unexpected sensitive) - 35 (SMS+Internet combo) = 35
    expect(analysis.riskScore).toBeLessThan(50);
  });

  it('detects sideloaded app install source', () => {
    const sideloadedApp: InstalledApp = {
      ...sampleTorchApp,
      packageName: 'com.sideloaded.game',
      appName: 'Free APK Game',
      installSource: null, // Sideloaded
      category: 'game',
      grantedPermissions: ['android.permission.INTERNET'],
    };

    const analysis = analyzeAppPermissions(sideloadedApp, 'scan_1');
    expect(analysis.isSideloaded).toBe(true);
    expect(analysis.findings.some((f) => f.type === 'APP_SIDELOADED_FLAGGED')).toBe(true);
  });

  it('detects unused app with sensitive permissions (>60 days)', () => {
    const seventyDaysAgo = Date.now() - 70 * 24 * 3600 * 1000;
    const unusedApp: InstalledApp = {
      ...sampleTorchApp,
      packageName: 'com.old.scanner',
      appName: 'Old Document Scanner',
      lastTimeUsed: seventyDaysAgo,
      category: 'utility',
      grantedPermissions: ['android.permission.CAMERA'],
    };

    const analysis = analyzeAppPermissions(unusedApp, 'scan_1');
    expect(analysis.isUnusedWithSensitivePerms).toBe(true);
    expect(analysis.findings.some((f) => f.type === 'APP_UNUSED_WITH_SENSITIVE_PERMISSIONS')).toBe(true);
  });

  it('detects new sensitive permission since last scan (N3 diffing)', () => {
    const previousPerms = ['android.permission.INTERNET'];
    const updatedApp: InstalledApp = {
      ...sampleTorchApp,
      packageName: 'com.example.messenger',
      appName: 'Chat Messenger',
      category: 'messaging',
      grantedPermissions: ['android.permission.INTERNET', 'android.permission.RECORD_AUDIO'],
    };

    const analysis = analyzeAppPermissions(updatedApp, 'scan_2', previousPerms);
    const diffFinding = analysis.findings.find(
      (f) => f.type === 'APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN'
    );
    expect(diffFinding).toBeDefined();
    expect(diffFinding?.whyDetected).toContain('RECORD_AUDIO');
  });

  it('returns UNAVAILABLE signals on iOS without running app inspection', async () => {
    const result = await collectAppsSignals({
      platform: 'ios',
      installedApps: [sampleTorchApp],
    });

    expect(result.signals.every((s) => s.provenance === 'UNAVAILABLE')).toBe(true);
    expect(result.appAnalyses).toHaveLength(0);
    expect(result.findings).toHaveLength(0);
  });
});
