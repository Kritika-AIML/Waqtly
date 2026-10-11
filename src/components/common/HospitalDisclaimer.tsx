import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const HospitalDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs ${className}`}
    >
      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <span className="font-semibold text-amber-900 block mb-0.5">Clinical Care Notice</span>
        Wait predictions are informational only. They must never delay emergency care or override clinical triage. In an emergency, go to the emergency department immediately.
      </div>
    </div>
  );
};
