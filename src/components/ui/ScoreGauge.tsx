import React from 'react';
import { QualitativeGrade } from '../../types';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  grade: QualitativeGrade;
  delta?: number; // e.g. +3 vs previous scan
  previousScanDate?: string;
  size?: 'large' | 'compact';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  grade,
  delta = 0,
  size = 'large',
}) => {
  // SVG circular arc parameters
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Grade color theme mapping
  const getGradeTheme = () => {
    switch (grade) {
      case 'Excellent':
        return {
          stroke: '#16A34A',
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          text: 'text-emerald-700',
        };
      case 'Good':
        return {
          stroke: '#0B6174',
          bg: 'bg-teal-50 text-teal-950 border-teal-200',
          badge: 'bg-teal-100 text-teal-800 border-teal-300',
          text: 'text-teal-700',
        };
      case 'Needs Attention':
        return {
          stroke: '#D97706',
          bg: 'bg-amber-50 text-amber-950 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          text: 'text-amber-700',
        };
      case 'At Risk':
        return {
          stroke: '#DC2626',
          bg: 'bg-rose-50 text-rose-950 border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          text: 'text-rose-700',
        };
    }
  };

  const theme = getGradeTheme();

  if (size === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" stroke="#E2E8F0" strokeWidth="5" fill="transparent" />
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke={theme.stroke}
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - score / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute font-bold text-base tnum font-mono-nums text-neutral-950">
            {score}
          </span>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Hygiene</div>
          <div className={`text-sm font-semibold ${theme.text}`}>{grade}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 max-w-[280px] max-h-[280px] mx-auto rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.stroke }}
      />

      {/* Dominant Circular Gauge */}
      <div className="relative w-[210px] h-[210px] flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 190 190">
          {/* Background track */}
          <circle
            cx="95"
            cy="95"
            r={radius}
            stroke="#E2E5EC"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active score meter */}
          <circle
            cx="95"
            cy="95"
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content: Confident 49px+ Numeral (§9.1) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span className="text-hero font-bold tnum tabular-nums text-neutral-950 tracking-tight leading-none">
              {score}
            </span>
            <span className="text-sm font-semibold text-slate-600 ml-1">/100</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <Shield size={13} className={theme.text} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              SurakshaScore
            </span>
          </div>
        </div>
      </div>

      {/* Grade Pill & Delta Comparison */}
      <div className="mt-4 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${theme.badge} shadow-sm`}>
          {grade}
        </span>

        {delta !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              delta > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {delta > 0 ? (
              <TrendingUp size={12} className="text-emerald-600" />
            ) : (
              <TrendingDown size={12} className="text-rose-600" />
            )}
            {delta > 0 ? `+${delta}` : delta} pts vs last scan
          </span>
        )}

        {delta === 0 && (
          <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200">
            <Minus size={12} className="text-slate-400" /> Unchanged
          </span>
        )}
      </div>
    </div>
  );
};
