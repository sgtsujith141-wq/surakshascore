import { describe, it, expect } from 'vitest';
import { runScanPipeline } from '../../src/lib/pipeline/scanPipeline';
import { InstalledApp } from '../../src/types';

describe('Scan Pipeline Orchestrator (§7.2, §11)', () => {
  const mockInstalledApps: InstalledApp[] = [
    {
      packageName: 'com.good.calc',
      appName: 'Calculator Safe',
      versionName: '1.0',
      versionCode: 1,
      targetSdkVersion: 34,
      isSystemApp: false,
      installSource: 'com.android.vending',
      category: 'utility',
      requestedPermissions: [],
      grantedPermissions: [],
    },
    {
      packageName: 'com.shady.flashlight',
      appName: 'Flashlight Ultra',
      versionName: '1.0',
      versionCode: 1,
      targetSdkVersion: 34,
      isSystemApp: false,
      installSource: 'com.android.vending',
      category: 'utility',
      requestedPermissions: ['android.permission.READ_SMS', 'android.permission.INTERNET'],
      grantedPermissions: ['android.permission.READ_SMS', 'android.permission.INTERNET'],
    },
  ];

  it('runs complete pipeline sweep on Android and produces deterministic score', async () => {
    const stageEvents: string[] = [];

    const result = await runScanPipeline({
      platform: 'android',
      installedApps: mockInstalledApps,
      deviceOptions: {
        nativeBridge: {
          getSecurityPatchDate: async () => '2026-05-01', // > 30 days
          isScreenLockEnabled: async () => true,
          getScreenLockType: async () => 'pin',
        },
      },
      networkOptions: {
        isPublicWifi: false,
        isVpnActive: false,
      },
      accountOptions: {
        twoFactorStatus: {
          emailHas2FA: true,
          bankingHas2FA: true,
          socialHas2FA: true,
        },
      },
      onStageChange: (p) => {
        stageEvents.push(`${p.stage}:${p.status}`);
      },
    });

    expect(result.scanId).toBeDefined();
    expect(result.platform).toBe('android');
    expect(result.stageProgress).toHaveLength(5);
    expect(result.stageProgress.every((s) => s.status === 'done' || s.status === 'skipped')).toBe(true);

    // Found device stale patch + shady app unexpected permission + combo
    expect(result.findings.length).toBeGreaterThanOrEqual(2);
    expect(result.scoreBreakdown.overallScore).toBeLessThan(100);
    expect(result.scoreBreakdown.grade).toBeDefined();
    expect(result.appAnalyses).toHaveLength(2);
  });

  it('runs pipeline on iOS gracefully with unscoreable apps category', async () => {
    const result = await runScanPipeline({
      platform: 'ios',
      installedApps: mockInstalledApps,
      networkOptions: {
        isPublicWifi: false,
      },
    });

    expect(result.platform).toBe('ios');
    expect(result.scoreBreakdown.unscoreableCategories).toContain('apps');
    expect(result.scoreBreakdown.weightRedistributed).toBe(true);

    const appsStage = result.stageProgress.find((s) => s.stage === 'apps');
    expect(appsStage?.status).toBe('skipped');
    expect(appsStage?.reasonIfSkipped).toContain('not available on IOS');
  });
});
