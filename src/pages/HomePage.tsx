import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocationCard } from '../components/home/LocationCard';
import { CompareLocationsStrip } from '../components/home/CompareLocationsStrip';
import { HonestyBadge } from '../components/common/HonestyBadge';
import { DayDial } from '../components/home/DayDial';
import {
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  Zap,
  RotateCcw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { predictDay } from '../services/predictionService';

interface HomePageProps {
  onNavigateToPlan: (locationId?: string) => void;
  onNavigateToLocation: (locationId: string) => void;
  onNavigateToForecast: (locationId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToPlan,
  onNavigateToLocation,
  onNavigateToForecast,
}) => {
  const {
    locations,
    demoClock,
    setDemoClockOverride,
    resetDemoClockToReal,
    addEvent,
    addStaffUpdate,
    resetScenarioDemo,
    showToast,
  } = useApp();

  const [dialLocId, setDialLocId] = useState<string>(locations[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'open' | 'low'>('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const selectedDialLocation = locations.find((l) => l.id === dialLocId) || locations[0];

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  // Scenario Triggers
  const handleTriggerScenario = (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    if (scenarioKey === 'lunch') {
      setDemoClockOverride('Weekday', 13, 0);
      showToast('Scenario active: Weekday Lunch Rush (13:00) simulated across all venues.');
    } else if (scenarioKey === 'morning') {
      setDemoClockOverride('Weekday', 9, 0);
      showToast('Scenario active: Quiet Morning (09:00) off-peak window simulated.');
    } else if (scenarioKey === 'deadline') {
      setDemoClockOverride('Weekday', 11, 0);
      addEvent('admin', {
        name: 'Tuition Fee Deadline Surge',
        startHour: 10,
        endHour: 14,
        multiplier: 1.35,
      });
      showToast('Scenario active: Fee Deadline Day (+35% demand surge) applied to Admin Office.');
    } else if (scenarioKey === 'counter-down') {
      setDemoClockOverride('Weekday', 12, 15);
      addStaffUpdate('canteen', 32);
      showToast('Scenario active: Live staff update entered (32 customers in queue at Canteen).');
    } else if (scenarioKey === 'reset') {
      setActiveScenario(null);
      resetScenarioDemo();
    }
  };

  // Filter locations based on query and filter tab
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.purposes.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const predictions = predictDay(loc, demoClock.dayType, {
      demoCurrentHour: demoClock.hour,
      demoClockTimestamp: Date.now(),
    });
    const currentSlot = predictions.find((p) => p.hour === demoClock.hour);
    const isOpen = currentSlot ? currentSlot.isOpen : false;
    const isLowCrowd = currentSlot ? currentSlot.crowdLevel === 'Low' : false;

    if (filterType === 'open') return isOpen;
    if (filterType === 'low') return isOpen && isLowCrowd;
    return true;
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* 1. HERO (Full-Width Deep Navy #0B1B3A with Day Dial) */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B1B3A] text-white border border-slate-800 shadow-2xl p-6 sm:p-10 lg:p-14">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Text Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold tracking-tight">
                AI-Assisted Queue Forecasting
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 px-2.5 py-1 text-xs">
                Illustrative demo data
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08] font-sans">
              Know when to go.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Queue monitors tell you how long lines are after you arrive. Waqtly simulates arrival demand and service capacity beforehand so you can schedule visits when queues are virtually zero.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateToPlan(dialLocId)}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#1F4FE0] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all cursor-pointer border border-blue-400/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Plan My Visit</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToForecast(dialLocId)}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-sm transition-all hover:text-white cursor-pointer"
              >
                <Clock className="w-4 h-4 text-blue-400" />
                <span>See forecast</span>
              </button>
            </div>
          </div>

          {/* Right Hero Visual Column: Signature "Day Dial" (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center pt-2 lg:pt-0">
            <div className="text-center mb-3">
              <span className="text-[11px] uppercase tracking-widest font-mono text-blue-300 font-bold">
                24-Hour Day Dial
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Hover or tap any segment to explore hourly crowd density
              </p>
            </div>

            {/* The Dial Visual */}
            <DayDial
              location={selectedDialLocation}
              dayType={demoClock.dayType}
              currentHour={demoClock.hour}
              currentMinute={demoClock.minute}
              onSelectHour={(h) => onNavigateToPlan(selectedDialLocation.id)}
            />

            {/* Location Switcher Pill Tabs Below Dial */}
            <div className="mt-5 flex flex-wrap justify-center gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
              {locations.map((loc) => {
                const isSelected = loc.id === dialLocId;
                const shortName =
                  loc.id === 'canteen'
                    ? 'Canteen'
                    : loc.id === 'admin'
                    ? 'Admin Office'
                    : loc.id === 'hospital'
                    ? 'Hospital OPD'
                    : 'Bank Desk';
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setDialLocId(loc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK DEMO SCENARIOS (The live demo moment) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Try a scenario (demo)
              </h2>
              <p className="text-xs text-slate-500">
                Trigger instant live conditions to test how Waqtly dynamically shifts the Day Dial, wait curves, and visit scoring
              </p>
            </div>
          </div>

          {activeScenario && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Scenario active
            </span>
          )}
        </div>

        {/* Scenario Chips Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleTriggerScenario('lunch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeScenario === 'lunch'
                ? 'bg-orange-50 border-orange-300 text-orange-900 ring-2 ring-orange-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span>Lunch rush</span>
            <span className="text-[10px] text-slate-400 font-mono">(13:00)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerScenario('morning')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeScenario === 'morning'
                ? 'bg-teal-50 border-teal-300 text-teal-900 ring-2 ring-teal-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span>Quiet morning</span>
            <span className="text-[10px] text-slate-400 font-mono">(09:00)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerScenario('deadline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeScenario === 'deadline'
                ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span>Fee deadline day</span>
            <span className="text-[10px] text-slate-400 font-mono">(+35% surge)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerScenario('counter-down')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeScenario === 'counter-down'
                ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span>Staff update: queue surge</span>
            <span className="text-[10px] text-slate-400 font-mono">(32 in line)</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => handleTriggerScenario('reset')}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Back to normal</span>
          </button>
        </div>
      </section>

      {/* Compare Locations Strip (if user selected any) */}
      {compareIds.length > 0 && (
        <CompareLocationsStrip
          selectedLocationIds={compareIds}
          onRemoveLocation={(id) => setCompareIds((prev) => prev.filter((i) => i !== id))}
          onClearAll={() => setCompareIds([])}
          onPlanVisit={(id) => onNavigateToPlan(id)}
        />
      )}

      {/* Locations Section Header + Filters */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Demo Service Locations
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {locations.length} supported
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current demo clock: <strong className="text-slate-800">{demoClock.dayType}</strong> at{' '}
              <strong className="text-slate-800 font-mono">
                {demoClock.hour.toString().padStart(2, '0')}:00
              </strong>
            </p>
          </div>

          {/* Search box & filter buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search location or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle Buttons */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('open')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'open'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open now
              </button>
              <button
                type="button"
                onClick={() => setFilterType('low')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'low'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Low crowd
              </button>
            </div>
          </div>
        </div>

        {/* Location Cards Grid */}
        {filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLocations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                onSelect={(id) => onNavigateToLocation(id)}
                onPlanVisit={(id) => onNavigateToPlan(id)}
                isSelectedForCompare={compareIds.includes(loc.id)}
                onToggleCompare={handleToggleCompare}
                showCompareCheckbox={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            {/* Friendly inline SVG empty illustration */}
            <svg
              className="w-16 h-16 mx-auto text-slate-300"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="32" cy="32" r="26" strokeDasharray="4 4" />
              <circle cx="32" cy="32" r="14" fill="#F1F5F9" />
              <path d="M32 24v8l6 3" stroke="#64748B" strokeLinecap="round" />
            </svg>
            <h3 className="text-sm font-bold text-slate-900">No locations matched your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing your search query or switching the filter to "All" or updating the demo clock.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Feature Value Props Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200/80">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Demand Sensitivity Range</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every predicted wait comes with an explicit range testing ±15% higher or lower customer volume, giving you honest operational margins.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Staff Update Backlog Decays</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            When staff enter queue lengths on location, predictions incorporate that backlog for up to 45 minutes before gracefully reverting to baseline models.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Deterministic & Auditable</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Built with clear, transparent mathematical formulas (arrivals, active counters, service minutes) so staff and visitors understand every reason.
          </p>
        </div>
      </section>
    </div>
  );
};
