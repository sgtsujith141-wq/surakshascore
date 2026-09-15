import {
  ICapabilityDetector,
  PlatformCapabilitySummary,
} from '../core/capabilities/capabilityDetector';
import { SecurityCategory } from '../core/types/categories';
import { PlatformId, CapabilityStatus } from '../core/types/platform';
import { EvidenceTier } from '../core/types/evidenceTier';

/**
 * Capability detector implementation for Web browser runtime environment.
 * Identifies that web clients rely primarily on Self-Reported (Tier 4) and limited heuristic signals.
 */
export class WebCapabilityDetector implements ICapabilityDetector {
  private readonly forcedPlatform?: PlatformId;

  constructor(forcedPlatform?: PlatformId) {
    this.forcedPlatform = forcedPlatform;
  }

  detectPlatform(): PlatformId {
    if (this.forcedPlatform) {
      return this.forcedPlatform;
    }

    if (typeof navigator === 'undefined') {
      return 'web';
    }

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    if (ua.includes('linux')) return 'linux';
    return 'web';
  }

  getCategoryCapability(category: SecurityCategory): CapabilityStatus {
    switch (category) {
      case 'account_security':
      case 'phishing_fraud':
      case 'backup_recovery':
        // Assessment questionnaire available on web
        return 'supported';
      case 'device_safety':
      case 'update_hygiene':
      case 'privacy':
        // Web browsers cannot directly inspect device settings or OS patch level
        return 'limited';
      default:
        return 'unsupported';
    }
  }

  getMaxEvidenceTier(category: SecurityCategory): EvidenceTier {
    switch (category) {
      case 'device_safety':
      case 'update_hygiene':
      case 'privacy':
        // In pure web mode, only self-reported assessment is possible
        return EvidenceTier.TIER_4_SELF_REPORTED;
      default:
        return EvidenceTier.TIER_4_SELF_REPORTED;
    }
  }

  isHardwareAttestationSupported(): boolean {
    return false;
  }

  getCapabilitySummary(): PlatformCapabilitySummary {
    const platform = this.detectPlatform();
    return {
      platform,
      categoryCapabilities: {
        account_security: this.getCategoryCapability('account_security'),
        device_safety: this.getCategoryCapability('device_safety'),
        phishing_fraud: this.getCategoryCapability('phishing_fraud'),
        privacy: this.getCategoryCapability('privacy'),
        backup_recovery: this.getCategoryCapability('backup_recovery'),
        update_hygiene: this.getCategoryCapability('update_hygiene'),
      },
      maxEvidenceTier: {
        account_security: this.getMaxEvidenceTier('account_security'),
        device_safety: this.getMaxEvidenceTier('device_safety'),
        phishing_fraud: this.getMaxEvidenceTier('phishing_fraud'),
        privacy: this.getMaxEvidenceTier('privacy'),
        backup_recovery: this.getMaxEvidenceTier('backup_recovery'),
        update_hygiene: this.getMaxEvidenceTier('update_hygiene'),
      },
      hardwareAttestationAvailable: false,
      backgroundInspectionSupported: false,
    };
  }
}
