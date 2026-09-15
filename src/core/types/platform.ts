/**
 * Platform identifiers supported across runtime environments.
 */
export type PlatformId =
  | 'web'
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'unknown';

export type CapabilityStatus =
  | 'supported'
  | 'unsupported'
  | 'limited'
  | 'permission_required';
