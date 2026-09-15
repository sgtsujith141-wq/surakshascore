import { SignalMap, Signal } from '../../core/models/signal';
import { EvidenceTier } from '../../core/types/evidenceTier';

/**
 * Profile simulating a restricted environment where native signals are UNAVAILABLE or NOT_SUPPORTED.
 */
export function createUnavailableProfile(timestamp: string = new Date().toISOString()): SignalMap {
  const signalIds = [
    { id: 'account.two_factor_primary_email', cat: 'account_security' as const },
    { id: 'account.password_reuse', cat: 'account_security' as const },
    { id: 'account.password_manager_used', cat: 'account_security' as const },
    { id: 'device.screen_lock_secured', cat: 'device_safety' as const },
    { id: 'device.storage_encrypted', cat: 'device_safety' as const },
    { id: 'device.root_or_jailbreak_detected', cat: 'device_safety' as const },
    { id: 'device.unknown_sources_allowed', cat: 'device_safety' as const },
    { id: 'device.developer_mode_enabled', cat: 'device_safety' as const },
    { id: 'phishing.shares_otp_or_pin', cat: 'phishing_fraud' as const },
    { id: 'phishing.opens_unverified_links', cat: 'phishing_fraud' as const },
    { id: 'phishing.acts_on_urgent_financial_requests', cat: 'phishing_fraud' as const },
    { id: 'privacy.unreviewed_broad_permissions', cat: 'privacy' as const },
    { id: 'privacy.shares_identity_docs_publicly', cat: 'privacy' as const },
    { id: 'backup.recovery_contact_configured', cat: 'backup_recovery' as const },
    { id: 'backup.automated_backup_enabled', cat: 'backup_recovery' as const },
    { id: 'update.os_patch_age_days', cat: 'update_hygiene' as const },
    { id: 'update.auto_updates_enabled', cat: 'update_hygiene' as const },
  ];

  const signals: Record<string, Signal> = {};

  for (const { id, cat } of signalIds) {
    signals[id] = {
      id,
      category: cat,
      tier: EvidenceTier.TIER_2_OS_API,
      status: 'UNAVAILABLE',
      value: null,
      timestamp,
      source: 'unsupported_platform',
    };
  }

  return Object.freeze(signals);
}
