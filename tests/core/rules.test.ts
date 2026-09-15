import { describe, it, expect } from 'vitest';
import {
  RULE_ACCT_NO_2FA_PRIMARY,
  RULE_ACCT_PASSWORD_REUSE,
  RULE_ACCT_NO_PASSWORD_MANAGER,
} from '../../src/core/rules/accountRules';
import {
  RULE_DEV_NO_SCREEN_LOCK,
  RULE_DEV_STORAGE_UNENCRYPTED,
  RULE_DEV_ROOT_JAILBREAK,
  RULE_DEV_UNKNOWN_SOURCES_ENABLED,
  RULE_DEV_DEVELOPER_MODE_ACTIVE,
} from '../../src/core/rules/deviceRules';
import {
  RULE_PHISH_OTP_SHARING,
  RULE_PHISH_UNVERIFIED_LINKS,
  RULE_PHISH_URGENT_REQUEST_COMPLIANCE,
} from '../../src/core/rules/phishingRules';
import {
  RULE_PRIV_EXCESSIVE_APP_PERMISSIONS,
  RULE_PRIV_PUBLIC_IDENTITY_SHARING,
} from '../../src/core/rules/privacyRules';
import {
  RULE_BACKUP_NO_RECOVERY_INFO,
  RULE_BACKUP_NO_SECURE_BACKUP,
} from '../../src/core/rules/backupRules';
import {
  RULE_UPD_OS_OUTDATED,
  RULE_UPD_AUTO_UPDATES_DISABLED,
} from '../../src/core/rules/updateRules';
import { Signal } from '../../src/core/models/signal';
import { EvidenceTier } from '../../src/core/types/evidenceTier';

function makeSignal(id: string, cat: any, value: any, status: any = 'AVAILABLE'): Signal {
  return {
    id,
    category: cat,
    tier: EvidenceTier.TIER_2_OS_API,
    status,
    value,
    timestamp: new Date().toISOString(),
    source: 'unit_test',
  };
}

describe('Representative Security Rules (Task 10)', () => {
  describe('Account Security Rules', () => {
    it('RULE_ACCT_NO_2FA_PRIMARY triggers when 2FA is none', () => {
      const res = RULE_ACCT_NO_2FA_PRIMARY.evaluate({
        'account.two_factor_primary_email': makeSignal(
          'account.two_factor_primary_email',
          'account_security',
          'none'
        ),
      });
      expect(res.triggered).toBe(true);
      expect(res.insufficientEvidence).toBeFalsy();
    });

    it('RULE_ACCT_NO_2FA_PRIMARY does not trigger when 2FA is authenticator_app', () => {
      const res = RULE_ACCT_NO_2FA_PRIMARY.evaluate({
        'account.two_factor_primary_email': makeSignal(
          'account.two_factor_primary_email',
          'account_security',
          'authenticator_app'
        ),
      });
      expect(res.triggered).toBe(false);
    });

    it('RULE_ACCT_PASSWORD_REUSE triggers on frequent reuse', () => {
      const res = RULE_ACCT_PASSWORD_REUSE.evaluate({
        'account.password_reuse': makeSignal(
          'account.password_reuse',
          'account_security',
          'frequent'
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_ACCT_NO_PASSWORD_MANAGER triggers when password manager is false', () => {
      const res = RULE_ACCT_NO_PASSWORD_MANAGER.evaluate({
        'account.password_manager_used': makeSignal(
          'account.password_manager_used',
          'account_security',
          false
        ),
      });
      expect(res.triggered).toBe(true);
    });
  });

  describe('Device Safety Rules', () => {
    it('RULE_DEV_NO_SCREEN_LOCK triggers when screen lock is false', () => {
      const res = RULE_DEV_NO_SCREEN_LOCK.evaluate({
        'device.screen_lock_secured': makeSignal(
          'device.screen_lock_secured',
          'device_safety',
          false
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_DEV_STORAGE_UNENCRYPTED triggers when storage encryption is false', () => {
      const res = RULE_DEV_STORAGE_UNENCRYPTED.evaluate({
        'device.storage_encrypted': makeSignal(
          'device.storage_encrypted',
          'device_safety',
          false
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_DEV_ROOT_JAILBREAK triggers when root detected is true', () => {
      const res = RULE_DEV_ROOT_JAILBREAK.evaluate({
        'device.root_or_jailbreak_detected': makeSignal(
          'device.root_or_jailbreak_detected',
          'device_safety',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_DEV_UNKNOWN_SOURCES_ENABLED triggers when unknown sources allowed is true', () => {
      const res = RULE_DEV_UNKNOWN_SOURCES_ENABLED.evaluate({
        'device.unknown_sources_allowed': makeSignal(
          'device.unknown_sources_allowed',
          'device_safety',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_DEV_DEVELOPER_MODE_ACTIVE triggers when developer mode is true', () => {
      const res = RULE_DEV_DEVELOPER_MODE_ACTIVE.evaluate({
        'device.developer_mode_enabled': makeSignal(
          'device.developer_mode_enabled',
          'device_safety',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });
  });

  describe('Phishing & Scam Resilience Rules', () => {
    it('RULE_PHISH_OTP_SHARING triggers if user reports sharing OTP', () => {
      const res = RULE_PHISH_OTP_SHARING.evaluate({
        'phishing.shares_otp_or_pin': makeSignal(
          'phishing.shares_otp_or_pin',
          'phishing_fraud',
          'if_bank_calls'
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_PHISH_UNVERIFIED_LINKS triggers if user opens unknown links', () => {
      const res = RULE_PHISH_UNVERIFIED_LINKS.evaluate({
        'phishing.opens_unverified_links': makeSignal(
          'phishing.opens_unverified_links',
          'phishing_fraud',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_PHISH_URGENT_REQUEST_COMPLIANCE triggers on urgent compliance', () => {
      const res = RULE_PHISH_URGENT_REQUEST_COMPLIANCE.evaluate({
        'phishing.acts_on_urgent_financial_requests': makeSignal(
          'phishing.acts_on_urgent_financial_requests',
          'phishing_fraud',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });
  });

  describe('Privacy & Data Exposure Rules', () => {
    it('RULE_PRIV_EXCESSIVE_APP_PERMISSIONS triggers on unreviewed permissions', () => {
      const res = RULE_PRIV_EXCESSIVE_APP_PERMISSIONS.evaluate({
        'privacy.unreviewed_broad_permissions': makeSignal(
          'privacy.unreviewed_broad_permissions',
          'privacy',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_PRIV_PUBLIC_IDENTITY_SHARING triggers on public ID sharing', () => {
      const res = RULE_PRIV_PUBLIC_IDENTITY_SHARING.evaluate({
        'privacy.shares_identity_docs_publicly': makeSignal(
          'privacy.shares_identity_docs_publicly',
          'privacy',
          true
        ),
      });
      expect(res.triggered).toBe(true);
    });
  });

  describe('Backup & Recovery Rules', () => {
    it('RULE_BACKUP_NO_RECOVERY_INFO triggers when recovery info not configured', () => {
      const res = RULE_BACKUP_NO_RECOVERY_INFO.evaluate({
        'backup.recovery_contact_configured': makeSignal(
          'backup.recovery_contact_configured',
          'backup_recovery',
          false
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_BACKUP_NO_SECURE_BACKUP triggers when automated backup is disabled', () => {
      const res = RULE_BACKUP_NO_SECURE_BACKUP.evaluate({
        'backup.automated_backup_enabled': makeSignal(
          'backup.automated_backup_enabled',
          'backup_recovery',
          false
        ),
      });
      expect(res.triggered).toBe(true);
    });
  });

  describe('Update Hygiene Rules', () => {
    it('RULE_UPD_OS_OUTDATED triggers when patch age > 90 days', () => {
      const res = RULE_UPD_OS_OUTDATED.evaluate({
        'update.os_patch_age_days': makeSignal(
          'update.os_patch_age_days',
          'update_hygiene',
          180
        ),
      });
      expect(res.triggered).toBe(true);
    });

    it('RULE_UPD_OS_OUTDATED does not trigger when patch age <= 90 days', () => {
      const res = RULE_UPD_OS_OUTDATED.evaluate({
        'update.os_patch_age_days': makeSignal(
          'update.os_patch_age_days',
          'update_hygiene',
          30
        ),
      });
      expect(res.triggered).toBe(false);
    });

    it('RULE_UPD_AUTO_UPDATES_DISABLED triggers when auto updates is false', () => {
      const res = RULE_UPD_AUTO_UPDATES_DISABLED.evaluate({
        'update.auto_updates_enabled': makeSignal(
          'update.auto_updates_enabled',
          'update_hygiene',
          false
        ),
      });
      expect(res.triggered).toBe(true);
    });
  });
});
