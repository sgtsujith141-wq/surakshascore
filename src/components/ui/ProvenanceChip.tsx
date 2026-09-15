import React from 'react';
import { Provenance } from '../../types';
import { Check } from 'lucide-react';

interface ProvenanceChipProps {
  provenance: Provenance;
}

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({
  provenance,
}) => {
  switch (provenance) {
    case 'VERIFIED':
      return (
        <span className="text-[11px] font-sans font-medium text-emerald-800 border border-emerald-200/80 bg-emerald-50/70 px-2 py-0.5 rounded-md tracking-tight inline-flex items-center gap-1">
          <Check size={11} className="text-emerald-700" />
          <span>Verified by OS</span>
        </span>
      );
    case 'PERMISSION_BASED':
      return (
        <span className="text-[11px] font-sans font-medium text-purple-800 border border-purple-200/80 bg-purple-50/70 px-2 py-0.5 rounded-md tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          <span>App Permission</span>
        </span>
      );
    case 'SELF_REPORTED':
      return (
        <span className="text-[11px] font-sans font-medium text-indigo-800 border border-indigo-200/80 bg-indigo-50/70 px-2 py-0.5 rounded-md tracking-tight inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rotate-45 bg-indigo-600 inline-block"></span>
          <span>Self-Reported</span>
        </span>
      );
    case 'UNAVAILABLE':
      return (
        <span className="text-[11px] font-sans font-medium text-neutral-400 border border-dashed border-neutral-200 bg-neutral-50 px-2 py-0.5 rounded-md tracking-tight inline-flex items-center gap-1">
          <span>—</span>
          <span>Unavailable</span>
        </span>
      );
  }
};
