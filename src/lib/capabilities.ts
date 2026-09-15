import { Category, Platform, PermissionKey } from '../types';

export type AvailabilityStatus = 'supported' | 'limited' | 'unsupported' | 'not_applicable';

export interface PlatformAvailability {
  readonly supported: boolean;
  readonly status: AvailabilityStatus;
  readonly notes?: string;
}

export interface SignalCapabilityEntry {
  readonly id: string;
  readonly category: Category;
  readonly label: string;
  readonly platforms: Record<Platform, PlatformAvailability>;
  readonly mechanism: string;
  readonly requiresPermission?: PermissionKey;
  readonly fallback?: string | null;
  readonly fallbackQuestionId?: string | null;
}

/**
 * Platform Capability Matrix (Section 4.2 of PSS Engineering Spec v1.0).
 * Exhaustive, typed mapping of all signals, their platform support, collection mechanism, and fallbacks.
 */
export const PLATFORM_CAPABILITY_MATRIX: Readonly<Record<string, SignalCapabilityEntry>> = {
  'device.osVersion': {
    id: 'device.osVersion',
    category: 'device',
    label: 'OS Version',
    platforms: {
      android: { supported: true, status: 'supported' },
      ios: { supported: true, status: 'supported' },
      web: { supported: true, status: 'limited', notes: 'Derived from user-agent string' },
    },
    mechanism: '@capacitor/device getInfo()',
    fallback: null,
  },

  'device.securityPatch': {
    id: 'device.securityPatch',
    category: 'device',
    label: 'Security Patch Level',
    platforms: {
      android: { supported: true, status: 'supported' },
      ios: {
        supported: false,
        status: 'unsupported',
        notes: "iOS does not expose monthly security patch levels to third-party apps",
      },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Build.VERSION.SECURITY_PATCH via custom native plugin',
    fallback: 'iOS: use osVersion recency instead, label as PERMISSION_BASED proxy',
    fallbackQuestionId: 'habits.device.os_updates_recent',
  },

  'device.screenLockEnabled': {
    id: 'device.screenLockEnabled',
    category: 'device',
    label: 'Screen Lock / Passcode',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'KeyguardManager.isDeviceSecure()' },
      ios: {
        supported: false,
        status: 'limited',
        notes: 'LAContext.canEvaluatePolicy detects biometric/passcode availability, not literal lock state',
      },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Custom native Keyguard plugin on Android; LAContext proxy on iOS',
    fallback: 'SELF_REPORTED question',
    fallbackQuestionId: 'habits.auth.screen_lock_type',
  },

  'device.diskEncryption': {
    id: 'device.diskEncryption',
    category: 'device',
    label: 'Storage Encryption',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'Assume true if lock enabled on modern Android' },
      ios: { supported: true, status: 'supported', notes: 'Always true on iOS via Apple Data Protection' },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'DevicePolicyManager on Android; iOS Data Protection constant (VERIFIED)',
    fallback: null,
  },

  'device.developerOptionsEnabled': {
    id: 'device.developerOptionsEnabled',
    category: 'device',
    label: 'Developer Options & USB Debugging',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'Settings.Global.ADB_ENABLED' },
      ios: { supported: false, status: 'unsupported', notes: 'Not exposed by iOS' },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Custom native plugin querying Settings.Global',
    fallback: 'SELF_REPORTED question',
    fallbackQuestionId: 'habits.device.developer_options',
  },

  'device.unknownSourcesAllowed': {
    id: 'device.unknownSourcesAllowed',
    category: 'device',
    label: 'App Sideloading / Unknown Sources',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'API 26+: per-app canRequestPackageInstalls' },
      ios: { supported: false, status: 'not_applicable', notes: 'App Store only sandbox, not applicable' },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Custom native plugin checking PackageManager install permissions',
    fallback: null,
  },

  'apps.installedList': {
    id: 'apps.installedList',
    category: 'apps',
    label: 'Installed Application Inventory',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'PackageManager.getInstalledPackages' },
      ios: {
        supported: false,
        status: 'unsupported',
        notes: 'iOS sandbox never exposes third-party app inventory to other apps',
      },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Custom native plugin (Android only)',
    fallback: 'iOS: this whole category becomes UNAVAILABLE with an explanatory empty state, not hidden silently',
  },

  'apps.permissionsPerApp': {
    id: 'apps.permissionsPerApp',
    category: 'apps',
    label: 'Per-App Granted Permissions',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'PackageManager permission inspection' },
      ios: {
        supported: false,
        status: 'unsupported',
        notes: 'iOS does not allow querying other apps permissions',
      },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Custom native plugin (Android only)',
    fallback: 'iOS: this whole category becomes UNAVAILABLE with an explanatory empty state, not hidden silently',
  },

  'network.wifiSecurityType': {
    id: 'network.wifiSecurityType',
    category: 'network',
    label: 'Wi-Fi Security Type & Encryption',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'WifiManager (requires ACCESS_FINE_LOCATION)' },
      ios: {
        supported: false,
        status: 'limited',
        notes: 'NEHotspotHelper / CNCopySupportedInterfaces requires special Apple entitlement',
      },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: 'Custom native plugin + ACCESS_FINE_LOCATION permission on Android',
    requiresPermission: 'ACCESS_FINE_LOCATION',
    fallback: 'SELF_REPORTED "is this a network you trust?"',
    fallbackQuestionId: 'habits.network.public_wifi_habits',
  },

  'network.vpnActive': {
    id: 'network.vpnActive',
    category: 'network',
    label: 'VPN Active Connection',
    platforms: {
      android: { supported: true, status: 'supported', notes: 'ConnectivityManager transport check' },
      ios: { supported: true, status: 'supported', notes: 'NEVPNManager or Network framework transport check' },
      web: { supported: false, status: 'unsupported' },
    },
    mechanism: '@capacitor/network extension or custom native plugin',
    fallback: null,
  },

  'account.twoFactorEnabled': {
    id: 'account.twoFactorEnabled',
    category: 'account',
    label: 'Account 2FA Protection Status',
    platforms: {
      android: { supported: false, status: 'not_applicable', notes: "OS cannot inspect remote service 2FA" },
      ios: { supported: false, status: 'not_applicable', notes: "OS cannot inspect remote service 2FA" },
      web: { supported: false, status: 'not_applicable' },
    },
    mechanism: 'None (OS cannot inspect)',
    fallback: 'Always SELF_REPORTED via Habits questionnaire',
    fallbackQuestionId: 'habits.auth.2fa_primary_accounts',
  },

  'account.breachedEmail': {
    id: 'account.breachedEmail',
    category: 'account',
    label: 'Email Breach Status (HIBP)',
    platforms: {
      android: { supported: true, status: 'supported' },
      ios: { supported: true, status: 'supported' },
      web: { supported: true, status: 'supported' },
    },
    mechanism: 'HIBP API call via Supabase Edge Function (VERIFIED external source, user-entered email)',
    fallback: null,
  },

  'account.passwordReused': {
    id: 'account.passwordReused',
    category: 'account',
    label: 'Vault Password Reuse Analysis',
    platforms: {
      android: { supported: true, status: 'supported' },
      ios: { supported: true, status: 'supported' },
      web: { supported: true, status: 'supported' },
    },
    mechanism: 'Vault-local client-side computation',
    fallback: null,
  },
};

/**
 * Checks if a specific signal can be collected natively or verified on the given platform.
 */
export function isSignalSupported(signalId: string, platform: Platform): boolean {
  const entry = PLATFORM_CAPABILITY_MATRIX[signalId];
  if (!entry) return false;
  const plat = entry.platforms[platform];
  return plat ? plat.supported : false;
}

/**
 * Retrieves the full capability descriptor for a signal.
 */
export function getSignalCapability(signalId: string): SignalCapabilityEntry | undefined {
  return PLATFORM_CAPABILITY_MATRIX[signalId];
}

/**
 * Determines if a security category has collectible signals on a given platform.
 * If a category has 0 collectible signals (e.g. `apps` on iOS), it cannot be scored natively.
 */
export function isCategoryScoreable(category: Category, platform: Platform): boolean {
  // Account and habits always have self-reported or external signals on all platforms
  if (category === 'account' || category === 'habits') {
    return true;
  }

  // Check if at least one signal in this category is supported on the target platform
  for (const entry of Object.values(PLATFORM_CAPABILITY_MATRIX)) {
    if (entry.category === category) {
      const plat = entry.platforms[platform];
      if (plat && plat.supported) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns a list of categories that are completely unscoreable on the target platform.
 * (e.g. ['apps'] on iOS).
 */
export function getUnscoreableCategories(platform: Platform): Category[] {
  const unscoreable: Category[] = [];
  const categories: Category[] = ['device', 'apps', 'network', 'account', 'habits'];

  for (const cat of categories) {
    if (!isCategoryScoreable(cat, platform)) {
      unscoreable.push(cat);
    }
  }

  return unscoreable;
}
