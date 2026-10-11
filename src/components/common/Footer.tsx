import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { resetDemo } = useApp();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <footer className="border-t border-slate-800 bg-[#0B1B3A] text-slate-300 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight font-sans">
                Waqtly
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1F4FE0] ml-1 mb-1" />
              <span className="text-xs text-slate-400 font-semibold ml-2.5 pl-2.5 border-l border-slate-700">
                Know when to go.
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md text-xs">
              AI-assisted queue forecasting and proactive visit planning prototype. Waqtly helps students, patients, and citizens make informed decisions on when to visit service locations rather than waiting after arrival.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Hackathon Prototype Edition
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px] mb-3.5">
              App Navigation
            </h4>
            <ul className="space-y-2">
              {[
                { id: 'home', label: 'Home Dashboard' },
                { id: 'plan', label: 'Plan My Visit' },
                { id: 'forecast', label: 'Hourly Forecasts' },
                { id: 'locations', label: 'Demo Locations' },
                { id: 'admin', label: 'Staff Demo Mode' },
                { id: 'how-it-works', label: 'How It Works & Limitations' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(link.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors text-left text-slate-400 cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Prototype Controls */}
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px] mb-3.5">
              Prototype Controls
            </h4>
            <p className="text-slate-400 text-xs mb-3.5 leading-relaxed">
              Restore the initial seed numbers and wipe mock records at any point.
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo State
            </button>
          </div>
        </div>

        {/* Persistent Honesty Disclaimer in Footer */}
        <div className="pt-8 border-t border-slate-800/80 text-slate-400 text-xs leading-relaxed flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <span className="font-bold text-slate-200">Prototype Disclaimer:</span> All locations, visitor counts, and wait duration predictions are illustrative sample data generated using a transparent rule-based forecast model. No real-time camera feeds, IoT sensors, or live venue telemetry exist. Hospital triage protocols strictly supersede all informational wait figures.
          </div>
          <div className="shrink-0 text-slate-500 font-mono text-[11px]">
            Waqtly v1.0 • Built for Demo
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 sm:p-7 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Reset Demo State?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This will reset all active counter numbers, opening hours, queue updates, recorded actual waits, and saved visit plans back to the pristine initial seed dataset.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemo();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
