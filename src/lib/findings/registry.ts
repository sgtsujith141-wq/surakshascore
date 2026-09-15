import {
  FindingType,
  FindingTemplate,
  FindingContext,
  Severity,
  EvidenceItem,
  Finding,
  Provenance,
} from '../../types';

// ============================================================================
// Device Category Finding Templates (§5.2)
// ============================================================================

export const STALE_SECURITY_PATCH_TEMPLATE: FindingTemplate = {
  type: 'STALE_SECURITY_PATCH',
  title: (ctx: FindingContext): string => {
    const days = ctx.daysSincePatch ?? 0;
    if (days > 365) return 'Critical: OS Security Patch is Over a Year Old';
    if (days > 90) return `Outdated Security Patch (${days} Days Old)`;
    return 'Security Patch Update Available';
  },
  whyDetected: (ctx: FindingContext): string => {
    const days = ctx.daysSincePatch ?? 0;
    return `Your device security patch level was last updated ${days} day${days === 1 ? '' : 's'} ago. Modern security baselines recommend receiving updates within 30–90 days.`;
  },
  whyItMatters:
    'Security updates fix known vulnerabilities that attackers actively exploit to install malware, steal data, or bypass locks. Running an unpatched OS leaves your device vulnerable to known exploits.',
  evidence: (ctx: FindingContext): EvidenceItem[] => {
    const days = ctx.daysSincePatch ?? 0;
    const patchSignal = ctx.signals['device.securityPatch'];
    const prov: Provenance = patchSignal?.provenance ?? 'VERIFIED';

    return [
      {
        id: 'patch_age',
        label: 'Days Since Patch',
        value: `${days} days`,
        provenance: prov,
        details: days > 90 ? 'Exceeds recommended 90-day threshold' : 'Within acceptable maintenance window',
      },
      {
        id: 'patch_status',
        label: 'Patch Currency',
        value: days > 365 ? 'Critically Stale' : days > 90 ? 'Stale' : days > 30 ? 'Aging' : 'Fresh',
        provenance: prov,
      },
    ];
  },
  severityRule: (ctx: FindingContext): Severity => {
    const days = ctx.daysSincePatch ?? 0;
    if (days > 365) return 'critical';
    if (days > 180) return 'high';
    if (days > 90) return 'medium';
    if (days > 30) return 'low';
    return 'info';
  },
  effort: 'quick',
  recommendedActions: [
    {
      id: 'open_system_update',
      type: 'open_settings',
      label: 'Open System Update Settings',
      description: 'Check for available manufacturer and Android security updates.',
      target: 'android.settings.SYSTEM_UPDATE_SETTINGS',
      primary: true,
    },
    {
      id: 'rescan_after_update',
      type: 'mark_fixed',
      label: 'Re-scan Device',
      description: 'Re-evaluate patch freshness after completing the update.',
    },
  ],
};

export const SCREEN_LOCK_DISABLED_TEMPLATE: FindingTemplate = {
  type: 'SCREEN_LOCK_DISABLED',
  title: (): string => 'Device Screen Lock Disabled',
  whyDetected: (): string =>
    'The device does not have a secure lock screen PIN, password, or biometric barrier configured.',
  whyItMatters:
    'An unlocked phone grants immediate access to bank accounts, OTPs, identity apps, and private chats to anyone who physically holds the device.',
  evidence: (ctx: FindingContext): EvidenceItem[] => {
    const lockSignal = ctx.signals['device.screenLockEnabled'];
    return [
      {
        id: 'screen_lock_status',
        label: 'Screen Lock State',
        value: 'Disabled (None / Insecure)',
        provenance: lockSignal?.provenance ?? 'VERIFIED',
        details: 'Device opens directly without authentication prompt',
      },
    ];
  },
  severityRule: (): Severity => 'critical',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'open_lock_settings',
      type: 'open_settings',
      label: 'Set Up Screen Lock in Settings',
      description: 'Configure a strong 6+ digit PIN, password, or biometric unlock.',
      target: 'android.settings.SECURITY_SETTINGS',
      primary: true,
    },
  ],
};

export const WEAK_LOCK_TYPE_TEMPLATE: FindingTemplate = {
  type: 'WEAK_LOCK_TYPE',
  title: (): string => 'Insecure Screen Lock Type in Use',
  whyDetected: (ctx: FindingContext): string =>
    `The device is secured using a ${ctx.lockType || 'pattern or swipe'} lock rather than a strong 6+ digit PIN or biometric credential.`,
  whyItMatters:
    'Pattern locks leave visible smudge trails on phone screens and are easily observed by shoulder-surfers in public spaces.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'lock_type',
      label: 'Current Lock Type',
      value: ctx.lockType || 'Pattern Lock',
      provenance: 'VERIFIED',
      details: 'Recommended: 6+ digit PIN or Fingerprint/Face recognition',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'upgrade_lock',
      type: 'open_settings',
      label: 'Upgrade to PIN or Biometrics',
      description: 'Switch to a 6+ digit PIN in Android Security settings.',
      target: 'android.settings.SECURITY_SETTINGS',
      primary: true,
    },
  ],
};

export const DEVELOPER_OPTIONS_ENABLED_TEMPLATE: FindingTemplate = {
  type: 'DEVELOPER_OPTIONS_ENABLED',
  title: (): string => 'Developer Options & USB Debugging Active',
  whyDetected: (): string =>
    'Android developer settings or USB debugging (ADB) are currently turned on for this device.',
  whyItMatters:
    'When USB debugging is active, connecting your device to an untrusted computer or malicious charging station can allow full data extraction without entering your lock screen password.',
  evidence: (ctx: FindingContext): EvidenceItem[] => {
    const devSignal = ctx.signals['device.developerOptionsEnabled'];
    return [
      {
        id: 'adb_state',
        label: 'USB Debugging',
        value: 'Enabled',
        provenance: devSignal?.provenance ?? 'VERIFIED',
      },
    ];
  },
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'turn_off_dev_options',
      type: 'open_settings',
      label: 'Turn Off Developer Options',
      description: 'Toggle Developer Options to Off in System settings.',
      target: 'android.settings.APPLICATION_DEVELOPMENT_SETTINGS',
      primary: true,
    },
  ],
};

export const UNKNOWN_SOURCES_ENABLED_TEMPLATE: FindingTemplate = {
  type: 'UNKNOWN_SOURCES_ENABLED',
  title: (): string => 'App Sideloading / Unknown Sources Allowed',
  whyDetected: (): string =>
    'One or more applications on this device are granted permission to install unknown APKs from outside the Google Play Store.',
  whyItMatters:
    'Sideloaded apps bypass Google Play Protect security screening and account for over 90% of mobile malware and banking trojan infections.',
  evidence: (ctx: FindingContext): EvidenceItem[] => {
    const signal = ctx.signals['device.unknownSourcesAllowed'];
    return [
      {
        id: 'unknown_sources',
        label: 'Sideloading Permission',
        value: 'Allowed for 1+ apps',
        provenance: signal?.provenance ?? 'VERIFIED',
      },
    ];
  },
  severityRule: (): Severity => 'high',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'revoke_unknown_sources',
      type: 'open_settings',
      label: 'Revoke Install Unknown Apps Permission',
      description: 'Disallow browsers and file managers from installing APKs.',
      target: 'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
      primary: true,
    },
  ],
};

export const DISK_ENCRYPTION_DISABLED_TEMPLATE: FindingTemplate = {
  type: 'DISK_ENCRYPTION_DISABLED',
  title: (): string => 'Device Storage Encryption Disabled',
  whyDetected: (): string =>
    'Internal storage partition is not encrypted using OS full-disk or file-based encryption.',
  whyItMatters:
    'Without hardware encryption, physical attackers can dismantle your device and read photos, documents, and messages directly from flash memory.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'encryption_status',
      label: 'Storage Encryption',
      value: 'Unencrypted',
      provenance: 'VERIFIED',
    },
  ],
  severityRule: (): Severity => 'high',
  effort: 'moderate',
  recommendedActions: [
    {
      id: 'enable_encryption',
      type: 'open_settings',
      label: 'Enable Phone Encryption',
      description: 'Navigate to Security & Privacy and turn on device storage encryption.',
      target: 'android.settings.SECURITY_SETTINGS',
      primary: true,
    },
  ],
};

// ============================================================================
// Apps Category Finding Templates (§5.2)
// ============================================================================

export const APP_UNEXPECTED_PERMISSION_TEMPLATE: FindingTemplate = {
  type: 'APP_UNEXPECTED_PERMISSION',
  title: (ctx: FindingContext): string => {
    const app = ctx.appName || 'Application';
    const perm = ctx.permissionName || 'Sensitive Permission';
    return `${app} holds unexpected permission: ${perm}`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const app = ctx.appName || 'This application';
    const perm = ctx.permissionName || 'this permission';
    const reason = ctx.reason ? ` (${ctx.reason})` : '';
    return `${app} has been granted access to ${perm}, which is not typically required for its core features${reason}.`;
  },
  whyItMatters:
    'Granting unnecessary sensitive permissions allows background apps to track your location, read SMS verification codes, or record audio without active user context.',
  evidence: (ctx: FindingContext): EvidenceItem[] => {
    const appSignal = ctx.signals['apps.permissionsPerApp'];
    const prov: Provenance = appSignal?.provenance ?? 'PERMISSION_BASED';

    const items: EvidenceItem[] = [
      {
        id: 'app_name',
        label: 'Application',
        value: ctx.appName || 'Unknown App',
        provenance: prov,
        details: ctx.packageName ? `Package: ${ctx.packageName}` : undefined,
      },
      {
        id: 'permission',
        label: 'Granted Permission',
        value: ctx.permissionName || 'Unknown Permission',
        provenance: prov,
      },
    ];

    if (ctx.reason) {
      items.push({
        id: 'classification_reason',
        label: 'Analysis Reason',
        value: ctx.reason,
        provenance: 'VERIFIED',
      });
    }

    return items;
  },
  severityRule: (ctx: FindingContext): Severity => {
    const perm = (ctx.permissionName || '').toUpperCase();
    if (perm.includes('SMS') || perm.includes('LOCATION') || perm.includes('RECORD_AUDIO') || perm.includes('CAMERA')) {
      return 'high';
    }
    return 'medium';
  },
  effort: 'quick',
  recommendedActions: [
    {
      id: 'open_app_settings',
      type: 'open_settings',
      label: 'Manage Permissions in Settings',
      description: 'Revoke background access for unneeded permissions.',
      target: 'android.settings.APPLICATION_DETAILS_SETTINGS',
      primary: true,
    },
    {
      id: 'mark_reviewed',
      type: 'mark_fixed',
      label: 'Mark as Reviewed',
      description: 'Acknowledge that you intentionally granted this permission.',
    },
  ],
};

export const APP_SUSPICIOUS_PERMISSION_COMBO_TEMPLATE: FindingTemplate = {
  type: 'APP_SUSPICIOUS_PERMISSION_COMBO',
  title: (ctx: FindingContext): string => {
    const app = ctx.appName || 'Application';
    const combo = ctx.comboName || 'Dangerous Permission Combination';
    return `${app}: ${combo}`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const app = ctx.appName || 'App';
    const perms = ctx.permissionList?.join(', ') || 'Sensitive permissions';
    const desc = ctx.comboDescription || 'combined access risks data exfiltration';
    return `${app} possesses granted permissions [${perms}], enabling: ${desc}.`;
  },
  whyItMatters:
    'Individually legitimate permissions become dangerous when combined together. For example, reading SMS alongside Internet access allows silent exfiltration of one-time banking passwords.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'app_identifier',
      label: 'App',
      value: ctx.appName || 'Unknown App',
      provenance: 'PERMISSION_BASED',
      details: ctx.packageName,
    },
    {
      id: 'combo_permissions',
      label: 'Combined Permissions',
      value: ctx.permissionList?.join(' + ') || 'Multiple Permissions',
      provenance: 'PERMISSION_BASED',
      details: ctx.comboDescription,
    },
  ],
  severityRule: (ctx: FindingContext): Severity => {
    const name = (ctx.comboName || '').toLowerCase();
    if (name.includes('sms') || name.includes('surveillance')) {
      return 'critical';
    }
    return 'high';
  },
  effort: 'quick',
  recommendedActions: [
    {
      id: 'review_combo',
      type: 'open_settings',
      label: 'Revoke Sensitive Permissions',
      description: 'Open app settings and revoke one or more permissions in the combination.',
      target: 'android.settings.APPLICATION_DETAILS_SETTINGS',
      primary: true,
    },
  ],
};

export const APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN_TEMPLATE: FindingTemplate = {
  type: 'APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN',
  title: (ctx: FindingContext): string => {
    const app = ctx.appName || 'App';
    return `${app} acquired new sensitive permissions since last scan`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const app = ctx.appName || 'This application';
    const perms = ctx.permissionList?.join(', ') || 'sensitive permissions';
    return `${app} was recently granted new access to ${perms} after an update or user prompt.`;
  },
  whyItMatters:
    'Monitoring permission diffs prevents "permission creep" where applications gradually accumulate broad data access over multiple routine updates.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'new_permissions',
      label: 'New Permissions Detected',
      value: ctx.permissionList?.join(', ') || 'New Permissions',
      provenance: 'PERMISSION_BASED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'review_new_perms',
      type: 'open_settings',
      label: 'Review New Permissions in Settings',
      target: 'android.settings.APPLICATION_DETAILS_SETTINGS',
      primary: true,
    },
    {
      id: 'mark_approved',
      type: 'mark_fixed',
      label: 'Approve Permissions',
    },
  ],
};

export const APP_SIDELOADED_FLAGGED_TEMPLATE: FindingTemplate = {
  type: 'APP_SIDELOADED_FLAGGED',
  title: (ctx: FindingContext): string => {
    const app = ctx.appName || 'Application';
    return `${app} was installed outside official Google Play Store`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const app = ctx.appName || 'This app';
    return `${app} (${ctx.packageName || 'package'}) was sideloaded or installed from an unofficial source.`;
  },
  whyItMatters:
    'Sideloaded apps do not receive continuous security scanning from Google Play Protect and can be modified with repackaged spyware or backdoors.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'install_source',
      label: 'Install Source',
      value: 'Sideloaded / Unverified Installer',
      provenance: 'VERIFIED',
      details: ctx.packageName,
    },
  ],
  severityRule: (): Severity => 'high',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'verify_or_uninstall',
      type: 'open_settings',
      label: 'Inspect or Uninstall App',
      target: 'android.settings.APPLICATION_DETAILS_SETTINGS',
      primary: true,
    },
  ],
};

export const APP_UNUSED_WITH_SENSITIVE_PERMISSIONS_TEMPLATE: FindingTemplate = {
  type: 'APP_UNUSED_WITH_SENSITIVE_PERMISSIONS',
  title: (ctx: FindingContext): string => {
    const app = ctx.appName || 'Application';
    return `Unused app retaining sensitive permissions: ${app}`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const app = ctx.appName || 'This application';
    return `${app} has not been opened in over 60 days but continues to retain high-privilege device permissions.`;
  },
  whyItMatters:
    'Unused applications expand your device attack surface. If abandoned apps contain security flaws, attackers can leverage their granted permissions.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'unused_duration',
      label: 'Last Active',
      value: '> 60 days ago',
      provenance: 'PERMISSION_BASED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'uninstall_unused',
      type: 'open_settings',
      label: 'Uninstall Unused Application',
      target: 'android.settings.APPLICATION_DETAILS_SETTINGS',
      primary: true,
    },
  ],
};

// ============================================================================
// Network Category Finding Templates (§5.2)
// ============================================================================

export const UNTRUSTED_WIFI_SELF_REPORTED_TEMPLATE: FindingTemplate = {
  type: 'UNTRUSTED_WIFI_SELF_REPORTED',
  title: (): string => 'Connected to Unsecured or Untrusted Wi-Fi Network',
  whyDetected: (ctx: FindingContext): string =>
    `The device is connected to Wi-Fi "${ctx.wifiSSID || 'Public Wi-Fi'}" without verified WPA2/WPA3 encryption or trust confirmation.`,
  whyItMatters:
    'Open public Wi-Fi networks allow attackers on the same local network to attempt man-in-the-middle eavesdropping, DNS redirection, and credential sniffing.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'wifi_name',
      label: 'Network SSID',
      value: ctx.wifiSSID || 'Open Wi-Fi Network',
      provenance: 'SELF_REPORTED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'enable_vpn',
      type: 'in_app_action',
      label: 'Turn on VPN Connection',
      description: 'Encrypt all network communications before browsing on public Wi-Fi.',
      primary: true,
    },
  ],
};

export const NO_VPN_ON_PUBLIC_WIFI_TEMPLATE: FindingTemplate = {
  type: 'NO_VPN_ON_PUBLIC_WIFI',
  title: (): string => 'Public Wi-Fi Active Without VPN Protection',
  whyDetected: (): string =>
    'You indicated using public Wi-Fi networks, but no active VPN connection was detected.',
  whyItMatters:
    'A Virtual Private Network (VPN) encrypts all data leaving your device, shielding passwords, browsing destinations, and tokens from local network snooping.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'vpn_state',
      label: 'VPN Tunnel',
      value: 'Inactive',
      provenance: 'VERIFIED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'activate_vpn',
      type: 'in_app_action',
      label: 'Activate VPN Before Browsing',
      primary: true,
    },
  ],
};

// ============================================================================
// Account Category Finding Templates (§5.2)
// ============================================================================

export const EMAIL_IN_KNOWN_BREACH_TEMPLATE: FindingTemplate = {
  type: 'EMAIL_IN_KNOWN_BREACH',
  title: (ctx: FindingContext): string => {
    const count = ctx.breachCount || 1;
    return `Email Address Found in ${count} Known Data Breach${count === 1 ? '' : 'es'}`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const list = ctx.breachNames?.slice(0, 3).join(', ') || 'publicly verified breaches';
    return `Your email address appeared in known corporate data breaches (${list}).`;
  },
  whyItMatters:
    'When third-party databases leak credentials, attackers use automated botnets to test your leaked email and password combinations across banking, email, and shopping websites.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'breach_sources',
      label: 'Breach Sources',
      value: ctx.breachNames?.join(', ') || 'Verified Breaches',
      provenance: 'VERIFIED',
      details: 'Source: Have I Been Pwned authoritative database',
    },
  ],
  severityRule: (): Severity => 'high',
  effort: 'moderate',
  recommendedActions: [
    {
      id: 'change_passwords',
      type: 'in_app_action',
      label: 'Change Passwords on Breached Services',
      description: 'Ensure unique passwords and 2FA are enabled on all affected accounts.',
      primary: true,
    },
  ],
};

export const PASSWORD_FOUND_IN_LEAK_TEMPLATE: FindingTemplate = {
  type: 'PASSWORD_FOUND_IN_LEAK',
  title: (): string => 'Password Appears in Public Breach Database',
  whyDetected: (): string =>
    'The checked password was identified in public breach records via k-anonymity hash verification.',
  whyItMatters:
    'Attackers include breached passwords in standard automated dictionary attacks. Continuing to use this password makes account takeover trivial.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'leak_result',
      label: 'HIBP Range Query Result',
      value: 'Pwned (Matches public hash suffix)',
      provenance: 'VERIFIED',
      details: 'Verified cryptographically without transmitting plaintext password',
    },
  ],
  severityRule: (): Severity => 'critical',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'replace_password',
      type: 'in_app_action',
      label: 'Change This Password Immediately',
      description: 'Replace with a 14+ character unique passphrase in a password manager.',
      primary: true,
    },
  ],
};

export const PASSWORD_REUSED_ACROSS_VAULT_ENTRIES_TEMPLATE: FindingTemplate = {
  type: 'PASSWORD_REUSED_ACROSS_VAULT_ENTRIES',
  title: (ctx: FindingContext): string => {
    const count = ctx.reusedCount || 2;
    return `Identical Password Reused Across ${count} Vault Accounts`;
  },
  whyDetected: (ctx: FindingContext): string => {
    const count = ctx.reusedCount || 2;
    return `You have ${count} accounts in your local vault sharing the exact same password.`;
  },
  whyItMatters:
    'If any single website you use suffers a data leak, attackers will use that password to access all other services sharing it.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'reused_count',
      label: 'Accounts Sharing Password',
      value: `${ctx.reusedCount || 2} accounts`,
      provenance: 'VERIFIED',
    },
  ],
  severityRule: (): Severity => 'high',
  effort: 'moderate',
  recommendedActions: [
    {
      id: 'generate_unique_passwords',
      type: 'in_app_action',
      label: 'Generate Unique Passwords for Reused Accounts',
      primary: true,
    },
  ],
};

export const WEAK_PASSWORD_IN_VAULT_TEMPLATE: FindingTemplate = {
  type: 'WEAK_PASSWORD_IN_VAULT',
  title: (ctx: FindingContext): string => {
    const sites = ctx.weakPasswordSites?.slice(0, 2).join(', ') || 'Vault Account';
    return `Weak Password Detected for ${sites}`;
  },
  whyDetected: (): string =>
    'One or more passwords in your vault have low entropy (length < 8 or easily guessable dictionary patterns).',
  whyItMatters:
    'Weak passwords can be brute-forced or guessed by automated offline cracking tools in under a minute.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'weak_sites',
      label: 'Affected Accounts',
      value: ctx.weakPasswordSites?.join(', ') || 'Vault Accounts',
      provenance: 'VERIFIED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'upgrade_vault_entry',
      type: 'in_app_action',
      label: 'Upgrade Password to Strong Passphrase',
      primary: true,
    },
  ],
};

export const TWO_FACTOR_DISABLED_SELF_REPORTED_TEMPLATE: FindingTemplate = {
  type: 'TWO_FACTOR_DISABLED_SELF_REPORTED',
  title: (): string => 'Two-Factor Authentication Missing on Primary Accounts',
  whyDetected: (ctx: FindingContext): string => {
    const accounts = ctx.missing2FAServices?.join(', ') || 'Email / Banking / Social Media';
    return `You reported that two-factor authentication (2FA) is not enabled on: ${accounts}.`;
  },
  whyItMatters:
    'Without 2FA, a single leaked password is all an attacker needs to take complete control of your primary accounts and linked identities.',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'unprotected_accounts',
      label: 'Accounts Lacking 2FA',
      value: ctx.missing2FAServices?.join(', ') || 'Primary Accounts',
      provenance: 'SELF_REPORTED',
    },
  ],
  severityRule: (): Severity => 'critical',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'enable_2fa',
      type: 'in_app_action',
      label: 'Enable Authenticator App 2FA',
      description: 'Turn on 2-Step Verification using an authenticator app (Google Authenticator, Aegis).',
      primary: true,
    },
  ],
};

export const NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED_TEMPLATE: FindingTemplate = {
  type: 'NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED',
  title: (): string => 'No Offline Account Recovery Pathway Configured',
  whyDetected: (): string =>
    'You reported that your primary accounts lack up-to-date recovery phone numbers, backup emails, or stored offline emergency codes.',
  whyItMatters:
    'If your device is lost or compromised, stored offline recovery codes are the only guaranteed method to regain account access without permanent data loss.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'recovery_status',
      label: 'Recovery Pathway',
      value: 'Missing / Outdated',
      provenance: 'SELF_REPORTED',
    },
  ],
  severityRule: (): Severity => 'high',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'setup_recovery',
      type: 'in_app_action',
      label: 'Download & Store Emergency Recovery Codes',
      primary: true,
    },
  ],
};

// ============================================================================
// Habits Category Finding Templates (§5.2, §8)
// ============================================================================

export const POOR_PASSWORD_HABITS_TEMPLATE: FindingTemplate = {
  type: 'POOR_PASSWORD_HABITS',
  title: (): string => 'High-Risk Password Management Habits',
  whyDetected: (): string =>
    'Assessment responses indicate memorizing simple passwords or reusing similar password patterns across accounts.',
  whyItMatters:
    'Human memory naturally favors predictable password formulas that automated credential stuffing tools exploit within seconds.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'password_habit',
      label: 'Reported Habit',
      value: 'Password reuse or predictable variations',
      provenance: 'SELF_REPORTED',
    },
  ],
  severityRule: (): Severity => 'high',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'adopt_manager',
      type: 'in_app_action',
      label: 'Adopt a Dedicated Password Manager',
      primary: true,
    },
  ],
};

export const NO_PASSWORD_MANAGER_TEMPLATE: FindingTemplate = {
  type: 'NO_PASSWORD_MANAGER',
  title: (): string => 'No Password Manager In Use',
  whyDetected: (): string =>
    'You reported that you do not currently utilize a password manager to generate and store credentials.',
  whyItMatters:
    'Password managers eliminate the cognitive burden of complex passwords and provide automated protection against phishing spoof sites.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'pw_manager_status',
      label: 'Password Manager',
      value: 'Not in use',
      provenance: 'SELF_REPORTED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'install_manager',
      type: 'in_app_action',
      label: 'Get Started with a Free Password Manager',
      description: 'Install Bitwarden, 1Password, or use your phone’s built-in password vault.',
      primary: true,
    },
  ],
};

export const LOW_PHISHING_AWARENESS_TEMPLATE: FindingTemplate = {
  type: 'LOW_PHISHING_AWARENESS',
  title: (): string => 'Phishing & Social Engineering Vulnerability',
  whyDetected: (ctx: FindingContext): string =>
    ctx.reason || 'You indicated a willingness to act on urgent unverified messages or share OTP verification codes.',
  whyItMatters:
    'Phishing and social engineering attacks trick victims into sharing OTPs and credentials by faking urgency (e.g. fake delivery holds or bank alerts).',
  evidence: (ctx: FindingContext): EvidenceItem[] => [
    {
      id: 'quiz_scenario',
      label: 'Scenario Assessment',
      value: ctx.reason || 'Incorrect response on phishing identification quiz',
      provenance: 'SELF_REPORTED',
      details: ctx.scenarioQuestion,
    },
  ],
  severityRule: (ctx: FindingContext): Severity => {
    const reason = (ctx.reason || '').toLowerCase();
    const userAnswer = (ctx.userAnswer || '').toLowerCase();
    const scenario = (ctx.scenarioQuestion || '').toLowerCase();
    if (reason.includes('otp') || userAnswer.includes('otp') || scenario.includes('otp')) {
      return 'critical';
    }
    return 'high';
  },
  effort: 'quick',
  recommendedActions: [
    {
      id: 'review_phishing_guide',
      type: 'in_app_action',
      label: 'Review Scam & Phishing Resilience Guide',
      primary: true,
    },
  ],
};

export const PUBLIC_DEVICE_SHARING_TEMPLATE: FindingTemplate = {
  type: 'PUBLIC_DEVICE_SHARING',
  title: (): string => 'Shared Device & Physical Security Exposure',
  whyDetected: (): string =>
    'Device is shared with other people without separate user profiles or has a lengthy screen timeout.',
  whyItMatters:
    'An unlocked shared device allows casual users to view private notifications, access financial apps, and inspect stored photos.',
  evidence: (): EvidenceItem[] => [
    {
      id: 'device_sharing',
      label: 'Device Usage Mode',
      value: 'Shared with others without profile isolation',
      provenance: 'SELF_REPORTED',
    },
  ],
  severityRule: (): Severity => 'medium',
  effort: 'quick',
  recommendedActions: [
    {
      id: 'shorten_timeout',
      type: 'open_settings',
      label: 'Set Screen Timeout to 30 Seconds',
      target: 'android.settings.DISPLAY_SETTINGS',
      primary: true,
    },
  ],
};

// ============================================================================
// Central Finding Registry Export (§5.1, §5.2)
// ============================================================================

export const FINDING_REGISTRY: Readonly<Record<FindingType, FindingTemplate>> = {
  // Device
  STALE_SECURITY_PATCH: STALE_SECURITY_PATCH_TEMPLATE,
  SCREEN_LOCK_DISABLED: SCREEN_LOCK_DISABLED_TEMPLATE,
  WEAK_LOCK_TYPE: WEAK_LOCK_TYPE_TEMPLATE,
  DEVELOPER_OPTIONS_ENABLED: DEVELOPER_OPTIONS_ENABLED_TEMPLATE,
  UNKNOWN_SOURCES_ENABLED: UNKNOWN_SOURCES_ENABLED_TEMPLATE,
  DISK_ENCRYPTION_DISABLED: DISK_ENCRYPTION_DISABLED_TEMPLATE,

  // Apps
  APP_UNEXPECTED_PERMISSION: APP_UNEXPECTED_PERMISSION_TEMPLATE,
  APP_SUSPICIOUS_PERMISSION_COMBO: APP_SUSPICIOUS_PERMISSION_COMBO_TEMPLATE,
  APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN: APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN_TEMPLATE,
  APP_SIDELOADED_FLAGGED: APP_SIDELOADED_FLAGGED_TEMPLATE,
  APP_UNUSED_WITH_SENSITIVE_PERMISSIONS: APP_UNUSED_WITH_SENSITIVE_PERMISSIONS_TEMPLATE,

  // Network
  UNTRUSTED_WIFI_SELF_REPORTED: UNTRUSTED_WIFI_SELF_REPORTED_TEMPLATE,
  NO_VPN_ON_PUBLIC_WIFI: NO_VPN_ON_PUBLIC_WIFI_TEMPLATE,

  // Account
  EMAIL_IN_KNOWN_BREACH: EMAIL_IN_KNOWN_BREACH_TEMPLATE,
  PASSWORD_FOUND_IN_LEAK: PASSWORD_FOUND_IN_LEAK_TEMPLATE,
  PASSWORD_REUSED_ACROSS_VAULT_ENTRIES: PASSWORD_REUSED_ACROSS_VAULT_ENTRIES_TEMPLATE,
  WEAK_PASSWORD_IN_VAULT: WEAK_PASSWORD_IN_VAULT_TEMPLATE,
  TWO_FACTOR_DISABLED_SELF_REPORTED: TWO_FACTOR_DISABLED_SELF_REPORTED_TEMPLATE,
  NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED: NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED_TEMPLATE,

  // Habits
  POOR_PASSWORD_HABITS: POOR_PASSWORD_HABITS_TEMPLATE,
  NO_PASSWORD_MANAGER: NO_PASSWORD_MANAGER_TEMPLATE,
  LOW_PHISHING_AWARENESS: LOW_PHISHING_AWARENESS_TEMPLATE,
  PUBLIC_DEVICE_SHARING: PUBLIC_DEVICE_SHARING_TEMPLATE,
};

/**
 * Retrieves an authored finding template by type.
 */
export function getFindingTemplate(type: FindingType): FindingTemplate | undefined {
  return FINDING_REGISTRY[type];
}

/**
 * Factory helper to construct a fully instantiated Finding from a template and context.
 */
export function createFindingFromTemplate(
  template: FindingTemplate,
  ctx: FindingContext,
  options: {
    id: string;
    category: Finding['category'];
    provenance: Provenance;
    scanId: string;
    firstSeenScanId?: string;
    status?: Finding['status'];
  }
): Finding {
  const severity = template.severityRule(ctx);
  const title = template.title(ctx);
  const whyDetected = template.whyDetected(ctx);
  const evidence = template.evidence(ctx);

  return {
    id: options.id,
    type: template.type,
    severity,
    category: options.category,
    provenance: options.provenance,
    effort: template.effort,
    status: options.status ?? 'open',
    evidence,
    scanId: options.scanId,
    firstSeenScanId: options.firstSeenScanId ?? options.scanId,
    title,
    whyDetected,
    whyItMatters: template.whyItMatters,
    recommendedActions: template.recommendedActions,
  };
}
