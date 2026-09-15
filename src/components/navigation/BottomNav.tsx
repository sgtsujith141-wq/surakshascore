import React from 'react';
import { Shield, Activity, AlertTriangle, TrendingUp, User } from 'lucide-react';

export type NavTab = 'posture' | 'scan' | 'issues' | 'improve' | 'you';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  openRisksCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  openRisksCount = 0,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'posture', label: 'Posture', icon: <Shield size={20} strokeWidth={activeTab === 'posture' ? 2.2 : 1.8} /> },
    { id: 'scan', label: 'Scan', icon: <Activity size={20} strokeWidth={activeTab === 'scan' ? 2.2 : 1.8} /> },
    {
      id: 'issues',
      label: 'Issues',
      icon: <AlertTriangle size={20} strokeWidth={activeTab === 'issues' ? 2.2 : 1.8} />,
      badge: openRisksCount > 0 ? openRisksCount : undefined,
    },
    { id: 'improve', label: 'Improve', icon: <TrendingUp size={20} strokeWidth={activeTab === 'improve' ? 2.2 : 1.8} /> },
    { id: 'you', label: 'You', icon: <User size={20} strokeWidth={activeTab === 'you' ? 2.2 : 1.8} /> },
  ];

  return (
    <nav
      aria-label="Main Navigation Dock"
      className="fixed bottom-0 left-0 right-0 w-full h-[68px] z-50 bg-[#F5F1E8]/95 backdrop-blur-md border-t border-outline-variant/70 flex items-center justify-around px-2 pb-safe font-sans shadow-subtle"
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeTab(t.id)}
            className="flex-1 max-w-[72px] h-full flex flex-col items-center justify-center gap-1 group py-1 transition-standard cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <div
                className={`flex h-8 w-12 items-center justify-center rounded-xl transition-standard ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 group-hover:text-neutral-800 group-active:scale-95'
                }`}
              >
                {t.icon}
              </div>

              {t.badge !== undefined && (
                <span className="absolute -top-1 -right-0.5 px-1.5 min-w-[17px] h-[17px] bg-red-600 text-white text-[10px] font-sans font-bold flex items-center justify-center rounded-full border-2 border-white shadow-xs">
                  {t.badge}
                </span>
              )}
            </div>

            <span
              className={`text-[11px] font-medium leading-tight transition-standard tracking-tight ${
                isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-500 group-hover:text-neutral-700'
              }`}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
