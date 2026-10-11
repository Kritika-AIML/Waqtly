import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CrowdBadge } from '../common/CrowdBadge';
import { X, Trash2, Copy, Check, Bookmark, Calendar, Clock, ArrowRight } from 'lucide-react';

interface SavedPlansDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlan: () => void;
}

export const SavedPlansDrawer: React.FC<SavedPlansDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToPlan,
}) => {
  const { savedPlans, removePlan, showToast } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (plan: any) => {
    const text = `Waqtly Plan: ${plan.locationName}\nTarget: ${plan.hour.toString().padStart(2, '0')}:00–${(plan.hour + 1).toString().padStart(2, '0')}:00 (${plan.dayType})\nExpected Wait: ~${plan.expectedWaitMin} min (${plan.crowdLevel})\nPurpose: ${plan.purpose}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(plan.id);
    showToast('Plan summary copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">My Visit Plans</h2>
              <p className="text-xs text-slate-500">
                {savedPlans.length} {savedPlans.length === 1 ? 'plan' : 'plans'} saved
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedPlans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">No saved visit plans yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Use "Plan My Visit" to find the optimal arrival window for any location, then save it here for reference.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToPlan();
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Plan a Visit Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{plan.locationName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-blue-700">{plan.purpose}</span>
                      <span>•</span>
                      <span>Max tolerance: {plan.maxWaitMin}m</span>
                    </div>
                  </div>
                  <CrowdBadge level={plan.crowdLevel} size="sm" />
                </div>

                {/* Timing card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900 font-mono">
                        {plan.hour.toString().padStart(2, '0')}:00 –{' '}
                        {(plan.hour + 1).toString().padStart(2, '0')}:00
                      </span>
                      <span className="text-slate-500 block text-[11px]">{plan.dayType}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                      Expected wait
                    </span>
                    <span className="font-bold text-slate-900 text-sm">~{plan.expectedWaitMin} min</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopy(plan)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
                  >
                    {copiedId === plan.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy summary</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => removePlan(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove plan"
                    aria-label="Remove plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedPlans.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
            <span className="text-[11px] text-slate-500">
              Saved in this browser only (demo storage, not a database)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
