import { describe, it, expect } from 'vitest';
import { collectNetworkSignals } from '../../src/lib/collectors/networkCollector';

describe('Network Collector (§4.2, §5.2)', () => {
  it('detects public Wi-Fi without VPN active and generates NO_VPN_ON_PUBLIC_WIFI', async () => {
    const result = await collectNetworkSignals({
      platform: 'android',
      isPublicWifi: true,
      isVpnActive: false,
    });

    expect(result.signals.some((s) => s.id === 'network.vpnActive')).toBe(true);
    expect(result.signals.some((s) => s.id === 'network.wifiSecurityType')).toBe(true);

    const vpnFinding = result.findings.find((f) => f.type === 'NO_VPN_ON_PUBLIC_WIFI');
    expect(vpnFinding).toBeDefined();
    expect(vpnFinding?.category).toBe('network');
    expect(vpnFinding?.severity).toBe('medium');
  });

  it('does not generate finding when VPN is active on public Wi-Fi', async () => {
    const result = await collectNetworkSignals({
      platform: 'android',
      isPublicWifi: true,
      isVpnActive: true,
    });

    expect(result.findings.some((f) => f.type === 'NO_VPN_ON_PUBLIC_WIFI')).toBe(false);
  });

  it('generates UNTRUSTED_WIFI_SELF_REPORTED when user flags network as untrusted', async () => {
    const result = await collectNetworkSignals({
      platform: 'android',
      isUntrustedWifi: true,
      wifiSSID: 'Hotel Free Internet',
    });

    const untrustedFinding = result.findings.find((f) => f.type === 'UNTRUSTED_WIFI_SELF_REPORTED');
    expect(untrustedFinding).toBeDefined();
    expect(untrustedFinding?.provenance).toBe('SELF_REPORTED');
  });
});
