import React from 'react';
import { LocationData, DayType } from '../../types';
import { useApp } from '../../context/AppContext';
import { predictDay, getBestTimeToday } from '../../services/predictionService';
import { CrowdBadge } from '../common/CrowdBadge';
import { HonestyBadge } from '../common/HonestyBadge';
import { HospitalDisclaimer } from '../common/HospitalDisclaimer';
import { Clock, Users, ArrowRight, Sparkles, Building2, TrendingUp } from 'lucide-react';

interface LocationCardProps {
  location: LocationData;
  onSelect: (locationId: string) => void;
  onPlanVisit: (locationId: string) => void;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (locationId: string) => void;
  showCompareCheckbox?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onSelect,
  onPlanVisit,
  isSelectedForCompare = false,
  onToggleCompare,
  showCompareCheckbox = false,
}) => {
  const { demoClock } = useApp();

  const predictions = predictDay(location, demoClock.dayType, {
    demoCurrentHour: demoClock.hour,
    demoClockTimestamp: Date.now(),
  });

  const currentPred = predictions.find((p) => p.hour === demoClock.hour);
  const isOpenNow = currentPred ? currentPred.isOpen : false;

  const bestTime = getBestTimeToday(location, demoClock.dayType, demoClock.hour);

  // Sparkline data for open slots
  const openSlots = predictions.filter((p) => location.openSlots.includes(p.hour));
  const maxWait = Math.max(10, ...openSlots.map((p) => p.expectedWaitMin));

  // Staff update status
  let staffUpdateLabel = 'No staff update';
  if (location.lastStaffUpdate) {
    const diffMin = Math.floor(Math.max(0, Date.now() - location.lastStaffUpdate.timestamp) / 60000);
    if (diffMin <= 45) {
      staffUpdateLabel = `Staff update: ${diffMin} min ago (queue: ${location.lastStaffUpdate.queueLength})`;
    } else {
      staffUpdateLabel = `Staff update: >45 min ago (expired)`;
    }
  }

  const isHospital = location.id === 'hospital';

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top meta strip */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isOpenNow ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'
              }`}
            />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isOpenNow ? 'Open Now' : 'Closed'}
            </span>
            <span className="text-slate-300">•</span>
            <HonestyBadge size="sm" />
          </div>

          {showCompareCheckbox && onToggleCompare && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800">
              <input
                type="checkbox"
                checked={isSelectedForCompare}
                onChange={() => onToggleCompare(location.id)}
                className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Compare</span>
            </label>
          )}
        </div>

        {/* Title & Description */}
        <h3
          onClick={() => onSelect(location.id)}
          className="text-lg font-extrabold text-slate-900 group-hover:text-blue-700 cursor-pointer transition-colors leading-snug tracking-tight"
        >
          {location.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {location.shortDescription}
        </p>

        {/* Current status highlight box */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Current Wait Estimate
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              {isOpenNow ? (
                <>
                  <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    ~{currentPred?.expectedWaitMin ?? 0}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">min</span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-500">Currently Closed</span>
              )}
            </div>
            {isOpenNow && currentPred && (
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Demand range: {currentPred.lowWaitMin}–{currentPred.highWaitMin}m
              </span>
            )}
          </div>

          <div className="text-right flex flex-col items-end gap-1.5">
            <CrowdBadge level={isOpenNow && currentPred ? currentPred.crowdLevel : 'Closed'} size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">
              {demoClock.hour.toString().padStart(2, '0')}:00 slot
            </span>
          </div>
        </div>

        {/* Today's Wait Sparkline */}
        {openSlots.length > 0 && demoClock.dayType !== 'Sunday' && (
          <div className="mt-4 px-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span>Today's Wait Curve</span>
              <span className="font-mono">{openSlots[0].hour}:00 – {openSlots[openSlots.length - 1].hour + 1}:00</span>
            </div>
            <div className="h-10 w-full flex items-end gap-1 pt-1">
              {openSlots.map((slot) => {
                const heightPct = Math.max(12, Math.round((slot.expectedWaitMin / maxWait) * 100));
                const isCur = slot.hour === demoClock.hour;
                return (
                  <div
                    key={slot.hour}
                    className="flex-1 flex flex-col items-center group/bar relative h-full justify-end"
                    title={`${slot.hour}:00 - ~${slot.expectedWaitMin}m wait`}
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xs transition-all duration-200 ${
                        isCur
                          ? 'bg-blue-600 ring-1 ring-blue-300'
                          : slot.crowdLevel === 'Low'
                          ? 'bg-teal-400/80 hover:bg-teal-500'
                          : slot.crowdLevel === 'Moderate'
                          ? 'bg-amber-400/80 hover:bg-amber-500'
                          : slot.crowdLevel === 'High'
                          ? 'bg-orange-400/80 hover:bg-orange-500'
                          : 'bg-rose-400/80 hover:bg-rose-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Best time today Highlighted Chip */}
        <div className="mt-4 flex items-center justify-between text-xs py-2.5 px-3 rounded-xl bg-teal-50/50 border border-teal-200/60">
          <div className="flex items-center gap-1.5 text-teal-900 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Best time today:</span>
          </div>
          <div>
            {bestTime ? (
              <span className="font-extrabold text-teal-950 font-mono text-xs">
                {bestTime.hour.toString().padStart(2, '0')}:00 (~{bestTime.waitMin}m)
              </span>
            ) : (
              <span className="text-slate-400 text-xs">No slots available</span>
            )}
          </div>
        </div>

        {/* Staff update note */}
        <div className="text-[11px] text-slate-500 italic mt-2 px-1">
          {staffUpdateLabel}
        </div>

        {/* Hospital Disclaimer on card if hospital */}
        {isHospital && (
          <div className="mt-3.5">
            <HospitalDisclaimer />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(location.id)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 py-2 px-2.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          View Full Breakdown
        </button>
        <button
          type="button"
          onClick={() => onPlanVisit(location.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <span>Plan Visit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
