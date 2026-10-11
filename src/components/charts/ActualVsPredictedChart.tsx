import React from 'react';
import { ActualWaitRecord } from '../../types';

interface ActualVsPredictedChartProps {
  records: ActualWaitRecord[];
  className?: string;
}

export const ActualVsPredictedChart: React.FC<ActualVsPredictedChartProps> = ({
  records,
  className = '',
}) => {
  if (records.length === 0) return null;

  const maxVal = Math.max(
    30,
    ...records.map((r) => Math.max(r.predictedWaitMin, r.actualWaitMin))
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart visualization */}
      <div className="h-44 w-full relative">
        <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Baseline */}
          <line x1="25" y1="135" x2="495" y2="135" stroke="#CBD5E1" strokeWidth="1" />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 135 - ratio * 115;
            return (
              <g key={ratio}>
                <line x1="25" y1={y} x2="495" y2={y} stroke="#F1F5F9" strokeDasharray="3 3" />
                <text x="20" y={y + 3} textAnchor="end" fill="#94A3B8" fontSize="8">
                  {Math.round(ratio * maxVal)}m
                </text>
              </g>
            );
          })}

          {/* Grouped bars for Predicted vs Actual */}
          {records.map((rec, i) => {
            const step = (495 - 35) / records.length;
            const x = 35 + i * step;
            const barW = Math.min(22, step * 0.35);

            const predH = (rec.predictedWaitMin / maxVal) * 115;
            const actualH = (rec.actualWaitMin / maxVal) * 115;

            const predY = 135 - predH;
            const actualY = 135 - actualH;

            return (
              <g key={rec.id || i}>
                {/* Predicted bar */}
                <rect
                  x={x + step * 0.15}
                  y={predY}
                  width={barW}
                  height={Math.max(2, predH)}
                  fill="#93C5FD"
                  rx="3"
                />
                <text
                  x={x + step * 0.15 + barW / 2}
                  y={predY - 4}
                  textAnchor="middle"
                  fill="#2563EB"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {rec.predictedWaitMin}m
                </text>

                {/* Actual bar */}
                <rect
                  x={x + step * 0.15 + barW + 3}
                  y={actualY}
                  width={barW}
                  height={Math.max(2, actualH)}
                  fill="#1F4FE0"
                  rx="3"
                />
                <text
                  x={x + step * 0.15 + barW + 3 + barW / 2}
                  y={actualY - 4}
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {rec.actualWaitMin}m
                </text>

                {/* Hour label */}
                <text
                  x={x + step * 0.15 + barW}
                  y="148"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="8"
                  fontWeight="medium"
                >
                  {rec.hour.toString().padStart(2, '0')}:00
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs bg-[#93C5FD] inline-block" />
          <span>Predicted wait</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs bg-[#1F4FE0] inline-block" />
          <span className="font-semibold text-slate-900">Recorded actual wait</span>
        </div>
      </div>
    </div>
  );
};
