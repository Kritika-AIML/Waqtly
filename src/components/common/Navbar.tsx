import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Bookmark,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  BarChart2,
  MapPin,
  ShieldCheck,
  HelpCircle,
  Home,
} from 'lucide-react';
import { DemoClockModal } from './DemoClockModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openPlansDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openPlansDrawer }) => {
  const { demoClock, savedPlans, resetDemoClockToReal, isAdminUnlocked } = useApp();
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'plan', label: 'Plan My Visit' },
    { id: 'forecast', label: 'Crowd Forecast' },
    { id: 'locations', label: 'Locations' },
    { id: 'admin', label: 'Admin' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo: Capital 'Waqtly' with Cobalt Accent */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className="group text-left flex items-center gap-1.5 focus:outline-hidden cursor-pointer"
                aria-label="Waqtly Home"
              >
                <div className="flex items-baseline">
                  <span className="text-2xl font-black tracking-tight text-[#0B1B3A] font-sans">
                    Waqtly
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1F4FE0] ml-1 mb-1 group-hover:scale-125 transition-transform" />
                </div>
                <span className="hidden lg:inline-block text-[11px] font-semibold text-slate-500 pl-2.5 border-l border-slate-200">
                  Know when to go.
                </span>
              </button>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                      {item.id === 'admin' && isAdminUnlocked && (
                        <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right actions: Demo clock indicator, My Plans, mobile menu toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Demo Clock Pill */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setIsClockModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    demoClock.isOverridden
                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                  title={
                    demoClock.isOverridden
                      ? 'Demo clock override is active. Click to edit.'
                      : 'Click to simulate a custom day or hour'
                  }
                >
                  <Clock
                    className={`w-3.5 h-3.5 ${
                      demoClock.isOverridden ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  />
                  <span className="font-mono">
                    {demoClock.dayType.slice(0, 3)} {demoClock.hour.toString().padStart(2, '0')}:
                    {demoClock.minute.toString().padStart(2, '0')}
                  </span>
                  {demoClock.isOverridden && (
                    <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-extrabold bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded-xs">
                      Override
                    </span>
                  )}
                </button>

                {demoClock.isOverridden && (
                  <button
                    type="button"
                    onClick={resetDemoClockToReal}
                    className="p-1.5 ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Reset to real time"
                    aria-label="Reset demo clock to real time"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* My Plans Drawer Trigger */}
              <button
                type="button"
                onClick={openPlansDrawer}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
                title="View your saved visit plans"
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">My Plans</span>
                {savedPlans.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white min-w-4">
                    {savedPlans.length}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === 'admin' && isAdminUnlocked && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      Unlocked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Clean & Accessible) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-2xl"
        aria-label="Mobile Bottom Navigation"
      >
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
            activeTab === 'home' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('plan')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
            activeTab === 'plan' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Plan</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('forecast')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
            activeTab === 'forecast' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Forecast</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('locations')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
            activeTab === 'locations' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Places</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('how-it-works')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
            activeTab === 'how-it-works' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>About</span>
        </button>
      </nav>

      {/* Demo Clock Modal */}
      <DemoClockModal isOpen={isClockModalOpen} onClose={() => setIsClockModalOpen(false)} />
    </>
  );
};
