import { describe, it, expect } from 'vitest';
import { analyzeSuspiciousLink } from '../../src/lib/tools/linkScanner';

describe('Suspicious Link Scanner (§7.8)', () => {
  it('classifies official legitimate domains as SAFE', () => {
    const res = analyzeSuspiciousLink('https://github.com/google/antigravity');
    expect(res.verdict).toBe('SAFE');
    expect(res.riskScore).toBe(0);
    expect(res.redFlags).toHaveLength(0);
  });

  it('detects raw IP address host as MALICIOUS', () => {
    const res = analyzeSuspiciousLink('http://192.168.1.100/secure-login');
    expect(res.verdict).toBe('MALICIOUS');
    expect(res.isIpHost).toBe(true);
    expect(res.redFlags.some((r) => r.includes('IP address'))).toBe(true);
  });

  it('detects brand typosquatting on unverified domain', () => {
    const res = analyzeSuspiciousLink('https://paypa1-security-verification.com/login');
    expect(res.hasTyposquatting).toBe(true);
    expect(res.verdict).toBe('MALICIOUS');
    expect(res.redFlags.some((r) => r.includes('paypal'))).toBe(true);
  });

  it('flags high-risk TLD with deceptive auth keywords as SUSPICIOUS or MALICIOUS', () => {
    const res = analyzeSuspiciousLink('https://quick-account-update.xyz/verify');
    expect(res.hasSuspiciousTld).toBe(true);
    expect(res.hasDeceptivePath).toBe(true);
    expect(['SUSPICIOUS', 'MALICIOUS']).toContain(res.verdict);
  });
});
