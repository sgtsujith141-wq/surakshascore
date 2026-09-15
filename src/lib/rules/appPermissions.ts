import {
  AppCategory,
  InstalledApp,
  PermissionAnalysisResult,
  SuspiciousComboRule,
  SuspiciousComboMatch,
  AppRiskAnalysis,
  Finding,
} from '../../types';
import { createFindingFromTemplate, getFindingTemplate } from '../findings/registry';

/**
 * Known sensitive Android permissions requiring heightened user scrutiny.
 */
export const SENSITIVE_PERMISSIONS: readonly string[] = [
  'android.permission.READ_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.SEND_SMS',
  'android.permission.READ_CONTACTS',
  'android.permission.WRITE_CONTACTS',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA',
  'android.permission.READ_CALL_LOG',
  'android.permission.WRITE_CALL_LOG',
  'android.permission.PROCESS_OUTGOING_CALLS',
  'android.permission.PACKAGE_USAGE_STATS',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.BIND_ACCESSIBILITY_SERVICE',
];

/**
 * Normalizes permission string to handle short or fully-qualified forms.
 */
export function normalizePermission(perm: string): string {
  if (perm.startsWith('android.permission.')) {
    return perm;
  }
  return `android.permission.${perm}`;
}

/**
 * Checks whether a permission is classified as sensitive.
 */
export function isSensitivePermission(permission: string): boolean {
  const norm = normalizePermission(permission);
  return SENSITIVE_PERMISSIONS.includes(norm);
}

/**
 * Category-to-expected permissions mapping (§7.5).
 */
export const EXPECTED_PERMISSIONS_BY_CATEGORY: Record<AppCategory, readonly string[]> = {
  navigation: [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.VIBRATE',
    'android.permission.WAKE_LOCK',
    'android.permission.POST_NOTIFICATIONS',
  ],
  messaging: [
    'android.permission.READ_CONTACTS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
  ],
  social: [
    'android.permission.READ_CONTACTS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.POST_NOTIFICATIONS',
  ],
  finance: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.CAMERA', // QR scanner
    'android.permission.USE_BIOMETRIC',
    'android.permission.USE_FINGERPRINT',
    'android.permission.POST_NOTIFICATIONS',
  ],
  browser: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.DOWNLOAD_WITHOUT_NOTIFICATION',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.POST_NOTIFICATIONS',
  ],
  media: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.RECORD_AUDIO',
    'android.permission.WAKE_LOCK',
    'android.permission.POST_NOTIFICATIONS',
  ],
  game: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.VIBRATE',
    'android.permission.WAKE_LOCK',
    'android.permission.POST_NOTIFICATIONS',
  ],
  productivity: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.READ_CALENDAR',
    'android.permission.WRITE_CALENDAR',
    'android.permission.POST_NOTIFICATIONS',
  ],
  utility: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.VIBRATE',
    'android.permission.WAKE_LOCK',
    'android.permission.POST_NOTIFICATIONS',
  ],
  unknown: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.POST_NOTIFICATIONS',
  ],
};

/**
 * Suspicious permission combinations ruleset (§5.2).
 * Documented ruleset with minimum 6 concrete combos.
 */
export const SUSPICIOUS_PERMISSION_COMBOS: readonly SuspiciousComboRule[] = [
  {
    id: 'COMBO_SMS_INTERNET',
    name: 'SMS Interception & Network Exfiltration',
    description: 'App can read/receive 2FA SMS verification codes and transmit them over the internet.',
    requiredPermissions: [
      'android.permission.READ_SMS',
      'android.permission.INTERNET',
    ],
    severity: 'critical',
    penalty: 35,
  },
  {
    id: 'COMBO_SURVEILLANCE_TRIAD',
    name: 'Surveillance Triad (Contacts + Location + Audio)',
    description: 'App can record ambient room audio, track precise geolocation, and map your social contact graph.',
    requiredPermissions: [
      'android.permission.READ_CONTACTS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.RECORD_AUDIO',
    ],
    severity: 'critical',
    penalty: 40,
  },
  {
    id: 'COMBO_CAMERA_CONTACTS',
    name: 'Identity & Facial Photo Harvesting',
    description: 'App can capture camera photos and correlate them with device contact identities.',
    requiredPermissions: [
      'android.permission.CAMERA',
      'android.permission.READ_CONTACTS',
    ],
    severity: 'high',
    penalty: 25,
  },
  {
    id: 'COMBO_SMS_CONTACTS',
    name: 'SMS & Contact Book Access (Worm / Impersonation)',
    description: 'App can harvest contact numbers and inspect private SMS conversations.',
    requiredPermissions: [
      'android.permission.READ_SMS',
      'android.permission.READ_CONTACTS',
    ],
    severity: 'high',
    penalty: 30,
  },
  {
    id: 'COMBO_BACKGROUND_TRACKING',
    name: 'Persistent Background Geolocation & Storage',
    description: 'App can track physical coordinates in the background and cache movement logs.',
    requiredPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
    severity: 'high',
    penalty: 25,
  },
  {
    id: 'COMBO_AUDIO_STORAGE_INTERNET',
    name: 'Audio Recording & Web Exfiltration',
    description: 'App can record microphone audio, store audio buffers locally, and upload them.',
    requiredPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
    ],
    severity: 'high',
    penalty: 25,
  },
];

/**
 * Analyzes permissions of an installed application against category baselines and combo rules.
 */
export function analyzeAppPermissions(
  app: InstalledApp,
  scanId: string = 'scan_active',
  previousSensitivePermissions?: readonly string[]
): AppRiskAnalysis {
  const category = app.category || 'unknown';
  const expectedList = EXPECTED_PERMISSIONS_BY_CATEGORY[category] || EXPECTED_PERMISSIONS_BY_CATEGORY.unknown;
  const expectedSet = new Set(expectedList.map(normalizePermission));

  const grantedNormalized = app.grantedPermissions.map(normalizePermission);
  const grantedSet = new Set(grantedNormalized);

  const unexpectedPermissions: PermissionAnalysisResult[] = [];
  const findings: Finding[] = [];

  // 1. Evaluate unexpected permissions
  for (const perm of grantedNormalized) {
    const isSensitive = isSensitivePermission(perm);
    const isExpected = expectedSet.has(perm);

    if (!isExpected) {
      const shortName = perm.replace('android.permission.', '');
      const reason = `Granted ${shortName} is unusual for a ${category} application`;

      unexpectedPermissions.push({
        permission: perm,
        granted: true,
        expected: false,
        reason,
        isSensitive,
      });

      // Only generate individual findings for SENSITIVE unexpected permissions to avoid noise
      if (isSensitive) {
        const template = getFindingTemplate('APP_UNEXPECTED_PERMISSION');
        if (template) {
          const finding = createFindingFromTemplate(
            template,
            {
              signals: {},
              appName: app.appName,
              packageName: app.packageName,
              permissionName: shortName,
              reason,
              scanId,
            },
            {
              id: `finding_perm_${app.packageName}_${shortName.toLowerCase()}`,
              category: 'apps',
              provenance: 'PERMISSION_BASED',
              scanId,
            }
          );
          findings.push(finding);
        }
      }
    }
  }

  // 2. Evaluate suspicious permission combos
  const matchedCombos: SuspiciousComboMatch[] = [];
  for (const combo of SUSPICIOUS_PERMISSION_COMBOS) {
    const hasAll = combo.requiredPermissions.every((p) => grantedSet.has(normalizePermission(p)));
    if (hasAll) {
      matchedCombos.push({
        ruleId: combo.id,
        name: combo.name,
        description: combo.description,
        matchedPermissions: combo.requiredPermissions,
        severity: combo.severity,
        penalty: combo.penalty,
      });

      const comboTemplate = getFindingTemplate('APP_SUSPICIOUS_PERMISSION_COMBO');
      if (comboTemplate) {
        const finding = createFindingFromTemplate(
          comboTemplate,
          {
            signals: {},
            appName: app.appName,
            packageName: app.packageName,
            comboName: combo.name,
            comboDescription: combo.description,
            permissionList: combo.requiredPermissions.map((p) => p.replace('android.permission.', '')),
            scanId,
          },
          {
            id: `finding_combo_${app.packageName}_${combo.id.toLowerCase()}`,
            category: 'apps',
            provenance: 'PERMISSION_BASED',
            scanId,
          }
        );
        findings.push(finding);
      }
    }
  }

  // 3. Check Sideloading (installed outside Google Play Store)
  const isSideloaded = !app.isSystemApp && app.installSource !== 'com.android.vending';
  if (isSideloaded) {
    const sideloadTemplate = getFindingTemplate('APP_SIDELOADED_FLAGGED');
    if (sideloadTemplate) {
      const finding = createFindingFromTemplate(
        sideloadTemplate,
        {
          signals: {},
          appName: app.appName,
          packageName: app.packageName,
          scanId,
        },
        {
          id: `finding_sideload_${app.packageName}`,
          category: 'apps',
          provenance: 'VERIFIED',
          scanId,
        }
      );
      findings.push(finding);
    }
  }

  // 4. Check Unused app with sensitive permissions (>60 days unused)
  const now = Date.now();
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const hasSensitive = grantedNormalized.some(isSensitivePermission);
  const isUnused = app.lastTimeUsed !== undefined && now - app.lastTimeUsed > sixtyDaysMs;
  const isUnusedWithSensitivePerms = !app.isSystemApp && isUnused && hasSensitive;

  if (isUnusedWithSensitivePerms) {
    const unusedTemplate = getFindingTemplate('APP_UNUSED_WITH_SENSITIVE_PERMISSIONS');
    if (unusedTemplate) {
      const finding = createFindingFromTemplate(
        unusedTemplate,
        {
          signals: {},
          appName: app.appName,
          packageName: app.packageName,
          scanId,
        },
        {
          id: `finding_unused_${app.packageName}`,
          category: 'apps',
          provenance: 'PERMISSION_BASED',
          scanId,
        }
      );
      findings.push(finding);
    }
  }

  // 5. Diff sensitive permissions against previous scan (N3)
  if (previousSensitivePermissions) {
    const prevSet = new Set(previousSensitivePermissions.map(normalizePermission));
    const newSensitivePerms = grantedNormalized.filter(
      (p) => isSensitivePermission(p) && !prevSet.has(p)
    );

    if (newSensitivePerms.length > 0) {
      const diffTemplate = getFindingTemplate('APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN');
      if (diffTemplate) {
        const finding = createFindingFromTemplate(
          diffTemplate,
          {
            signals: {},
            appName: app.appName,
            packageName: app.packageName,
            permissionList: newSensitivePerms.map((p) => p.replace('android.permission.', '')),
            scanId,
          },
          {
            id: `finding_new_perm_${app.packageName}`,
            category: 'apps',
            provenance: 'PERMISSION_BASED',
            scanId,
          }
        );
        findings.push(finding);
      }
    }
  }

  // 6. Compute per-app risk score (0-100, where 100 is completely safe/clean)
  let deductions = 0;
  for (const unexpected of unexpectedPermissions) {
    deductions += unexpected.isSensitive ? 15 : 5;
  }
  for (const combo of matchedCombos) {
    deductions += combo.penalty;
  }
  if (isSideloaded) {
    deductions += 15;
  }
  if (isUnusedWithSensitivePerms) {
    deductions += 10;
  }

  const riskScore = Math.max(0, Math.min(100, Math.round(100 - deductions)));

  return {
    app,
    riskScore,
    unexpectedPermissions,
    suspiciousCombos: matchedCombos,
    isSideloaded,
    isUnusedWithSensitivePerms,
    findings,
  };
}
