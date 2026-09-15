import { describe, it, expect } from 'vitest';
import {
  HABITS_QUESTION_BANK,
  evaluateHabitsResponses,
} from '../../src/lib/collectors/habitsCollector';
import { HabitResponse } from '../../src/types';

describe('Habits Collector & Questionnaire (§8)', () => {
  it('contains questions across all 5 required sections', () => {
    const sections = new Set(HABITS_QUESTION_BANK.map((q) => q.section));
    expect(sections).toContain('auth');
    expect(sections).toContain('password');
    expect(sections).toContain('recovery');
    expect(sections).toContain('phishing');
    expect(sections).toContain('sharing');
  });

  it('evaluates all-good responses to a 100 habits score with zero findings', () => {
    const goodResponses: HabitResponse[] = [
      { questionId: 'habits.auth.2fa_coverage', selectedOptionIds: ['all_major'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.auth.2fa_method', selectedOptionIds: ['authenticator_or_passkey'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.password.manager_usage', selectedOptionIds: ['dedicated_manager'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.password.reuse_frequency', selectedOptionIds: ['never_reuse'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.recovery.offline_codes', selectedOptionIds: ['saved_securely'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.phishing.scenario_electricity_sms', selectedOptionIds: ['verify_official'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.phishing.scenario_bank_otp_call', selectedOptionIds: ['hangup_immediately'], answeredAt: new Date().toISOString() },
      { questionId: 'habits.sharing.device_access', selectedOptionIds: ['personal_only_short_timeout'], answeredAt: new Date().toISOString() },
    ];

    const result = evaluateHabitsResponses(goodResponses);

    expect(result.habitsScore).toBe(100);
    expect(result.findings).toHaveLength(0);
    expect(result.signals.length).toBe(goodResponses.length);
    expect(result.signals.every((s) => s.provenance === 'SELF_REPORTED')).toBe(true);
  });

  it('detects phishing scenario failure and generates LOW_PHISHING_AWARENESS finding', () => {
    const failedPhishingResponses: HabitResponse[] = [
      {
        questionId: 'habits.phishing.scenario_bank_otp_call',
        selectedOptionIds: ['share_otp'], // Failed scenario: shares OTP over call
        answeredAt: new Date().toISOString(),
      },
    ];

    const result = evaluateHabitsResponses(failedPhishingResponses);

    const phishingFinding = result.findings.find((f) => f.type === 'LOW_PHISHING_AWARENESS');
    expect(phishingFinding).toBeDefined();
    expect(phishingFinding?.severity).toBe('critical');
    expect(phishingFinding?.provenance).toBe('SELF_REPORTED');
  });

  it('detects poor password reuse and no password manager', () => {
    const weakResponses: HabitResponse[] = [
      {
        questionId: 'habits.password.reuse_frequency',
        selectedOptionIds: ['frequent_reuse'],
        answeredAt: new Date().toISOString(),
      },
      {
        questionId: 'habits.password.manager_usage',
        selectedOptionIds: ['memorize_or_note'],
        answeredAt: new Date().toISOString(),
      },
    ];

    const result = evaluateHabitsResponses(weakResponses);

    expect(result.findings.some((f) => f.type === 'POOR_PASSWORD_HABITS')).toBe(true);
    expect(result.findings.some((f) => f.type === 'NO_PASSWORD_MANAGER')).toBe(true);
  });
});
