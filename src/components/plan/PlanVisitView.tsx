import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DayType, PlanRecommendation, HourlyPrediction } from '../../types';
import { planMyVisit, predictDay } from '../../services/predictionService';
import { CrowdBadge } from '../common/CrowdBadge';
import { HonestyBadge } from '../common/HonestyBadge';
import { HospitalDisclaimer } from '../common/HospitalDisclaimer';
import {
  Calendar,
  Clock,
  Sparkles,
  Bookmark,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  Info,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface PlanVisitViewProps {
  initialLocationId?: string;
  onOpenPlansDrawer: () => void;
}

export const PlanVisitView: React.FC<PlanVisitViewProps> = ({
  initialLocationId,
  onOpenPlansDrawer,
}) => {
  const { locations, demoClock, savePlan, showToast } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    initialLocationId || locations[0].id
  );
  const [selectedDay, setSelectedDay] = useState<DayType>(demoClock.dayType);
  const [startHour, setStartHour] = useState<number>(Math.max(8, Math.min(15, demoClock.hour)));
  const [endHour, setEndHour] = useState<number>(Math.max(10, Math.min(18, demoClock.hour + 3)));
  const [maxWaitMin, setMaxWaitMin] = useState<number>(15);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [recommendation, setRecommendation] = useState<PlanRecommendation | null>(null);
  const [activeSlotHour, setActiveSlotHour] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const activeLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];

  // Set default purpose when location changes
  useEffect(() => {
    if (activeLocation && activeLocation.purposes.length > 0) {
      if (!activeLocation.purposes.includes(selectedPurpose)) {
        setSelectedPurpose(activeLocation.purposes[0]);
      }
    }
  }, [activeLocation]);

  useEffect(() => {
    if (initialLocationId) {
      setSelectedLocationId(initialLocationId);
    }
  }, [initialLocationId]);

  // Live predictions for Step 2 mini-strip preview
  const livePreviewPredictions = predictDay(activeLocation, selectedDay, {
    demoCurrentHour: demoClock.hour,
    demoClockTimestamp: Date.now(),
  });

  const handleComputePlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (!selectedPurpose) {
      setValidationError('Please select a visit purpose.');
      setCurrentStep(3);
      return;
    }

    if (endHour <= startHour) {
      setValidationError('Window end hour must be later than the start hour.');
      setCurrentStep(2);
      return;
    }

    if (maxWaitMin < 5 || maxWaitMin > 120 || isNaN(maxWaitMin)) {
      setValidationError('Max acceptable wait must be between 5 and 120 minutes.');
      setCurrentStep(2);
      return;
    }

    if (selectedDay === 'Sunday') {
      setValidationError(
        'All demo locations are closed on Sunday in this prototype. Please select a weekday or Saturday.'
      );
      setCurrentStep(2);
      return;
    }

    const isToday = selectedDay === demoClock.dayType;
    if (isToday && endHour <= demoClock.hour) {
      setValidationError(
        `The chosen window (${startHour}:00–${endHour}:00) is already in the past relative to the demo clock (${demoClock.hour}:00). Choose a later window or change the demo clock.`
      );
      setCurrentStep(2);
      return;
    }

    // 800ms scanning animation
    setIsLoading(true);
    setRecommendation(null);
    setScanIndex(0);

    const interval = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % 10);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const result = planMyVisit({
        location: activeLocation,
        dayType: selectedDay,
        startHour,
        endHour,
        maxWaitMin,
        purpose: selectedPurpose,
        demoClock: {
          hour: demoClock.hour,
          dayType: demoClock.dayType,
          timestamp: Date.now(),
        },
        isToday,
      });

      setIsLoading(false);

      if ('error' in result) {
        setValidationError(result.error);
        setRecommendation(null);
      } else {
        setRecommendation(result);
        setActiveSlotHour(result.recommendedHour);
        setValidationError(null);
      }
    }, 800);
  };

  const handleSaveToPlans = () => {
    if (!recommendation) return;
    savePlan({
      locationId: activeLocation.id,
      locationName: activeLocation.name,
      dayType: selectedDay,
      dateStr: demoClock.dateStr,
      hour: recommendation.recommendedHour,
      expectedWaitMin: recommendation.expectedWaitMin,
      crowdLevel: recommendation.crowdLevel,
      purpose: selectedPurpose,
      maxWaitMin,
    });
  };

  const handleCopySummary = () => {
    if (!recommendation) return;
    const text = `Waqtly Plan: ${activeLocation.name}
Recommended arrival: ${recommendation.recommendedHour.toString().padStart(2, '0')}:00 – ${(recommendation.recommendedHour + 1).toString().padStart(2, '0')}:00 (${selectedDay})
Expected wait: ~${recommendation.expectedWaitMin} min (Demand sensitivity range: ${recommendation.lowWaitMin}–${recommendation.highWaitMin} min)
Crowd level: ${recommendation.crowdLevel}
Purpose: ${selectedPurpose}
Why this slot: ${recommendation.explanation.whyThisSlot}`;

    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    showToast('Plan summary copied to clipboard');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Find busiest slot in the window to compute real minutes saved
  let minutesSaved = 0;
  let busiestSlot: HourlyPrediction | null = null;
  if (recommendation && recommendation.windowPredictions.length > 0) {
    const sorted = [...recommendation.windowPredictions].sort(
      (a, b) => b.expectedWaitMin - a.expectedWaitMin
    );
    busiestSlot = sorted[0];
    minutesSaved = Math.max(0, busiestSlot.expectedWaitMin - recommendation.expectedWaitMin);
  }

  const isHospital = activeLocation.id === 'hospital';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <HonestyBadge />
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-bold text-blue-700">Signature Optimization</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
          Plan My Visit
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Waqtly scans all open slots across your preferred arrival window, simulates counter queues, and pinpoints the lowest-friction time to arrive.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3-Step Guided Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-blue-700 font-mono">Step {currentStep} of 3</span>
              <span className="text-slate-400">
                {currentStep === 1
                  ? 'Where?'
                  : currentStep === 2
                  ? 'When & Wait Limit'
                  : 'Purpose'}
              </span>
            </div>

            {/* Step Pills Bar */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`h-2 rounded-full transition-all ${
                  currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`h-2 rounded-full transition-all ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`h-2 rounded-full transition-all ${
                  currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Step 1: WHERE? */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 1: Choose your destination
                </h2>
                <p className="text-xs text-slate-500">
                  Select which venue desk you plan to visit today.
                </p>
              </div>

              <div className="space-y-2.5">
                {locations.map((loc) => {
                  const isSelected = loc.id === selectedLocationId;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs text-blue-950'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm">{loc.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {loc.shortDescription}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Continue to Time & Limit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: WHEN & HOW LONG CAN YOU WAIT? */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 2: When and how long can you wait?
                </h2>
                <p className="text-xs text-slate-500">
                  Pick your target arrival window and maximum acceptable queue duration.
                </p>
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Day of Visit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Weekday', 'Saturday', 'Sunday'] as DayType[]).map((day) => {
                    const isClosed = day === 'Sunday';
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                        {isClosed && (
                          <span className={`block text-[9px] uppercase font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            (Closed)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Window start and end */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Window Start
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Window End
                  </label>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIVE PREVIEW MINI-STRIP OF THE DAY'S CROWD COLOURS */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Day Crowd Profile</span>
                  <span className="font-mono text-blue-700">
                    Window: {startHour}:00–{endHour}:00
                  </span>
                </div>

                {/* 24-hour mini coloured blocks */}
                <div className="flex h-5 w-full rounded-md overflow-hidden bg-slate-200 gap-0.5 p-0.5">
                  {livePreviewPredictions.slice(7, 19).map((pred) => {
                    const inWindow = pred.hour >= startHour && pred.hour <= endHour;
                    const bg =
                      !pred.isOpen
                        ? 'bg-slate-300'
                        : pred.crowdLevel === 'Low'
                        ? 'bg-teal-500'
                        : pred.crowdLevel === 'Moderate'
                        ? 'bg-amber-400'
                        : pred.crowdLevel === 'High'
                        ? 'bg-orange-500'
                        : 'bg-rose-500';
                    return (
                      <div
                        key={pred.hour}
                        title={`${pred.hour}:00 - ${pred.isOpen ? `~${pred.expectedWaitMin}m (${pred.crowdLevel})` : 'Closed'}`}
                        className={`flex-1 rounded-xs transition-all ${bg} ${
                          inWindow ? 'ring-1 ring-slate-900 ring-offset-1' : 'opacity-40'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>07:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                </div>
              </div>

              {/* Max Acceptable Wait */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Max Acceptable Wait
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {maxWaitMin} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={maxWaitMin}
                  onChange={(e) => setMaxWaitMin(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>5m</span>
                  <span>30m</span>
                  <span>60m</span>
                  <span>120m</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Purpose</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: WHAT FOR? */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 3: What is the purpose of your visit?
                </h2>
                <p className="text-xs text-slate-500">
                  Purpose affects counter routing and service requirements.
                </p>
              </div>

              {/* Purpose tiles */}
              <div className="space-y-2">
                {activeLocation.purposes.map((p) => {
                  const isSelected = selectedPurpose === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPurpose(p)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs text-blue-950 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{p}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{validationError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-3 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleComputePlan()}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Scanning Slots...' : 'Find Optimal Arrival Slot'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Loading Scanning Animation OR Result Hero Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isHospital && <HospitalDisclaimer />}

          {/* 800ms Tasteful Slot Scanning Animation */}
          {isLoading && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs text-center space-y-5 animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Scanning Candidate Slots...
              </div>

              {/* Left-to-right scanning tiles */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-3 max-w-md mx-auto">
                {Array.from({ length: 6 }, (_, idx) => {
                  const isCurrentScan = (scanIndex % 6) === idx;
                  return (
                    <div
                      key={idx}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-100 ${
                        isCurrentScan
                          ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-md'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-mono font-bold">
                        {(startHour + idx).toString().padStart(2, '0')}:00
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Testing throughput against queue backlogs for {activeLocation.name}...
              </p>
            </div>
          )}

          {/* Result Hero Card */}
          {!isLoading && recommendation && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header with recommendation pill & action triggers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recommended Arrival Slot
                  </span>
                  {recommendation.noSlotMetLimit && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-medium">
                      Shortest wait available
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Copy plan summary"
                    aria-label="Copy plan summary"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToPlans}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors border border-blue-200"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Add to My Plan
                  </button>
                </div>
              </div>

              {/* Big Slot Display with soft teal pulse */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-teal-50/40 border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pulse-teal-glow">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block">
                    Optimal Arrival Time
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight mt-1">
                    {recommendation.recommendedHour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    Slot window: {recommendation.recommendedHour.toString().padStart(2, '0')}:00 –{' '}
                    {(recommendation.recommendedHour + 1).toString().padStart(2, '0')}:00 ({selectedDay})
                  </div>
                  {/* Real minutes saved computed line */}
                  {minutesSaved > 0 && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-200">
                      <span>✓ You save about {minutesSaved} min vs the busiest slot in your window</span>
                    </div>
                  )}
                </div>

                <div className="sm:text-right flex flex-col sm:items-end gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Expected Wait
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-blue-700 font-mono">
                      ~{recommendation.expectedWaitMin}
                    </span>
                    <span className="text-sm font-bold text-slate-600">min</span>
                  </div>
                  <CrowdBadge level={recommendation.crowdLevel} size="md" />
                </div>
              </div>

              {/* Demand Sensitivity Range Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-600 font-medium">
                    Range if demand is 15% lower / higher:
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {recommendation.lowWaitMin} – {recommendation.highWaitMin} minutes
                </span>
              </div>

              {/* Horizontal Slot Timeline with recommended slot highlighted & closed slots striped */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Window Comparison Timeline
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {recommendation.windowPredictions.map((slot) => {
                    const isRec = slot.hour === recommendation.recommendedHour;
                    return (
                      <button
                        key={slot.hour}
                        type="button"
                        onClick={() => setActiveSlotHour(slot.hour)}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isRec
                            ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-teal-200/50 shadow-md scale-102'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-mono font-bold">
                          {slot.hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className={`text-base font-black font-mono mt-0.5 ${isRec ? 'text-white' : 'text-slate-900'}`}>
                          ~{slot.expectedWaitMin}m
                        </div>
                        <div className="mt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isRec ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {slot.crowdLevel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Why this slot explanation */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Why this slot?
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p className="font-semibold text-slate-900">{recommendation.explanation.whyThisSlot}</p>
                  <p>{recommendation.explanation.busiestComparison}</p>
                  <p className="text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                    {recommendation.explanation.variablesNote}
                  </p>
                </div>
              </div>

              {/* Clickable Alternatives as distinct cards */}
              {recommendation.alternatives.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Clickable Alternative Slots
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {recommendation.alternatives.map((alt) => (
                      <div
                        key={alt.hour}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">
                            {alt.hour.toString().padStart(2, '0')}:00 –{' '}
                            {(alt.hour + 1).toString().padStart(2, '0')}:00
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            Range: {alt.lowWaitMin}–{alt.highWaitMin}m
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            ~{alt.expectedWaitMin}m
                          </span>
                          <CrowdBadge level={alt.crowdLevel} size="sm" className="ml-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial Prompt state if not yet calculated */}
          {!isLoading && !recommendation && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-10 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  Select your parameters on the left
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Proceed through the 3 quick steps to compare available slots and receive an optimized arrival recommendation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
