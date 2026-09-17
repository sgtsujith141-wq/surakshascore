import React, { useState } from 'react';
import { useScan } from '../context/ScanContext';
import { HABITS_QUESTION_BANK } from '../lib/collectors/habitsCollector';
import {
  ArrowRight,
  RefreshCw,
  Check,
  AlertTriangle,
  Smartphone,
  Layers,
  Wifi,
  Mail,
  UserCheck,
  ShieldCheck,
  Activity,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';
import { ScanStage } from '../types';

interface ScanScreenProps {
  onNavigateToIssues: () => void;
  onNavigateToImprove: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onNavigateToIssues,
  onNavigateToImprove,
}) => {
  const {
    isScanning,
    stageProgress,
    activeStage,
    runScan,
    scanResult,
    habitsResponses,
    saveHabitResponse,
  } = useScan();

  const [scanSubTab, setScanSubTab] = useState<'device' | 'habits' | 'permissions'>('device');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const completedCount = stageProgress.filter((s) => s.status === 'done' || s.status === 'skipped').length;
  const progressPercent = Math.round((completedCount / Math.max(1, stageProgress.length)) * 100);

  const breakdown = scanResult?.scoreBreakdown;
  const signals = scanResult?.signals ?? [];
  const findings = scanResult?.findings ?? [];
  const openFindings = findings.filter((f) => f.status === 'open');
  const criticalCount = openFindings.filter((f) => f.severity === 'critical').length;
  const highCount = openFindings.filter((f) => f.severity === 'high').length;
  const medCount = openFindings.filter((f) => f.severity === 'medium').length;
  const lowCount = openFindings.filter((f) => f.severity === 'low').length;

  const appSignals = signals.filter((s) => s.category === 'apps');

  const categoryConfig: Record<ScanStage, { name: string; desc: string; icon: React.ReactNode; color: string; badgeBg: string }> = {
    device: {
      name: 'Device Security',
      desc: 'Screen lock, disk encryption state, and OS patch recency',
      icon: <Smartphone size={16} />,
      color: '#2563eb', // Blue
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    },
    apps: {
      name: 'Apps & Permissions',
      desc: 'Sensitive permission combinations and high-risk declared capabilities',
      icon: <Layers size={16} />,
      color: '#7c3aed', // Purple
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    },
    network: {
      name: 'Network Safety',
      desc: 'Wi-Fi transport encryption (WPA2/WPA3) and active VPN tunneling',
      icon: <Wifi size={16} />,
      color: '#0d9488', // Teal
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    },
    account: {
      name: 'Account Security',
      desc: 'Credential hygiene baseline and k-anonymity breach inquiries',
      icon: <Mail size={16} />,
      color: '#d97706', // Amber
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    habits: {
      name: 'Security Habits',
      desc: 'Password entropy standards and offline multi-factor readiness',
      icon: <UserCheck size={16} />,
      color: '#16a34a', // Green
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
  };

  // Signal values are `unknown`: booleans, strings, arrays of installed apps,
  // or nested objects such as { enabled, lockType }. String() on those renders
  // the literal text "[object Object]", so format by shape instead.
  const formatSignalValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'unavailable';
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).filter(
        ([, v]) => v !== null && v !== undefined && typeof v !== 'object'
      );
      if (entries.length === 0) return `${Object.keys(value as object).length} fields`;
      return entries.map(([k, v]) => `${k}=${String(v)}`).join(' ');
    }
    return String(value);
  };

  const getStageTelemetry = (stage: ScanStage) => {
    const stageSignals = signals.filter((s) => s.category === stage);
    return stageSignals.map((s) => ({
      key: s.id,
      value: formatSignalValue(s.value),
      provenance: s.provenance,
    }));
  };

  // Habits Response Map
  const responseMap = new Map<string, string[]>();
  for (const r of habitsResponses) {
    responseMap.set(r.questionId, r.selectedOptionIds);
  }

  const handleSelectHabitOption = (questionId: string, optionId: string) => {
    saveHabitResponse({
      questionId,
      selectedOptionIds: [optionId],
      answeredAt: new Date().toISOString(),
    });
    // Auto advance to next question
    if (currentQuestionIdx < HABITS_QUESTION_BANK.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const currentQ = HABITS_QUESTION_BANK[currentQuestionIdx];
  const selectedOptionForCurrent = currentQ ? responseMap.get(currentQ.id)?.[0] : undefined;

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-6 font-sans">
      {/* Sub-tab Navigation */}
      <div className="grid grid-cols-3 gap-1 bg-neutral-200/60 p-1 rounded-xl border border-[#E0DAD0]">
        <button
          type="button"
          onClick={() => setScanSubTab('device')}
          className={`h-9 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            scanSubTab === 'device'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Smartphone size={13} />
          <span>Device Check</span>
        </button>

        <button
          type="button"
          onClick={() => setScanSubTab('habits')}
          className={`h-9 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            scanSubTab === 'habits'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <UserCheck size={13} />
          <span>Self-Assessment</span>
        </button>

        <button
          type="button"
          onClick={() => setScanSubTab('permissions')}
          className={`h-9 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-standard cursor-pointer ${
            scanSubTab === 'permissions'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Layers size={13} />
          <span>App Risk</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DEVICE SECURITY CHECK (Full Multi-Vector Scan)                 */}
      {/* ========================================================================= */}
      {scanSubTab === 'device' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-[#E0DAD0] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Full Security Check
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isScanning ? 'Evaluating hardware, permissions, and credential telemetry...' : 'Live audit report & diagnostics'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => runScan()}
              disabled={isScanning}
              className="h-8 px-3 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-xs font-medium hover:bg-neutral-50 flex items-center gap-1.5 active:scale-[0.98] transition-standard disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={12} className={isScanning ? 'animate-spin text-neutral-900' : 'text-neutral-500'} />
              <span>{isScanning ? 'Auditing...' : 'Re-run Scan'}</span>
            </button>
          </div>

          {/* Fluid Precision Progress Card */}
          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-3 shadow-card">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-neutral-700 flex items-center gap-1.5">
                <Activity size={14} className={isScanning ? 'text-blue-600 animate-pulse' : 'text-neutral-500'} />
                <span>Audit Pipeline Progress</span>
              </span>
              <span className="text-neutral-900 font-semibold font-mono tabular-nums">{progressPercent}%</span>
            </div>

            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-xs text-neutral-500 flex justify-between">
              <span>{completedCount} of 5 vectors evaluated</span>
              <span className="flex items-center gap-1 text-emerald-800 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck size={13} />
                <span>100% On-Device Engine</span>
              </span>
            </div>
          </div>

          {/* 5 Sequential Stage Breakdown with Real Telemetry Chips */}
          <div className="space-y-2.5">
            {stageProgress.map((stage) => {
              const isCurrent = activeStage === stage.stage && isScanning;
              const isDone = stage.status === 'done';
              const isSkipped = stage.status === 'skipped';
              const cfg = categoryConfig[stage.stage];
              const telemetry = getStageTelemetry(stage.stage);

              return (
                <div
                  key={stage.stage}
                  className={`p-4 rounded-[22px] border transition-standard space-y-2.5 ${
                    isCurrent
                      ? 'bg-white border-neutral-900 shadow-card'
                      : isDone
                      ? 'bg-white border-[#E0DAD0] shadow-card'
                      : isSkipped
                      ? 'bg-neutral-50/50 border-dashed border-neutral-300 opacity-60'
                      : 'bg-neutral-50/70 border-neutral-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${isCurrent ? 'bg-neutral-900 text-white border-neutral-900' : cfg.badgeBg}`}>
                        {cfg.icon}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-900">
                          {cfg.name}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {isCurrent
                            ? 'Probing live subsystem signals...'
                            : isDone
                            ? cfg.desc
                            : isSkipped
                            ? stage.reasonIfSkipped || 'Restricted by platform sandbox'
                            : 'Waiting in pipeline'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCurrent && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-neutral-900 text-white rounded-full animate-pulse">
                          Checking
                        </span>
                      )}
                      {isDone && stage.findingsCount > 0 && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-1">
                          <AlertTriangle size={11} /> {stage.findingsCount} risk{stage.findingsCount === 1 ? '' : 's'}
                        </span>
                      )}
                      {isDone && stage.findingsCount === 0 && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md flex items-center gap-1">
                          <Check size={12} /> Clean
                        </span>
                      )}
                      {isSkipped && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 bg-neutral-100 text-neutral-400 rounded-md">
                          Excluded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real Telemetry Sub-indicators */}
                  {isDone && telemetry.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 flex-wrap">
                      {telemetry.slice(0, 3).map((t) => (
                        <span
                          key={t.key}
                          className="text-[10px] bg-neutral-50 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded font-mono"
                        >
                          {t.key.replace(/^(device_|network_|account_|habits_|apps_)/, '')}: {t.value.length > 18 ? `${t.value.slice(0, 16)}...` : t.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completed Audit Results Section */}
          {breakdown && !isScanning && (
            <div className="space-y-6 pt-2">
              <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-xs text-neutral-500 font-medium">Audit Hygiene Index</span>
                    <div className="text-3xl font-bold text-neutral-900 tabular-nums font-mono">
                      {breakdown.overallScore} <span className="text-xs text-neutral-400 font-normal font-sans">/ 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 font-medium">Posture Classification</span>
                    <div className="text-sm font-semibold text-neutral-900 mt-0.5 bg-neutral-100 px-2.5 py-1 rounded-lg inline-block">
                      Grade {breakdown.grade}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {breakdown.explanation}
                </p>

                {/* Severity Breakdown Badges Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                  <div className="p-2.5 rounded-xl border border-red-100 bg-red-50/50">
                    <div className="font-bold text-red-700 text-base tabular-nums font-mono">{criticalCount}</div>
                    <div className="text-[10px] text-red-800 font-medium uppercase mt-0.5">Critical</div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/50">
                    <div className="font-bold text-amber-700 text-base tabular-nums font-mono">{highCount}</div>
                    <div className="text-[10px] text-amber-800 font-medium uppercase mt-0.5">High</div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/30">
                    <div className="font-bold text-amber-600 text-base tabular-nums font-mono">{medCount}</div>
                    <div className="text-[10px] text-amber-800 font-medium uppercase mt-0.5">Medium</div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <div className="font-bold text-neutral-700 text-base tabular-nums font-mono">{lowCount}</div>
                    <div className="text-[10px] text-neutral-600 font-medium uppercase mt-0.5">Low</div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="pt-3 border-t border-neutral-100 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onNavigateToIssues}
                    className="flex-1 h-11 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] transition-standard flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>View {openFindings.length} Security Issues</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateToImprove}
                    className="h-11 px-4 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-medium hover:bg-neutral-50 active:scale-[0.98] transition-standard cursor-pointer"
                  >
                    Remediate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DIGITAL HYGIENE SELF-ASSESSMENT                                */}
      {/* ========================================================================= */}
      {scanSubTab === 'habits' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-[#E0DAD0] pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Digital Hygiene Self-Assessment
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
                  SELF-REPORTED
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Answer 10 behavioral hygiene questions to evaluate habits and update your score.
              </p>
            </div>
          </div>

          {/* Assessment Progress */}
          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-3 shadow-card">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-neutral-700">
                Question {currentQuestionIdx + 1} of {HABITS_QUESTION_BANK.length}
              </span>
              <span className="text-neutral-900 font-semibold font-mono">
                {habitsResponses.length} answered
              </span>
            </div>

            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.round(((currentQuestionIdx + 1) / HABITS_QUESTION_BANK.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Current Question Card */}
          {currentQ && (
            <div className="bg-white p-5 sm:p-6 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Section: {currentQ.section.toUpperCase()}
                </span>
                <h3 className="text-base font-semibold text-neutral-900">
                  {currentQ.title}
                </h3>
                {currentQ.subtitle && (
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {currentQ.subtitle}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOptionForCurrent === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectHabitOption(currentQ.id, opt.id)}
                      className={`p-3.5 rounded-xl border transition-standard cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white text-neutral-800 border-neutral-200/90 hover:border-neutral-400 hover:bg-neutral-50/50'
                      }`}
                    >
                      <span className="text-xs font-medium leading-relaxed">{opt.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-white bg-white text-neutral-900' : 'border-neutral-300'
                      }`}>
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  className="h-9 px-3 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentQuestionIdx < HABITS_QUESTION_BANK.length - 1) {
                        setCurrentQuestionIdx((prev) => prev + 1);
                      }
                    }}
                    className="h-9 px-3 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                  >
                    <SkipForward size={12} />
                    <span>Skip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      runScan();
                      setScanSubTab('device');
                    }}
                    className="h-9 px-4 bg-emerald-700 text-white rounded-xl text-xs font-medium hover:bg-emerald-800 active:scale-[0.98] transition-standard cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>Update Hygiene Index</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: APP & PERMISSION RISK SCANNER                                 */}
      {/* ========================================================================= */}
      {scanSubTab === 'permissions' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-[#E0DAD0] pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  App & Permission Risk Scanner
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                  DEMO SIGNALS
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Audit declared high-risk permissions and background capabilities across installed packages.
              </p>
            </div>
          </div>

          {/* Sensitive Capabilities Matrix */}
          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              High-Risk Permission Matrix
            </h4>

            <div className="space-y-2.5">
              <div className="p-3.5 bg-neutral-50/70 border border-neutral-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Background SMS & OTP Access</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-red-800 rounded">HIGH RISK</span>
                  </div>
                  <p className="text-neutral-500 mt-0.5">
                    Permits reading inbound SMS messages containing banking 2FA codes.
                  </p>
                </div>
                <span className="font-mono text-neutral-700 font-medium">READ_SMS</span>
              </div>

              <div className="p-3.5 bg-neutral-50/70 border border-neutral-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Background Fine Location</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">MEDIUM</span>
                  </div>
                  <p className="text-neutral-500 mt-0.5">
                    Continuous GPS tracking of user location coordinates.
                  </p>
                </div>
                <span className="font-mono text-neutral-700 font-medium">ACCESS_FINE_LOCATION</span>
              </div>

              <div className="p-3.5 bg-neutral-50/70 border border-neutral-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Camera & Microphone Access</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">MEDIUM</span>
                  </div>
                  <p className="text-neutral-500 mt-0.5">
                    Direct audio recording and video capture capabilities.
                  </p>
                </div>
                <span className="font-mono text-neutral-700 font-medium">CAMERA / RECORD_AUDIO</span>
              </div>
            </div>

            {/* Observed Signals */}
            {appSignals.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <span className="text-[11px] font-semibold text-neutral-700 block">
                  Observed Application Telemetry Signals:
                </span>
                <div className="space-y-1.5">
                  {appSignals.map((s) => (
                    <div key={s.id} className="p-2.5 bg-white border border-neutral-200/80 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-mono text-neutral-800">{s.id}</span>
                      <span className="font-mono text-neutral-500 text-[11px]">{String(s.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
