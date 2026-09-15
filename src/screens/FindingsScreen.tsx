import React, { useState, useMemo } from 'react';
import { useScan } from '../context/ScanContext';
import { FindingCard } from '../components/ui/FindingCard';
import { Category, Severity } from '../types';
import { Search, CheckCircle2, ArrowRight, Filter } from 'lucide-react';

interface FindingsScreenProps {
  onNavigateToImprove?: () => void;
}

export const FindingsScreen: React.FC<FindingsScreenProps> = ({
  onNavigateToImprove,
}) => {
  const { scanResult, markFindingFixed, openSettingsHandler } = useScan();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const findings = scanResult?.findings ?? [];

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (f.title || f.type).toLowerCase().includes(query);
        const matchesWhy = (f.whyDetected || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesWhy) return false;
      }
      return true;
    });
  }, [findings, selectedCategory, selectedSeverity, searchQuery]);

  const openCount = findings.filter((f) => f.status === 'open').length;
  const criticalCount = findings.filter((f) => f.status === 'open' && f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.status === 'open' && f.severity === 'high').length;

  const categoryLabels: Record<string, string> = {
    all: 'All',
    device: 'Device',
    apps: 'Apps',
    network: 'Network',
    account: 'Account',
    habits: 'Habits',
  };

  const severityLabels: Record<string, string> = {
    all: 'All',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-5 font-sans">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Security Issues
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {openCount} active finding{openCount === 1 ? '' : 's'} identified across attack surfaces
          </p>
        </div>
        {criticalCount + highCount > 0 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
            {criticalCount + highCount} Urgent
          </span>
        )}
      </div>

      {/* Action Plan Quick Banner */}
      {openCount > 0 && onNavigateToImprove && (
        <div className="p-3.5 bg-white border border-neutral-200/80 rounded-2xl flex items-center justify-between text-xs shadow-xs">
          <span className="text-neutral-700 font-medium">
            Looking for a prioritized step-by-step fix guide?
          </span>
          <button
            type="button"
            onClick={onNavigateToImprove}
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-700 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            <span>Action Plan</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Sleek Search & Native Pill Controls */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, permissions, or apps..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-neutral-200/90 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-standard shadow-xs"
          />
        </div>

        {/* Category Horizontal Segmented Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/50">
          {(['all', 'device', 'apps', 'network', 'account', 'habits'] as const).map((cat) => {
            const count =
              cat === 'all'
                ? findings.filter((f) => f.status === 'open').length
                : findings.filter((f) => f.status === 'open' && f.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-8 px-3 rounded-lg font-medium whitespace-nowrap transition-standard cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {categoryLabels[cat]}{count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Severity Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs px-0.5">
          <span className="text-neutral-400 mr-1 text-[11px] font-medium flex items-center gap-1">
            <Filter size={11} /> Severity:
          </span>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`h-7 px-2.5 rounded-lg text-xs transition-standard cursor-pointer border ${
                selectedSeverity === sev
                  ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                  : 'bg-white text-neutral-600 border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              {severityLabels[sev]}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-8 bg-white border border-neutral-200/80 rounded-2xl text-center space-y-2 shadow-xs">
          <CheckCircle2 size={26} className="mx-auto text-emerald-600" />
          <div className="text-sm font-semibold text-neutral-900">No Issues Match Filters</div>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            All inspected areas in this filter criteria meet standard security requirements.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              index={idx + 1}
              onFix={markFindingFixed}
              onOpenSettings={openSettingsHandler}
            />
          ))}
        </div>
      )}
    </div>
  );
};
