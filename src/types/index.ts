// ============================================================================
// PSS Core Domain Types (Section 4.1 & 5.1 of PSS Engineering Spec v1.0)
// ============================================================================

/**
 * Provenance tag representing verification trustworthiness.
 * Every displayed data point, finding, and score component carries this tag.
 */
export type Provenance =
  | 'VERIFIED'
  | 'PERMISSION_BASED'
  | 'SELF_REPORTED'
  | 'UNAVAILABLE';

export const ALL_PROVENANCES: readonly Provenance[] = [
  'VERIFIED',
  'PERMISSION_BASED',
  'SELF_REPORTED',
  'UNAVAILABLE',
] as const;

/**
 * Host platforms supported by PSS.
 */
export type Platform = 'android' | 'ios' | 'web';

export const ALL_PLATFORMS: readonly Platform[] = ['android', 'ios', 'web'] as const;

/**
 * Security categories evaluated by PSS (§4.1, §6.1).
 */
export type Category = 'device' | 'apps' | 'network' | 'account' | 'habits';

export const ALL_CATEGORIES: readonly Category[] = [
  'device',
  'apps',
  'network',
  'account',
  'habits',
] as const;

/**
 * Finding severity classification.
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const ALL_SEVERITIES: readonly Severity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;

/**
 * Remediation effort required for a finding.
 */
export type Effort = 'quick' | 'moderate' | 'involved';

/**
 * Lifecycle status of a finding.
 */
export type FindingStatus = 'open' | 'fixed' | 'ignored';

/**
 * Platform permission identifiers.
 */
export type PermissionKey =
  | 'ACCESS_FINE_LOCATION'
  | 'ACCESS_COARSE_LOCATION'
  | 'PACKAGE_USAGE_STATS'
  | 'READ_SMS'
  | 'RECEIVE_SMS'
  | 'READ_CONTACTS'
  | 'CAMERA'
  | 'RECORD_AUDIO'
  | 'READ_EXTERNAL_STORAGE'
  | 'WRITE_EXTERNAL_STORAGE'
  | 'POST_NOTIFICATIONS'
  | string;

/**
 * Telemetry signal collected from device, platform, or habits questionnaire (§4.1).
 */
export interface Signal {
  id: string;
  category: Category;
  provenance: Provenance;
  platform: Platform[];
  collectedAt: string | null;
  value: unknown;
  requiresPermission?: PermissionKey;
}

/**
 * Individual evidence point supporting a security finding.
 */
export interface EvidenceItem {
  id: string;
  label: string;
  value: string;
  icon?: string;
  provenance: Provenance;
  details?: string;
}

/**
 * Actions recommended in finding remediation guidance.
 */
export type ActionType = 'open_settings' | 'open_url' | 'mark_fixed' | 'in_app_action';

export interface RecommendedAction {
  id: string;
  type: ActionType;
  label: string;
  description?: string;
  target?: string;
  primary?: boolean;
}

/**
 * Authored finding type identifier.
 */
export type FindingType =
  // Device category
  | 'STALE_SECURITY_PATCH'
  | 'SCREEN_LOCK_DISABLED'
  | 'WEAK_LOCK_TYPE'
  | 'DEVELOPER_OPTIONS_ENABLED'
  | 'UNKNOWN_SOURCES_ENABLED'
  | 'DISK_ENCRYPTION_DISABLED'
  // Apps category
  | 'APP_UNEXPECTED_PERMISSION'
  | 'APP_SUSPICIOUS_PERMISSION_COMBO'
  | 'APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN'
  | 'APP_SIDELOADED_FLAGGED'
  | 'APP_UNUSED_WITH_SENSITIVE_PERMISSIONS'
  // Network category
  | 'UNTRUSTED_WIFI_SELF_REPORTED'
  | 'NO_VPN_ON_PUBLIC_WIFI'
  // Account category
  | 'EMAIL_IN_KNOWN_BREACH'
  | 'PASSWORD_FOUND_IN_LEAK'
  | 'PASSWORD_REUSED_ACROSS_VAULT_ENTRIES'
  | 'WEAK_PASSWORD_IN_VAULT'
  | 'TWO_FACTOR_DISABLED_SELF_REPORTED'
  | 'NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED'
  // Habits category
  | 'POOR_PASSWORD_HABITS'
  | 'NO_PASSWORD_MANAGER'
  | 'LOW_PHISHING_AWARENESS'
  | 'PUBLIC_DEVICE_SHARING';

export const ALL_FINDING_TYPES: readonly FindingType[] = [
  // Device
  'STALE_SECURITY_PATCH',
  'SCREEN_LOCK_DISABLED',
  'WEAK_LOCK_TYPE',
  'DEVELOPER_OPTIONS_ENABLED',
  'UNKNOWN_SOURCES_ENABLED',
  'DISK_ENCRYPTION_DISABLED',
  // Apps
  'APP_UNEXPECTED_PERMISSION',
  'APP_SUSPICIOUS_PERMISSION_COMBO',
  'APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN',
  'APP_SIDELOADED_FLAGGED',
  'APP_UNUSED_WITH_SENSITIVE_PERMISSIONS',
  // Network
  'UNTRUSTED_WIFI_SELF_REPORTED',
  'NO_VPN_ON_PUBLIC_WIFI',
  // Account
  'EMAIL_IN_KNOWN_BREACH',
  'PASSWORD_FOUND_IN_LEAK',
  'PASSWORD_REUSED_ACROSS_VAULT_ENTRIES',
  'WEAK_PASSWORD_IN_VAULT',
  'TWO_FACTOR_DISABLED_SELF_REPORTED',
  'NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED',
  // Habits
  'POOR_PASSWORD_HABITS',
  'NO_PASSWORD_MANAGER',
  'LOW_PHISHING_AWARENESS',
  'PUBLIC_DEVICE_SHARING',
] as const;

/**
 * Context provided to a finding template to generate dynamic copy and evidence.
 */
export interface FindingContext {
  signals: Record<string, Signal>;
  findingData?: Record<string, unknown>;
  daysSincePatch?: number;
  lockType?: string;
  appName?: string;
  packageName?: string;
  permissionName?: string;
  permissionList?: string[];
  comboName?: string;
  comboDescription?: string;
  wifiSSID?: string;
  securityType?: string;
  breachCount?: number;
  breachNames?: string[];
  reusedCount?: number;
  weakPasswordSites?: string[];
  missing2FAServices?: string[];
  scenarioQuestion?: string;
  userAnswer?: string;
  correctAnswer?: string;
  reason?: string;
  scanId?: string;
}

/**
 * Concrete security finding produced by evaluating signals against finding templates.
 */
export interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  category: Category;
  provenance: Provenance;
  effort: Effort;
  status: FindingStatus;
  evidence: EvidenceItem[];
  scanId: string;
  firstSeenScanId: string;
  title?: string;
  whyDetected?: string;
  whyItMatters?: string;
  recommendedActions?: RecommendedAction[];
}

/**
 * Template structure defining each FindingType (§5.1).
 */
export interface FindingTemplate {
  type: FindingType;
  title: (ctx: FindingContext) => string;
  whyDetected: (ctx: FindingContext) => string;
  whyItMatters: string;
  evidence: (ctx: FindingContext) => EvidenceItem[];
  recommendedActions: RecommendedAction[];
  severityRule: (ctx: FindingContext) => Severity;
  effort: Effort;
}

/**
 * Score breakdown for a single category (§6.1).
 */
export interface CategoryScoreBreakdown {
  category: Category;
  score: number;
  weight: number;
  originalWeight: number;
  pointContribution: number;
  isScoreable: boolean;
  reasonIfUnscoreable?: string;
  openFindingsCount: number;
  findings: Finding[];
  provenanceCounts: Record<Provenance, number>;
}

/**
 * Qualitative score rating buckets (§7.1).
 */
export type QualitativeGrade =
  | 'Excellent'
  | 'Good'
  | 'Needs Attention'
  | 'At Risk';

/**
 * Comprehensive explainable score breakdown (§6.1, §6.2).
 */
export interface ScoreBreakdown {
  overallScore: number;
  grade: QualitativeGrade;
  categoryScores: Record<Category, CategoryScoreBreakdown>;
  totalOpenFindings: number;
  unscoreableCategories: Category[];
  weightRedistributed: boolean;
  explanation: string;
}

// ============================================================================
// Phase 1 Application & Permission Models (§5.2, §7.5)
// ============================================================================

export type AppCategory =
  | 'utility'
  | 'navigation'
  | 'messaging'
  | 'social'
  | 'finance'
  | 'game'
  | 'browser'
  | 'productivity'
  | 'media'
  | 'unknown';

export interface InstalledApp {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  targetSdkVersion: number;
  isSystemApp: boolean;
  installSource: string | null; // e.g. 'com.android.vending' (Play Store) or null (sideloaded)
  requestedPermissions: string[];
  grantedPermissions: string[];
  lastTimeUsed?: number; // timestamp in ms, for usage stats
  category?: AppCategory;
}

export interface PermissionAnalysisResult {
  permission: string;
  granted: boolean;
  expected: boolean;
  reason: string;
  isSensitive: boolean;
}

export interface SuspiciousComboRule {
  id: string;
  name: string;
  description: string;
  requiredPermissions: string[];
  severity: Severity;
  penalty: number;
}

export interface SuspiciousComboMatch {
  ruleId: string;
  name: string;
  description: string;
  matchedPermissions: string[];
  severity: Severity;
  penalty: number;
}

export interface AppRiskAnalysis {
  app: InstalledApp;
  riskScore: number; // 0-100 (100 = safe)
  unexpectedPermissions: PermissionAnalysisResult[];
  suspiciousCombos: SuspiciousComboMatch[];
  isSideloaded: boolean;
  isUnusedWithSensitivePerms: boolean;
  findings: Finding[];
}

// ============================================================================
// Phase 1 Habits Questionnaire Models (§8)
// ============================================================================

export type HabitSection =
  | 'auth'
  | 'password'
  | 'recovery'
  | 'phishing'
  | 'sharing';

export interface HabitOption {
  id: string;
  label: string;
  points: number; // 0-100
  penaltySeverity?: Severity;
  findingType?: FindingType;
  isCorrectScenarioAnswer?: boolean;
}

export interface HabitQuestion {
  id: string;
  section: HabitSection;
  title: string;
  subtitle?: string;
  type: 'single_choice' | 'multi_choice' | 'scenario_quiz';
  options: HabitOption[];
  explanation?: string;
}

export interface HabitResponse {
  questionId: string;
  selectedOptionIds: string[];
  answeredAt: string;
}

// ============================================================================
// Phase 1 Scan Pipeline Models (§7.2)
// ============================================================================

export type ScanStage = 'device' | 'apps' | 'network' | 'account' | 'habits';

export type StageStatus = 'pending' | 'running' | 'done' | 'skipped' | 'blocked';

export interface StageProgress {
  stage: ScanStage;
  label: string;
  status: StageStatus;
  findingsCount: number;
  reasonIfSkipped?: string;
}

export interface VaultCredential {
  id: string;
  service: string;
  username: string;
  password: string;
  notes?: string;
  has2FA: boolean;
  createdAt: string;
}

