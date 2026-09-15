import React, { useState } from 'react';
import { VaultScreen } from './VaultScreen';
import { TimelineScreen } from './TimelineScreen';
import { DataPrivacyScreen } from './DataPrivacyScreen';
import { Lock, History, Shield, Sliders, Check, Sparkles } from 'lucide-react';
import { useScan } from '../context/ScanContext';
import { PLATFORM_CAPABILITY_MATRIX } from '../lib/capabilities';
import { MockProfilePreset } from '../mock/mockSignalProvider';
import { Platform } from '../types';
import { seedDemoData } from '../lib/mock/demoDataSeeder';

export const YouScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'vault' | 'history' | 'privacy' | 'diagnostics'>('vault');
  const [demoSeeded, setDemoSeeded] = useState(false);
  const {
    platform,
    setPlatform,
    activePreset,
    setActivePreset,
    scanResult,
    runScan,
  } = useScan();

  const presets: MockProfilePreset[] = [
    'perfect',
    'student',
    'elder',
    'critical_risk',
    'unavailable',
  ];

  const handleSeedDemo = () => {
    seedDemoData(platform);
    setDemoSeeded(true);
    runScan();
    setTimeout(() => setDemoSeeded(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-6 font-sans">
      {/* 4 Section Segmented Pills */}
      <div className="grid grid-cols-4 gap-1 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/50">
        <button
          type="button"
          onClick={() => setActiveSection('vault')}
          className={`h-9 px-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            activeSection === 'vault'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Lock size={13} />
          <span>Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('history')}
          className={`h-9 px-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            activeSection === 'history'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <History size={13} />
          <span>History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('privacy')}
          className={`h-9 px-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            activeSection === 'privacy'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Shield size={13} />
          <span>Privacy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('diagnostics')}
          className={`h-9 px-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            activeSection === 'diagnostics'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Sliders size={13} />
          <span>System</span>
        </button>
      </div>

      {/* 1. Vault & Credentials */}
      {activeSection === 'vault' && <VaultScreen />}

      {/* 2. Security History & Timeline */}
      {activeSection === 'history' && <TimelineScreen />}

      {/* 3. Data & Privacy */}
      {activeSection === 'privacy' && <DataPrivacyScreen />}

      {/* 4. System Diagnostics, Capability Matrix & Demo Tools */}
      {activeSection === 'diagnostics' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-neutral-200/80 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                System Diagnostics & Testing
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Platform simulation, capability matrices, and judge testing tools
              </p>
            </div>
          </div>

          {/* Demo Seeder Tool */}
          <div className="bg-white p-5 border border-neutral-200/80 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <Sparkles size={16} className="text-amber-600" />
                <span>Evaluation Demo Profile Seeder</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md border border-neutral-200">
                Dev Tool
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Instantly populates a realistic 7-day posture trajectory (52 to 84 pts), historical scans, and sample findings to evaluate the app without waiting 7 days.
            </p>

            {demoSeeded && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check size={15} />
                <span>Sample 7-day demo profile loaded successfully!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSeedDemo}
              className="w-full h-11 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] transition-standard cursor-pointer shadow-xs"
            >
              Load 7-Day Demo Profile
            </button>
          </div>

          {/* Target Operating System Simulator */}
          <article className="space-y-2.5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
              Simulated Platform Runtime
            </h3>
            <div className="bg-white p-5 border border-neutral-200/80 rounded-2xl space-y-4 shadow-xs">
              <div className="grid grid-cols-3 gap-2">
                {(['android', 'ios', 'web'] as Platform[]).map((p) => {
                  const labels: Record<Platform, string> = { android: 'Android', ios: 'iOS (Apple)', web: 'Web Browser' };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`h-10 rounded-xl text-xs font-medium transition-standard cursor-pointer border ${
                        platform === p
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs font-semibold'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <span className="block text-xs font-medium text-neutral-600 mb-2">
                  Inject Risk Scenario Profile:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setActivePreset(pr)}
                      className={`h-8 px-3 text-xs font-medium rounded-lg border transition-standard cursor-pointer capitalize ${
                        activePreset === pr
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {pr.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Platform Capability Matrix Table */}
          <article className="space-y-2.5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
              Signal Probing Capability Matrix
            </h3>
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200/80">
                    <th className="p-3 font-semibold text-neutral-800">Signal ID</th>
                    <th className="p-3 font-semibold text-neutral-800">Category</th>
                    <th className="p-3 font-semibold text-neutral-800">Android</th>
                    <th className="p-3 font-semibold text-neutral-800">iOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[11px]">
                  {Object.values(PLATFORM_CAPABILITY_MATRIX).map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3 font-mono text-neutral-900">{row.id}</td>
                      <td className="p-3 text-neutral-500 capitalize">{row.category}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 font-medium text-[10px] rounded-md ${
                          row.platforms.android.supported ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                          {row.platforms.android.supported ? 'Supported' : 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 font-medium text-[10px] rounded-md ${
                          row.platforms.ios.supported ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                          {row.platforms.ios.supported ? 'Supported' : 'Restricted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          {/* Engine Specifications */}
          <article className="space-y-2.5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
              Engine Specifications
            </h3>
            <div className="bg-white p-4 border border-neutral-200/80 rounded-2xl space-y-2 text-xs shadow-xs">
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600 font-medium">Deterministic Scoring Core</span>
                <span className="font-semibold text-emerald-800">Active (Pure Math)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600 font-medium">Critical Finding Cap Invariant</span>
                <span className="font-semibold text-neutral-900">Enforced (Max &lt; 100)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600 font-medium">Proportional Weight Redistribution</span>
                <span className="font-semibold text-neutral-900">
                  {scanResult?.scoreBreakdown.weightRedistributed ? 'Applied (iOS Sandbox)' : 'Standard 1.0 Matrix'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600 font-medium">Telemetry Storage</span>
                <span className="font-semibold text-emerald-800">100% Local (Zero-Cloud)</span>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};
