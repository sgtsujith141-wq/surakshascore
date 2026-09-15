import { SecurityRule, RuleEvaluationResult } from './rule.interface';
import { SignalMap } from '../models/signal';

function getAvailableSignal(signals: SignalMap, id: string) {
  const signal = signals[id];
  if (!signal || signal.status !== 'AVAILABLE') {
    return null;
  }
  return signal;
}

export const RULE_PHISH_OTP_SHARING: SecurityRule = {
  id: 'RULE_PHISH_OTP_SHARING',
  category: 'phishing_fraud',
  name: 'Susceptible to OTP / PIN Disclosure',
  description: 'Evaluates user behavior regarding sharing One-Time Passwords or Banking PINs when prompted over call/message.',
  defaultSeverity: 'critical',
  requiredSignalIds: ['phishing.shares_otp_or_pin'],
  remediation: {
    title: 'Never Share OTPs, PINs, or Verification Codes',
    whyItMatters: 'Legitimate banks, government officials, and delivery services NEVER request your OTP or UPI PIN. Sharing it authorizes immediate fraudulent transactions.',
    steps: [
      'Remember: An OTP is your personal digital signature — never read it aloud or send via message.',
      'Entering a UPI PIN always sends money; receiving money never requires a PIN.',
      'If someone calls claiming to be bank or customer support asking for an OTP, hang up immediately.',
    ],
    effort: 'low',
    impact: 10,
    likelihood: 9,
    easeOfFix: 9,
    priorityScore: 810, // 10 * 9 * 9
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'phishing.shares_otp_or_pin');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'OTP confidentiality telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const isSharing = value === 'true' || value === 'sometimes' || value === 'yes' || value === 'if_bank_calls';

    if (isSharing) {
      return {
        triggered: true,
        rationale: 'User reports willingness to share OTPs or verification codes under certain conditions.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'User strictly maintains OTP confidentiality.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_PHISH_UNVERIFIED_LINKS: SecurityRule = {
  id: 'RULE_PHISH_UNVERIFIED_LINKS',
  category: 'phishing_fraud',
  name: 'Opening Links Without Sender Verification',
  description: 'Checks habits around clicking links in SMS, WhatsApp, or email from unknown senders.',
  defaultSeverity: 'high',
  requiredSignalIds: ['phishing.opens_unverified_links'],
  remediation: {
    title: 'Verify Domain Names and Sender Addresses Before Clicking Links',
    whyItMatters: 'Phishing websites mimic real login and payment pages to capture passwords and card details.',
    steps: [
      'Check the full URL: look for misspellings (e.g. paytm-rewards.net instead of paytm.com).',
      'Never click links in SMS claiming electricity disconnection, parcel delivery holds, or lottery wins.',
      'Navigate to the official app or website directly instead of clicking SMS links.',
    ],
    effort: 'low',
    impact: 8,
    likelihood: 9,
    easeOfFix: 8,
    priorityScore: 576, // 8 * 9 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'phishing.opens_unverified_links');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Link verification habit telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const isAtRisk = value === 'true' || value === 'often' || value === 'sometimes' || value === 'yes';

    if (isAtRisk) {
      return {
        triggered: true,
        rationale: 'User regularly opens links from unverified messages without domain validation.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'User verifies links and avoids unsolicited message redirects.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_PHISH_URGENT_REQUEST_COMPLIANCE: SecurityRule = {
  id: 'RULE_PHISH_URGENT_REQUEST_COMPLIANCE',
  category: 'phishing_fraud',
  name: 'Susceptibility to Urgency and Authority Impersonation',
  description: 'Checks response to high-pressure demands (e.g. customs, tax, fake law enforcement threats).',
  defaultSeverity: 'medium',
  requiredSignalIds: ['phishing.acts_on_urgent_financial_requests'],
  remediation: {
    title: 'Pause and Independently Verify High-Pressure Demands',
    whyItMatters: 'Scammers manufacture artificial urgency to panic victims into impulsive transfers before they can think critically.',
    steps: [
      'Take a 5-minute pause whenever an urgent message or call demands immediate payment or verification.',
      'Consult a trusted family member, colleague, or official helpline before transferring funds.',
      'Real government agencies never arrest or fine citizens over WhatsApp video calls.',
    ],
    effort: 'low',
    impact: 7,
    likelihood: 7,
    easeOfFix: 8,
    priorityScore: 392, // 7 * 7 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'phishing.acts_on_urgent_financial_requests');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Social engineering resilience telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const value = String(signal.value).toLowerCase();
    const isSusceptible = value === 'true' || value === 'yes';

    if (isSusceptible) {
      return {
        triggered: true,
        rationale: 'User indicates tendency to act immediately on urgent authority or financial notices without independent verification.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'User pauses and verifies urgent financial demands.',
      evidenceSignals: [signal],
    };
  },
};

export const PHISHING_RULES: readonly SecurityRule[] = [
  RULE_PHISH_OTP_SHARING,
  RULE_PHISH_UNVERIFIED_LINKS,
  RULE_PHISH_URGENT_REQUEST_COMPLIANCE,
];
