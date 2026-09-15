import { describe, it, expect } from 'vitest';
import { generateDemoHistory, seedDemoData } from '../../src/lib/mock/demoDataSeeder';

describe('Demo Mode Data Seeder (§11, Item 21)', () => {
  it('generates realistic 7-day posture trajectory', () => {
    const history = generateDemoHistory();
    expect(history.length).toBe(4);

    const baseline = history[0]!;
    const latest = history[history.length - 1]!;

    expect(baseline.score).toBe(52);
    expect(baseline.grade).toBe('F');
    expect(latest.score).toBe(84);
    expect(latest.grade).toBe('B');
    expect(latest.score).toBeGreaterThan(baseline.score);
  });

  it('seeds complete demo profile with valid findings and signals', () => {
    const demoData = seedDemoData('android');
    expect(demoData.currentScan.scoreBreakdown.overallScore).toBe(84);
    expect(demoData.currentScan.findings.length).toBeGreaterThan(0);
    expect(demoData.currentScan.signals.length).toBeGreaterThan(0);
    expect(demoData.vaultSummary.totalAccounts).toBe(8);
  });
});
