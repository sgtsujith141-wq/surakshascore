import React from 'react';
import { Logo } from '../ui/Logo';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface TopBarProps {
  onQuickRescan?: () => void;
  isScanning?: boolean;
  score?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onQuickRescan,
  isScanning = false,
  score,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 z-50 bg-[#F5F1E8]/90 backdrop-blur-md border-b border-outline-variant/70 px-4 flex items-center shadow-xs transition-standard">
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        {/* Clean Logo Mark & Brand */}
        <Logo size={24} subtitle="On-Device Protection" />

        {/* Right Action: Subtle Security Indicator & Fast Audit */}
        <div className="flex items-center gap-2">
          {score !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-800">
              <ShieldCheck size={13} className="text-emerald-700" />
              <span>{score} / 100</span>
            </div>
          )}

          <button
            type="button"
            onClick={onQuickRescan}
            disabled={isScanning}
            aria-label="Run Quick Security Scan"
            className="h-8 px-2.5 rounded-lg bg-white border border-outline-variant/70 text-on-surface text-xs font-medium hover:bg-neutral-50 hover:border-outline active:scale-[0.98] transition-standard flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={12} className={isScanning ? 'animate-spin text-primary' : 'text-on-surface-variant'} />
            <span className="text-[11px] font-medium">{isScanning ? 'Auditing...' : 'Check'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
