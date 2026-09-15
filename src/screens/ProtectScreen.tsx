import React from 'react';
import { useScan } from '../context/ScanContext';
import { Finding } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { ProvenanceChip } from '../components/ui/ProvenanceChip';
import {
  ExternalLink,
  Check,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const ProtectScreen: React.FC = () => {
  const { scanResult, markFindingFixed, openSettingsHandler } = useScan();

  const findings = scanResult?.findings ?? [];
  const openFindings = findings.filter((f) => f.status === 'open');
  const fixedFindings = findings.filter((f) => f.status === 'fixed');

  const currentScore = scanResult?.scoreBreakdown.overallScore ?? 84;

  // Calculate potential score gain
  let potentialGain = 0;
  for (const f of openFindings) {
    if (f.severity === 'critical') potentialGain += 40;
    else if (f.severity === 'high') potentialGain += 20;
    else if (f.severity === 'medium') potentialGain += 10;
    else if (f.severity === 'low') potentialGain += 5;
  }
  const projectedScore = Math.min(100, currentScore + potentialGain);

  const quickWins = openFindings.filter((f) => f.effort === 'quick');
  const involvedFixes = openFindings.filter((f) => f.effort !== 'quick');

  const getPointsForFinding = (f: Finding) => {
    switch (f.severity) {
      case 'critical':
        return 40;
      case 'high':
        return 20;
      case 'medium':
        return 10;
      case 'low':
        return 5;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">
      {/* Point Recovery Simulator Plate */}
      <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <span className="text-xs text-neutral-500 font-medium block">Current Score</span>
            <div className="text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums font-mono">
              {currentScore} <span className="text-xs font-normal text-neutral-400 font-sans">/ 100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-500 font-medium block">Projected Score</span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 flex items-center justify-end gap-1 tabular-nums font-mono">
              <TrendingUp size={20} className="text-emerald-600" />
              {projectedScore} <span className="text-xs font-normal text-neutral-400 font-sans">/ 100</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-neutral-700">Remediation Progress</span>
          <span className="text-neutral-500">{fixedFindings.length} of {findings.length} issues resolved</span>
        </div>

        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.round((fixedFindings.length / Math.max(1, findings.length)) * 100)}%` }}
          />
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Resolving all remaining {openFindings.length} active issue{openFindings.length === 1 ? '' : 's'} will recover up to <strong className="text-neutral-900 font-semibold font-mono">+{Math.min(100 - currentScore, potentialGain)} points</strong> toward your hygiene score.
        </p>
      </div>

      {/* Section 1: Quick Wins (<2 Mins) */}
      <article className="space-y-3">
        <div className="flex items-center gap-1.5 px-0.5">
          <Zap size={15} className="text-amber-600" />
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Quick Fixes (under 2 minutes)
          </h3>
        </div>

        {quickWins.length === 0 ? (
          <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl text-xs text-neutral-500 text-center shadow-xs">
            All quick fixes have been implemented.
          </div>
        ) : (
          <div className="space-y-3">
            {quickWins.map((f) => (
              <div
                key={f.id}
                className="bg-white p-4 sm:p-5 border border-[#E0DAD0] rounded-[22px] space-y-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityBadge severity={f.severity} />
                      <ProvenanceChip provenance={f.provenance} />
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug">{f.title || f.type}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">{f.whyDetected}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap tabular-nums font-mono">
                    +{getPointsForFinding(f)} pts
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const act = f.recommendedActions?.[0];
                      if (act?.type === 'open_settings') openSettingsHandler(act.target);
                      else markFindingFixed(f.id);
                    }}
                    className="h-9 bg-neutral-900 text-white px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-neutral-800 active:scale-[0.98] transition-standard shadow-xs cursor-pointer"
                  >
                    <span>{f.recommendedActions?.[0]?.label.replace(/[\[\]]/g, '') || 'Fix in Settings'}</span>
                    <ExternalLink size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => markFindingFixed(f.id)}
                    className="h-9 border border-neutral-200 px-3 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:scale-[0.98] transition-standard cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Section 2: High Impact Security Fixes */}
      <article className="space-y-3">
        <div className="flex items-center gap-1.5 px-0.5">
          <AlertCircle size={15} className="text-red-600" />
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Important Fixes
          </h3>
        </div>

        {involvedFixes.length === 0 ? (
          <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl text-xs text-neutral-500 text-center shadow-xs">
            No complex security fixes pending.
          </div>
        ) : (
          <div className="space-y-3">
            {involvedFixes.map((f) => (
              <div
                key={f.id}
                className="bg-white p-4 sm:p-5 border border-[#E0DAD0] rounded-[22px] space-y-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityBadge severity={f.severity} />
                      <ProvenanceChip provenance={f.provenance} />
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug">{f.title || f.type}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">{f.whyDetected}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap tabular-nums font-mono">
                    +{getPointsForFinding(f)} pts
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const act = f.recommendedActions?.[0];
                      if (act?.type === 'open_settings') openSettingsHandler(act.target);
                      else markFindingFixed(f.id);
                    }}
                    className="h-9 bg-neutral-900 text-white px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-neutral-800 active:scale-[0.98] transition-standard shadow-xs cursor-pointer"
                  >
                    <span>{f.recommendedActions?.[0]?.label.replace(/[\[\]]/g, '') || 'Resolve Issue'}</span>
                    <ExternalLink size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => markFindingFixed(f.id)}
                    className="h-9 border border-neutral-200 px-3 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:scale-[0.98] transition-standard cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Section 3: Resolved Findings History */}
      {fixedFindings.length > 0 && (
        <article className="space-y-3">
          <div className="flex items-center gap-1.5 px-0.5">
            <ShieldCheck size={15} className="text-emerald-700" />
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Fixed Issues ({fixedFindings.length})
            </h3>
          </div>
          <div className="bg-white border border-neutral-200/80 rounded-2xl divide-y divide-neutral-100 overflow-hidden shadow-xs">
            {fixedFindings.map((f) => (
              <div key={f.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-600" />
                  <span className="font-medium line-through text-neutral-400">
                    {f.title || f.type}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Resolved
                </span>
              </div>
            ))}
          </div>
        </article>
      )}
    </div>
  );
};
