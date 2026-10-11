/**
 * Waqtly Prediction Service
 * 
 * Pure, deterministic rule-based queue forecasting engine.
 * Designed with a clean interface so an ML/statistical model can replace it seamlessly.
 */

import {
  DayType,
  HourlyPrediction,
  LocationData,
  PlanRecommendation,
  CrowdLevel,
} from '../types';

export interface PredictOptions {
  demoCurrentHour?: number;
  demoClockTimestamp?: number;
}

/**
 * Calculates crowd level tier based on utilization ratio (arrivals / capacity)
 */
export function getCrowdLevelFromUtilization(utilization: number, isOpen: boolean): CrowdLevel {
  if (!isOpen) return 'Closed';
  if (utilization < 0.6) return 'Low';
  if (utilization < 0.9) return 'Moderate';
  if (utilization < 1.1) return 'High';
  return 'Very High';
}

/**
 * Simulates hourly arrivals, backlog accumulation, and expected waiting time
 * for a specific demand scenario (multiplier on arrivals).
 */
function simulateDayDemand(
  location: LocationData,
  dayType: DayType,
  demandScale: number,
  demoHour?: number,
  validStaffUpdateQueue?: number
): { hour: number; arrivals: number; capacity: number; waitMin: number; utilization: number }[] {
  const hours: { hour: number; arrivals: number; capacity: number; waitMin: number; utilization: number }[] = [];
  
  if (dayType === 'Sunday') {
    for (let h = 0; h < 24; h++) {
      hours.push({ hour: h, arrivals: 0, capacity: 0, waitMin: 0, utilization: 0 });
    }
    return hours;
  }

  // 1. capacity per hour = activeCounters * (60 / avgServiceMin)
  const capacityPerHour = Math.max(1, Math.round(location.activeCounters * (60 / location.avgServiceMin)));
  const dayMultiplier = dayType === 'Saturday' ? location.saturdayMultiplier : 1.0;

  let currentBacklog = 0;

  for (let h = 0; h < 24; h++) {
    const isOpen = location.openSlots.includes(h);

    if (!isOpen) {
      // Step 3: Backlog resets to 0 after any closed slot
      currentBacklog = 0;
      hours.push({
        hour: h,
        arrivals: 0,
        capacity: 0,
        waitMin: 0,
        utilization: 0,
      });
      continue;
    }

    // Event multipliers covering this hour
    let eventMultiplier = 1.0;
    if (location.events && location.events.length > 0) {
      for (const ev of location.events) {
        if (h >= ev.startHour && h <= ev.endHour) {
          eventMultiplier *= ev.multiplier;
        }
      }
    }

    // Step 2: arrivals per hour = baseline * dayMultiplier * eventMultipliers * demandScale
    const baseline = location.baselineWeekdayArrivals[h] || 0;
    const rawArrivals = baseline * dayMultiplier * eventMultiplier * demandScale;
    const arrivals = Math.round(rawArrivals);

    // Step 7: Staff update seeding for the current demo hour
    if (h === demoHour && validStaffUpdateQueue !== undefined) {
      currentBacklog = validStaffUpdateQueue;
    }

    // Step 3: Backlog progression
    currentBacklog = Math.max(0, currentBacklog + arrivals - capacityPerHour);

    // Step 4: expectedWaitMin = (backlog / capacity) * 60 + avgServiceMin / 2
    // If arrivals are 0 and backlog is 0, wait is 0 min.
    let expectedWait = 0;
    if (arrivals > 0 || currentBacklog > 0) {
      expectedWait = Math.round((currentBacklog / capacityPerHour) * 60 + location.avgServiceMin / 2);
    }

    const utilization = arrivals / capacityPerHour;

    hours.push({
      hour: h,
      arrivals,
      capacity: capacityPerHour,
      waitMin: expectedWait,
      utilization,
    });
  }

  return hours;
}

/**
 * Predicts 24-hour schedule and wait times for a location.
 * Pure and deterministic.
 */
export function predictDay(
  location: LocationData,
  dayType: DayType,
  options?: PredictOptions
): HourlyPrediction[] {
  const demoHour = options?.demoCurrentHour;
  const demoTimestamp = options?.demoClockTimestamp ?? Date.now();

  // Evaluate staff update freshness (< 45 minutes relative to demo clock)
  let validStaffUpdateQueue: number | undefined = undefined;
  let staffUpdateMinutesAgo: number | null = null;
  let isStaffUpdateStale = false;

  if (location.lastStaffUpdate) {
    const diffMs = Math.max(0, demoTimestamp - location.lastStaffUpdate.timestamp);
    const diffMin = Math.floor(diffMs / 60000);
    staffUpdateMinutesAgo = diffMin;

    if (diffMin <= 45) {
      validStaffUpdateQueue = location.lastStaffUpdate.queueLength;
    } else {
      isStaffUpdateStale = true;
    }
  }

  // Base simulation (1.0x demand)
  const baseSim = simulateDayDemand(location, dayType, 1.0, demoHour, validStaffUpdateQueue);

  // Step 5: Demand sensitivity range (0.85x and 1.15x)
  const lowSim = simulateDayDemand(location, dayType, 0.85, demoHour, validStaffUpdateQueue);
  const highSim = simulateDayDemand(location, dayType, 1.15, demoHour, validStaffUpdateQueue);

  const predictions: HourlyPrediction[] = [];

  for (let h = 0; h < 24; h++) {
    const isOpen = location.openSlots.includes(h) && dayType !== 'Sunday';
    const base = baseSim[h];
    const low = lowSim[h];
    const high = highSim[h];

    const drivers: string[] = [];

    if (!isOpen) {
      if (dayType === 'Sunday') {
        drivers.push('Location closed on Sundays');
      } else {
        drivers.push('Outside normal operating hours');
      }
    } else {
      // Analyze drivers
      if (dayType === 'Saturday') {
        drivers.push(`Saturday schedule (${Math.round(location.saturdayMultiplier * 100)}% weekday demand)`);
      }

      // Check events
      if (location.events && location.events.length > 0) {
        for (const ev of location.events) {
          if (h >= ev.startHour && h <= ev.endHour) {
            const pct = Math.round((ev.multiplier - 1) * 100);
            drivers.push(`${ev.name} (${pct >= 0 ? '+' : ''}${pct}% demand impact)`);
          }
        }
      }

      // Staff update driver
      const isCurrentHour = demoHour !== undefined && h === demoHour;
      if (isCurrentHour && validStaffUpdateQueue !== undefined && staffUpdateMinutesAgo !== null) {
        drivers.push(`Based on staff update from ${staffUpdateMinutesAgo} min ago (queue: ${validStaffUpdateQueue})`);
      } else if (isCurrentHour && isStaffUpdateStale) {
        drivers.push('Staff update is older than 45 min; not used');
      }

      // Capacity driver
      drivers.push(`${location.activeCounters} counters active (~${location.avgServiceMin}m per person)`);

      // Crowd & peak patterns
      if (base.utilization >= 1.1) {
        drivers.push(`High arrival rate exceeds counter capacity (${Math.round(base.utilization * 100)}% capacity)`);
      } else if (base.utilization < 0.6) {
        drivers.push('Off-peak arrival rate allows swift turnaround');
      }

      // Location-specific heuristic drivers
      if (location.id === 'canteen' && (h === 12 || h === 13)) {
        drivers.push('Peak campus lunch hour rush');
      } else if (location.id === 'admin' && (h === 11 || h === 12)) {
        drivers.push('Pre-lunch administrative paperwork surge');
      } else if (location.id === 'hospital' && (h === 9 || h === 10)) {
        drivers.push('Morning doctor clinic intake rush');
      } else if (location.id === 'bank' && (h === 11 || h === 12)) {
        drivers.push('Peak retail banking customer volume');
      }
    }

    const crowdLevel = getCrowdLevelFromUtilization(base.utilization, isOpen);

    predictions.push({
      hour: h,
      isOpen,
      arrivals: base.arrivals,
      capacity: base.capacity,
      expectedWaitMin: isOpen ? base.waitMin : 0,
      lowWaitMin: isOpen ? low.waitMin : 0,
      highWaitMin: isOpen ? high.waitMin : 0,
      crowdLevel,
      drivers,
      freshStaffUpdate: demoHour === h && validStaffUpdateQueue !== undefined,
    });
  }

  return predictions;
}

/**
 * Plan My Visit Scoring
 * Evaluates all open slots within the preferred window,
 * filters by max wait tolerance, and picks the most practical slot.
 */
export function planMyVisit(params: {
  location: LocationData;
  dayType: DayType;
  startHour: number;
  endHour: number;
  maxWaitMin: number;
  purpose: string;
  demoClock: {
    hour: number;
    dayType: DayType;
    timestamp: number;
  };
  isToday: boolean;
}): PlanRecommendation | { error: string } {
  const { location, dayType, startHour, endHour, maxWaitMin, demoClock, isToday } = params;

  if (dayType === 'Sunday') {
    return { error: 'The location is closed all day on Sundays. Please select a weekday or Saturday.' };
  }

  const allPredictions = predictDay(location, dayType, {
    demoCurrentHour: demoClock.hour,
    demoClockTimestamp: demoClock.timestamp,
  });

  // Candidate slots = open slots inside window.
  // NEVER include closed slots or slots in the past relative to demo clock if today.
  const windowPredictions = allPredictions.filter((p) => {
    if (p.hour < startHour || p.hour > endHour) return false;
    if (!p.isOpen) return false;
    if (isToday && p.hour < demoClock.hour) return false;
    return true;
  });

  if (windowPredictions.length === 0) {
    const openSlotsStr = location.openSlots.map((h) => `${h.toString().padStart(2, '0')}:00`).join(', ');
    return {
      error: `The selected window has no open available slots for today. Normal operating slots: ${openSlotsStr}.`,
    };
  }

  // Within limit slots
  const withinLimitSlots = windowPredictions.filter((p) => p.expectedWaitMin <= maxWaitMin);

  let chosenSlot: HourlyPrediction;
  let noSlotMetLimit = false;

  if (withinLimitSlots.length > 0) {
    // Choose within-limit slot with lowest expected wait. Ties go to earliest.
    withinLimitSlots.sort((a, b) => {
      if (a.expectedWaitMin !== b.expectedWaitMin) {
        return a.expectedWaitMin - b.expectedWaitMin;
      }
      return a.hour - b.hour;
    });
    chosenSlot = withinLimitSlots[0];
  } else {
    // No slot meets limit: return least-wait available slot in window
    noSlotMetLimit = true;
    const sortedAll = [...windowPredictions].sort((a, b) => {
      if (a.expectedWaitMin !== b.expectedWaitMin) {
        return a.expectedWaitMin - b.expectedWaitMin;
      }
      return a.hour - b.hour;
    });
    chosenSlot = sortedAll[0];
  }

  // Find up to 2 alternatives
  const alternatives = windowPredictions
    .filter((p) => p.hour !== chosenSlot.hour)
    .sort((a, b) => a.expectedWaitMin - b.expectedWaitMin)
    .slice(0, 2)
    .map((alt) => ({
      hour: alt.hour,
      expectedWaitMin: alt.expectedWaitMin,
      lowWaitMin: alt.lowWaitMin,
      highWaitMin: alt.highWaitMin,
      crowdLevel: alt.crowdLevel,
    }));

  // Find busiest slot in the window for comparison
  const busiestSlot = [...windowPredictions].sort((a, b) => b.expectedWaitMin - a.expectedWaitMin)[0];
  const minutesSaved = Math.max(0, busiestSlot.expectedWaitMin - chosenSlot.expectedWaitMin);

  const hourStr = `${chosenSlot.hour.toString().padStart(2, '0')}:00–${(chosenSlot.hour + 1).toString().padStart(2, '0')}:00`;
  const busiestHourStr = `${busiestSlot.hour.toString().padStart(2, '0')}:00–${(busiestSlot.hour + 1).toString().padStart(2, '0')}:00`;

  let whyThisSlot = '';
  if (noSlotMetLimit) {
    whyThisSlot = `No slot inside your preferred window meets your ${maxWaitMin} min limit. The ${hourStr} slot offers the lowest forecast wait at ~${chosenSlot.expectedWaitMin} min.`;
  } else {
    whyThisSlot = `At ${hourStr}, arrival demand is well-matched to the ${location.activeCounters} active counters, resulting in an expected wait of ~${chosenSlot.expectedWaitMin} min.`;
  }

  let busiestComparison = '';
  if (busiestSlot.hour !== chosenSlot.hour && minutesSaved > 0) {
    busiestComparison = `Visiting at ${hourStr} saves approximately ${minutesSaved} minutes compared to the busiest peak slot (${busiestHourStr}, ~${busiestSlot.expectedWaitMin} min).`;
  } else {
    busiestComparison = `Wait times remain relatively steady throughout your chosen window (~${chosenSlot.expectedWaitMin} min).`;
  }

  const sensitivityNote = `Under demand sensitivity tests (±15% customer volume variation), wait times range from ${chosenSlot.lowWaitMin} to ${chosenSlot.highWaitMin} minutes.`;
  const variablesNote = `Predictions may vary if counters close early, unexpected group arrivals occur, or fresh staff updates are entered.`;

  return {
    recommendedHour: chosenSlot.hour,
    expectedWaitMin: chosenSlot.expectedWaitMin,
    lowWaitMin: chosenSlot.lowWaitMin,
    highWaitMin: chosenSlot.highWaitMin,
    crowdLevel: chosenSlot.crowdLevel,
    isWithinLimit: !noSlotMetLimit,
    noSlotMetLimit,
    alternatives,
    explanation: {
      whyThisSlot,
      busiestComparison,
      sensitivityNote,
      variablesNote,
    },
    windowPredictions,
  };
}

/**
 * Computes best open slot today for a location (lowest wait)
 */
export function getBestTimeToday(location: LocationData, dayType: DayType, currentHour?: number): { hour: number; waitMin: number; crowdLevel: CrowdLevel } | null {
  if (dayType === 'Sunday') return null;

  const predictions = predictDay(location, dayType, { demoCurrentHour: currentHour });
  const openPredictions = predictions.filter((p) => p.isOpen && (currentHour === undefined || p.hour >= currentHour));

  if (openPredictions.length === 0) {
    // If all remaining slots today are done, check all open slots of the day
    const allOpen = predictions.filter((p) => p.isOpen);
    if (allOpen.length === 0) return null;
    allOpen.sort((a, b) => a.expectedWaitMin - b.expectedWaitMin);
    return { hour: allOpen[0].hour, waitMin: allOpen[0].expectedWaitMin, crowdLevel: allOpen[0].crowdLevel };
  }

  openPredictions.sort((a, b) => a.expectedWaitMin - b.expectedWaitMin);
  return {
    hour: openPredictions[0].hour,
    waitMin: openPredictions[0].expectedWaitMin,
    crowdLevel: openPredictions[0].crowdLevel,
  };
}
