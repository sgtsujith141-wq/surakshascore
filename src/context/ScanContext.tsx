import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Platform,
  Finding,
  HabitResponse,
  ScanStage,
  StageProgress,
  VaultCredential,
} from '../types';
import { runScanPipeline, ScanPipelineResult } from '../lib/pipeline/scanPipeline';
import { MockSignalProvider, MockProfilePreset } from '../mock/mockSignalProvider';
import { computeScore } from '../lib/scoring';

interface ScanContextType {
  platform: Platform;
  setPlatform: (p: Platform) => void;
  activePreset: MockProfilePreset;
  setActivePreset: (preset: MockProfilePreset) => void;
  scanResult: ScanPipelineResult | null;
  isScanning: boolean;
  activeStage: ScanStage | null;
  stageProgress: StageProgress[];
  habitsResponses: HabitResponse[];
  saveHabitResponse: (response: HabitResponse) => void;
  runScan: (customPlatform?: Platform) => Promise<ScanPipelineResult>;
  markFindingFixed: (findingId: string) => void;
  openSettingsHandler: (target?: string) => void;
  vaultCredentials: VaultCredential[];
  addVaultCredential: (cred: Omit<VaultCredential, 'id' | 'createdAt'>) => void;
  removeVaultCredential: (id: string) => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

export const ScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platform, setPlatform] = useState<Platform>('android');
  const [activePreset, setActivePreset] = useState<MockProfilePreset>('student');
  const [scanResult, setScanResult] = useState<ScanPipelineResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeStage, setActiveStage] = useState<ScanStage | null>(null);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  
  // Local vault seed state.
  // NOTE: these are fictional demo entries for the vault walkthrough — the
  // services, usernames and passwords below are invented and correspond to no
  // real account. Do not treat them as credentials.
  const [vaultCredentials, setVaultCredentials] = useState<VaultCredential[]>([
    {
      id: 'vault-1',
      service: 'github.com',
      username: 'developer@campus.edu',
      password: 'v9$Kp!8mQ#2xL@1wZ',
      notes: 'Primary developer repository account',
      has2FA: true,
      createdAt: '2026-08-15T10:00:00.000Z',
    },
    {
      id: 'vault-2',
      service: 'gmail.com',
      username: 'student.primary@campus.edu',
      password: 'H7#wR$5yT@9nB!3kM',
      notes: 'Academic & banking recovery email',
      has2FA: true,
      createdAt: '2026-08-18T14:30:00.000Z',
    },
    {
      id: 'vault-3',
      service: 'sbi.co.in',
      username: 'student_netbank',
      password: 'k2*Pn#9aL@4vB!7xQ',
      notes: 'NetBanking primary credential',
      has2FA: true,
      createdAt: '2026-08-19T09:15:00.000Z',
    },
  ]);

  const [habitsResponses, setHabitsResponses] = useState<HabitResponse[]>([
    { questionId: 'habits.auth.2fa_coverage', selectedOptionIds: ['banking_only'], answeredAt: new Date().toISOString() },
    { questionId: 'habits.password.manager_usage', selectedOptionIds: ['browser_only'], answeredAt: new Date().toISOString() },
    { questionId: 'habits.password.reuse_frequency', selectedOptionIds: ['rare_reuse'], answeredAt: new Date().toISOString() },
    { questionId: 'habits.recovery.offline_codes', selectedOptionIds: ['saved_securely'], answeredAt: new Date().toISOString() },
    { questionId: 'habits.phishing.scenario_electricity_sms', selectedOptionIds: ['verify_official'], answeredAt: new Date().toISOString() },
    { questionId: 'habits.phishing.scenario_bank_otp_call', selectedOptionIds: ['hangup_immediately'], answeredAt: new Date().toISOString() },
    { questionId: 'habits.sharing.device_access', selectedOptionIds: ['personal_only_short_timeout'], answeredAt: new Date().toISOString() },
  ]);

  const addVaultCredential = (cred: Omit<VaultCredential, 'id' | 'createdAt'>) => {
    const newCred: VaultCredential = {
      ...cred,
      id: `vault-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVaultCredentials((prev) => [newCred, ...prev]);
  };

  const removeVaultCredential = (id: string) => {
    setVaultCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  const runScan = useCallback(async (targetPlatform?: Platform): Promise<ScanPipelineResult> => {
    const p = targetPlatform ?? platform;
    setIsScanning(true);

    // Initial stages
    const initialStages: StageProgress[] = [
      { stage: 'device', label: 'Device & OS Integrity', status: 'pending', findingsCount: 0 },
      { stage: 'apps', label: 'Applications & Permissions', status: 'pending', findingsCount: 0 },
      { stage: 'network', label: 'Network & VPN Security', status: 'pending', findingsCount: 0 },
      { stage: 'account', label: 'Account & Breach Checks', status: 'pending', findingsCount: 0 },
      { stage: 'habits', label: 'Security Habits', status: 'pending', findingsCount: 0 },
    ];
    setStageProgress(initialStages);

    // Mock presets or live inputs
    const mockProvider = new MockSignalProvider();
    const mockSignals = mockProvider.getProfile(activePreset);

    // Map vault credentials to hash comparison entries
    const mappedVaultEntries = vaultCredentials.map((c) => ({
      id: c.id,
      site: c.service,
      username: c.username,
      passwordHash: c.password,
    }));

    // Run pipeline with realistic timing delay for visual excellence
    const result = await runScanPipeline({
      platform: p,
      habitsResponses,
      deviceOptions: {
        platform: p,
        nativeBridge: {
          getSecurityPatchDate: async () =>
            activePreset === 'perfect'
              ? new Date().toISOString()
              : activePreset === 'critical_risk'
              ? '2025-01-01'
              : '2026-05-15',
          isScreenLockEnabled: async () => activePreset !== 'critical_risk',
          getScreenLockType: async () => (activePreset === 'elder' ? 'pattern' : 'pin'),
          isDeveloperOptionsEnabled: async () => (mockSignals['device.developerOptionsEnabled']?.value as boolean) ?? false,
          isUnknownSourcesAllowed: async () => (mockSignals['device.unknownSourcesAllowed']?.value as boolean) ?? false,
          isStorageEncrypted: async () => (mockSignals['device.diskEncryption']?.value as boolean) ?? true,
        },
      },
      accountOptions: {
        breachedEmails:
          activePreset === 'critical_risk'
            ? [{ email: 'demo@domain.com', breachCount: 4, breachNames: ['Adobe (2013)', 'Canva (2019)', 'LinkedIn', 'Dropbox'] }]
            : activePreset === 'student'
            ? [{ email: 'student@campus.edu', breachCount: 1, breachNames: ['Edmodo (2017)'] }]
            : [],
        vaultEntries: mappedVaultEntries,
        twoFactorStatus: {
          emailHas2FA: activePreset !== 'critical_risk',
          bankingHas2FA: true,
          socialHas2FA: activePreset === 'perfect',
        },
        recoveryConfigured: activePreset !== 'critical_risk',
      },
      onStageChange: (stage) => {
        setActiveStage(stage.stage);
        setStageProgress((prev) => {
          const next = [...prev];
          const idx = next.findIndex((s) => s.stage === stage.stage);
          if (idx !== -1) {
            next[idx] = stage;
          }
          return next;
        });
      },
    });

    setScanResult(result);
    setIsScanning(false);
    setActiveStage(null);
    return result;
  }, [platform, activePreset, habitsResponses, vaultCredentials]);

  // Initial scan on mount
  useEffect(() => {
    runScan();
  }, [platform, activePreset]);

  const saveHabitResponse = (resp: HabitResponse) => {
    setHabitsResponses((prev) => {
      const next = prev.filter((r) => r.questionId !== resp.questionId);
      next.push(resp);
      return next;
    });
  };

  const markFindingFixed = (findingId: string) => {
    if (!scanResult) return;
    const updatedFindings = scanResult.findings.map((f): Finding => {
      if (f.id === findingId) {
        return { ...f, status: 'fixed' as const };
      }
      return f;
    });

    const recalculatedScore = computeScore(updatedFindings, { platform: scanResult.platform });

    setScanResult({
      ...scanResult,
      findings: updatedFindings,
      scoreBreakdown: recalculatedScore,
    });
  };

  const openSettingsHandler = (target?: string) => {
    if (target) {
      alert(`Native Settings Intent Dispatched: ${target}`);
    } else {
      alert('Opening Android / iOS Security Settings');
    }
  };

  return (
    <ScanContext.Provider
      value={{
        platform,
        setPlatform,
        activePreset,
        setActivePreset,
        scanResult,
        isScanning,
        activeStage,
        stageProgress,
        habitsResponses,
        saveHabitResponse,
        runScan,
        markFindingFixed,
        openSettingsHandler,
        vaultCredentials,
        addVaultCredential,
        removeVaultCredential,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within a ScanProvider');
  return ctx;
};
