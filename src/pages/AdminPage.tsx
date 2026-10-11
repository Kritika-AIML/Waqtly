import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocationData, Counter, LocationEvent } from '../types';
import {
  Lock,
  Unlock,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ShieldAlert,
  Clock,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const {
    locations,
    demoClock,
    isAdminUnlocked,
    unlockAdmin,
    lockAdmin,
    updateLocationGeneral,
    addStaffUpdate,
    updateCounter,
    addEvent,
    removeEvent,
    recordActualWait,
    resetDemo,
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0].id);

  // Form states for location general
  const activeLoc = locations.find((l) => l.id === selectedLocId) || locations[0];

  const [queueInput, setQueueInput] = useState<number>(0);
  const [activeCountersInput, setActiveCountersInput] = useState<number>(activeLoc.activeCounters);
  const [avgServiceInput, setAvgServiceInput] = useState<number>(activeLoc.avgServiceMin);

  // Opening hours range
  const minOpen = activeLoc.openSlots.length > 0 ? Math.min(...activeLoc.openSlots) : 8;
  const maxOpen = activeLoc.openSlots.length > 0 ? Math.max(...activeLoc.openSlots) : 17;
  const [openStartHour, setOpenStartHour] = useState<number>(minOpen);
  const [openEndHour, setOpenEndHour] = useState<number>(maxOpen + 1);

  // Add event state
  const [eventName, setEventName] = useState('');
  const [eventStartHour, setEventStartHour] = useState(11);
  const [eventEndHour, setEventEndHour] = useState(13);
  const [eventMultiplier, setEventMultiplier] = useState(1.3);

  // Record actual wait state
  const [recordHour, setRecordHour] = useState(demoClock.hour);
  const [actualWaitInput, setActualWaitInput] = useState(12);

  // Dialog state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Update form inputs when selected location changes
  React.useEffect(() => {
    setActiveCountersInput(activeLoc.activeCounters);
    setAvgServiceInput(activeLoc.avgServiceMin);
    const minH = activeLoc.openSlots.length > 0 ? Math.min(...activeLoc.openSlots) : 8;
    const maxH = activeLoc.openSlots.length > 0 ? Math.max(...activeLoc.openSlots) : 17;
    setOpenStartHour(minH);
    setOpenEndHour(maxH + 1);
  }, [activeLoc]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdmin(pinInput)) {
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCountersInput < 1 || activeCountersInput > 12) return;
    if (avgServiceInput < 1 || avgServiceInput > 60) return;
    if (openEndHour <= openStartHour) return;

    // Generate new open slots array (handling Admin Office lunch gap if admin)
    const newSlots: number[] = [];
    for (let h = openStartHour; h < openEndHour; h++) {
      if (activeLoc.id === 'admin' && h === 13) {
        // preserve 13:00 lunch break for admin office
        continue;
      }
      newSlots.push(h);
    }

    updateLocationGeneral(activeLoc.id, {
      activeCounters: activeCountersInput,
      avgServiceMin: avgServiceInput,
      openSlots: newSlots,
    });
  };

  const handleStaffQueueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queueInput < 0 || queueInput > 500) return;
    addStaffUpdate(activeLoc.id, queueInput);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    if (eventEndHour < eventStartHour) return;
    if (eventMultiplier < 0.5 || eventMultiplier > 2.0) return;

    addEvent(activeLoc.id, {
      name: eventName.trim(),
      startHour: eventStartHour,
      endHour: eventEndHour,
      multiplier: eventMultiplier,
    });

    setEventName('');
  };

  const handleRecordActual = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualWaitInput < 0 || actualWaitInput > 240) return;
    recordActualWait(activeLoc.id, recordHour, actualWaitInput);
  };

  // Locked gate screen
  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs text-center space-y-6 animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Staff Demo Mode</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter demo PIN <strong className="text-blue-700 font-mono">1234</strong> to simulate venue staff actions, alter capacity, add crowd events, and log actual wait times.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter PIN 1234"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-xl tracking-widest font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              maxLength={6}
            />
            {pinError && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">
                Incorrect PIN. Use demo PIN 1234.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Unlock Staff Mode
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Demo only, not real authentication.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Bar with Lock and Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5" />
              Staff Mode Unlocked
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Demo only, not real authentication</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Venue Operations & Calibration
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={lockAdmin}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Lock Mode
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Target Location Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Select Venue to Configure
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setSelectedLocId(loc.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedLocId === loc.id
                  ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 text-blue-950 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className="font-bold text-xs line-clamp-1">{loc.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {loc.activeCounters} counters • ~{loc.avgServiceMin}m/person
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of operational controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel 1: Live Staff Queue Input */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Enter Staff Queue Update (Decays after 45m)
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Staff enter the physical line headcount. Waqtly seeds the current hour's backlog with this value and sets a "Fresh staff update" driver flag.
          </p>

          <form onSubmit={handleStaffQueueSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observed Physical Queue Length (0–500)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={queueInput}
                onChange={(e) => setQueueInput(parseInt(e.target.value, 10) || 0)}
                className="w-full py-2 px-3 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Broadcast Staff Update
            </button>
          </form>

          {activeLoc.lastStaffUpdate && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
              Active recorded update: <strong>{activeLoc.lastStaffUpdate.queueLength} people</strong> (entered at demo hour {activeLoc.lastStaffUpdate.demoHour}:00).
            </div>
          )}
        </div>

        {/* Panel 2: Capacity & Opening Hours General Setup */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Settings className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Capacity & Operating Schedule
            </h2>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active Counters (1–12)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={activeCountersInput}
                  onChange={(e) => setActiveCountersInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Avg Service (1–60 min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={avgServiceInput}
                  onChange={(e) => setAvgServiceInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opening Hour
                </label>
                <select
                  value={openStartHour}
                  onChange={(e) => setOpenStartHour(parseInt(e.target.value, 10))}
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Closing Hour
                </label>
                <select
                  value={openEndHour}
                  onChange={(e) => setOpenEndHour(parseInt(e.target.value, 10))}
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Save Capacity & Hours
            </button>
          </form>
        </div>

        {/* Panel 3: Demand Events (e.g. Fee deadline, rain rush) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Special Demand Multiplier Events
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Inject surges (e.g. fee deadlines +30%, rains +20%) across specific hour windows.
          </p>

          <form onSubmit={handleAddEvent} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Name</label>
              <input
                type="text"
                placeholder="e.g. Fee Submission Deadline"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Hour</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={eventStartHour}
                  onChange={(e) => setEventStartHour(parseInt(e.target.value, 10))}
                  className="w-full py-1.5 px-2 text-xs font-mono rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">End Hour</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={eventEndHour}
                  onChange={(e) => setEventEndHour(parseInt(e.target.value, 10))}
                  className="w-full py-1.5 px-2 text-xs font-mono rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Multiplier (0.5-2.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2.0"
                  value={eventMultiplier}
                  onChange={(e) => setEventMultiplier(parseFloat(e.target.value))}
                  className="w-full py-1.5 px-2 text-xs font-mono rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Add Surge Event
            </button>
          </form>

          {/* Current events list */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Events for Location ({activeLoc.events.length})
            </span>
            {activeLoc.events.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No events configured</span>
            ) : (
              activeLoc.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{ev.name}</span>
                    <span className="text-slate-500 font-mono ml-2 text-[11px]">
                      {ev.startHour}:00–{ev.endHour}:00 ({Math.round(ev.multiplier * 100)}% demand)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvent(activeLoc.id, ev.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 4: Record Actual Wait for Model Calibration */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Record an Actual Wait Entry
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Log an empirical wait time in minutes. The current model prediction is automatically snapshotted alongside it.
          </p>

          <form onSubmit={handleRecordActual} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hour Slot (0–23)
                </label>
                <select
                  value={recordHour}
                  onChange={(e) => setRecordHour(parseInt(e.target.value, 10))}
                  className="w-full py-2 px-3 text-xs font-mono font-semibold rounded-xl border border-slate-300"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Wait (0–240 min)
                </label>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={actualWaitInput}
                  onChange={(e) => setActualWaitInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Record Empirical Wait
            </button>
          </form>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Recorded actual entries are displayed in the "Predicted vs Actual" table on the Location Details page.
          </div>
        </div>

        {/* Panel 5: Counter-level Queue & Status (if counters exist) */}
        {activeLoc.counters && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Individual Counter Queue & Status Controls
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Adjust line length or toggle individual counters open/closed. Smart Counter Recommendation uses these numbers in real time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeLoc.counters.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => updateCounter(activeLoc.id, c.id, { isOpen: !c.isOpen })}
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        c.isOpen
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {c.isOpen ? 'OPEN' : 'CLOSED'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Queue Headcount</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={c.queueLength}
                      onChange={(e) =>
                        updateCounter(activeLoc.id, c.id, {
                          queueLength: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full py-1 px-2 font-mono font-bold text-xs bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Reset Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Reset Demo State?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              This will restore all seed counter parameters, opening hours, clear actual wait records, and reset saved plans.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemo();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Reset All Seed Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
