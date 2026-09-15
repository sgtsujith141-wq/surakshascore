import { describe, it, expect } from 'vitest';
import { collectAccountSignals } from '../../src/lib/collectors/accountCollector';

describe('Account Collector (§4.2, §5.2, N1, N2, N7)', () => {
  it('generates EMAIL_IN_KNOWN_BREACH when breached email reports breaches (N1)', async () => {
    const result = await collectAccountSignals({
      breachedEmails: [
        {
          email: 'user@example.com',
          breachCount: 3,
          breachNames: ['Adobe (2013)', 'Canva (2019)', 'LinkedIn (2016)'],
        },
      ],
    });

    const breachFinding = result.findings.find((f) => f.type === 'EMAIL_IN_KNOWN_BREACH');
    expect(breachFinding).toBeDefined();
    expect(breachFinding?.severity).toBe('high');
    expect(breachFinding?.whyDetected).toContain('Adobe');
  });

  it('detects duplicate passwords across vault accounts (N2)', async () => {
    const result = await collectAccountSignals({
      vaultEntries: [
        { id: '1', site: 'netflix.com', username: 'alex', passwordHash: 'hash_abc123' },
        { id: '2', site: 'spotify.com', username: 'alex', passwordHash: 'hash_abc123' }, // Duplicate!
        { id: '3', site: 'github.com', username: 'alex', passwordHash: 'hash_unique999' },
      ],
    });

    const reuseFinding = result.findings.find((f) => f.type === 'PASSWORD_REUSED_ACROSS_VAULT_ENTRIES');
    expect(reuseFinding).toBeDefined();
    expect(reuseFinding?.severity).toBe('high');
  });

  it('detects weak passwords in vault (N2)', async () => {
    const result = await collectAccountSignals({
      vaultEntries: [
        { id: '1', site: 'oldforum.com', username: 'alex', isWeak: true },
      ],
    });

    const weakFinding = result.findings.find((f) => f.type === 'WEAK_PASSWORD_IN_VAULT');
    expect(weakFinding).toBeDefined();
    expect(weakFinding?.severity).toBe('medium');
  });

  it('generates TWO_FACTOR_DISABLED_SELF_REPORTED when 2FA is missing on email/banking', async () => {
    const result = await collectAccountSignals({
      twoFactorStatus: {
        emailHas2FA: false,
        bankingHas2FA: true,
        socialHas2FA: false,
      },
    });

    const twoFactorFinding = result.findings.find((f) => f.type === 'TWO_FACTOR_DISABLED_SELF_REPORTED');
    expect(twoFactorFinding).toBeDefined();
    expect(twoFactorFinding?.severity).toBe('critical');
    expect(twoFactorFinding?.provenance).toBe('SELF_REPORTED');
  });

  it('generates NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED (N7)', async () => {
    const result = await collectAccountSignals({
      recoveryConfigured: false,
    });

    const recoveryFinding = result.findings.find((f) => f.type === 'NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED');
    expect(recoveryFinding).toBeDefined();
    expect(recoveryFinding?.severity).toBe('high');
  });
});
