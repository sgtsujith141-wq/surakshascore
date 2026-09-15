import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity | 'success';
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
}) => {
  switch (severity) {
    case 'critical':
      return (
        <span className="text-[11px] font-sans font-semibold px-2 py-0.5 bg-red-50 text-red-700 rounded-md border border-red-200 tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          <span>Critical</span>
        </span>
      );
    case 'high':
      return (
        <span className="text-[11px] font-sans font-semibold px-2 py-0.5 bg-orange-50 text-orange-800 rounded-md border border-orange-200 tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
          <span>High</span>
        </span>
      );
    case 'medium':
      return (
        <span className="text-[11px] font-sans font-medium px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Medium</span>
        </span>
      );
    case 'low':
      return (
        <span className="text-[11px] font-sans font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Low</span>
        </span>
      );
    case 'info':
      return (
        <span className="text-[11px] font-sans font-medium px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md border border-neutral-200 tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
          <span>Info</span>
        </span>
      );
    case 'success':
      return (
        <span className="text-[11px] font-sans font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span>Resolved</span>
        </span>
      );
  }
};
