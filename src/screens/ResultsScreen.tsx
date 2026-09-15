import React from 'react';
import { useScan } from '../context/ScanContext';
import { Category } from '../types';
import { ArrowRight, RefreshCw, AlertTriangle, History } from 'lucide-react';

interface ResultsScreenProps {
  onNavigateToFindings: () => void;
  onNavigateToScan: () => void;
  onNavigateToTimeline?: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  onNavigateToFindings,
  onNavigateToScan,
  onNavigateToTimeline,
}) => {
  const { scanResult, runScan } = useScan();

  if (!scanResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center font-sans">
        <p className="text-sm text-on-surface-variant">No active audit record available.</p>
        <button
          onClick={onNavigateToScan}
          className="mt-4 px-5 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-none"
        >
          Run Security Check
        </button>
      </div>
    );
  }

  const breakdown = scanResult.scoreBreakdown;
  const criticalCount = scanResult.findings.filter((f) => f.status === 'open' && f.severity === 'critical').length;
  const highCount = scanResult.findings.filter((f) => f.status === 'open' && f.severity === 'high').length;
  const medCount = scanResult.findings.filter((f) => f.status === 'open' && f.severity === 'medium').length;
  const lowCount = scanResult.findings.filter((f) => f.status === 'open' && f.severity === 'low').length;

  const categoryLabels: Record<Category, string> = {
    device: 'Device Security',
    apps: 'App Permissions',
    network: 'Network Safety',
    account: 'Account Safety',
    habits: 'Security Habits',
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
            Security Audit Report
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Platform: {scanResult.platform.toUpperCase()} • Scan ID: {scanResult.scanId.slice(0, 12)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => runScan()}
          className="px-3 py-1.5 border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Re-scan
        </button>
      </div>

      {/* Hero Score Plate */}
      <div className="bg-surface-container-lowest p-6 border border-surface-container-highest text-center space-y-3">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[72px] sm:text-[80px] font-serif font-bold text-primary leading-none">
            {breakdown.overallScore}
          </span>
          <span className="text-base font-semibold text-outline">/100</span>
        </div>
        <div className="inline-block px-3 py-1 bg-surface-container font-semibold text-xs text-on-surface">
          Rating: {breakdown.grade}
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto">
          {breakdown.explanation}
        </p>

        {/* Severity Count Row */}
        <div className="mt-4 pt-4 border-t border-surface-container-highest grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 border border-error/40 bg-error-container/20">
            <div className="font-bold text-error text-lg">{criticalCount}</div>
            <div className="text-[11px] font-medium text-error">Critical</div>
          </div>
          <div className="p-2.5 border border-secondary/40 bg-secondary-container/20">
            <div className="font-bold text-secondary text-lg">{highCount}</div>
            <div className="text-[11px] font-medium text-secondary">High</div>
          </div>
          <div className="p-2.5 border border-outline-variant bg-surface-container">
            <div className="font-bold text-on-surface text-lg">{medCount}</div>
            <div className="text-[11px] font-medium text-on-surface-variant">Medium</div>
          </div>
          <div className="p-2.5 border border-outline-variant bg-surface-container">
            <div className="font-bold text-on-surface text-lg">{lowCount}</div>
            <div className="text-[11px] font-medium text-on-surface-variant">Low</div>
          </div>
        </div>
      </div>

      {/* Platform Weight Redistribution Notice */}
      {breakdown.weightRedistributed && (
        <div className="p-4 border border-secondary/50 bg-secondary-container/10">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={17} className="text-secondary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-secondary">
                iOS Sandbox Weight Redistribution Active
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                App permission scanning is restricted by the iOS sandbox. To maintain mathematical balance, the 25% weight was distributed proportionally across the remaining categories without penalizing your score.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Mathematical Contributions Plate */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          Category Breakdown
        </h3>

        <div className="border border-surface-container-highest bg-surface-container-lowest divide-y divide-surface-container-highest">
          {(Object.keys(breakdown.categoryScores) as Category[]).map((cat) => {
            const c = breakdown.categoryScores[cat];

            return (
              <div key={cat} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-on-surface">
                    {categoryLabels[cat] || cat} ({Math.round(c.weight * 100)}% weight)
                  </span>
                  <span className="text-primary font-bold">
                    {c.isScoreable ? `${c.score} / 100` : 'Not Supported on iOS'}
                  </span>
                </div>

                <div className="w-full h-2 bg-surface-container-highest">
                  <div
                    className={`h-full ${
                      !c.isScoreable
                        ? 'bg-outline'
                        : c.score >= 80
                        ? 'bg-emerald-600'
                        : c.score >= 60
                        ? 'bg-amber-500'
                        : 'bg-error'
                    }`}
                    style={{ width: `${c.isScoreable ? c.score : 0}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-on-surface-variant">
                  <span>Open issues: {c.openFindingsCount}</span>
                  <span>Contribution: +{Math.round(c.pointContribution)} pts to overall</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2.5">
        <button
          type="button"
          onClick={onNavigateToFindings}
          className="w-full min-h-[48px] bg-primary border-2 border-primary text-on-primary py-3 px-4 rounded-none flex items-center justify-center gap-2 text-xs font-semibold tracking-wide hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span>Review & Fix Issues</span>
          <ArrowRight size={15} />
        </button>

        {onNavigateToTimeline && (
          <button
            type="button"
            onClick={onNavigateToTimeline}
            className="w-full min-h-[44px] border border-outline-variant bg-surface-container-lowest text-on-surface py-2.5 px-4 text-xs font-semibold hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
          >
            <History size={15} />
            <span>View 7-Day Score History</span>
          </button>
        )}
      </div>
    </div>
  );
};
