import { SecurityRule, RuleEvaluationResult } from './rule.interface';
import { SignalMap } from '../models/signal';

function getAvailableSignal(signals: SignalMap, id: string) {
  const signal = signals[id];
  if (!signal || signal.status !== 'AVAILABLE') {
    return null;
  }
  return signal;
}

export const RULE_PRIV_EXCESSIVE_APP_PERMISSIONS: SecurityRule = {
  id: 'RULE_PRIV_EXCESSIVE_APP_PERMISSIONS',
  category: 'privacy',
  name: 'Unreviewed Broad Application Permissions',
  description: 'Checks if third-party apps have unreviewed access to SMS, Location, Contacts, or Microphone.',
  defaultSeverity: 'high',
  requiredSignalIds: ['privacy.unreviewed_broad_permissions'],
  remediation: {
    title: 'Audit App Permissions for Sensitive Hardware & Data',
    whyItMatters: 'Unnecessary background permissions allow apps to track your location, read SMS verification messages, or harvest your address book.',
    steps: [
      'Open Device Settings > Privacy > Permission Manager.',
      'Review apps with access to "Location" and change to "While using the app" or "Don\'t allow".',
      'Revoke "SMS" and "Call logs" permissions for non-essential applications.',
      'Enable "Auto-remove permissions for unused apps".',
    ],
    effort: 'medium',
    impact: 8,
    likelihood: 7,
    easeOfFix: 7,
    priorityScore: 392, // 8 * 7 * 7
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'privacy.unreviewed_broad_permissions');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Permission telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const hasIssues = value === 'true' || value === 'yes' || value === 'unreviewed';

    if (hasIssues) {
      return {
        triggered: true,
        rationale: 'Third-party applications possess unreviewed high-privilege permissions (SMS/Location/Microphone).',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Application permissions have been audited and restricted.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_PRIV_PUBLIC_IDENTITY_SHARING: SecurityRule = {
  id: 'RULE_PRIV_PUBLIC_IDENTITY_SHARING',
  category: 'privacy',
  name: 'Public Disclosure of Identification Documents',
  description: 'Checks if sensitive identity documents (Aadhaar, PAN, Passport, Driving License) are stored on public drives or shared publicly.',
  defaultSeverity: 'medium',
  requiredSignalIds: ['privacy.shares_identity_docs_publicly'],
  remediation: {
    title: 'Secure Sensitive Identity Documents in Encrypted Storage',
    whyItMatters: 'Unmasked government ID numbers can be abused for SIM swapping, identity theft, or unauthorized loan applications.',
    steps: [
      'Use Masked Aadhaar (showing only last 4 digits) for general verification.',
      'Store identity scans in a password-protected vault (DigiLocker or encrypted drive), never in open social media or public cloud folders.',
      'Delete temporary downloaded PDF certificates from public or shared computers.',
    ],
    effort: 'low',
    impact: 7,
    likelihood: 6,
    easeOfFix: 8,
    priorityScore: 336, // 7 * 6 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'privacy.shares_identity_docs_publicly');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Identity sharing practice telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const isPublic = value === 'true' || value === 'yes' || value === 'sometimes';

    if (isPublic) {
      return {
        triggered: true,
        rationale: 'Government ID or identity document scans are exposed or stored in unencrypted public locations.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Identity documents are securely managed and not publicly shared.',
      evidenceSignals: [signal],
    };
  },
};

export const PRIVACY_RULES: readonly SecurityRule[] = [
  RULE_PRIV_EXCESSIVE_APP_PERMISSIONS,
  RULE_PRIV_PUBLIC_IDENTITY_SHARING,
];
