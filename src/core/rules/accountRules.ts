import { SecurityRule, RuleEvaluationResult } from './rule.interface';
import { SignalMap } from '../models/signal';

/**
 * Helper to verify signal availability. Returns null if missing or unavailable.
 */
function getAvailableSignal(signals: SignalMap, id: string) {
  const signal = signals[id];
  if (!signal || signal.status !== 'AVAILABLE') {
    return null;
  }
  return signal;
}

export const RULE_ACCT_NO_2FA_PRIMARY: SecurityRule = {
  id: 'RULE_ACCT_NO_2FA_PRIMARY',
  category: 'account_security',
  name: 'Primary Email Missing Multi-Factor Authentication',
  description: 'Checks whether two-factor authentication (2FA) or passkeys are enabled on primary email accounts.',
  defaultSeverity: 'critical',
  requiredSignalIds: ['account.two_factor_primary_email'],
  remediation: {
    title: 'Enable 2FA on your primary email account',
    whyItMatters: 'Email is the master key to your digital identity; securing it prevents unauthorized password resets across all linked accounts.',
    steps: [
      'Open your primary email account security settings (e.g. Google, Microsoft, Apple).',
      'Navigate to 2-Step Verification / Two-Factor Authentication.',
      'Prefer an Authenticator App (Google Authenticator, Microsoft Authenticator, Aegis) or Passkey over SMS OTP.',
      'Save and securely store backup recovery codes offline.',
    ],
    effort: 'low',
    impact: 10,
    likelihood: 9,
    easeOfFix: 8,
    priorityScore: 720, // 10 * 9 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'account.two_factor_primary_email');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Telemetry for primary email 2FA is unavailable or unobserved.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const isUnprotected = value === 'none' || value === 'disabled' || value === 'false' || value === 'no';

    if (isUnprotected) {
      return {
        triggered: true,
        rationale: 'Primary email does not have two-factor authentication enabled, exposing all connected accounts to takeover.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Multi-factor authentication is active on the primary email account.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_ACCT_PASSWORD_REUSE: SecurityRule = {
  id: 'RULE_ACCT_PASSWORD_REUSE',
  category: 'account_security',
  name: 'Password Reused Across Multiple Services',
  description: 'Checks if identical or similar passwords are used across sensitive online accounts.',
  defaultSeverity: 'critical',
  requiredSignalIds: ['account.password_reuse'],
  remediation: {
    title: 'Create unique passwords for important accounts',
    whyItMatters: 'When a single breached website leaks your password, automated attackers test it against hundreds of services (credential stuffing).',
    steps: [
      'Identify accounts sharing passwords (especially email, banking, and primary social media).',
      'Change each password to a unique, random passphrase of at least 14 characters.',
      'Store each unique password in a secure password manager.',
    ],
    effort: 'medium',
    impact: 9,
    likelihood: 9,
    easeOfFix: 7,
    priorityScore: 567, // 9 * 9 * 7
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'account.password_reuse');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Telemetry for password reuse habits is unavailable.',
        evidenceSignals: [],
      };
    }

    const val = String(signal.value).toLowerCase();
    const isReused = val === 'often' || val === 'frequent' || val === 'across_critical_services' || val === 'always';

    if (isReused) {
      return {
        triggered: true,
        rationale: 'Passwords are reported as reused across accounts, creating a severe credential stuffing risk.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Passwords are reported as unique across different services.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_ACCT_NO_PASSWORD_MANAGER: SecurityRule = {
  id: 'RULE_ACCT_NO_PASSWORD_MANAGER',
  category: 'account_security',
  name: 'No Password Manager In Use',
  description: 'Evaluates whether a trusted password manager is used to generate and maintain strong unique credentials.',
  defaultSeverity: 'high',
  requiredSignalIds: ['account.password_manager_used'],
  remediation: {
    title: 'Adopt a trusted password manager',
    whyItMatters: 'Password managers eliminate the cognitive burden of remembering complex passwords and protect against phishing autofill traps.',
    steps: [
      'Select a reputable password manager (e.g. Bitwarden, 1Password, or built-in OS Keychain).',
      'Create one strong, memorable master passphrase.',
      'Import or save existing credentials as you log into accounts.',
    ],
    effort: 'low',
    impact: 8,
    likelihood: 7,
    easeOfFix: 8,
    priorityScore: 448, // 8 * 7 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'account.password_manager_used');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Telemetry for password manager usage is unavailable.',
        evidenceSignals: [],
      };
    }

    const isUsed = signal.value === true || String(signal.value).toLowerCase() === 'yes';

    if (!isUsed) {
      return {
        triggered: true,
        rationale: 'No password manager is used, which often leads to weak or reused passwords.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'A trusted password manager is actively utilized.',
      evidenceSignals: [signal],
    };
  },
};

export const ACCOUNT_RULES: readonly SecurityRule[] = [
  RULE_ACCT_NO_2FA_PRIMARY,
  RULE_ACCT_PASSWORD_REUSE,
  RULE_ACCT_NO_PASSWORD_MANAGER,
];
