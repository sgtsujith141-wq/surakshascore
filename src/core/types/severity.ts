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
 * Numeric severity order where lower number indicates higher severity.
 */
const SEVERITY_RANK_MAP: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function severityRank(severity: Severity): number {
  return SEVERITY_RANK_MAP[severity];
}

/**
 * Compares two severities. Returns negative if a is more severe than b.
 */
export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_RANK_MAP[a] - SEVERITY_RANK_MAP[b];
}
