import { describe, it, expect } from 'vitest';
import { checkEmailBreaches, KNOWN_BREACH_DATABASE } from '../../src/lib/tools/breachMonitor';

describe('Breach Monitor (§7.14)', () => {
  it('contains verified corporate breach records in the database', () => {
    expect(KNOWN_BREACH_DATABASE.length).toBeGreaterThanOrEqual(5);
    expect(KNOWN_BREACH_DATABASE.some((b) => b.name === 'Adobe')).toBe(true);
    expect(KNOWN_BREACH_DATABASE.some((b) => b.name === 'Canva')).toBe(true);
  });

  it('detects matched breaches for compromised email test patterns', async () => {
    const res = await checkEmailBreaches('student@campus.edu');
    expect(res.isCompromised).toBe(true);
    expect(res.breachCount).toBeGreaterThanOrEqual(1);
    expect(res.breaches.some((b) => b.name === 'Edmodo')).toBe(true);
    expect(res.exposedDataClasses.length).toBeGreaterThan(0);
  });

  it('reports clean status for unbreached email', async () => {
    const res = await checkEmailBreaches('safe.individual.2026@secure-domain.org');
    expect(res.isCompromised).toBe(false);
    expect(res.breachCount).toBe(0);
    expect(res.breaches).toHaveLength(0);
  });
});
