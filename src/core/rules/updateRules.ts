import { SecurityRule, RuleEvaluationResult } from './rule.interface';
import { SignalMap } from '../models/signal';

function getAvailableSignal(signals: SignalMap, id: string) {
  const signal = signals[id];
  if (!signal || signal.status !== 'AVAILABLE') {
    return null;
  }
  return signal;
}

export const RULE_UPD_OS_OUTDATED: SecurityRule = {
  id: 'RULE_UPD_OS_OUTDATED',
  category: 'update_hygiene',
  name: 'Operating System Security Patch Outdated',
  description: 'Evaluates whether the OS is missing critical security updates (> 90 days since latest patch).',
  defaultSeverity: 'high',
  requiredSignalIds: ['update.os_patch_age_days'],
  remediation: {
    title: 'Install Latest Operating System Security Update',
    whyItMatters: 'Outdated systems contain publicly documented vulnerabilities actively exploited by cybercriminals to remotely compromise devices.',
    steps: [
      'Open Device Settings > System > System Update / Software Update.',
      'Check for updates and download the latest patch level.',
      'Restart the device to apply security fixes.',
    ],
    effort: 'low',
    impact: 9,
    likelihood: 8,
    easeOfFix: 8,
    priorityScore: 576, // 9 * 8 * 8
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'update.os_patch_age_days');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'OS patch age telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const ageDays = Number(signal.value);
    if (isNaN(ageDays)) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'OS patch age value could not be parsed.',
        evidenceSignals: [signal],
      };
    }

    if (ageDays > 90) {
      return {
        triggered: true,
        rationale: `Operating system security patch is ${ageDays} days old (exceeds recommended 90-day threshold).`,
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: `OS patch level is current (${ageDays} days old).`,
      evidenceSignals: [signal],
    };
  },
};

export const RULE_UPD_AUTO_UPDATES_DISABLED: SecurityRule = {
  id: 'RULE_UPD_AUTO_UPDATES_DISABLED',
  category: 'update_hygiene',
  name: 'Automatic Software Updates Disabled',
  description: 'Checks if automatic downloads and installation of critical software updates are turned on.',
  defaultSeverity: 'medium',
  requiredSignalIds: ['update.auto_updates_enabled'],
  remediation: {
    title: 'Enable Automatic Software & App Updates',
    whyItMatters: 'Automatic updates ensure zero-day vulnerabilities in browsers and apps are patched immediately without relying on manual checks.',
    steps: [
      'In Google Play Store / App Store settings, enable "Auto-update apps over Wi-Fi".',
      'In System Settings > Software Update, enable "Auto-download over Wi-Fi" and "Install overnight".',
    ],
    effort: 'low',
    impact: 7,
    likelihood: 7,
    easeOfFix: 9,
    priorityScore: 441, // 7 * 7 * 9
  },
  evaluate(signals: SignalMap): RuleEvaluationResult {
    const signal = getAvailableSignal(signals, 'update.auto_updates_enabled');
    if (!signal) {
      return {
        triggered: false,
        insufficientEvidence: true,
        rationale: 'Automatic update telemetry is unavailable.',
        evidenceSignals: [],
      };
    }

    const isEnabled = signal.value === true || String(signal.value).toLowerCase() === 'true' || String(signal.value).toLowerCase() === 'yes';

    if (!isEnabled) {
      return {
        triggered: true,
        rationale: 'Automatic updates are disabled, leaving the device exposed until manual patching occurs.',
        evidenceSignals: [signal],
      };
    }

    return {
      triggered: false,
      rationale: 'Automatic updates are active.',
      evidenceSignals: [signal],
    };
  },
};

export const UPDATE_RULES: readonly SecurityRule[] = [
  RULE_UPD_OS_OUTDATED,
  RULE_UPD_AUTO_UPDATES_DISABLED,
];
