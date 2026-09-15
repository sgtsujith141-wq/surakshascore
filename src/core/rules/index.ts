import { SecurityCategory } from '../types/categories';
import { SecurityRule } from './rule.interface';
import { ACCOUNT_RULES } from './accountRules';
import { DEVICE_RULES } from './deviceRules';
import { PHISHING_RULES } from './phishingRules';
import { PRIVACY_RULES } from './privacyRules';
import { BACKUP_RULES } from './backupRules';
import { UPDATE_RULES } from './updateRules';

export * from './rule.interface';
export * from './accountRules';
export * from './deviceRules';
export * from './phishingRules';
export * from './privacyRules';
export * from './backupRules';
export * from './updateRules';

/**
 * Standard registry containing all built-in security rules.
 */
export const ALL_BUILTIN_RULES: readonly SecurityRule[] = [
  ...ACCOUNT_RULES,
  ...DEVICE_RULES,
  ...PHISHING_RULES,
  ...PRIVACY_RULES,
  ...BACKUP_RULES,
  ...UPDATE_RULES,
];

/**
 * Filter built-in rules for a specific security category.
 */
export function getRulesByCategory(category: SecurityCategory): SecurityRule[] {
  return ALL_BUILTIN_RULES.filter((rule) => rule.category === category);
}

/**
 * Find a specific built-in rule by its unique rule identifier.
 */
export function getRuleById(ruleId: string): SecurityRule | undefined {
  return ALL_BUILTIN_RULES.find((rule) => rule.id === ruleId);
}
