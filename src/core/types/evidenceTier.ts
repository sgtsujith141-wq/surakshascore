/**
 * EvidenceTier defines the provenance and verification trustworthiness of security signals.
 * Tier 1: Cryptographic/Hardware-attested (Highest trust)
 * Tier 2: Operating System API inspected
 * Tier 3: Heuristic / Application analyzed
 * Tier 4: Self-reported / User-declared (Standard baseline)
 */
export enum EvidenceTier {
  TIER_1_HARDWARE = 1,
  TIER_2_OS_API = 2,
  TIER_3_HEURISTIC = 3,
  TIER_4_SELF_REPORTED = 4,
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceTierMetadata {
  readonly tier: EvidenceTier;
  readonly name: string;
  readonly description: string;
  readonly defaultConfidence: ConfidenceLevel;
  readonly weightFactor: number;
}

export const EVIDENCE_TIER_INFO: Record<EvidenceTier, EvidenceTierMetadata> = {
  [EvidenceTier.TIER_1_HARDWARE]: {
    tier: EvidenceTier.TIER_1_HARDWARE,
    name: 'Hardware Attested',
    description: 'Cryptographically verified via secure hardware enclave or KeyStore.',
    defaultConfidence: 'high',
    weightFactor: 1.0,
  },
  [EvidenceTier.TIER_2_OS_API]: {
    tier: EvidenceTier.TIER_2_OS_API,
    name: 'OS API Verified',
    description: 'Directly verified through trusted operating system system APIs.',
    defaultConfidence: 'high',
    weightFactor: 0.9,
  },
  [EvidenceTier.TIER_3_HEURISTIC]: {
    tier: EvidenceTier.TIER_3_HEURISTIC,
    name: 'Heuristic / Inspected',
    description: 'Derived through application manifest inspection, static analysis, or network probing.',
    defaultConfidence: 'medium',
    weightFactor: 0.75,
  },
  [EvidenceTier.TIER_4_SELF_REPORTED]: {
    tier: EvidenceTier.TIER_4_SELF_REPORTED,
    name: 'Self-Reported',
    description: 'Reported directly by the user via security assessment questionnaire.',
    defaultConfidence: 'medium',
    weightFactor: 0.6,
  },
};
