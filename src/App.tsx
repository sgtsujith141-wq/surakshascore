import React, { useState } from 'react';
import { ScanProvider, useScan } from './context/ScanContext';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav, NavTab } from './components/navigation/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { FindingsScreen } from './screens/FindingsScreen';
import { ImproveScreen } from './screens/ImproveScreen';
import { YouScreen } from './screens/YouScreen';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('posture');
  const { runScan, isScanning, scanResult } = useScan();

  const openRisksCount = (scanResult?.findings ?? []).filter(
    (f) => f.status === 'open' && (f.severity === 'critical' || f.severity === 'high')
  ).length;

  const score = scanResult?.scoreBreakdown.overallScore ?? 84;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary selection:text-on-primary">
      {/* Clean Minimal App Header */}
      <TopBar
        score={score}
        onQuickRescan={() => {
          setCurrentTab('scan');
          runScan();
        }}
        isScanning={isScanning}
      />

      {/* Screen Views with exact top and bottom offsets for fixed bars */}
      <main className="flex-1 w-full pt-16 pb-24 min-h-screen">
        {currentTab === 'posture' && (
          <HomeScreen
            onNavigateToScan={() => {
              setCurrentTab('scan');
              runScan();
            }}
            onNavigateToIssues={() => setCurrentTab('issues')}
            onNavigateToImprove={() => setCurrentTab('improve')}
          />
        )}

        {currentTab === 'scan' && (
          <ScanScreen
            onNavigateToIssues={() => setCurrentTab('issues')}
            onNavigateToImprove={() => setCurrentTab('improve')}
          />
        )}

        {currentTab === 'issues' && (
          <FindingsScreen
            onNavigateToImprove={() => setCurrentTab('improve')}
          />
        )}

        {currentTab === 'improve' && (
          <ImproveScreen
            onNavigateToScan={() => {
              setCurrentTab('scan');
              runScan();
            }}
          />
        )}

        {currentTab === 'you' && <YouScreen />}
      </main>

      {/* Clean 5-Destination Bottom Navigation Dock */}
      <BottomNav
        activeTab={currentTab}
        onChangeTab={setCurrentTab}
        openRisksCount={openRisksCount}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ScanProvider>
      <MainLayout />
    </ScanProvider>
  );
};

export default App;
