import React from 'react';
import { LocationData } from '../../types';
import { useApp } from '../../context/AppContext';
import { predictDay, getBestTimeToday } from '../../services/predictionService';
import { CrowdBadge } from '../common/CrowdBadge';
import { Sparkles, X, ArrowRight, BarChart2 } from 'lucide-react';

interface CompareLocationsStripProps {
  selectedLocationIds: string[];
  onRemoveLocation: (id: string) => void;
  onClearAll: () => void;
  onPlanVisit: (id: string) => void;
}

export const CompareLocationsStrip: React.FC<CompareLocationsStripProps> = ({
  selectedLocationIds,
  onRemoveLocation,
  onClearAll,
  onPlanVisit,
}) => {
  const { locations, demoClock } = useApp();

  if (selectedLocationIds.length === 0) return null;

  const compareList = locations.filter((l) => selectedLocationIds.includes(l.id));

  return (
    <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-sm space-y-4 animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Location Comparison ({compareList.length} selected)
            </h3>
            <p className="text-xs text-slate-500">
              Side-by-side outlook for {demoClock.dayType} at {demoClock.hour.toString().padStart(2, '0')}:00
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
        >
          Clear comparison
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {compareList.map((loc) => {
          const preds = predictDay(loc, demoClock.dayType, {
            demoCurrentHour: demoClock.hour,
            demoClockTimestamp: Date.now(),
          });
          const curr = preds.find((p) => p.hour === demoClock.hour);
          const isOpen = curr?.isOpen ?? false;
          const bestTime = getBestTimeToday(loc, demoClock.dayType, demoClock.hour);

          return (
            <div
              key={loc.id}
              className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 relative flex flex-col justify-between"
            >
              <button
                type="button"
                onClick={() => onRemoveLocation(loc.id)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60"
                aria-label={`Remove ${loc.name} from comparison`}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="pr-6">
                <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{loc.name}</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Wait now:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {isOpen ? `~${curr?.expectedWaitMin}m` : 'Closed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Crowd level:</span>
                    <CrowdBadge level={isOpen && curr ? curr.crowdLevel : 'Closed'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs text-slate-500">Best time today:</span>
                    <span className="text-xs font-mono font-bold text-teal-800">
                      {bestTime ? `${bestTime.hour.toString().padStart(2, '0')}:00 (~${bestTime.waitMin}m)` : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end">
                <button
                  type="button"
                  onClick={() => onPlanVisit(loc.id)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  <span>Plan for this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
