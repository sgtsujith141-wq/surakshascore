import {
  Platform,
  Signal,
  Finding,
  ScoreBreakdown,
  StageProgress,
  AppRiskAnalysis,
  InstalledApp,
  HabitResponse,
} from '../../types';
import {
  collectDeviceSignals,
  DeviceCollectorOptions,
} from '../collectors/deviceCollector';
import {
  collectAppsSignals,
  AppsCollectorOptions,
} from '../collectors/appsCollector';
import {
  collectNetworkSignals,
  NetworkCollectorOptions,
} from '../collectors/networkCollector';
import {
  collectAccountSignals,
  AccountCollectorOptions,
} from '../collectors/accountCollector';
import { evaluateHabitsResponses } from '../collectors/habitsCollector';
import { computeScore } from '../scoring';

export interface ScanPipelineOptions {
  platform?: Platform;
  scanId?: string;
  deviceOptions?: DeviceCollectorOptions;
  appsOptions?: AppsCollectorOptions;
  networkOptions?: NetworkCollectorOptions;
  accountOptions?: AccountCollectorOptions;
  installedApps?: InstalledApp[];
  habitsResponses?: HabitResponse[];
  onStageChange?: (progress: StageProgress) => void;
}

export interface ScanPipelineResult {
  scanId: string;
  timestamp: string;
  platform: Platform;
  signals: Signal[];
  findings: Finding[];
  scoreBreakdown: ScoreBreakdown;
  stageProgress: StageProgress[];
  appAnalyses: AppRiskAnalysis[];
}

/**
 * Sequential Scan Pipeline Orchestrator (§7.2, §11).
 * Executes real sequential async pipeline:
 * Device -> Apps (Android only) -> Network -> Account -> Habits -> Scoring.
 */
export async function runScanPipeline(
  options?: ScanPipelineOptions
): Promise<ScanPipelineResult> {
  const scanId = options?.scanId ?? `scan_${Date.now()}`;
  const platform = options?.platform ?? 'android';
  const timestamp = new Date().toISOString();

  const signals: Signal[] = [];
  const findings: Finding[] = [];
  let appAnalyses: AppRiskAnalysis[] = [];

  const stageProgress: StageProgress[] = [
    { stage: 'device', label: 'Device & OS Integrity', status: 'pending', findingsCount: 0 },
    { stage: 'apps', label: 'Applications & Permissions', status: 'pending', findingsCount: 0 },
    { stage: 'network', label: 'Network & VPN Security', status: 'pending', findingsCount: 0 },
    { stage: 'account', label: 'Account & Breach Checks', status: 'pending', findingsCount: 0 },
    { stage: 'habits', label: 'Security Habits', status: 'pending', findingsCount: 0 },
  ];

  const updateStage = (index: number, status: StageProgress['status'], findingsCount: number, reasonIfSkipped?: string) => {
    const progress: StageProgress = {
      ...stageProgress[index]!,
      status,
      findingsCount,
      reasonIfSkipped,
    };
    stageProgress[index] = progress;
    options?.onStageChange?.(progress);
  };

  // 1. Stage: Device
  updateStage(0, 'running', 0);
  try {
    const deviceRes = await collectDeviceSignals({
      ...options?.deviceOptions,
      platform,
      scanId,
    });
    signals.push(...deviceRes.signals);
    findings.push(...deviceRes.findings);
    updateStage(0, 'done', deviceRes.findings.length);
  } catch {
    updateStage(0, 'blocked', 0, 'Device inspection error');
  }

  // 2. Stage: Apps (Android only)
  updateStage(1, 'running', 0);
  if (platform === 'android') {
    try {
      const appsRes = await collectAppsSignals({
        ...options?.appsOptions,
        platform,
        scanId,
        installedApps: options?.installedApps ?? options?.appsOptions?.installedApps,
      });
      signals.push(...appsRes.signals);
      findings.push(...appsRes.findings);
      appAnalyses = appsRes.appAnalyses;
      updateStage(1, 'done', appsRes.findings.length);
    } catch {
      updateStage(1, 'blocked', 0, 'App enumeration error');
    }
  } else {
    updateStage(1, 'skipped', 0, `App scanning not available on ${platform.toUpperCase()}`);
    // Register unavailable signals
    const appsRes = await collectAppsSignals({ platform, scanId });
    signals.push(...appsRes.signals);
  }

  // 3. Stage: Network
  updateStage(2, 'running', 0);
  try {
    const networkRes = await collectNetworkSignals({
      ...options?.networkOptions,
      platform,
      scanId,
    });
    signals.push(...networkRes.signals);
    findings.push(...networkRes.findings);
    updateStage(2, 'done', networkRes.findings.length);
  } catch {
    updateStage(2, 'blocked', 0, 'Network check error');
  }

  // 4. Stage: Account
  updateStage(3, 'running', 0);
  try {
    const accountRes = await collectAccountSignals({
      ...options?.accountOptions,
      scanId,
    });
    signals.push(...accountRes.signals);
    findings.push(...accountRes.findings);
    updateStage(3, 'done', accountRes.findings.length);
  } catch {
    updateStage(3, 'blocked', 0, 'Account check error');
  }

  // 5. Stage: Habits
  updateStage(4, 'running', 0);
  if (options?.habitsResponses && options.habitsResponses.length > 0) {
    const habitsRes = evaluateHabitsResponses(options.habitsResponses, scanId);
    signals.push(...habitsRes.signals);
    findings.push(...habitsRes.findings);
    updateStage(4, 'done', habitsRes.findings.length);
  } else {
    updateStage(4, 'skipped', 0, 'No recent habits assessment completed');
  }

  // 6. Compute Deterministic Score
  const scoreBreakdown = computeScore(findings, { platform });

  return {
    scanId,
    timestamp,
    platform,
    signals,
    findings,
    scoreBreakdown,
    stageProgress,
    appAnalyses,
  };
}
