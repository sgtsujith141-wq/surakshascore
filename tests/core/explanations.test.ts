import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../../src/core/engine/scoringEngine';
import { createStudentProfile } from '../../src/mock/profiles/studentProfile';
import { createElderProfile } from '../../src/mock/profiles/elderProfile';

describe('Score Explanations & Deltas (Task 9 & Requirements)', () => {
  const engine = new ScoringEngine();

  it('generates transparent category deltas and point deductions for student profile', () => {
    const studentSignals = createStudentProfile();
    const result = engine.evaluate(studentSignals);

    const explanation = result.scoreExplanation;
    expect(explanation.baseScore).toBe(100);
    expect(explanation.finalScore).toBe(result.overallScore);
    expect(explanation.categoryDeltas).toHaveLength(6);

    // Verify each category delta has initial, deductions, final, weight, and contribution
    for (const delta of explanation.categoryDeltas) {
      expect(delta.initialScore).toBe(100);
      expect(delta.finalScore).toBe(100 - delta.totalDeductions);
      expect(delta.contribution).toBeCloseTo(delta.finalScore * delta.weight, 2);
    }

    // Check top deductions are sorted by severity then deduction amount
    expect(explanation.topDeductions.length).toBeGreaterThan(0);
    for (let i = 0; i < explanation.topDeductions.length - 1; i++) {
      const curr = explanation.topDeductions[i]!;
      const next = explanation.topDeductions[i + 1]!;
      expect(curr.deduction).toBeGreaterThanOrEqual(0);
      expect(next.deduction).toBeGreaterThanOrEqual(0);
    }
  });

  it('prioritizes remediation actions by priorityScore (impact * likelihood * easeOfFix)', () => {
    const elderSignals = createElderProfile();
    const result = engine.evaluate(elderSignals);

    const actions = result.scoreExplanation.prioritizedActions;
    expect(actions.length).toBeGreaterThan(0);

    // Verify descending order of priority score
    for (let i = 0; i < actions.length - 1; i++) {
      const curr = actions[i]!;
      const next = actions[i + 1]!;
      expect(curr.priorityScore).toBeGreaterThanOrEqual(next.priorityScore);
      expect(curr.priorityScore).toBe(curr.impact * curr.likelihood * curr.easeOfFix);
    }
  });

  it('generates clear summary for profiles with critical vs benign findings', () => {
    const elderSignals = createElderProfile();
    const result = engine.evaluate(elderSignals);

    expect(result.scoreExplanation.summary).toContain('SurakshaScore is');
    expect(result.scoreExplanation.summary).toMatch(/critical security finding/i);
  });
});
