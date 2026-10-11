import React from 'react';
import { useApp } from '../context/AppContext';
import { predictDay, getBestTimeToday } from '../services/predictionService';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { HonestyBadge } from '../components/common/HonestyBadge';
import { HospitalDisclaimer } from '../components/common/HospitalDisclaimer';
import { HourlyForecastChart } from '../components/charts/HourlyForecastChart';
import { SmartCounterCard } from '../components/details/SmartCounterCard';
import { ActualWaitTracker } from '../components/details/ActualWaitTracker';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Users,
  Timer,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LocationDetailPageProps {
  locationId: string;
  onBack: () => void;
  onPlanVisit: (locationId: string) => void;
}

export const LocationDetailPage: React.FC<LocationDetailPageProps> = ({
  locationId,
  onBack,
  onPlanVisit,
}) => {
  const { locations, demoClock } = useApp();

  const location = locations.find((l) => l.id === locationId) || locations[0];

  const predictions = predictDay(location, demoClock.dayType, {
    demoCurrentHour: demoClock.hour,
    demoClockTimestamp: Date.now(),
  });

  const currentPred = predictions.find((p) => p.hour === demoClock.hour);
  const isOpenNow = currentPred?.isOpen ?? false;
  const bestTime = getBestTimeToday(location, demoClock.dayType, demoClock.hour);

  const openSlots = predictions.filter((p) => p.isOpen);
  let quietestSlot = openSlots.length > 0 ? [...openSlots].sort((a, b) => a.expectedWaitMin - b.expectedWaitMin)[0] : null;
  let busiestSlot = openSlots.length > 0 ? [...openSlots].sort((a, b) => b.expectedWaitMin - a.expectedWaitMin)[0] : null;

  // Staff update calculation
  let staffUpdateLabel = 'No staff update';
  if (location.lastStaffUpdate) {
    const diffMin = Math.floor(Math.max(0, Date.now() - location.lastStaffUpdate.timestamp) / 60000);
    if (diffMin <= 45) {
      staffUpdateLabel = `Last staff update: ${diffMin} min ago (queue: ${location.lastStaffUpdate.queueLength})`;
    } else {
      staffUpdateLabel = 'Last staff update: >45 min ago (expired)';
    }
  }

  const isHospital = location.id === 'hospital';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all locations</span>
        </button>

        <button
          type="button"
          onClick={() => onPlanVisit(location.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plan Visit to this Location</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isOpenNow ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'
                }`}
              />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isOpenNow ? 'Open Now' : 'Closed'}
              </span>
              <span className="text-slate-300">•</span>
              <HonestyBadge />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {location.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {location.shortDescription}
            </p>
            <div className="text-[11px] text-slate-500 pt-1 font-mono">
              {staffUpdateLabel}
            </div>
          </div>

          {/* Current Hour Quick Stat Box */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 min-w-56 text-right flex flex-col items-start md:items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Current Hour Wait Estimate
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                {isOpenNow ? (
                  <>
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      ~{currentPred?.expectedWaitMin}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">min</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-slate-500">Closed</span>
                )}
              </div>
              {isOpenNow && currentPred && (
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  Range: {currentPred.lowWaitMin}–{currentPred.highWaitMin}m
                </span>
              )}
            </div>

            <div className="mt-3">
              <CrowdBadge level={isOpenNow && currentPred ? currentPred.crowdLevel : 'Closed'} size="sm" />
            </div>
          </div>
        </div>

        {/* Operational Attributes Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Active Counters
            </span>
            <span className="font-mono font-black text-slate-900 text-base mt-0.5 block">
              {location.activeCounters}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Avg Service Time
            </span>
            <span className="font-mono font-black text-slate-900 text-base mt-0.5 block">
              {location.avgServiceMin} min
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Quietest Slot
            </span>
            <span className="font-mono font-bold text-teal-800 text-sm mt-0.5 block">
              {quietestSlot ? `${quietestSlot.hour}:00 (~${quietestSlot.expectedWaitMin}m)` : 'None'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Peak Slot
            </span>
            <span className="font-mono font-bold text-orange-800 text-sm mt-0.5 block">
              {busiestSlot ? `${busiestSlot.hour}:00 (~${busiestSlot.expectedWaitMin}m)` : 'None'}
            </span>
          </div>
        </div>

        {/* Hospital Disclaimer on Location view */}
        {isHospital && <HospitalDisclaimer />}
      </div>

      {/* Today's Forecast Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Today's Forecast Schedule ({demoClock.dayType})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Demo clock: {demoClock.hour}:00
          </span>
        </div>
        <HourlyForecastChart
          predictions={predictions}
          currentHour={demoClock.hour}
        />
      </div>

      {/* Smart Counter Recommendation Card */}
      <SmartCounterCard location={location} />

      {/* Predicted vs Actual Panel */}
      <ActualWaitTracker location={location} />
    </div>
  );
};
