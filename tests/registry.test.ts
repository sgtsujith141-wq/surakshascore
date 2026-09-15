import { describe, it, expect } from 'vitest';
import {
  FINDING_REGISTRY,
  getFindingTemplate,
  createFindingFromTemplate,
  STALE_SECURITY_PATCH_TEMPLATE,
  APP_UNEXPECTED_PERMISSION_TEMPLATE,
} from '../src/lib/findings/registry';
import { ALL_FINDING_TYPES, FindingContext } from '../src/types';

describe('Finding Template Registry (§5.1, §5.2)', () => {
  it('has fully authored templates for all 23 finding types', () => {
    for (const type of ALL_FINDING_TYPES) {
      expect(FINDING_REGISTRY[type]).toBeDefined();
      const template = getFindingTemplate(type);
      expect(template, `Missing template for finding type: ${type}`).toBeDefined();
      expect(template?.type).toBe(type);
      expect(typeof template?.title).toBe('function');
      expect(typeof template?.whyDetected).toBe('function');
      expect(typeof template?.whyItMatters).toBe('string');
      expect(typeof template?.evidence).toBe('function');
      expect(typeof template?.severityRule).toBe('function');
      expect(template?.recommendedActions.length).toBeGreaterThan(0);
      expect(['quick', 'moderate', 'involved']).toContain(template?.effort);
    }
  });

  describe('STALE_SECURITY_PATCH', () => {
    it('scales severity with days-since-patch according to N5 curve', () => {
      const makeCtx = (days: number): FindingContext => ({
        signals: {
          'device.securityPatch': {
            id: 'device.securityPatch',
            category: 'device',
            provenance: 'VERIFIED',
            platform: ['android'],
            collectedAt: new Date().toISOString(),
            value: `${days} days ago`,
          },
        },
        daysSincePatch: days,
      });

      expect(STALE_SECURITY_PATCH_TEMPLATE.severityRule(makeCtx(15))).toBe('info');
      expect(STALE_SECURITY_PATCH_TEMPLATE.severityRule(makeCtx(45))).toBe('low');
      expect(STALE_SECURITY_PATCH_TEMPLATE.severityRule(makeCtx(120))).toBe('medium');
      expect(STALE_SECURITY_PATCH_TEMPLATE.severityRule(makeCtx(200))).toBe('high');
      expect(STALE_SECURITY_PATCH_TEMPLATE.severityRule(makeCtx(400))).toBe('critical');
    });

    it('generates structured evidence items with provenance', () => {
      const ctx: FindingContext = {
        signals: {
          'device.securityPatch': {
            id: 'device.securityPatch',
            category: 'device',
            provenance: 'VERIFIED',
            platform: ['android'],
            collectedAt: new Date().toISOString(),
            value: '120 days ago',
          },
        },
        daysSincePatch: 120,
      };

      const evidence = STALE_SECURITY_PATCH_TEMPLATE.evidence(ctx);
      expect(evidence.length).toBeGreaterThanOrEqual(2);
      expect(evidence[0]?.provenance).toBe('VERIFIED');
      expect(evidence[0]?.value).toContain('120 days');
    });
  });

  describe('APP_UNEXPECTED_PERMISSION', () => {
    it('classifies sensitive permissions as high severity', () => {
      const smsCtx: FindingContext = {
        signals: {},
        appName: 'Torch Light',
        permissionName: 'android.permission.READ_SMS',
      };
      expect(APP_UNEXPECTED_PERMISSION_TEMPLATE.severityRule(smsCtx)).toBe('high');

      const normalCtx: FindingContext = {
        signals: {},
        appName: 'Torch Light',
        permissionName: 'android.permission.VIBRATE',
      };
      expect(APP_UNEXPECTED_PERMISSION_TEMPLATE.severityRule(normalCtx)).toBe('medium');
    });

    it('creates fully instantiated Finding instance using factory helper', () => {
      const ctx: FindingContext = {
        signals: {},
        appName: 'Calculator Pro',
        packageName: 'com.example.calc',
        permissionName: 'ACCESS_FINE_LOCATION',
        reason: 'Calculator apps do not need background geolocation',
      };

      const finding = createFindingFromTemplate(APP_UNEXPECTED_PERMISSION_TEMPLATE, ctx, {
        id: 'finding_calc_loc',
        category: 'apps',
        provenance: 'PERMISSION_BASED',
        scanId: 'scan_100',
      });

      expect(finding.id).toBe('finding_calc_loc');
      expect(finding.type).toBe('APP_UNEXPECTED_PERMISSION');
      expect(finding.severity).toBe('high');
      expect(finding.category).toBe('apps');
      expect(finding.provenance).toBe('PERMISSION_BASED');
      expect(finding.title).toContain('Calculator Pro');
      expect(finding.whyDetected).toContain('ACCESS_FINE_LOCATION');
      expect(finding.recommendedActions?.length).toBeGreaterThan(0);
    });
  });
});
