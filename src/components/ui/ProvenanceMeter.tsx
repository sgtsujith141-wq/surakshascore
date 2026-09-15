import React from 'react';
import { Signal, Finding } from '../../types';

interface ProvenanceMeterProps {
  score: number;
  signals: Signal[];
  findings: Finding[];
}

export const ProvenanceMeter: React.FC<ProvenanceMeterProps> = ({
  score,
  signals,
  findings,
}) => {
  // Real provenance counts derived from collected signals
  const verifiedCount = signals.filter((s) => s.provenance === 'VERIFIED').length;
  const permissionCount = signals.filter((s) => s.provenance === 'PERMISSION_BASED').length;
  const selfReportedCount = signals.filter((s) => s.provenance === 'SELF_REPORTED').length;
  const unavailableCount = signals.filter((s) => s.provenance === 'UNAVAILABLE').length;

  const openRisks = findings.filter(
    (f) => f.status === 'open' && (f.severity === 'critical' || f.severity === 'high')
  );
  const risksCount = openRisks.length;

  // 10 Segments calculation (each segment represents 10% of score)
  const totalSegments = 10;
  const filledRatio = score / 10; // e.g. 84 -> 8.4
  const fullBars = Math.floor(filledRatio);
  const partialPercent = Math.round((filledRatio - fullBars) * 100);

  return (
    <div className="mt-8 flex flex-col items-center w-full">
      {/* 10 Solid Vertical Signal Strength Bars */}
      <div className="flex items-end gap-2 h-14 justify-center w-full max-w-[280px]">
        {Array.from({ length: totalSegments }).map((_, index) => {
          if (index < fullBars) {
            // Full active bar
            return (
              <div
                key={index}
                className="w-5 bg-tertiary-container h-14 rounded-none transition-all duration-300"
              />
            );
          } else if (index === fullBars && partialPercent > 0) {
            // Partial active bar
            return (
              <div
                key={index}
                className="w-5 h-14 border-2 border-tertiary-container rounded-none flex items-end relative bg-surface-container-highest"
              >
                <div
                  className="w-full bg-tertiary-container transition-all duration-300"
                  style={{ height: `${partialPercent}%` }}
                />
              </div>
            );
          } else {
            // Inactive hollow bar
            return (
              <div
                key={index}
                className="w-5 h-14 border-2 border-outline-variant rounded-none"
              />
            );
          }
        })}
      </div>

      {/* Live Dynamic Provenance Legend (Section 4.1 & 6) */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 text-[10px] font-mono font-bold uppercase tracking-wider text-center justify-center">
        <span className="flex items-center gap-1.5 text-on-surface">
          <span className="size-2.5 bg-tertiary-container rounded-none"></span>
          [VERIFIED ({verifiedCount})]
        </span>
        <span className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="size-2.5 bg-tertiary-container/60 rounded-none"></span>
          [PERMISSION ({permissionCount})]
        </span>
        <span className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="size-2.5 bg-tertiary-container/30 rounded-none"></span>
          [SELF-REPORTED ({selfReportedCount})]
        </span>
        {unavailableCount > 0 ? (
          <span className="flex items-center gap-1.5 text-outline">
            <span className="border border-outline-variant size-2.5 rounded-none"></span>
            [UNAVAILABLE ({unavailableCount})]
          </span>
        ) : null}
        {risksCount > 0 ? (
          <span className="flex items-center gap-1.5 text-error">
            <span className="size-2.5 bg-error rounded-none"></span>
            [RISKS ({risksCount})]
          </span>
        ) : null}
      </div>

      {/* Rationale copy */}
      <p className="mt-6 text-[12px] leading-relaxed text-on-surface-variant font-mono text-center max-w-[320px]">
        Score derived deterministically via OS signal matrix. {risksCount > 0 ? `${risksCount} high-risk vector${risksCount === 1 ? '' : 's'} detected.` : 'No critical risk vectors detected.'}
      </p>
    </div>
  );
};
