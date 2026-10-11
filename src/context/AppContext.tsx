import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LocationData,
  DemoClock,
  SavedPlan,
  DayType,
  ActualWaitRecord,
  LocationEvent,
  Counter,
} from '../types';
import { INITIAL_LOCATIONS, SAMPLE_ACTUAL_RECORDS } from '../data/seedData';
import { predictDay } from '../services/predictionService';

interface AppContextType {
  locations: LocationData[];
  demoClock: DemoClock;
  savedPlans: SavedPlan[];
  isAdminUnlocked: boolean;
  toastMessage: string | null;
  // Demo clock actions
  setDemoClockOverride: (dayType: DayType, hour: number, minute?: number) => void;
  resetDemoClockToReal: () => void;
  // Plan actions
  savePlan: (plan: Omit<SavedPlan, 'id' | 'createdAt'>) => void;
  removePlan: (id: string) => void;
  // Admin actions
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;
  updateLocationGeneral: (
    locationId: string,
    updates: {
      activeCounters?: number;
      avgServiceMin?: number;
      openSlots?: number[];
    }
  ) => void;
  addStaffUpdate: (locationId: string, queueLength: number) => void;
  updateCounter: (locationId: string, counterId: string, updates: Partial<Counter>) => void;
  addEvent: (locationId: string, event: Omit<LocationEvent, 'id'>) => void;
  removeEvent: (locationId: string, eventId: string) => void;
  recordActualWait: (locationId: string, hour: number, actualWaitMin: number) => void;
  loadSampleActualRecords: (locationId: string) => void;
  clearActualRecords: (locationId: string) => void;
  resetScenarioDemo: () => void;
  resetDemo: () => void;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_LOCATIONS = 'Waqtly_locations_v1';
const STORAGE_KEY_PLANS = 'Waqtly_plans_v1';

function getRealCurrentClock(): { dayType: DayType; hour: number; minute: number; dateStr: string } {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  let dayType: DayType = 'Weekday';
  if (day === 0) dayType = 'Sunday';
  else if (day === 6) dayType = 'Saturday';

  const dateStr = now.toISOString().split('T')[0];
  return {
    dayType,
    hour: now.getHours(),
    minute: now.getMinutes(),
    dateStr,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo clock state
  const realClock = getRealCurrentClock();
  const [demoClock, setDemoClock] = useState<DemoClock>({
    isOverridden: false,
    dayType: realClock.dayType,
    hour: realClock.hour,
    minute: realClock.minute,
    dateStr: realClock.dateStr,
  });

  // Locations state
  const [locations, setLocations] = useState<LocationData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Storage unavailable fallback
    }
    return INITIAL_LOCATIONS;
  });

  // Saved plans state
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PLANS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Storage unavailable fallback
    }
    return [];
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
    } catch {
      // Silently ignore storage failures
    }
  }, [locations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(savedPlans));
    } catch {
      // Silently ignore storage failures
    }
  }, [savedPlans]);

  // Keep real clock updated every minute if override is inactive
  useEffect(() => {
    if (demoClock.isOverridden) return;
    const interval = setInterval(() => {
      const current = getRealCurrentClock();
      setDemoClock((prev) => {
        if (prev.isOverridden) return prev;
        return {
          isOverridden: false,
          dayType: current.dayType,
          hour: current.hour,
          minute: current.minute,
          dateStr: current.dateStr,
        };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [demoClock.isOverridden]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const setDemoClockOverride = (dayType: DayType, hour: number, minute: number = 0) => {
    const today = new Date().toISOString().split('T')[0];
    setDemoClock({
      isOverridden: true,
      dayType,
      hour,
      minute,
      dateStr: today,
    });
    showToast(`Demo clock set to ${dayType}, ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };

  const resetDemoClockToReal = () => {
    const current = getRealCurrentClock();
    setDemoClock({
      isOverridden: false,
      dayType: current.dayType,
      hour: current.hour,
      minute: current.minute,
      dateStr: current.dateStr,
    });
    showToast('Demo clock reset to real system time');
  };

  const savePlan = (plan: Omit<SavedPlan, 'id' | 'createdAt'>) => {
    const newPlan: SavedPlan = {
      ...plan,
      id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: Date.now(),
    };
    setSavedPlans((prev) => [newPlan, ...prev]);
    showToast('Visit plan saved to My Plans');
  };

  const removePlan = (id: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
    showToast('Plan removed');
  };

  const unlockAdmin = (pin: string): boolean => {
    if (pin.trim() === '1234') {
      setIsAdminUnlocked(true);
      showToast('Staff demo mode unlocked');
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
  };

  const updateLocationGeneral = (
    locationId: string,
    updates: {
      activeCounters?: number;
      avgServiceMin?: number;
      openSlots?: number[];
    }
  ) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        return {
          ...loc,
          activeCounters: updates.activeCounters !== undefined ? updates.activeCounters : loc.activeCounters,
          avgServiceMin: updates.avgServiceMin !== undefined ? updates.avgServiceMin : loc.avgServiceMin,
          openSlots: updates.openSlots !== undefined ? updates.openSlots : loc.openSlots,
        };
      })
    );
    showToast('Updated. Forecasts refreshed.');
  };

  const addStaffUpdate = (locationId: string, queueLength: number) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        return {
          ...loc,
          lastStaffUpdate: {
            queueLength,
            timestamp: Date.now(),
            demoHour: demoClock.hour,
          },
        };
      })
    );
    showToast('Staff update saved. Current hour backlog updated.');
  };

  const updateCounter = (locationId: string, counterId: string, updates: Partial<Counter>) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId || !loc.counters) return loc;
        return {
          ...loc,
          counters: loc.counters.map((c) => (c.id === counterId ? { ...c, ...updates } : c)),
        };
      })
    );
    showToast('Counter updated.');
  };

  const addEvent = (locationId: string, event: Omit<LocationEvent, 'id'>) => {
    const newEvent: LocationEvent = {
      ...event,
      id: 'ev_' + Date.now(),
    };
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        return {
          ...loc,
          events: [...loc.events, newEvent],
        };
      })
    );
    showToast(`Event "${event.name}" added. Forecasts refreshed.`);
  };

  const removeEvent = (locationId: string, eventId: string) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        return {
          ...loc,
          events: loc.events.filter((e) => e.id !== eventId),
        };
      })
    );
    showToast('Event removed. Forecasts refreshed.');
  };

  const recordActualWait = (locationId: string, hour: number, actualWaitMin: number) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        // Compute predicted wait for that hour at this moment
        const predictions = predictDay(loc, demoClock.dayType, {
          demoCurrentHour: demoClock.hour,
          demoClockTimestamp: Date.now(),
        });
        const pred = predictions.find((p) => p.hour === hour);
        const predictedWaitMin = pred ? pred.expectedWaitMin : 0;

        const newRecord: ActualWaitRecord = {
          id: 'act_' + Date.now(),
          timestamp: Date.now(),
          hour,
          predictedWaitMin,
          actualWaitMin,
          isSample: false,
        };
        return {
          ...loc,
          actualRecords: [newRecord, ...loc.actualRecords],
        };
      })
    );
    showToast('Actual wait recorded.');
  };

  const loadSampleActualRecords = (locationId: string) => {
    const samples = SAMPLE_ACTUAL_RECORDS[locationId] || [];
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        return {
          ...loc,
          actualRecords: [...samples, ...loc.actualRecords.filter((r) => !r.isSample)],
        };
      })
    );
    showToast('Loaded illustrative sample actual records.');
  };

  const clearActualRecords = (locationId: string) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === locationId ? { ...loc, actualRecords: [] } : loc))
    );
    showToast('Cleared recorded wait entries.');
  };

  const resetScenarioDemo = () => {
    setLocations(INITIAL_LOCATIONS);
    resetDemoClockToReal();
    showToast('Scenario reset: returned to normal schedule.');
  };

  const resetDemo = () => {
    setLocations(INITIAL_LOCATIONS);
    setSavedPlans([]);
    resetDemoClockToReal();
    setIsAdminUnlocked(false);
    try {
      localStorage.removeItem(STORAGE_KEY_LOCATIONS);
      localStorage.removeItem(STORAGE_KEY_PLANS);
    } catch {
      // ignore
    }
    showToast('Demo reset complete. Seed data restored.');
  };

  return (
    <AppContext.Provider
      value={{
        locations,
        demoClock,
        savedPlans,
        isAdminUnlocked,
        toastMessage,
        setDemoClockOverride,
        resetDemoClockToReal,
        savePlan,
        removePlan,
        unlockAdmin,
        lockAdmin,
        updateLocationGeneral,
        addStaffUpdate,
        updateCounter,
        addEvent,
        removeEvent,
        recordActualWait,
        loadSampleActualRecords,
        clearActualRecords,
        resetScenarioDemo,
        resetDemo,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
