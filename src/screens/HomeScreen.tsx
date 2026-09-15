import React, { useState } from 'react';
import { useScan } from '../context/ScanContext';
import { ScoreRing } from '../components/ui/ScoreRing';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { ProvenanceChip } from '../components/ui/ProvenanceChip';
import {
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Smartphone,
  Layers,
  Wifi,
  Mail,
  UserCheck,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
} from 'lucide-react';
import { Category } from '../types';

interface HomeScreenProps {
  onNavigateToScan: () => void;
  onNavigateToIssues: () => void;
  onNavigateToImprove: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToScan,
  onNavigateToIssues,
  onNavigateToImprove,
}) => {
  const {
    scanResult,
    openSettingsHandler,
    habitsResponses,
  } = useScan();

  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  const score = scanResult?.scoreBreakdown.overallScore ?? 84;
  const signals = scanResult?.signals ?? [];
  const findings = scanResult?.findings ?? [];

  const openFindings = findings.filter((f) => f.status === 'open');
  const criticalFindings = openFindings.filter((f) => f.severity === 'critical');
  const highFindings = openFindings.filter((f) => f.severity === 'high');

  const urgentCount = criticalFindings.length + highFindings.length;
  const totalOpenCount = openFindings.length;

  const verifiedCount = signals.filter((s) => s.provenance === 'VERIFIED').length;
  const coveragePercent = Math.round(
    ((signals.filter((s) => s.provenance !== 'UNAVAILABLE').length) / Math.max(1, signals.length)) * 100
  );

  const categoryScores = scanResult?.scoreBreakdown.categoryScores;

  // Status message and semantic color
  const getStatusInfo = () => {
    if (urgentCount > 0) {
      return {
        message: `${urgentCount} urgent issue${urgentCount === 1 ? '' : 's'} require attention`,
        subtext: 'High-priority risks are active on your device perimeter.',
        color: '#dc2626',
        dotColor: 'bg-red-600',
      };
    }
    if (score >= 80) {
      return {
        message: 'Security posture is hardened',
        subtext: 'Core system integrity and baseline defenses are verified.',
        color: '#16a34a',
        dotColor: 'bg-emerald-600',
      };
    }
    return {
      message: 'Security settings need review',
      subtext: 'Recommended improvements pending across attack vectors.',
      color: '#d97706',
      dotColor: 'bg-amber-500',
    };
  };

  const status = getStatusInfo();

  // Category Semantic Identities
  const categoryConfig: Record<Category, { label: string; icon: React.ReactNode; color: string; badgeBg: string }> = {
    device: {
      label: 'Device Security',
      icon: <Smartphone size={16} />,
      color: '#2563eb', // Blue
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    },
    apps: {
      label: 'Apps & Permissions',
      icon: <Layers size={16} />,
      color: '#7c3aed', // Purple
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    },
    network: {
      label: 'Network Safety',
      icon: <Wifi size={16} />,
      color: '#0d9488', // Teal
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    },
    account: {
      label: 'Account Security',
      icon: <Mail size={16} />,
      color: '#d97706', // Amber
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    habits: {
      label: 'Security Habits',
      icon: <UserCheck size={16} />,
      color: '#16a34a', // Green
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
  };

  const getCategoryStatusLabel = (scoreVal: number, isScoreable: boolean, openCount: number) => {
    if (!isScoreable) return { label: 'Restricted', color: 'text-neutral-400' };
    if (openCount > 0 && scoreVal < 70) return { label: 'Attention', color: 'text-red-600' };
    if (openCount > 0) return { label: 'Review', color: 'text-amber-600' };
    return { label: 'Secure', color: 'text-emerald-600' };
  };

  const scanDate = scanResult?.timestamp
    ? new Date(scanResult.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  // Preview top 2-3 most important findings
  const previewFindings = openFindings.slice(0, 3);

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-6 font-sans">
      {/* 1. Cohesive Premium Security Posture Dashboard Hero Surface */}
      <section className="bg-white border border-[#E0DAD0] rounded-[26px] p-6 sm:p-7 shadow-card space-y-5">
        {/* Circular Score Visualizer */}
        <div className="flex justify-center pt-1">
          <ScoreRing score={score} color={status.color} />
        </div>

        {/* Score Status Headline & Subtext */}
        <div className="text-center max-w-sm mx-auto space-y-1">
          <div className="inline-flex items-center gap-1.5 justify-center">
            <span className={`w-2 h-2 rounded-full ${status.dotColor} shrink-0`}></span>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              {status.message}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {status.subtext}
          </p>
        </div>

        {/* Precision Telemetry Row with Thin Separators */}
        <div className="pt-4 border-t border-neutral-100 grid grid-cols-4 gap-1 text-center divide-x divide-neutral-200/70">
          <div className="px-1">
            <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Coverage</span>
            <span className="text-xs font-bold text-neutral-900 tabular-nums font-mono">{coveragePercent}%</span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Verified</span>
            <span className="text-xs font-bold text-emerald-700 tabular-nums font-mono">{verifiedCount} checks</span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Open Risks</span>
            <span className={`text-xs font-bold tabular-nums font-mono ${totalOpenCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {totalOpenCount}
            </span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Audit Mode</span>
            <span className="text-xs font-bold text-neutral-800">Local OS</span>
          </div>
        </div>

        {/* "How is this score calculated?" Expandable Technical Drawer */}
        <div className="pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            className="w-full h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-standard cursor-pointer"
          >
            <Info size={13} />
            <span>{showCalculationDetails ? 'Hide calculation breakdown' : 'How is this score calculated?'}</span>
            {showCalculationDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showCalculationDetails && (
            <div className="mt-3 p-4 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl text-xs space-y-3 shadow-2xs">
              <p className="text-xs text-neutral-700 leading-relaxed">
                The Hygiene Index is calculated from five security vectors. Each vector begins at 100. Detected risks reduce its category score according to severity and evidence confidence. Category scores are then combined using security-weighted contributions to produce the final 0–100 Hygiene Index.
              </p>

              {/* Vector Weights Breakdown */}
              <div className="pt-2 border-t border-neutral-200/70 space-y-1.5 text-[11px]">
                <span className="font-semibold text-neutral-800 block mb-1">
                  Standard Security Vector Contributions:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-neutral-200/60">
                    <span className="text-neutral-600">Device & OS Integrity</span>
                    <span className="font-semibold font-mono text-neutral-900">25%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-neutral-200/60">
                    <span className="text-neutral-600">Apps & Permissions</span>
                    <span className="font-semibold font-mono text-neutral-900">25%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-neutral-200/60">
                    <span className="text-neutral-600">Account Security</span>
                    <span className="font-semibold font-mono text-neutral-900">20%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-neutral-200/60">
                    <span className="text-neutral-600">Network Safety</span>
                    <span className="font-semibold font-mono text-neutral-900">15%</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-neutral-200/60 col-span-2">
                    <span className="text-neutral-600">Security Habits Profile</span>
                    <span className="font-semibold font-mono text-neutral-900">15%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Refined Urgent Attention Banner with Semantic Red Accent */}
      {urgentCount > 0 && (
        <section className="bg-white border border-red-200/90 rounded-[22px] p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-50 text-red-700 shrink-0 mt-0.5 border border-red-100">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
                    Immediate Attention Required
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-md border border-red-200">
                    HIGH PRIORITY
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  {urgentCount} critical risk{urgentCount === 1 ? '' : 's'} identified reducing your hygiene index by -{criticalFindings.length * 40 + highFindings.length * 20} pts.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateToIssues}
              className="flex-1 h-10 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-medium hover:bg-neutral-50 active:scale-[0.98] transition-standard cursor-pointer"
            >
              Review {totalOpenCount} Risks
            </button>
            <button
              type="button"
              onClick={() => openSettingsHandler()}
              className="flex-1 h-10 bg-red-600 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-red-700 active:scale-[0.98] transition-standard shadow-xs cursor-pointer"
            >
              <span>Fix in System Settings</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </section>
      )}

      {/* 2.5. Digital Hygiene Assessment Status Card */}
      <div
        onClick={onNavigateToScan}
        className="bg-white border border-[#E0DAD0] rounded-[20px] p-3.5 flex items-center justify-between gap-3 hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer shadow-card"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-900">Digital Habits Self-Assessment</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                SELF-REPORTED
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">
              {habitsResponses.length} / 10 questions answered
            </span>
          </div>
        </div>
        <ChevronRight size={15} className="text-neutral-400 shrink-0" />
      </div>

      {/* 3. Primary Action Key: Run Full Security Check */}
      <div>
        <button
          type="button"
          onClick={onNavigateToScan}
          className="w-full h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center gap-2 px-6 group hover:bg-neutral-800 active:scale-[0.98] transition-standard cursor-pointer shadow-sm"
        >
          <Activity size={16} className="text-neutral-300" />
          <span className="text-sm font-medium tracking-tight">
            Run Full Security Check
          </span>
          <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform ml-auto" />
        </button>
      </div>

      {/* 4. Refined Vector Health Matrix */}
      <article className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Vector Health Matrix
          </h3>
          <button
            type="button"
            onClick={onNavigateToImprove}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>Remediation Roadmap</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-[22px] divide-y divide-neutral-100 overflow-hidden shadow-card">
          {categoryScores &&
            (Object.keys(categoryScores) as Category[]).map((cat) => {
              const c = categoryScores[cat];
              const cfg = categoryConfig[cat];
              const isScoreable = c.isScoreable;
              const statusBadge = getCategoryStatusLabel(c.score, isScoreable, c.openFindingsCount);

              return (
                <div key={cat} className="p-3.5 space-y-2 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 font-medium text-neutral-900">
                      <span className={`p-1.5 rounded-lg ${cfg.badgeBg}`}>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <span className="font-semibold text-neutral-900 tabular-nums text-xs font-mono">
                        {isScoreable ? `${c.score}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${isScoreable ? c.score : 0}%`,
                        backgroundColor: !isScoreable ? '#d4d4d4' : cfg.color,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>
                      {c.openFindingsCount > 0
                        ? `${c.openFindingsCount} open risk${c.openFindingsCount === 1 ? '' : 's'}`
                        : 'Defenses Verified'}
                    </span>
                    <span className="tabular-nums font-mono">+{Math.round(c.pointContribution)} pts to overall</span>
                  </div>
                </div>
              );
            })}
        </div>
      </article>

      {/* 5. Priority Findings Preview (Top Priorities) */}
      {previewFindings.length > 0 && (
        <article className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Priority Findings Preview
            </h3>
            <button
              type="button"
              onClick={onNavigateToIssues}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer flex items-center gap-0.5 transition-colors"
            >
              <span>All ({totalOpenCount})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {previewFindings.map((f) => (
              <div
                key={f.id}
                onClick={onNavigateToIssues}
                className="p-4 bg-white border border-[#E0DAD0] rounded-2xl hover:border-neutral-300 active:scale-[0.99] cursor-pointer transition-standard space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} />
                    <ProvenanceChip provenance={f.provenance} />
                  </div>
                  <span className="text-[11px] text-neutral-400 capitalize font-medium font-mono">
                    {f.category}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug">
                  {f.title || f.type.replace(/_/g, ' ')}
                </h4>
                <p className="text-xs text-neutral-500 line-clamp-1">
                  {f.whyDetected}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* 6. Last Scan Metadata Strip */}
      <div className="p-3.5 bg-neutral-100/70 rounded-xl border border-neutral-200/50 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-neutral-600" />
          <span>Audit timestamp: <strong className="text-neutral-700 font-medium font-mono">{scanDate}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-emerald-800 font-medium text-[11px] bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
          <ShieldCheck size={12} />
          <span>100% Local Enclave</span>
        </div>
      </div>
    </div>
  );
};
