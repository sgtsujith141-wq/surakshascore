import { Signal, Finding, InstalledApp, AppRiskAnalysis, Platform } from '../../types';
import { analyzeAppPermissions } from '../rules/appPermissions';

export interface AppsCollectorOptions {
  platform?: Platform;
  scanId?: string;
  installedApps?: InstalledApp[];
  previousAppPermissions?: Record<string, string[]>; // packageName -> permission list from previous scan
  nativeBridge?: {
    getInstalledPackages?: () => Promise<InstalledApp[]>;
  };
}

export interface AppsCollectorResult {
  signals: Signal[];
  appAnalyses: AppRiskAnalysis[];
  findings: Finding[];
  totalAppsCount: number;
  highRiskAppsCount: number;
}

/**
 * Collects Apps Category signals and evaluates per-app risk and suspicious combinations (§4.2, §5.2, §7.5).
 */
export async function collectAppsSignals(
  options?: AppsCollectorOptions
): Promise<AppsCollectorResult> {
  const platform = options?.platform ?? 'android';
  const scanId = options?.scanId ?? `scan_${Date.now()}`;
  const now = new Date().toISOString();

  const signals: Signal[] = [];
  const appAnalyses: AppRiskAnalysis[] = [];
  const findings: Finding[] = [];

  // On iOS or Web: App inventory is unavailable
  if (platform === 'ios' || platform === 'web') {
    signals.push(
      {
        id: 'apps.installedList',
        category: 'apps',
        provenance: 'UNAVAILABLE',
        platform: ['android'],
        collectedAt: now,
        value: null,
      },
      {
        id: 'apps.permissionsPerApp',
        category: 'apps',
        provenance: 'UNAVAILABLE',
        platform: ['android'],
        collectedAt: now,
        value: null,
      }
    );

    return {
      signals,
      appAnalyses: [],
      findings: [],
      totalAppsCount: 0,
      highRiskAppsCount: 0,
    };
  }

  // On Android: Retrieve installed applications
  let apps: InstalledApp[] = options?.installedApps ?? [];
  if (apps.length === 0 && options?.nativeBridge?.getInstalledPackages) {
    apps = await options.nativeBridge.getInstalledPackages();
  }

  signals.push(
    {
      id: 'apps.installedList',
      category: 'apps',
      provenance: 'VERIFIED',
      platform: ['android'],
      collectedAt: now,
      value: { count: apps.length },
    },
    {
      id: 'apps.permissionsPerApp',
      category: 'apps',
      provenance: 'PERMISSION_BASED',
      platform: ['android'],
      collectedAt: now,
      value: { appsAnalyzed: apps.length },
    }
  );

  let highRiskCount = 0;

  for (const app of apps) {
    const prevPerms = options?.previousAppPermissions?.[app.packageName];
    const analysis = analyzeAppPermissions(app, scanId, prevPerms);
    appAnalyses.push(analysis);
    findings.push(...analysis.findings);

    if (analysis.riskScore < 70) {
      highRiskCount++;
    }
  }

  return {
    signals,
    appAnalyses,
    findings,
    totalAppsCount: apps.length,
    highRiskAppsCount: highRiskCount,
  };
}
