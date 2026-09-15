import { SecurityRule, RuleEvaluationResult } from './rule.interface';
import { SignalMap } from '../models/signal';

function getAvailableSignal(signals: SignalMap, id: string) {
  const signal = signals[id];
  if (!signal || signal.status !== 'AVAILABLE') {
    return null;
  }
  return signal;
}

export const RULE_DEV_NO_SCREEN_LOCK: SecurityRule = {
  id: 'RULE_DEV_NO_SCREEN_LOCK',
  category: 'device_safety',
  name: 'Device Screen Lock Disabled',
  description: 'Checks if the device is protected by PIN, password, pattern, or biometric lock.',
  defaultSeverity: 'critical',
  requiredSignalIds: ['device.screen_lock_secured'],
  remediation: {
    title: 'Enable PIN or Biometric Screen Lock',
    whyItMatters: 'An unlocked device gives anyone with physical access immediate control of your photos, messages, banking apps, and accounts.',
    steps: [
      'Open Device Settings > Security & Privacy > Screen Lock.',
      'Configure a strong 6+ digit PIN or alphanumeric passphrase.',
      'Optionally enable Fingerprint or Face unlock for convenience.',
      'Set screen timeout to 30 seconds or 1 minute maximum.',
    ],
    effort: 'low',
    impact: 10,
    likelihood: 8,
    easeOfFix: 9,
    priorityScore: 720, // 10 * 8 * 9
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'device.screen_lock_secured');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Screen lock telemetry is unavailable or restricted by OS.',
        evidenceSignals: [],
      };
    }

    const isLocked = signal.value === true || String(signal.value).toLowerCase() === 'true' || String(signal.value).toLowerCase() === 'yes';

    if (!isLocked) {
      return {
        triggered: true,
        rationale: 'The device is not secured with a screen lock or biometrics, leaving all local data exposed.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Device screen lock is active and verified.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_DEV_STORAGE_UNENCRYPTED: SecurityRule = {
  id: 'RULE_DEV_STORAGE_UNENCRYPTED',
  category: 'device_safety',
  name: 'Device Storage Unencrypted',
  description: 'Checks if full-disk storage encryption is enabled.',
  defaultSeverity: 'high',
  requiredSignalIds: ['device.storage_encrypted'],
  remediation: {
    title: 'Enable Full-Disk Storage Encryption',
    whyItMatters: 'Without encryption, data can be extracted directly from device storage chips even if a lock screen is present.',
    steps: [
      'Navigate to Device Settings > Security > Encryption & Credentials.',
      'Enable Encrypt Phone / FileVault / BitLocker.',
      'Keep the device connected to power during initial encryption.',
    ],
    effort: 'low',
    impact: 9,
    likelihood: 6,
    easeOfFix: 7,
    priorityScore: 378, // 9 * 6 * 7
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'device.storage_encrypted');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Storage encryption telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const isEncrypted = signal.value === true || String(signal.value).toLowerCase() === 'true';

    if (!isEncrypted) {
      return {
        triggered: true,
        rationale: 'Device storage is unencrypted, creating physical extraction vulnerability.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Device storage is fully encrypted.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_DEV_ROOT_JAILBREAK: SecurityRule = {
  id: 'RULE_DEV_ROOT_JAILBREAK',
  category: 'device_safety',
  name: 'Root / Jailbreak Indicators Detected',
  description: 'Checks whether the device operating system has been rooted or jailbroken, disabling application sandboxing.',
  defaultSeverity: 'critical',
  requiredSignalIds: ['device.root_or_jailbreak_detected'],
  remediation: {
    title: 'Restore OEM / Factory Operating System',
    whyItMatters: 'Root or jailbreak compromises the OS security boundary, allowing malicious apps to read memory and bypass permissions of banking and private apps.',
    steps: [
      'Backup personal media and documents to a verified secure storage.',
      'Restore the device to official OEM manufacturer firmware.',
      'Avoid running modified kernels or superuser binaries.',
    ],
    effort: 'high',
    impact: 10,
    likelihood: 7,
    easeOfFix: 4,
    priorityScore: 280, // 10 * 7 * 4
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'device.root_or_jailbreak_detected');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Root/jailbreak telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const isRooted = signal.value === true || String(signal.value).toLowerCase() === 'true';

    if (isRooted) {
      return {
        triggered: true,
        rationale: 'Operating system integrity is broken by root or jailbreak binaries, compromising app isolation.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'No root or jailbreak indicators detected.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_DEV_UNKNOWN_SOURCES_ENABLED: SecurityRule = {
  id: 'RULE_DEV_UNKNOWN_SOURCES_ENABLED',
  category: 'device_safety',
  name: 'App Sideloading / Unknown Sources Allowed',
  description: 'Checks if apps can be installed from untrusted web browsers or unofficial sources.',
  defaultSeverity: 'high',
  requiredSignalIds: ['device.unknown_sources_allowed'],
  remediation: {
    title: 'Restrict App Installation to Trusted App Stores',
    whyItMatters: 'Sideloaded APKs bypass store security checks and frequently contain spyware, fake banking trojans, or stalkerware.',
    steps: [
      'Go to Device Settings > Apps > Special App Access > Install Unknown Apps.',
      'Turn off permission for all browsers, file managers, and messaging apps.',
      'Install applications exclusively from the Google Play Store or Apple App Store.',
    ],
    effort: 'low',
    impact: 8,
    likelihood: 8,
    easeOfFix: 9,
    priorityScore: 576, // 8 * 8 * 9
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'device.unknown_sources_allowed');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Unknown sources telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const isAllowed = signal.value === true || String(signal.value).toLowerCase() === 'true';

    if (isAllowed) {
      return {
        triggered: true,
        rationale: 'App installation from untrusted sources is allowed, elevating malware infection risk.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Installation from untrusted sources is disabled.',
      evidenceSignals: [signal],
    };
  },
};

export const RULE_DEV_DEVELOPER_MODE_ACTIVE: SecurityRule = {
  id: 'RULE_DEV_DEVELOPER_MODE_ACTIVE',
  category: 'device_safety',
  name: 'Developer Mode / USB Debugging Active',
  description: 'Checks if Android Developer Options or USB Debugging is currently active.',
  defaultSeverity: 'medium',
  requiredSignalIds: ['device.developer_mode_enabled'],
  remediation: {
    title: 'Turn Off Developer Mode & USB Debugging',
    whyItMatters: 'When USB debugging is on, connecting your phone to a public charger or untrusted computer can allow full data extraction via ADB without unlocking.',
    steps: [
      'Open Settings > System > Developer Options.',
      'Toggle Developer Options to "Off" (or disable USB Debugging).',
    ],
    effort: 'low',
    impact: 6,
    likelihood: 6,
    easeOfFix: 9,
    priorityScore: 324, // 6 * 6 * 9
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'device.developer_mode_enabled');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Developer mode telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const isDev = signal.value === true || String(signal.value).toLowerCase() === 'true';

    if (isDev) {
      return {
        triggered: true,
        rationale: 'Developer mode or USB debugging is enabled on everyday device.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Developer mode is turned off.',
      evidenceSignals: [signal],
    };
  },
};

export const DEVICE_RULES: readonly SecurityRule[] = [
  RULE_DEV_NO_SCREEN_LOCK,
  RULE_DEV_STORAGE_UNENCRYPTED,
  RULE_DEV_ROOT_JAILBREAK,
  RULE_DEV_UNKNOWN_SOURCES_ENABLED,
  RULE_DEV_DEVELOPER_MODE_ACTIVE,
];
