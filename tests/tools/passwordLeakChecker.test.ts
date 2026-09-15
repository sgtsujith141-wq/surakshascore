import { describe, it, expect } from 'vitest';
import {
  sha1,
  calculatePasswordEntropy,
  checkPasswordLeak,
} from '../../src/lib/tools/passwordLeakChecker';

describe('Password Leak Checker & Entropy Analyzer (§7.7)', () => {
  it('correctly calculates SHA-1 hash of password', async () => {
    const hash = await sha1('password');
    expect(hash).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('calculates low entropy score for short simple passwords', () => {
    const res = calculatePasswordEntropy('12345');
    expect(res.entropyScore).toBeLessThan(30);
    expect(res.entropyLabel).toBe('Very Weak');
    expect(res.hasUppercase).toBe(false);
  });

  it('calculates high entropy score for long mixed passphrases', () => {
    const res = calculatePasswordEntropy('Correct-Horse-Battery-Staple-2026!');
    expect(res.entropyScore).toBeGreaterThanOrEqual(80);
    expect(res.entropyLabel).toMatch(/Strong/);
    expect(res.hasUppercase).toBe(true);
    expect(res.hasLowercase).toBe(true);
    expect(res.hasNumbers).toBe(true);
    expect(res.hasSymbols).toBe(true);
  });

  it('detects known breached password via k-anonymity verification', async () => {
    const result = await checkPasswordLeak('password');
    expect(result.isLeaked).toBe(true);
    expect(result.leakCount).toBeGreaterThan(1000);
    expect(result.hashPrefix).toBe('5BAA6');
  });

  it('reports zero leaks for high-entropy unique password', async () => {
    const result = await checkPasswordLeak('xK9#vP2$mL8@qZ4!wN7^jR3&');
    expect(result.isLeaked).toBe(false);
    expect(result.leakCount).toBe(0);
  });
});
