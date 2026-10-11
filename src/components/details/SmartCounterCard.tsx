import React, { useState } from 'react';
import { LocationData, Counter } from '../../types';
import { CheckCircle2, AlertCircle, Users, ArrowRight, ShieldAlert } from 'lucide-react';

interface SmartCounterCardProps {
  location: LocationData;
}

export const SmartCounterCard: React.FC<SmartCounterCardProps> = ({ location }) => {
  const [selectedPurpose, setSelectedPurpose] = useState<string>(
    location.purposes[0] || ''
  );

  // Specific requirement: Hospital OPD has NO counter data
  if (location.counters === null || location.id === 'hospital') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Smart Counter Recommendation
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 block mb-0.5">
              Counter-level data is not available for this location
            </span>
            Patients are triaged via central registration slips before token allocation.
          </div>
        </div>
      </div>
    );
  }

  // Filter counters serving the selected purpose and currently open
  const eligibleCounters = location.counters.filter(
    (c) => c.isOpen && c.purposes.includes(selectedPurpose)
  );

  // Sort by shortest queue length
  eligibleCounters.sort((a, b) => a.queueLength - b.queueLength);

  const bestCounter = eligibleCounters.length > 0 ? eligibleCounters[0] : null;
  const nextBestCounter = eligibleCounters.length > 1 ? eligibleCounters[1] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Smart Counter Recommendation</h3>
            <p className="text-xs text-slate-500">
              Select your purpose to find the counter with the shortest queue
            </p>
          </div>
        </div>
      </div>

      {/* Purpose Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Select Purpose
        </label>
        <div className="flex flex-wrap gap-2">
          {location.purposes.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPurpose(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedPurpose === p
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation Result */}
      {bestCounter ? (
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/90 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 block">
                Recommended Counter
              </span>
              <h4 className="text-base font-bold text-slate-900">{bestCounter.name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Current queue: <strong className="text-slate-900">{bestCounter.queueLength} people</strong> waiting
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-900 bg-white px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Shortest Queue
            </span>
          </div>

          {nextBestCounter && (
            <div className="pt-2 border-t border-teal-200/60 text-xs text-slate-600 flex items-center justify-between">
              <span>
                Next-best option: <strong className="text-slate-800">{nextBestCounter.name}</strong> ({nextBestCounter.queueLength} in queue)
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>No open counters currently serve the selected purpose ({selectedPurpose}).</span>
        </div>
      )}

      {/* Counter List Summary */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          All Service Counters at Location
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {location.counters.map((c) => (
            <div
              key={c.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                c.isOpen
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-slate-100/60 border-slate-200 text-slate-400'
              }`}
            >
              <div>
                <span className="font-semibold block">{c.name}</span>
                <span className="text-[10px] text-slate-500">
                  {c.purposes.slice(0, 2).join(', ')}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold block">{c.queueLength} in line</span>
                <span className="text-[10px] font-medium">{c.isOpen ? 'Open' : 'Closed'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
