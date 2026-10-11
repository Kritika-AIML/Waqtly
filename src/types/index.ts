export type DayType = 'Weekday' | 'Saturday' | 'Sunday';

export type CrowdLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Closed';

export interface Counter {
  id: string;
  name: string;
  queueLength: number;
  isOpen: boolean;
  purposes: string[];
}

export interface LocationEvent {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  multiplier: number; // e.g. 1.3 for +30%
}

export interface StaffUpdate {
  queueLength: number;
  timestamp: number; // ms timestamp
  demoHour: number;
}

export interface ActualWaitRecord {
  id: string;
  timestamp: number;
  hour: number;
  predictedWaitMin: number;
  actualWaitMin: number;
  isSample?: boolean;
}

export interface LocationData {
  id: string;
  name: string;
  shortDescription: string;
  openSlots: number[]; // start hours of open slots e.g. [8, 9, 10...]
  activeCounters: number;
  avgServiceMin: number;
  baselineWeekdayArrivals: Record<number, number>;
  saturdayMultiplier: number;
  purposes: string[];
  counters: Counter[] | null; // null for Hospital OPD where counter data is unavailable
  events: LocationEvent[];
  lastStaffUpdate: StaffUpdate | null;
  actualRecords: ActualWaitRecord[];
}

export interface HourlyPrediction {
  hour: number;
  isOpen: boolean;
  arrivals: number;
  capacity: number;
  expectedWaitMin: number;
  lowWaitMin: number;
  highWaitMin: number;
  crowdLevel: CrowdLevel;
  drivers: string[];
  freshStaffUpdate?: boolean;
}

export interface PlanRecommendation {
  recommendedHour: number;
  expectedWaitMin: number;
  lowWaitMin: number;
  highWaitMin: number;
  crowdLevel: CrowdLevel;
  isWithinLimit: boolean;
  alternatives: {
    hour: number;
    expectedWaitMin: number;
    lowWaitMin: number;
    highWaitMin: number;
    crowdLevel: CrowdLevel;
  }[];
  explanation: {
    whyThisSlot: string;
    busiestComparison: string;
    sensitivityNote: string;
    variablesNote: string;
  };
  windowPredictions: HourlyPrediction[];
  noSlotMetLimit?: boolean;
}

export interface SavedPlan {
  id: string;
  createdAt: number;
  locationId: string;
  locationName: string;
  dayType: DayType;
  dateStr: string;
  hour: number;
  expectedWaitMin: number;
  crowdLevel: CrowdLevel;
  purpose: string;
  maxWaitMin: number;
}

export interface DemoClock {
  isOverridden: boolean;
  dayType: DayType;
  hour: number;
  minute: number;
  dateStr: string;
}
