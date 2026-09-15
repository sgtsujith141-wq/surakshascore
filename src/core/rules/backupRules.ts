import { SecurityRule, RuleEvaluationResult } from './rule.interface';
import { SignalMap } from '../models/signal';

function getAvailableSignal(signals: SignalMap, id: string) {
  const signal = signals[id];
  if (!signal || signal.status !== 'AVAILABLE') {
    return null;
  }
  return signal;
}

export const RULE_BACKUP_NO_RECOVERY_INFO: SecurityRule = {
  id: 'RULE_BACKUP_NO_RECOVERY_INFO',
  category: 'backup_recovery',
  name: 'Outdated or Missing Account Recovery Pathways',
  description: 'Checks if modern recovery email, recovery phone number, and backup codes are configured.',
  defaultSeverity: 'high',
  requiredSignalIds: ['backup.recovery_contact_configured'],
  remediation: {
    title: 'Configure Recovery Email and Offline Backup Codes',
    whyItMatters: 'If you lose your device or forget your password, recovery contacts and offline codes are the only way to regain account access without permanent data loss.',
    steps: [
      'Go to your primary account security settings (Google, Apple, Microsoft).',
      'Verify that recovery phone number and backup email are active and accessible.',
      'Generate one-time emergency backup recovery codes, print or write them down, and store them securely.',
    ],
    effort: 'low',
    impact: 9,
    likelihood: 7,
    easeOfFix: 8,
    priorityScore: 504, // 9 * 7 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'backup.recovery_contact_configured');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Account recovery contact telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const isConfigured = value === 'true' || value === 'yes' || value === 'up_to_date';

    if (!isConfigured) {
      return {
        triggered: true,
        rationale: 'Primary account lacks verified recovery phone number, secondary email, or stored backup codes.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Account recovery pathways are verified and up to date.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_BACKUP_NO_SECURE_BACKUP: SecurityRule = {
  id: 'RULE_BACKUP_NO_SECURE_BACKUP',
  category: 'backup_recovery',
  name: 'No Automated Encrypted Device Backup',
  description: 'Checks if regular encrypted backups of device settings and critical data are maintained.',
  defaultSeverity: 'medium',
  requiredSignalIds: ['backup.automated_backup_enabled'],
  remediation: {
    title: 'Enable Automated Encrypted Backup',
    whyItMatters: 'Protects against ransomware, hardware failure, or device loss by ensuring your photos, messages, and configurations can be restored safely.',
    steps: [
      'Enable Google One Backup / Apple iCloud Backup with End-to-End Encryption enabled.',
      'Ensure backup runs automatically when connected to Wi-Fi and power.',
    ],
    effort: 'low',
    impact: 7,
    likelihood: 6,
    easeOfFix: 9,
    priorityScore: 378, // 7 * 6 * 9
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'backup.automated_backup_enabled');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Automated backup telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const isEnabled = signal.value === true || String(signal.value).toLowerCase() === 'true' || String(signal.value).toLowerCase() === 'yes';

    if (!isEnabled) {
      return {
        triggered: true,
        rationale: 'Automated backup is disabled, risking total data loss if the device is lost or compromised.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Automated encrypted backup is active.',
      evidenceSignals: [signal],
    };
  },
};

export const BACKUP_RULES: readonly SecurityRule[] = [
  RULE_BACKUP_NO_RECOVERY_INFO,
  RULE_BACKUP_NO_SECURE_BACKUP,
];
