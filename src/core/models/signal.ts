import { SecurityCategory } from '../types/categories';
import { EvidenceTier } from '../types/evidenceTier';

/**
 * Status of a telemetry signal.
 * - AVAILABLE: Telemetry was successfully acquired and verified.
 * - UNAVAILABLE: Telemetry could not be obtained (e.g. timeout, service unreachable).
 * - PERMISSION_DENIED: Platform permission was not granted by user.
 * - NOT_SUPPORTED: The current platform or device does not expose this capability.
 */
export type SignalStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED';

/**
 * An individual security signal collected from device, platform, or user assessment.
 */
export interface Signal<T = unknown> {
  readonly id: string;
  readonly category: SecurityCategory;
  readonly tier: EvidenceTier;
  readonly status: SignalStatus;
  readonly value: T;
  readonly timestamp: string;
  readonly source: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Fast lookup map of signal IDs to their respective Signal instances.
 */
export type SignalMap = Readonly<Record<string, Signal>>;
