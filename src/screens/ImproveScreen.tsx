import React, { useState } from 'react';
import { useScan } from '../context/ScanContext';
import { ProtectScreen } from './ProtectScreen';
import { ToolsScreen } from './ToolsScreen';
import { TrendingUp, Wrench, RefreshCw, ArrowRight, Shield } from 'lucide-react';

interface ImproveScreenProps {
  onNavigateToScan?: () => void;
}

export const ImproveScreen: React.FC<ImproveScreenProps> = ({
  onNavigateToScan,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'tools'>('plan');
  const { runScan, isScanning } = useScan();

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-6 font-sans">
      {/* Sub-tab Segmented Control */}
      <div className="grid grid-cols-2 gap-1 bg-neutral-200/60 p-1 rounded-xl border border-[#E0DAD0]">
        <button
          type="button"
          onClick={() => setActiveTab('plan')}
          className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <TrendingUp size={14} />
          <span>Remediation Roadmap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Wrench size={14} />
          <span>Security Tools</span>
        </button>
      </div>

      {/* Tab 1: Remediation Roadmap & Point Recovery */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Quick Discovery Banner for Tools Workspace */}
          <div
            onClick={() => setActiveTab('tools')}
            className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer flex items-center justify-between gap-3 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-neutral-900">Security Diagnostic Tools</h4>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">Ready</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Run focused on-device password checks, link phishing analysis, and breach searches.
                </p>
              </div>
            </div>
            <ArrowRight size={15} className="text-neutral-400 shrink-0" />
          </div>

          <ProtectScreen />

          {/* Re-scan Trigger After Fixing */}
          <div className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] flex items-center justify-between gap-3 shadow-card">
            <div>
              <span className="text-xs font-semibold text-neutral-900 block">
                Applied your security changes?
              </span>
              <p className="text-xs text-neutral-500 mt-0.5">
                Re-scan your device to verify fixes and update your score.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToScan) onNavigateToScan();
                else runScan();
              }}
              disabled={isScanning}
              className="h-9 px-3.5 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 flex items-center gap-1.5 active:scale-[0.98] transition-standard cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
            >
              <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
              <span>Verify & Re-scan</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Active Security Tools Workspace */}
      {activeTab === 'tools' && <ToolsScreen />}
    </div>
  );
};
