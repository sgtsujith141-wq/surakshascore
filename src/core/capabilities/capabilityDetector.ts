import { SecurityCategory } from '../types/categories';
import { PlatformId, CapabilityStatus } from '../types/platform';
import { EvidenceTier } from '../types/evidenceTier';

/**
 * Summary of platform security inspection capabilities.
 */
export interface PlatformCapabilitySummary {
  readonly platform: PlatformId;
  readonly categoryCapabilities: Readonly<Record<SecurityCategory, CapabilityStatus>>;
  readonly maxEvidenceTier: Readonly<Record<SecurityCategory, EvidenceTier>>;
  readonly hardwareAttestationAvailable: boolean;
  readonly backgroundInspectionSupported: boolean;
}

/**
 * Core abstraction for detecting host platform capabilities.
 * Zero dependency on native runtime or browser DOM.
 */
export interface ICapabilityDetector {
  /** Returns the detected host platform. */
  detectPlatform(): PlatformId;

  /** Returns capability status for a specific security category. */
  getCategoryCapability(category: SecurityCategory): CapabilityStatus;

  /** Returns maximum attainable evidence tier for a category on this platform. */
  getMaxEvidenceTier(category: SecurityCategory): EvidenceTier;

  /** Checks if hardware-backed cryptographic attestation is supported. */
  isHardwareAttestationSupported(): boolean;

  /** Returns a comprehensive summary of all platform capabilities. */
  getCapabilitySummary(): PlatformCapabilitySummary;
}
