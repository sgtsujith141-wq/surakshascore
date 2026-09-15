/**
 * Security categories evaluated by the Personal Security Score (PSS) engine.
 * Defined in accordance with the PSS Engineering Architecture Specification.
 */
export type SecurityCategory =
  | 'account_security'
  | 'device_safety'
  | 'phishing_fraud'
  | 'privacy'
  | 'backup_recovery'
  | 'update_hygiene';

export const ALL_SECURITY_CATEGORIES: readonly SecurityCategory[] = [
  'account_security',
  'device_safety',
  'phishing_fraud',
  'privacy',
  'backup_recovery',
  'update_hygiene',
] as const;

export const CATEGORY_METADATA: Record<
  SecurityCategory,
  { readonly label: string; readonly description: string }
> = {
  account_security: {
    label: 'Account Security',
    description: 'Multi-factor authentication, credential strength, and account protection.',
  },
  device_safety: {
    label: 'Device Safety',
    description: 'Screen lock, hardware encryption, root status, and platform integrity.',
  },
  phishing_fraud: {
    label: 'Phishing & Scam Resilience',
    description: 'Awareness of social engineering, link verification, and OTP confidentiality.',
  },
  privacy: {
    label: 'Privacy & Data Exposure',
    description: 'Application permissions, telemetry boundaries, and public data sharing.',
  },
  backup_recovery: {
    label: 'Backup & Recovery',
    description: 'Account recovery pathways and verified data backups.',
  },
  update_hygiene: {
    label: 'Update Hygiene',
    description: 'Operating system and software patch timeliness.',
  },
};
