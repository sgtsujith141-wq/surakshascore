import React, { useState } from 'react';
import { Finding } from '../../types';
import { SeverityBadge } from './SeverityBadge';
import { ProvenanceChip } from './ProvenanceChip';
import { ChevronDown, ChevronUp, ExternalLink, Check } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  index?: number;
  onFix?: (findingId: string) => void;
  onOpenSettings?: (target?: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onFix,
  onOpenSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFixed = finding.status === 'fixed';
  const isCritical = finding.severity === 'critical';

  const categoryNames: Record<string, string> = {
    device: 'Device Security',
    apps: 'Apps & Permissions',
    network: 'Network Safety',
    account: 'Account Security',
    habits: 'Security Habits',
  };

  const getPointsForFinding = () => {
    switch (finding.severity) {
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
    <article
      className={`rounded-2xl bg-white transition-standard overflow-hidden ${
        isFixed
          ? 'border border-neutral-200/60 opacity-65'
          : isCritical
          ? 'border border-red-200 shadow-xs'
          : 'border border-neutral-200/80 shadow-xs'
      }`}
    >
      {/* Header Strip */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 ${
          isCritical && !isFixed
            ? 'bg-red-50/50 border-red-100'
            : 'bg-neutral-50/70 border-neutral-100'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-neutral-800">
            {categoryNames[finding.category] || finding.category}
          </span>
          <SeverityBadge severity={isFixed ? 'success' : finding.severity} />
        </div>
        <ProvenanceChip provenance={finding.provenance} />
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h4 className={`text-sm sm:text-base font-semibold leading-snug tracking-tight ${isFixed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
              {finding.title || finding.type.replace(/_/g, ' ')}
            </h4>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {finding.whyDetected}
            </p>
          </div>

          {!isFixed && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0 tabular-nums">
              +{getPointsForFinding()} pts
            </span>
          )}
        </div>

        {/* Primary Action & Details Button */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {finding.recommendedActions?.[0] && !isFixed && (
              <button
                type="button"
                onClick={() => {
                  const act = finding.recommendedActions?.[0];
                  if (act?.type === 'open_settings') {
                    onOpenSettings?.(act.target);
                  } else if (act?.type === 'mark_fixed') {
                    onFix?.(finding.id);
                  }
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 active:scale-[0.98] transition-standard shadow-xs ${
                  isCritical
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                <span>{finding.recommendedActions[0].label.replace(/[\[\]]/g, '')}</span>
                <ExternalLink size={12} />
              </button>
            )}

            {!isFixed ? (
              <button
                type="button"
                onClick={() => onFix?.(finding.id)}
                className="h-9 px-3 rounded-xl text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 bg-white border border-neutral-200 active:scale-[0.98] transition-standard"
              >
                Mark as Fixed
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <Check size={14} /> Resolved
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9 px-2.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 flex items-center gap-1 transition-standard ml-auto font-medium cursor-pointer"
          >
            <span>{isExpanded ? 'Less' : 'Evidence & Details'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Expandable Technical Evidence & Audit Matrix */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3 text-xs bg-neutral-50/70 rounded-xl p-3.5">
            {/* Structured Telemetry Matrix */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-neutral-400 font-medium block">Evidence Confidence</span>
                <span className="font-semibold text-neutral-800 capitalize">{finding.provenance.toLowerCase().replace('_', ' ')}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-neutral-400 font-medium block">Estimated Gain</span>
                <span className="font-semibold text-emerald-700 font-mono">+{getPointsForFinding()} pts</span>
              </div>
            </div>

            {/* Why It Matters */}
            <div>
              <span className="font-semibold text-neutral-900 block mb-1">
                Threat Analysis:
              </span>
              <p className="text-neutral-600 leading-relaxed">
                {finding.whyItMatters || 'Resolving this finding mitigates known attack vectors and improves overall security hygiene.'}
              </p>
            </div>

            {/* Evidence Telemetry Table */}
            {finding.evidence && finding.evidence.length > 0 && (
              <div className="pt-2 border-t border-neutral-200/60 space-y-1.5">
                <span className="font-semibold text-neutral-900 block">
                  Observed Technical Evidence:
                </span>
                <div className="space-y-1">
                  {finding.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white p-2.5 rounded-lg border border-neutral-200/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1"
                    >
                      <span className="font-medium text-neutral-700">{ev.label}:</span>
                      <span className="text-neutral-800 font-mono text-[11px] bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200/60 break-all">{ev.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
