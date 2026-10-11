import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DayType, HourlyPrediction } from '../types';
import { predictDay } from '../services/predictionService';
import { HourlyForecastChart } from '../components/charts/HourlyForecastChart';
import { WeeklyCrowdHeatmap } from '../components/charts/WeeklyCrowdHeatmap';
import { HonestyBadge } from '../components/common/HonestyBadge';
import { HospitalDisclaimer } from '../components/common/HospitalDisclaimer';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { Sparkles, Bot, AlertCircle, Clock, Info, CheckCircle2, BarChart3, Grid3X3 } from 'lucide-react';

interface CrowdForecastPageProps {
  initialLocationId?: string;
  onNavigateToPlan: (locationId: string) => void;
}

export const CrowdForecastPage: React.FC<CrowdForecastPageProps> = ({
  initialLocationId,
  onNavigateToPlan,
}) => {
  const { locations, demoClock } = useApp();

  const [selectedLocId, setSelectedLocId] = useState<string>(
    initialLocationId || locations[0].id
  );
  const [selectedDay, setSelectedDay] = useState<DayType>(demoClock.dayType);
  const [viewFormat, setViewFormat] = useState<'chart' | 'heatmap'>('chart');

  // Gemini state
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiFallbackNote, setAiFallbackNote] = useState<string | null>(null);

  const location = locations.find((l) => l.id === selectedLocId) || locations[0];

  const predictions = predictDay(location, selectedDay, {
    demoCurrentHour: demoClock.hour,
    demoClockTimestamp: Date.now(),
  });

  const openSlots = predictions.filter((p) => p.isOpen);

  // Compute Quietest and Busiest slots for the plain-language summary
  let quietestSlot: HourlyPrediction | null = null;
  let busiestSlot: HourlyPrediction | null = null;

  if (openSlots.length > 0) {
    const sorted = [...openSlots].sort((a, b) => a.expectedWaitMin - b.expectedWaitMin);
    quietestSlot = sorted[0];
    busiestSlot = sorted[sorted.length - 1];
  }

  // Handle Gemini explanation call
  const handleExplainWithGemini = async () => {
    setIsAiLoading(true);
    setAiExplanation(null);
    setAiFallbackNote(null);

    const summaryText = quietestSlot && busiestSlot
      ? `Quietest period is ${quietestSlot.hour}:00 (~${quietestSlot.expectedWaitMin}m wait), while peak rush occurs at ${busiestSlot.hour}:00 (~${busiestSlot.expectedWaitMin}m wait).`
      : 'Location closed or limited operating slots.';

    const curr = predictions.find((p) => p.hour === demoClock.hour);
    const targetSlot = curr?.isOpen ? curr : (quietestSlot || predictions[12]);

    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: location.name,
          dayType: selectedDay,
          hour: targetSlot.hour,
          waitMin: targetSlot.expectedWaitMin,
          lowWait: targetSlot.lowWaitMin,
          highWait: targetSlot.highWaitMin,
          crowdLevel: targetSlot.crowdLevel,
          drivers: targetSlot.drivers,
          summaryText,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
      } else {
        throw new Error('No explanation returned');
      }
    } catch (err) {
      console.warn('Gemini explanation fallback triggered:', err);
      const fallbackText = `At ${targetSlot.hour.toString().padStart(2, '0')}:00 on ${selectedDay}, the forecast shows an expected wait of ~${targetSlot.expectedWaitMin} minutes (${targetSlot.crowdLevel} crowd) driven by ${location.activeCounters} active counters with ${targetSlot.arrivals} forecasted arrivals per hour. Based on demand sensitivity (±15%), the typical range spans ${targetSlot.lowWaitMin} to ${targetSlot.highWaitMin} minutes.`;
      setAiExplanation(fallbackText);
      setAiFallbackNote('AI explanation unavailable; showing standard explanation');
    } finally {
      setIsAiLoading(false);
    }
  };

  const isHospital = location.id === 'hospital';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <HonestyBadge />
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hourly Dynamics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
            Crowd Forecast
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Examine the full 24-hour mathematical arrival curve, counter throughput, demand sensitivity bounds, and underlying operational drivers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToPlan(location.id)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plan Visit for {location.name.split(' ')[0]}</span>
        </button>
      </div>

      {/* Selectors Bar + Chart/Heatmap Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Location Selector */}
        <div className="flex-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Service Location
          </label>
          <select
            value={selectedLocId}
            onChange={(e) => {
              setSelectedLocId(e.target.value);
              setAiExplanation(null);
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: Chart | Heatmap */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl p-1 bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewFormat('chart')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                viewFormat === 'chart'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setViewFormat('heatmap')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                viewFormat === 'heatmap'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Heatmap</span>
            </button>
          </div>
        </div>

        {/* Day Selector (active for Chart view) */}
        {viewFormat === 'chart' && (
          <div className="md:w-64">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Day of Week
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Weekday', 'Saturday', 'Sunday'] as DayType[]).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    setAiExplanation(null);
                  }}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                    selectedDay === day
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isHospital && <HospitalDisclaimer />}

      {/* View: Hourly Chart OR Weekly Heatmap */}
      {viewFormat === 'chart' ? (
        <HourlyForecastChart
          predictions={predictions}
          currentHour={demoClock.dayType === selectedDay ? demoClock.hour : undefined}
        />
      ) : (
        <WeeklyCrowdHeatmap
          location={location}
          onSelectSlot={(day, hour) => {
            onNavigateToPlan(location.id);
          }}
        />
      )}

      {/* Plain-Language Summary Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Plain-Language Forecast Summary
              </h3>
              <p className="text-xs text-slate-500">
                Operational takeaways synthesized from counter capacity and customer arrival rates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExplainWithGemini}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold text-xs transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{isAiLoading ? 'Synthesizing...' : 'Explain this forecast'}</span>
          </button>
        </div>

        {selectedDay === 'Sunday' && viewFormat === 'chart' ? (
          <div className="p-4 rounded-2xl bg-slate-50 text-slate-600 text-xs">
            This location is closed on Sundays in the current prototype configuration.
          </div>
        ) : quietestSlot && busiestSlot ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 block">
                Quietest Window
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {quietestSlot.hour.toString().padStart(2, '0')}:00 –{' '}
                  {(quietestSlot.hour + 1).toString().padStart(2, '0')}:00
                </span>
                <span className="font-mono font-black text-teal-800 text-base">
                  ~{quietestSlot.expectedWaitMin} min
                </span>
              </div>
              <div className="text-[11px] text-teal-900/80 mt-1">
                Range: {quietestSlot.lowWaitMin}–{quietestSlot.highWaitMin}m • {quietestSlot.crowdLevel}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-800 block">
                Busiest Peak Window
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {busiestSlot.hour.toString().padStart(2, '0')}:00 –{' '}
                  {(busiestSlot.hour + 1).toString().padStart(2, '0')}:00
                </span>
                <span className="font-mono font-black text-orange-900 text-base">
                  ~{busiestSlot.expectedWaitMin} min
                </span>
              </div>
              <div className="text-[11px] text-orange-900/80 mt-1">
                Range: {busiestSlot.lowWaitMin}–{busiestSlot.highWaitMin}m • {busiestSlot.crowdLevel}
              </div>
            </div>
          </div>
        ) : null}

        {/* Gemini Generated Explanation Box */}
        {aiExplanation && (
          <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-purple-200/60">
              <span className="font-bold text-purple-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Bot className="w-3.5 h-3.5 text-purple-700" />
                AI-generated explanation of the forecast
              </span>
              {aiFallbackNote && (
                <span className="text-[10px] text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full font-semibold">
                  {aiFallbackNote}
                </span>
              )}
            </div>
            <p className="leading-relaxed text-slate-800 text-xs">{aiExplanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
