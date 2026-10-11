import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DayType } from '../../types';
import { Clock, RotateCcw, X, Check, Sparkles } from 'lucide-react';

interface DemoClockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoClockModal: React.FC<DemoClockModalProps> = ({ isOpen, onClose }) => {
  const { demoClock, setDemoClockOverride, resetDemoClockToReal } = useApp();

  const [selectedDay, setSelectedDay] = useState<DayType>(demoClock.dayType);
  const [selectedHour, setSelectedHour] = useState<number>(demoClock.hour);

  if (!isOpen) return null;

  const handleApply = () => {
    setDemoClockOverride(selectedDay, selectedHour, 0);
    onClose();
  };

  const handleResetReal = () => {
    resetDemoClockToReal();
    onClose();
  };

  const presets: { label: string; day: DayType; hour: number; desc: string }[] = [
    { label: 'Weekday Lunch Rush', day: 'Weekday', hour: 13, desc: 'Peak canteen & office demand' },
    { label: 'Weekday Morning Opening', day: 'Weekday', hour: 9, desc: 'Early arrivals building up' },
    { label: 'Weekday Afternoon Off-peak', day: 'Weekday', hour: 15, desc: 'Moderate & low queue lengths' },
    { label: 'Saturday Moderate Session', day: 'Saturday', hour: 11, desc: 'Weekend reduced demand multiplier' },
    { label: 'Sunday (Closed)', day: 'Sunday', hour: 12, desc: 'All demo locations closed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clock-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="clock-modal-title" className="text-base font-bold text-slate-900">
                Demo Clock Control
              </h2>
              <p className="text-xs text-slate-500">
                Simulate different hours and days to test peak vs off-peak scenarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700">Current active clock:</span>{' '}
              <span className="font-mono text-slate-900 font-bold ml-1">
                {demoClock.dayType}, {demoClock.hour.toString().padStart(2, '0')}:
                {demoClock.minute.toString().padStart(2, '0')}
              </span>
              {demoClock.isOverridden ? (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  Override Active
                </span>
              ) : (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Real System Time
                </span>
              )}
            </div>
            {demoClock.isOverridden && (
              <button
                type="button"
                onClick={handleResetReal}
                className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to real
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick Test Scenarios
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((preset) => {
                const isActive = selectedDay === preset.day && selectedHour === preset.hour;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedDay(preset.day);
                      setSelectedHour(preset.hour);
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-950'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{preset.label}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {preset.hour.toString().padStart(2, '0')}:00
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{preset.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Day and Hour selection */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Day Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Weekday', 'Saturday', 'Sunday'] as DayType[]).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                      selectedDay === day
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Hour of Day
                </label>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {selectedHour.toString().padStart(2, '0')}:00 –{' '}
                  {(selectedHour + 1).toString().padStart(2, '0')}:00
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetReal}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Use Real Time
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
