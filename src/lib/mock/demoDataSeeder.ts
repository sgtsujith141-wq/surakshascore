/**
 * Demo Mode Data Seeder (§11, Item 21)
 * INTERNAL / DEV-ONLY SEEDER — NEVER IN PRODUCTION SCAN PATH.
 * Populates realistic 7-day historical audit progression for judge walkthroughs.
 */

import { Finding, Platform, CategoryScoreBreakdown } from '../../types';
import { ScanPipelineResult } from '../pipeline/scanPipeline';

export interface TimelineScanRecord {
  id: string;
  timestamp: string;
  daysAgo: number;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  delta: number; // e.g. +14
  openFindingsCount: number;
  resolvedSinceLastCount: number;
  summary: string;
  categoryScores: Record<string, CategoryScoreBreakdown>;
}

export interface DemoProfileData {
  currentScan: ScanPipelineResult;
  history: TimelineScanRecord[];
  vaultSummary: {
    totalAccounts: number;
    breachedIdentities: number;
    reusedPasswordsCount: number;
    totpCoveragePercent: number;
  };
}

export function generateDemoHistory(): TimelineScanRecord[] {
  return [
    {
      id: 'scan-demo-d07',
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      daysAgo: 7,
      score: 52,
      grade: 'F',
      delta: 0,
      openFindingsCount: 6,
      resolvedSinceLastCount: 0,
      summary: 'Initial baseline audit: Unsecured device state, ADB active, 2 critical permission combos.',
      categoryScores: {
        device: { category: 'device', score: 40, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 2, pointContribution: 10, findings: [], provenanceCounts: { VERIFIED: 3, PERMISSION_BASED: 0, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        apps: { category: 'apps', score: 35, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 2, pointContribution: 8.75, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 6, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        network: { category: 'network', score: 70, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 1, pointContribution: 10.5, findings: [], provenanceCounts: { VERIFIED: 2, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        account: { category: 'account', score: 60, weight: 0.20, originalWeight: 0.20, isScoreable: true, openFindingsCount: 1, pointContribution: 12, findings: [], provenanceCounts: { VERIFIED: 1, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        habits: { category: 'habits', score: 70, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 10.5, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 0, SELF_REPORTED: 5, UNAVAILABLE: 0 } },
      },
    },
    {
      id: 'scan-demo-d05',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      daysAgo: 5,
      score: 68,
      grade: 'D',
      delta: +16,
      openFindingsCount: 4,
      resolvedSinceLastCount: 2,
      summary: 'Biometric screen lock enabled (+16 pts). Developer bridge still active.',
      categoryScores: {
        device: { category: 'device', score: 70, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 1, pointContribution: 17.5, findings: [], provenanceCounts: { VERIFIED: 3, PERMISSION_BASED: 0, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        apps: { category: 'apps', score: 55, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 2, pointContribution: 13.75, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 6, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        network: { category: 'network', score: 80, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 12, findings: [], provenanceCounts: { VERIFIED: 2, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        account: { category: 'account', score: 60, weight: 0.20, originalWeight: 0.20, isScoreable: true, openFindingsCount: 1, pointContribution: 12, findings: [], provenanceCounts: { VERIFIED: 1, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        habits: { category: 'habits', score: 85, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 12.75, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 0, SELF_REPORTED: 5, UNAVAILABLE: 0 } },
      },
    },
    {
      id: 'scan-demo-d03',
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      daysAgo: 3,
      score: 76,
      grade: 'C',
      delta: +8,
      openFindingsCount: 3,
      resolvedSinceLastCount: 1,
      summary: 'Sideloaded APK sources revoked (+8 pts). SMS+Internet background permission pending.',
      categoryScores: {
        device: { category: 'device', score: 85, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 1, pointContribution: 21.25, findings: [], provenanceCounts: { VERIFIED: 3, PERMISSION_BASED: 0, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        apps: { category: 'apps', score: 60, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 1, pointContribution: 15, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 6, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        network: { category: 'network', score: 90, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 13.5, findings: [], provenanceCounts: { VERIFIED: 2, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        account: { category: 'account', score: 70, weight: 0.20, originalWeight: 0.20, isScoreable: true, openFindingsCount: 1, pointContribution: 14, findings: [], provenanceCounts: { VERIFIED: 1, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        habits: { category: 'habits', score: 85, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 12.75, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 0, SELF_REPORTED: 5, UNAVAILABLE: 0 } },
      },
    },
    {
      id: 'scan-demo-today',
      timestamp: new Date().toISOString(),
      daysAgo: 0,
      score: 84,
      grade: 'B',
      delta: +8,
      openFindingsCount: 2,
      resolvedSinceLastCount: 1,
      summary: 'Current Active Posture: 2 remaining risk vectors (Stale patch, SMS permission).',
      categoryScores: {
        device: { category: 'device', score: 85, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 1, pointContribution: 21.25, findings: [], provenanceCounts: { VERIFIED: 3, PERMISSION_BASED: 0, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        apps: { category: 'apps', score: 70, weight: 0.25, originalWeight: 0.25, isScoreable: true, openFindingsCount: 1, pointContribution: 17.5, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 6, SELF_REPORTED: 0, UNAVAILABLE: 0 } },
        network: { category: 'network', score: 100, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 15, findings: [], provenanceCounts: { VERIFIED: 2, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        account: { category: 'account', score: 85, weight: 0.20, originalWeight: 0.20, isScoreable: true, openFindingsCount: 0, pointContribution: 17, findings: [], provenanceCounts: { VERIFIED: 1, PERMISSION_BASED: 0, SELF_REPORTED: 1, UNAVAILABLE: 0 } },
        habits: { category: 'habits', score: 90, weight: 0.15, originalWeight: 0.15, isScoreable: true, openFindingsCount: 0, pointContribution: 13.5, findings: [], provenanceCounts: { VERIFIED: 0, PERMISSION_BASED: 0, SELF_REPORTED: 5, UNAVAILABLE: 0 } },
      },
    },
  ];
}

/**
 * Seeds a full demo state into local storage for judges.
 */
export function seedDemoData(platform: Platform = 'android'): DemoProfileData {
  const history = generateDemoHistory();

  const demoFindings: Finding[] = [
    {
      id: 'finding-demo-sms',
      type: 'APP_SUSPICIOUS_PERMISSION_COMBO',
      title: 'Suspicious App Permission Combination: SMS + Internet',
      category: 'apps',
      severity: 'critical',
      provenance: 'PERMISSION_BASED',
      status: 'open',
      scanId: 'scan-demo-today',
      firstSeenScanId: 'scan-demo-d07',
      whyDetected: 'Application "com.cleaner.fastbattery" holds both READ_SMS and INTERNET permissions without being a default SMS handler.',
      whyItMatters: 'Apps with SMS access and outbound internet can silently exfiltrate two-factor authentication (2FA) OTP codes and bank verification texts.',
      effort: 'quick',
      evidence: [
        {
          id: 'ev-pkg',
          label: 'Package Name',
          value: 'com.cleaner.fastbattery',
          provenance: 'PERMISSION_BASED',
          details: 'Category declared: UTILITIES',
        },
        {
          id: 'ev-perms',
          label: 'Declared Capabilities',
          value: 'android.permission.RECEIVE_SMS, android.permission.INTERNET',
          provenance: 'PERMISSION_BASED',
        },
      ],
      recommendedActions: [
        {
          id: 'act-revoke-sms',
          label: 'Revoke SMS in App Settings',
          type: 'open_settings',
          target: 'app_permissions',
        },
      ],
    },
    {
      id: 'finding-demo-patch',
      type: 'STALE_SECURITY_PATCH',
      title: 'Outdated Security Patch (120 Days Stale)',
      category: 'device',
      severity: 'high',
      provenance: 'VERIFIED',
      status: 'open',
      scanId: 'scan-demo-today',
      firstSeenScanId: 'scan-demo-d07',
      whyDetected: 'Security patch level is 2026-04-01 (120 days ago). Critical known vulnerabilities unpatched.',
      whyItMatters: 'Known kernel CVEs and privilege escalation vulnerabilities remain unpatched on this device.',
      effort: 'moderate',
      evidence: [
        {
          id: 'ev-patch-date',
          label: 'Reported Patch Level',
          value: '2026-04-01',
          provenance: 'VERIFIED',
        },
        {
          id: 'ev-staleness',
          label: 'Patch Age',
          value: '120 Days (Exceeds 30d threshold)',
          provenance: 'VERIFIED',
        },
      ],
      recommendedActions: [
        {
          id: 'act-sys-update',
          label: 'Check for System Updates',
          type: 'open_settings',
          target: 'system_update',
        },
      ],
    },
  ];

  const currentScan: ScanPipelineResult = {
    scanId: 'scan-demo-today',
    timestamp: new Date().toISOString(),
    platform,
    scoreBreakdown: {
      overallScore: 84,
      grade: 'Good',
      explanation: 'Score is 84/100 (Grade Good). Open critical finding prevents 100 score.',
      categoryScores: history[history.length - 1]!.categoryScores as Record<any, any>,
      totalOpenFindings: 2,
      unscoreableCategories: platform === 'ios' ? ['apps'] : [],
      weightRedistributed: platform === 'ios',
    },
    signals: [
      {
        id: 'device.securityPatch',
        category: 'device',
        platform: [platform],
        provenance: 'VERIFIED',
        collectedAt: new Date().toISOString(),
        value: { daysSince: 120, patchDate: '2026-04-01' },
      },
      {
        id: 'device.developerOptionsEnabled',
        category: 'device',
        platform: [platform],
        provenance: 'VERIFIED',
        collectedAt: new Date().toISOString(),
        value: false,
      },
      {
        id: 'device.screenLockEnabled',
        category: 'device',
        platform: [platform],
        provenance: 'VERIFIED',
        collectedAt: new Date().toISOString(),
        value: { enabled: true, lockType: 'biometric' },
      },
    ],
    findings: demoFindings,
    stageProgress: [
      { stage: 'device', label: 'Device Integrity', status: 'done', findingsCount: 1 },
      { stage: 'apps', label: 'App Permissions', status: 'done', findingsCount: 1 },
      { stage: 'network', label: 'Network Security', status: 'done', findingsCount: 0 },
      { stage: 'account', label: 'Account Safety', status: 'done', findingsCount: 0 },
      { stage: 'habits', label: 'Security Habits', status: 'done', findingsCount: 0 },
    ],
    appAnalyses: [],
  };

  const demoData: DemoProfileData = {
    currentScan,
    history,
    vaultSummary: {
      totalAccounts: 8,
      breachedIdentities: 1,
      reusedPasswordsCount: 0,
      totpCoveragePercent: 88,
    },
  };

  // Persist demo mode flag to localStorage when in browser environment
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pss_demo_history', JSON.stringify(history));
  }

  return demoData;
}
