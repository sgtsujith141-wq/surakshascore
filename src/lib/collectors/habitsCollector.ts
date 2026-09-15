import { Signal, Finding, HabitQuestion, HabitResponse } from '../../types';
import { getFindingTemplate, createFindingFromTemplate } from '../findings/registry';

/**
 * Complete Security Habits Question Bank (§8).
 * 5 sections with weighted options and scenario-based phishing micro-quizzes.
 */
export const HABITS_QUESTION_BANK: readonly HabitQuestion[] = [
  // 1. Authentication
  {
    id: 'habits.auth.2fa_coverage',
    section: 'auth',
    title: 'Two-Factor Authentication (2FA) Coverage',
    subtitle: 'Which of your primary online accounts have 2FA enabled?',
    type: 'single_choice',
    options: [
      { id: 'all_major', label: 'All primary accounts (Email, Banking, Social)', points: 100 },
      { id: 'banking_only', label: 'Banking and Email only', points: 75 },
      {
        id: 'none_or_few',
        label: 'None or only one account',
        points: 20,
        penaltySeverity: 'critical',
        findingType: 'TWO_FACTOR_DISABLED_SELF_REPORTED',
      },
    ],
  },
  {
    id: 'habits.auth.2fa_method',
    section: 'auth',
    title: 'Preferred 2FA Method',
    subtitle: 'What method do you use to receive verification codes?',
    type: 'single_choice',
    options: [
      { id: 'authenticator_or_passkey', label: 'Authenticator App (Aegis, Google) or Passkey', points: 100 },
      { id: 'sms_otp', label: 'SMS text message OTP', points: 65 },
      {
        id: 'no_2fa',
        label: 'I do not use 2FA',
        points: 0,
        penaltySeverity: 'critical',
        findingType: 'TWO_FACTOR_DISABLED_SELF_REPORTED',
      },
    ],
  },

  // 2. Password Hygiene
  {
    id: 'habits.password.manager_usage',
    section: 'password',
    title: 'Password Management Tool',
    subtitle: 'How do you store and remember your passwords?',
    type: 'single_choice',
    options: [
      { id: 'dedicated_manager', label: 'Dedicated Password Manager (Bitwarden, 1Password, Keychain)', points: 100 },
      { id: 'browser_only', label: 'Saved in web browser only', points: 70 },
      {
        id: 'memorize_or_note',
        label: 'Memorize or write down on notes/paper',
        points: 20,
        penaltySeverity: 'medium',
        findingType: 'NO_PASSWORD_MANAGER',
      },
    ],
  },
  {
    id: 'habits.password.reuse_frequency',
    section: 'password',
    title: 'Password Reuse Across Accounts',
    subtitle: 'Do you use identical or similar passwords across multiple websites?',
    type: 'single_choice',
    options: [
      { id: 'never_reuse', label: 'Never — Every account has a unique password', points: 100 },
      { id: 'rare_reuse', label: 'Occasionally for unimportant accounts', points: 60 },
      {
        id: 'frequent_reuse',
        label: 'Frequently across email, banking, and social apps',
        points: 10,
        penaltySeverity: 'high',
        findingType: 'POOR_PASSWORD_HABITS',
      },
    ],
  },

  // 3. Recovery & Backup
  {
    id: 'habits.recovery.offline_codes',
    section: 'recovery',
    title: 'Emergency Account Recovery Codes',
    subtitle: 'Do you have one-time backup recovery codes saved offline?',
    type: 'single_choice',
    options: [
      { id: 'saved_securely', label: 'Yes, printed or saved in a secure vault', points: 100 },
      { id: 'not_sure', label: 'I generated them once but unsure where they are', points: 50 },
      {
        id: 'not_saved',
        label: 'No, I have never saved recovery codes',
        points: 15,
        penaltySeverity: 'high',
        findingType: 'NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED',
      },
    ],
  },

  // 4. Phishing & Social Engineering Micro-Quiz (§8)
  {
    id: 'habits.phishing.scenario_electricity_sms',
    section: 'phishing',
    title: 'Scenario: Urgent Electricity Disconnection SMS',
    subtitle: 'You get an SMS: "Your power will be disconnected at 9:30 PM due to unpaid bill. Call 9876543210 immediately." What do you do?',
    type: 'scenario_quiz',
    options: [
      {
        id: 'call_number',
        label: 'Call the mobile number in the SMS to resolve the bill immediately',
        points: 0,
        isCorrectScenarioAnswer: false,
        penaltySeverity: 'high',
        findingType: 'LOW_PHISHING_AWARENESS',
      },
      {
        id: 'verify_official',
        label: 'Ignore the SMS and check billing status directly on official provider app',
        points: 100,
        isCorrectScenarioAnswer: true,
      },
    ],
    explanation: 'Scammers manufacture artificial panic. Genuine utility providers never instruct users to call personal mobile numbers via SMS.',
  },
  {
    id: 'habits.phishing.scenario_bank_otp_call',
    section: 'phishing',
    title: 'Scenario: Bank Fraud Officer Requesting OTP',
    subtitle: 'A caller claiming to be bank security says: "An unauthorized charge of Rs 45,000 was attempted. Tell me the OTP sent to your phone to reverse it."',
    type: 'scenario_quiz',
    options: [
      {
        id: 'share_otp',
        label: 'Read out the OTP to prevent the fraudulent charge',
        points: 0,
        isCorrectScenarioAnswer: false,
        penaltySeverity: 'critical',
        findingType: 'LOW_PHISHING_AWARENESS',
      },
      {
        id: 'hangup_immediately',
        label: 'Hang up immediately — Banks never ask for OTPs to cancel transactions',
        points: 100,
        isCorrectScenarioAnswer: true,
      },
    ],
    explanation: 'OTPs are cryptographic authorizations to transfer funds. Banks never require an OTP to cancel or block a charge.',
  },

  // 5. Sharing & Physical Security
  {
    id: 'habits.sharing.device_access',
    section: 'sharing',
    title: 'Device Sharing & Screen Timeout',
    subtitle: 'How is this device shared and configured for screen timeout?',
    type: 'single_choice',
    options: [
      { id: 'personal_only_short_timeout', label: 'Only used by me, 30s-1min timeout', points: 100 },
      { id: 'occasional_sharing', label: 'Handed to friends/family with supervision', points: 70 },
      {
        id: 'shared_freely',
        label: 'Shared freely with children/family without guest lock',
        points: 30,
        penaltySeverity: 'medium',
        findingType: 'PUBLIC_DEVICE_SHARING',
      },
    ],
  },
];

export interface HabitsCollectorResult {
  signals: Signal[];
  findings: Finding[];
  habitsScore: number;
}

/**
 * Evaluates responses from the Security Habits questionnaire (§8) and generates signals and findings.
 */
export function evaluateHabitsResponses(
  responses: readonly HabitResponse[],
  scanId: string = `scan_${Date.now()}`
): HabitsCollectorResult {
  const now = new Date().toISOString();
  const signals: Signal[] = [];
  const findings: Finding[] = [];

  const responseMap = new Map<string, string[]>();
  for (const r of responses) {
    responseMap.set(r.questionId, r.selectedOptionIds);
  }

  let totalPoints = 0;
  let questionsEvaluated = 0;

  for (const question of HABITS_QUESTION_BANK) {
    const selectedIds = responseMap.get(question.id);
    if (!selectedIds || selectedIds.length === 0) continue;

    questionsEvaluated++;
    const selectedOption = question.options.find((opt) => opt.id === selectedIds[0]);

    if (selectedOption) {
      totalPoints += selectedOption.points;

      // Register signal
      signals.push({
        id: question.id,
        category: 'habits',
        provenance: 'SELF_REPORTED',
        platform: ['android', 'ios', 'web'],
        collectedAt: now,
        value: {
          questionTitle: question.title,
          selectedOption: selectedOption.label,
          points: selectedOption.points,
        },
      });

      // Generate finding if option triggered a penalty
      if (selectedOption.findingType) {
        const template = getFindingTemplate(selectedOption.findingType);
        if (template) {
          findings.push(
            createFindingFromTemplate(
              template,
              {
                signals: { [question.id]: signals[signals.length - 1]! },
                reason: question.type === 'scenario_quiz' ? `Failed scenario: "${question.title}"` : undefined,
                scenarioQuestion: question.subtitle,
                userAnswer: selectedOption.label,
                scanId,
              },
              {
                id: `finding_habits_${question.id.replace(/[.]/g, '_')}_${scanId}`,
                category: 'habits',
                provenance: 'SELF_REPORTED',
                scanId,
              }
            )
          );
        }
      }
    }
  }

  const averageScore = questionsEvaluated > 0 ? Math.round(totalPoints / questionsEvaluated) : 100;

  return {
    signals,
    findings,
    habitsScore: averageScore,
  };
}
