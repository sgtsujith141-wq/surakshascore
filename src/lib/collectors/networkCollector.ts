import { Signal, Finding, Platform } from '../../types';
import { getFindingTemplate, createFindingFromTemplate } from '../findings/registry';

export interface NetworkCollectorOptions {
  platform?: Platform;
  scanId?: string;
  isVpnActive?: boolean;
  wifiSSID?: string;
  isPublicWifi?: boolean;
  isUntrustedWifi?: boolean;
}

export interface NetworkCollectorResult {
  signals: Signal[];
  findings: Finding[];
}

/**
 * Collects Network Category signals and evaluates Wi-Fi / VPN posture (§4.2, §5.2).
 */
export async function collectNetworkSignals(
  options?: NetworkCollectorOptions
): Promise<NetworkCollectorResult> {
  const scanId = options?.scanId ?? `scan_${Date.now()}`;
  const now = new Date().toISOString();
  const signals: Signal[] = [];
  const findings: Finding[] = [];

  const isVpnActive = options?.isVpnActive ?? false;
  const isPublicWifi = options?.isPublicWifi ?? false;
  const isUntrustedWifi = options?.isUntrustedWifi ?? false;
  const wifiSSID = options?.wifiSSID ?? (isPublicWifi ? 'Public Guest Wi-Fi' : undefined);

  // 1. Signal: network.vpnActive
  signals.push({
    id: 'network.vpnActive',
    category: 'network',
    provenance: 'VERIFIED',
    platform: ['android', 'ios'],
    collectedAt: now,
    value: isVpnActive,
  });

  // 2. Signal: network.wifiSecurityType
  signals.push({
    id: 'network.wifiSecurityType',
    category: 'network',
    provenance: isPublicWifi || isUntrustedWifi ? 'SELF_REPORTED' : 'VERIFIED',
    platform: ['android', 'ios'],
    collectedAt: now,
    value: { isPublicWifi, isUntrustedWifi, wifiSSID },
  });

  // Findings Evaluation
  if (isUntrustedWifi) {
    const template = getFindingTemplate('UNTRUSTED_WIFI_SELF_REPORTED');
    if (template) {
      findings.push(
        createFindingFromTemplate(
          template,
          { signals: { 'network.wifiSecurityType': signals[1]! }, wifiSSID, scanId },
          { id: `finding_untrusted_wifi_${scanId}`, category: 'network', provenance: 'SELF_REPORTED', scanId }
        )
      );
    }
  }

  if (isPublicWifi && !isVpnActive) {
    const template = getFindingTemplate('NO_VPN_ON_PUBLIC_WIFI');
    if (template) {
      findings.push(
        createFindingFromTemplate(
          template,
          { signals: { 'network.vpnActive': signals[0]! }, wifiSSID, scanId },
          { id: `finding_no_vpn_public_${scanId}`, category: 'network', provenance: 'VERIFIED', scanId }
        )
      );
    }
  }

  return {
    signals,
    findings,
  };
}
