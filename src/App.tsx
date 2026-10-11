import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SavedPlansDrawer } from './components/plan/SavedPlansDrawer';
import { HomePage } from './pages/HomePage';
import { PlanVisitView } from './components/plan/PlanVisitView';
import { CrowdForecastPage } from './pages/CrowdForecastPage';
import { LocationsPage } from './pages/LocationsPage';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { AdminPage } from './pages/AdminPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { Sparkles, Calendar, Clock, MapPin, Shield, Info, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { toastMessage } = useApp();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [planInitialLocationId, setPlanInitialLocationId] = useState<string | undefined>(undefined);
  const [isPlansDrawerOpen, setIsPlansDrawerOpen] = useState<boolean>(false);

  // Navigation handlers
  const handleNavigateToPlan = (locId?: string) => {
    setPlanInitialLocationId(locId);
    setActiveTab('plan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLocation = (locId: string) => {
    setSelectedLocationId(locId);
    setActiveTab('locations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToForecast = (locId?: string) => {
    if (locId) setSelectedLocationId(locId);
    setActiveTab('forecast');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0B1B3A] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'locations') setSelectedLocationId(null);
        }}
        openPlansDrawer={() => setIsPlansDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 md:pb-12">
        {activeTab === 'home' && (
          <HomePage
            onNavigateToPlan={handleNavigateToPlan}
            onNavigateToLocation={handleNavigateToLocation}
            onNavigateToForecast={handleNavigateToForecast}
          />
        )}

        {activeTab === 'plan' && (
          <PlanVisitView
            initialLocationId={planInitialLocationId}
            onOpenPlansDrawer={() => setIsPlansDrawerOpen(true)}
          />
        )}

        {activeTab === 'forecast' && (
          <CrowdForecastPage
            initialLocationId={selectedLocationId || undefined}
            onNavigateToPlan={handleNavigateToPlan}
          />
        )}

        {activeTab === 'locations' && (
          selectedLocationId ? (
            <LocationDetailPage
              locationId={selectedLocationId}
              onBack={() => setSelectedLocationId(null)}
              onPlanVisit={handleNavigateToPlan}
            />
          ) : (
            <LocationsPage
              onSelectLocation={(id) => setSelectedLocationId(id)}
              onPlanVisit={handleNavigateToPlan}
            />
          )
        )}

        {activeTab === 'admin' && <AdminPage />}

        {activeTab === 'how-it-works' && <HowItWorksPage />}
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedLocationId(null);
        }}
      />

      {/* Saved Plans Slide-over Drawer */}
      <SavedPlansDrawer
        isOpen={isPlansDrawerOpen}
        onClose={() => setIsPlansDrawerOpen(false)}
        onNavigateToPlan={() => {
          setIsPlansDrawerOpen(false);
          setActiveTab('plan');
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
