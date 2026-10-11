import React from 'react';
import { Info } from 'lucide-react';

export const HonestyBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      title="All figures and timings are synthetic sample data created for prototype demonstration."
    >
      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span>Illustrative demo data</span>
    </span>
  );
};
