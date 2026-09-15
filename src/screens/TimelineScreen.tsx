import React, { useState } from 'react';
import { generateDemoHistory, TimelineScanRecord } from '../lib/mock/demoDataSeeder';
import { TrendingUp, Calendar, CheckCircle2, ChevronRight, History, ArrowUpRight } from 'lucide-react';

interface TimelineScreenProps {
  onSelectHistoricalScan?: (scan: TimelineScanRecord) => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = () => {
  const [history] = useState<TimelineScanRecord[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('pss_demo_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return generateDemoHistory();
        }
      }
    }
    return generateDemoHistory();
  });

  const [selectedScan, setSelectedScan] = useState<TimelineScanRecord | null>(null);

  const initialScore = history[0]?.score ?? 52;
  const currentScore = history[history.length - 1]?.score ?? 84;
  const totalGain = currentScore - initialScore;

  // Key historical remediation events mapped to the 4 timeline steps
  const remediationEvents = [
    { score: 52, label: 'Baseline', sub: 'Initial assessment', delta: 0 },
    { score: 68, label: 'Screen Lock', sub: '+16 pts: Biometric enabled', delta: 16 },
    { score: 76, label: 'Permissions', sub: '+8 pts: SMS access revoked', delta: 8 },
    { score: 84, label: '2FA Activated', sub: '+8 pts: TOTP token added', delta: 8 },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Security Score History
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            7-day posture trajectory and verified remediation milestones
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
          7-Day Trajectory
        </span>
      </div>

      {/* Hero 7-Day Progression Plate */}
      <div className="bg-white p-5 border border-neutral-200/80 rounded-2xl space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <span className="text-xs font-medium text-neutral-500 block">Baseline Score (Day 1)</span>
            <div className="text-2xl font-bold text-neutral-400 tabular-nums font-mono">
              {initialScore} <span className="text-xs font-normal font-sans">/ 100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-neutral-500 block">Current Posture</span>
            <div className="text-2xl font-bold text-emerald-700 flex items-center justify-end gap-1 tabular-nums font-mono">
              <TrendingUp size={18} className="text-emerald-600" />
              {currentScore} <span className="text-xs font-normal font-sans text-neutral-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Linear Stepped Score Trajectory */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-800">Remediation Milestones</span>
            <span className="text-emerald-700 font-bold tabular-nums">+{totalGain} pts recovered</span>
          </div>

          {/* Stepped Event Node Line */}
          <div className="relative pt-3 pb-2">
            <div className="grid grid-cols-4 gap-1 relative">
              {/* Connecting hairline */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-neutral-200 -z-0" />

              {remediationEvents.map((ev, idx) => (
                <div key={idx} className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold font-mono transition-all ${
                    idx === remediationEvents.length - 1
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                      : 'bg-white border-emerald-600 text-emerald-800'
                  }`}>
                    {ev.score}
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-900 mt-2 block">
                    {ev.label}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                    {ev.delta > 0 ? `+${ev.delta} pts` : 'Day 1'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Audit Event List */}
      <article className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <History size={15} className="text-neutral-600" />
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Past Audit Snapshots
          </h3>
        </div>

        <div className="space-y-2.5">
          {history.slice().reverse().map((scan) => (
            <div
              key={scan.id}
              onClick={() => setSelectedScan(scan)}
              className="bg-white p-4 border border-neutral-200/80 rounded-2xl hover:border-neutral-300 active:scale-[0.99] cursor-pointer transition-standard space-y-2 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-neutral-900">
                      Score: {scan.score} / 100 (Grade {scan.grade})
                    </span>
                    {scan.delta > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md inline-flex items-center gap-0.5">
                        <ArrowUpRight size={12} />
                        +{scan.delta} pts
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">{scan.summary}</p>
                </div>

                <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar size={13} />
                  {scan.timestamp.slice(0, 10).replace(/-/g, '.')}
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                  <CheckCircle2 size={13} />
                  {scan.resolvedSinceLastCount} resolved
                </span>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Selected Historical Scan Details Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-floating">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-neutral-400 block font-mono">
                  Audit Snapshot • {selectedScan.timestamp.slice(0, 10).replace(/-/g, '.')}
                </span>
                <h4 className="text-base font-bold text-neutral-900 mt-0.5">
                  Score: {selectedScan.score} / 100 (Grade {selectedScan.grade})
                </h4>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {selectedScan.summary}
            </p>

            {/* Category Contributions */}
            <div className="border border-neutral-200/80 rounded-xl bg-neutral-50 divide-y divide-neutral-100 text-xs overflow-hidden">
              {Object.entries(selectedScan.categoryScores).map(([cat, c]) => (
                <div key={cat} className="p-3 flex justify-between">
                  <span className="capitalize font-medium text-neutral-700">{cat}</span>
                  <span className="font-semibold text-neutral-900 tabular-nums font-mono">{c.score} / 100 (+{Math.round(c.pointContribution)} pts)</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedScan(null)}
              className="w-full h-11 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] transition-standard cursor-pointer shadow-xs"
            >
              Close Snapshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
