import React, { useState } from 'react';
import { useScan } from '../context/ScanContext';
import { PLATFORM_CAPABILITY_MATRIX } from '../lib/capabilities';
import { MockProfilePreset } from '../mock/mockSignalProvider';
import { Platform } from '../types';
import { DataPrivacyScreen } from './DataPrivacyScreen';
import { TimelineScreen } from './TimelineScreen';
import { seedDemoData } from '../lib/mock/demoDataSeeder';
import { Sparkles, Check } from 'lucide-react';

export const ConfigScreen: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'telemetry' | 'timeline' | 'privacy'>('telemetry');
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

  const renderTabs = () => (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => setActiveSubTab('telemetry')}
        className={`min-h-[42px] py-2 px-2 text-xs font-semibold border transition-all ${
          activeSubTab === 'telemetry'
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
        }`}
      >
        Diagnostics
      </button>
      <button
        type="button"
        onClick={() => setActiveSubTab('timeline')}
        className={`min-h-[42px] py-2 px-2 text-xs font-semibold border transition-all ${
          activeSubTab === 'timeline'
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
        }`}
      >
        History
      </button>
      <button
        type="button"
        onClick={() => setActiveSubTab('privacy')}
        className={`min-h-[42px] py-2 px-2 text-xs font-semibold border transition-all ${
          activeSubTab === 'privacy'
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
        }`}
      >
        Privacy
      </button>
    </div>
  );

  if (activeSubTab === 'timeline') {
    return (
      <div className="space-y-4 font-sans">
        <div className="max-w-xl mx-auto px-4 pt-4">
          {renderTabs()}
        </div>
        <TimelineScreen />
      </div>
    );
  }

  if (activeSubTab === 'privacy') {
    return (
      <div className="space-y-4 font-sans">
        <div className="max-w-xl mx-auto px-4 pt-4">
          {renderTabs()}
        </div>
        <DataPrivacyScreen />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6 font-sans">
      {/* Sub-tab Navigation */}
      {renderTabs()}

      {/* Header */}
      <div className="border-b border-surface-container-highest pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
            Settings & Diagnostics
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Platform capability matrix & test simulators
          </p>
        </div>
      </div>

      {/* Demo Seeder Key (Dev-Only / Judges) */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 border border-surface-container-highest space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles size={15} className="text-amber-700" />
            <span>Sample 7-Day Demo Profile</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-surface-container text-on-surface-variant border border-outline-variant">
            Demo Tool
          </span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Instantly populates a realistic 7-day posture history (52 to 84 pts), past audit records, and sample findings to evaluate the app without waiting 7 days.
        </p>

        {demoSeeded && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-1.5">
            <Check size={15} />
            <span>Sample 7-day demo profile loaded successfully!</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSeedDemo}
          className="w-full min-h-[40px] bg-primary border border-primary text-on-primary py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          Load 7-Day Demo Profile
        </button>
      </div>

      {/* Module 1: Platform Simulation */}
      <article className="space-y-2.5">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          Target Operating System
        </h3>
        <div className="bg-surface-container-lowest p-4 border border-surface-container-highest space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(['android', 'ios', 'web'] as Platform[]).map((p) => {
              const labels: Record<Platform, string> = { android: 'Android', ios: 'iOS (Apple)', web: 'Web Demo' };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`min-h-[40px] py-2 text-xs font-semibold border transition-all ${
                    platform === p
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:text-on-surface'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-surface-container-highest">
            <span className="block text-xs font-medium text-on-surface-variant mb-2">
              Inject Test Risk Profile:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setActivePreset(pr)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                    activePreset === pr
                      ? 'bg-primary text-on-primary border-primary font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:text-on-surface'
                  }`}
                >
                  {pr.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Module 2: Platform Capability Matrix Table (§4.2) */}
      <article className="space-y-2.5">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          Signal Probing Matrix
        </h3>
        <div className="bg-surface-container-lowest border border-surface-container-highest overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-surface-container-highest">
                <th className="p-2.5 font-semibold text-on-surface">Signal</th>
                <th className="p-2.5 font-semibold text-on-surface">Category</th>
                <th className="p-2.5 font-semibold text-on-surface">Android</th>
                <th className="p-2.5 font-semibold text-on-surface">iOS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-[11px]">
              {Object.values(PLATFORM_CAPABILITY_MATRIX).map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low">
                  <td className="p-2.5 font-mono text-on-surface">{row.id}</td>
                  <td className="p-2.5 text-on-surface-variant capitalize">{row.category}</td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.5 font-semibold text-[10px] ${
                      row.platforms.android.supported ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-surface text-outline border border-outline-variant'
                    }`}>
                      {row.platforms.android.supported ? 'Supported' : 'N/A'}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.5 font-semibold text-[10px] ${
                      row.platforms.ios.supported ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-surface text-outline border border-outline-variant'
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

      {/* Module 3: Active Invariant Engine Status */}
      <article className="space-y-2.5">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          Engine Specifications
        </h3>
        <div className="bg-surface-container-lowest p-4 border border-surface-container-highest space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-surface-container-highest">
            <span className="font-medium text-on-surface">Deterministic Engine</span>
            <span className="font-semibold text-emerald-800">Active (Pure Math)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-surface-container-highest">
            <span className="font-medium text-on-surface">Critical Finding Cap Invariant</span>
            <span className="font-semibold text-on-surface">Enforced (Max &lt; 100)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-surface-container-highest">
            <span className="font-medium text-on-surface">Proportional Weight Redistribution</span>
            <span className="font-semibold text-on-surface">
              {scanResult?.scoreBreakdown.weightRedistributed ? 'Applied (iOS Sandbox)' : 'Standard 1.0 Matrix'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="font-medium text-on-surface">Telemetry Storage</span>
            <span className="font-semibold text-emerald-800">100% Local (Zero-Cloud)</span>
          </div>
        </div>
      </article>
    </div>
  );
};
