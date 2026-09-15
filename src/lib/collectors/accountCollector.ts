import { Signal, Finding } from '../../types';
import { getFindingTemplate, createFindingFromTemplate } from '../findings/registry';

export interface VaultAccountEntry {
  id: string;
  site: string;
  username: string;
  passwordHash?: string; // Or plaintext in memory during local scan
  passwordLength?: number;
  isWeak?: boolean;
}

export interface AccountCollectorOptions {
  scanId?: string;
  breachedEmails?: { email: string; breachCount: number; breachNames: string[] }[];
  vaultEntries?: VaultAccountEntry[];
  twoFactorStatus?: {
    emailHas2FA: boolean;
    bankingHas2FA: boolean;
    socialHas2FA: boolean;
  };
  recoveryConfigured?: boolean;
}

export interface AccountCollectorResult {
  signals: Signal[];
  findings: Finding[];
}

/**
 * Collects Account Category signals and evaluates breach, 2FA, and vault posture (§4.2, §5.2).
 */
export async function collectAccountSignals(
  options?: AccountCollectorOptions
): Promise<AccountCollectorResult> {
  const scanId = options?.scanId ?? `scan_${Date.now()}`;
  const now = new Date().toISOString();
  const signals: Signal[] = [];
  const findings: Finding[] = [];

  // 1. Signal: account.breachedEmail
  const breachedEmails = options?.breachedEmails ?? [];
  signals.push({
    id: 'account.breachedEmail',
    category: 'account',
    provenance: 'VERIFIED',
    platform: ['android', 'ios', 'web'],
    collectedAt: now,
    value: { accountsChecked: breachedEmails.length },
  });

  for (const b of breachedEmails) {
    if (b.breachCount > 0) {
      const template = getFindingTemplate('EMAIL_IN_KNOWN_BREACH');
      if (template) {
        findings.push(
          createFindingFromTemplate(
            template,
            {
              signals: { 'account.breachedEmail': signals[0]! },
              breachCount: b.breachCount,
              breachNames: b.breachNames,
              scanId,
            },
            {
              id: `finding_breach_${b.email.replace(/[@.]/g, '_')}_${scanId}`,
              category: 'account',
              provenance: 'VERIFIED',
              scanId,
            }
          )
        );
      }
    }
  }

  // 2. Signal: account.passwordReused & Vault analysis
  const vault = options?.vaultEntries ?? [];
  const passwordMap = new Map<string, string[]>(); // hash/pw -> sites list
  const weakSites: string[] = [];

  for (const entry of vault) {
    if (entry.passwordHash) {
      const sites = passwordMap.get(entry.passwordHash) || [];
      sites.push(entry.site);
      passwordMap.set(entry.passwordHash, sites);
    }
    if (entry.isWeak || (entry.passwordLength !== undefined && entry.passwordLength < 8)) {
      weakSites.push(entry.site);
    }
  }

  let totalReusedInstances = 0;
  for (const [, sites] of passwordMap.entries()) {
    if (sites.length > 1) {
      totalReusedInstances += sites.length;
    }
  }

  signals.push({
    id: 'account.passwordReused',
    category: 'account',
    provenance: 'VERIFIED',
    platform: ['android', 'ios', 'web'],
    collectedAt: now,
    value: { reusedInstances: totalReusedInstances, weakPasswords: weakSites.length },
  });

  if (totalReusedInstances > 0) {
    const template = getFindingTemplate('PASSWORD_REUSED_ACROSS_VAULT_ENTRIES');
    if (template) {
      findings.push(
        createFindingFromTemplate(
          template,
          {
            signals: { 'account.passwordReused': signals[signals.length - 1]! },
            reusedCount: totalReusedInstances,
            scanId,
          },
          {
            id: `finding_vault_reused_${scanId}`,
            category: 'account',
            provenance: 'VERIFIED',
            scanId,
          }
        )
      );
    }
  }

  if (weakSites.length > 0) {
    const template = getFindingTemplate('WEAK_PASSWORD_IN_VAULT');
    if (template) {
      findings.push(
        createFindingFromTemplate(
          template,
          {
            signals: { 'account.passwordReused': signals[signals.length - 1]! },
            weakPasswordSites: weakSites,
            scanId,
          },
          {
            id: `finding_vault_weak_${scanId}`,
            category: 'account',
            provenance: 'VERIFIED',
            scanId,
          }
        )
      );
    }
  }

  // 3. Signal: account.twoFactorEnabled (Self-reported)
  const missing2FA: string[] = [];
  if (options?.twoFactorStatus) {
    if (!options.twoFactorStatus.emailHas2FA) missing2FA.push('Email');
    if (!options.twoFactorStatus.bankingHas2FA) missing2FA.push('Banking / UPI');
    if (!options.twoFactorStatus.socialHas2FA) missing2FA.push('Social Media');
  }

  signals.push({
    id: 'account.twoFactorEnabled',
    category: 'account',
    provenance: 'SELF_REPORTED',
    platform: ['android', 'ios', 'web'],
    collectedAt: now,
    value: { missing2FA },
  });

  if (missing2FA.length > 0) {
    const template = getFindingTemplate('TWO_FACTOR_DISABLED_SELF_REPORTED');
    if (template) {
      findings.push(
        createFindingFromTemplate(
          template,
          {
            signals: { 'account.twoFactorEnabled': signals[signals.length - 1]! },
            missing2FAServices: missing2FA,
            scanId,
          },
          {
            id: `finding_2fa_disabled_${scanId}`,
            category: 'account',
            provenance: 'SELF_REPORTED',
            scanId,
          }
        )
      );
    }
  }

  // 4. Signal: account.recoveryConfigured (Self-reported)
  if (options?.recoveryConfigured === false) {
    const template = getFindingTemplate('NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED');
    if (template) {
      findings.push(
        createFindingFromTemplate(
          template,
          {
            signals: { 'account.twoFactorEnabled': signals[signals.length - 1]! },
            scanId,
          },
          {
            id: `finding_no_recovery_${scanId}`,
            category: 'account',
            provenance: 'SELF_REPORTED',
            scanId,
          }
        )
      );
    }
  }

  return {
    signals,
    findings,
  };
}
