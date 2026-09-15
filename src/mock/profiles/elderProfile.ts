import { SignalMap, Signal } from '../../core/models/signal';
import { EvidenceTier } from '../../core/types/evidenceTier';

/**
 * Realistic profile representing an older adult user who may need family assistance
 * and clear guided steps for 2FA, scam resilience, and screen lock.
 */
export function createElderProfile(timestamp: string = new Date().toISOString()): SignalMap {
  const signals: Record<string, Signal> = {
    'account.two_factor_primary_email': {
      id: 'account.two_factor_primary_email',
      category: 'account_security',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: 'none', // Critical Finding: No 2FA
      timestamp,
      source: 'assessment_survey',
    },
    'account.password_reuse': {
      id: 'account.password_reuse',
      category: 'account_security',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: 'frequent', // Critical Finding: Reused simple password
      timestamp,
      source: 'assessment_survey',
    },
    'account.password_manager_used': {
      id: 'account.password_manager_used',
      category: 'account_security',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: false, // High Finding: No password manager
      timestamp,
      source: 'assessment_survey',
    },
    'device.screen_lock_secured': {
      id: 'device.screen_lock_secured',
      category: 'device_safety',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false, // Critical Finding: No screen lock
      timestamp,
      source: 'keyguard_manager',
    },
    'device.storage_encrypted': {
      id: 'device.storage_encrypted',
      category: 'device_safety',
      tier: EvidenceTier.TIER_1_HARDWARE,
      status: 'AVAILABLE',
      value: true,
      timestamp,
      source: 'device_policy_manager',
    },
    'device.root_or_jailbreak_detected': {
      id: 'device.root_or_jailbreak_detected',
      category: 'device_safety',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false,
      timestamp,
      source: 'integrity_checker',
    },
    'device.unknown_sources_allowed': {
      id: 'device.unknown_sources_allowed',
      category: 'device_safety',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false,
      timestamp,
      source: 'package_manager',
    },
    'device.developer_mode_enabled': {
      id: 'device.developer_mode_enabled',
      category: 'device_safety',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false,
      timestamp,
      source: 'settings_secure',
    },
    'phishing.shares_otp_or_pin': {
      id: 'phishing.shares_otp_or_pin',
      category: 'phishing_fraud',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: 'if_bank_calls', // Critical Finding: Would share OTP if caller claims to be bank
      timestamp,
      source: 'assessment_survey',
    },
    'phishing.opens_unverified_links': {
      id: 'phishing.opens_unverified_links',
      category: 'phishing_fraud',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: false,
      timestamp,
      source: 'assessment_survey',
    },
    'phishing.acts_on_urgent_financial_requests': {
      id: 'phishing.acts_on_urgent_financial_requests',
      category: 'phishing_fraud',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: true, // Medium Finding: Worries about urgent electricity/pension threats
      timestamp,
      source: 'assessment_survey',
    },
    'privacy.unreviewed_broad_permissions': {
      id: 'privacy.unreviewed_broad_permissions',
      category: 'privacy',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false,
      timestamp,
      source: 'permission_controller',
    },
    'privacy.shares_identity_docs_publicly': {
      id: 'privacy.shares_identity_docs_publicly',
      category: 'privacy',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: false,
      timestamp,
      source: 'assessment_survey',
    },
    'backup.recovery_contact_configured': {
      id: 'backup.recovery_contact_configured',
      category: 'backup_recovery',
      tier: EvidenceTier.TIER_4_SELF_REPORTED,
      status: 'AVAILABLE',
      value: false, // High Finding: No recovery contacts set
      timestamp,
      source: 'assessment_survey',
    },
    'backup.automated_backup_enabled': {
      id: 'backup.automated_backup_enabled',
      category: 'backup_recovery',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false, // Medium Finding: No automated backup
      timestamp,
      source: 'backup_manager',
    },
    'update.os_patch_age_days': {
      id: 'update.os_patch_age_days',
      category: 'update_hygiene',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: 180, // High Finding: Outdated patches (>90 days)
      timestamp,
      source: 'build_version',
    },
    'update.auto_updates_enabled': {
      id: 'update.auto_updates_enabled',
      category: 'update_hygiene',
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'AVAILABLE',
      value: false, // Medium Finding: Updates not automatic
      timestamp,
      source: 'package_installer',
    },
  };

  return Object.freeze(signals);
}
