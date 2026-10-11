import React from 'react';
import { HonestyBadge } from '../components/common/HonestyBadge';
import { HospitalDisclaimer } from '../components/common/HospitalDisclaimer';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Database,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <HonestyBadge />
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-semibold text-slate-500">Methodology & Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How Waqtly Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          Waqtly provides a transparent, deterministic forecasting model designed to help people decide <strong className="text-slate-900 font-semibold">when to visit a place</strong> rather than waiting blindly after arrival.
        </p>
      </div>

      {/* 4 Plain-Language Steps */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
          The Four-Step Visit Planning Flow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Choose Place</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select one of our demo venues (Canteen, Admin Office, Hospital OPD, Bank Counter).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Set Your Window</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Specify your acceptable arrival window (e.g. 10:00–14:00), visit purpose, and max wait limit.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Waqtly Compares Slots</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our deterministic queuing engine balances incoming demand against counter capacity across each slot.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Get Recommendation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Receive the optimal arrival hour with minutes saved, sensitivity range, and alternative options.
            </p>
          </div>
        </div>
      </section>

      {/* The Mathematical Prediction Method */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            The Deterministic Forecasting Engine
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          In this prototype, predictions are governed by an auditable rule-based simulator. The model is structured with clean modular interfaces so that a statistical or machine-learning model trained on real sensor data can be dropped in seamlessly later.
        </p>

        <div className="space-y-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              1. Capacity per Hour = Active Counters × (60 / Avg Service Minutes)
            </span>
            <p className="text-slate-500">
              For example: 4 counters with 2-minute average service can process up to 120 customers per hour.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              2. Hourly Arrivals = Baseline Weekday Arrivals × Day Multiplier × Event Multipliers
            </span>
            <p className="text-slate-500">
              Saturday applies a weekend reduction multiplier (0.5× to 0.8×). Special events (such as fee deadlines) apply custom surge multipliers.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              3. Backlog Progression: Backlog[h] = max(0, Backlog[h-1] + Arrivals[h] - Capacity[h])
            </span>
            <p className="text-slate-500">
              If incoming arrivals exceed capacity, the unserved overflow rolls over to the next hour. Backlog strictly resets to 0 after any closed hour.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              4. Expected Wait (min) = (Backlog[h] / Capacity[h]) × 60 + (Avg Service Minutes / 2)
            </span>
            <p className="text-slate-500">
              Calculates queuing time through the backlog plus half of the service duration for the customer being helped.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              5. Demand Sensitivity Range (±15% Demand Variation)
            </span>
            <p className="text-slate-500">
              The engine automatically re-simulates the entire day at 85% and 115% baseline demand. We label this strictly as <em>"Range if demand is 15% lower / higher"</em>. We never present this as a probabilistic confidence percentage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              6. Crowd Level Tiers from Utilization Ratio (Arrivals / Capacity)
            </span>
            <p className="text-slate-500">
              Below 0.6 = Low (Teal) • 0.6 to &lt;0.9 = Moderate (Amber) • 0.9 to &lt;1.1 = High (Orange) • 1.1 or more = Very High (Red) • Closed = Muted Grey.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              7. Staff Update Influence & 45-Minute Decay
            </span>
            <p className="text-slate-500">
              When location staff record a physical queue length, it seeds the current hour's starting backlog with that headcount. If the update is older than 45 minutes, Waqtly marks it expired and reverts to pure baseline arrivals.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Limitations & Hospital Disclaimer */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Honest Limitations of this Prototype
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-2">
            <h3 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
              Mandatory Hospital OPD Clinical Protocol
            </h3>
            <p>
              Wait predictions are informational only. They must never delay emergency care or override clinical triage. In an emergency, go to the emergency department immediately.
            </p>
          </div>

          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong className="text-slate-900">Illustrative Sample Data:</strong> All 4 venues and their numbers represent synthetic sample figures crafted for demonstration.
            </li>
            <li>
              <strong className="text-slate-900">No Real-Time Sensors:</strong> There are no camera streams, Wi-Fi sniffers, or live venue telemetry feeds in this prototype.
            </li>
            <li>
              <strong className="text-slate-900">No Trained ML Model:</strong> The forecasts are computed using the transparent arithmetic queue equations documented above.
            </li>
            <li>
              <strong className="text-slate-900">Counter-Level Data Availability:</strong> Counter breakdowns are supported for Canteen, Admin Office, and Bank. Hospital OPD intentionally has counter data disabled to reflect triage realities.
            </li>
          </ul>
        </div>
      </section>

      {/* Sample Data Notes (Tune nothing silently) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Sample Data Parameters & Assumptions
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Per our honesty guidelines, all baseline seed parameters are fully disclosed:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">MIET College Canteen</span>
            <p className="text-slate-500">
              Open 08:00–18:00. 4 active counters. 2 min service time. Peak at 12:00–14:00 (140–160 arrivals/hr). Saturday multiplier: 0.5.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">College Administration Office</span>
            <p className="text-slate-500">
              Open 10:00–16:00 (closed 13:00–14:00 lunch break). 3 counters. 8 min service time. Peak at 12:00 & 14:00. Saturday multiplier: 0.6.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">Hospital OPD Registration Desk</span>
            <p className="text-slate-500">
              Open 08:00–14:00. 4 counters. 5 min service time. Peak at 10:00 (70 arrivals/hr). Saturday multiplier: 0.8. Counter data: Not available.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">Bank Service Counter</span>
            <p className="text-slate-500">
              Open 10:00–16:00. 4 counters. 6 min service time. Peak at 11:00 (52 arrivals/hr). Saturday multiplier: 0.7.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">
            Roadmap (Future Engineering, Not Implemented)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
            <span className="font-bold text-slate-900 block">1. Historical ML Training</span>
            <p className="text-slate-500 leading-relaxed">
              Replace baseline rule estimates with a gradient-boosted time-series model trained on multi-month turnstile and ticketing logs.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
            <span className="font-bold text-slate-900 block">2. POS & Ticket Dispenser Sync</span>
            <p className="text-slate-500 leading-relaxed">
              Automate live queue counts directly through campus cafeteria POS registers and bank token kiosks instead of manual staff entry.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
            <span className="font-bold text-slate-900 block">3. Smart Arrival Alerts</span>
            <p className="text-slate-500 leading-relaxed">
              Push notification triggers that advise travelers when an unexpected dip in wait times creates a prime departure opportunity.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
