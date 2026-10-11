import React, { useState } from 'react';
import { LocationData, DayType, HourlyPrediction, CrowdLevel } from '../../types';
import { predictDay } from '../../services/predictionService';
import { CrowdBadge } from '../common/CrowdBadge';
import { Star, Info } from 'lucide-react';

interface WeeklyCrowdHeatmapProps {
  location: LocationData;
  className?: string;
  onSelectSlot?: (day: string, hour: number) => void;
}

interface CellData {
  dayName: string;
  dayType: DayType;
  hour: number;
  prediction: HourlyPrediction;
}

export const WeeklyCrowdHeatmap: React.FC<WeeklyCrowdHeatmapProps> = ({
  location,
  className = '',
  onSelectSlot,
}) => {
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);

  const days: { name: string; type: DayType }[] = [
    { name: 'Monday', type: 'Weekday' },
    { name: 'Tuesday', type: 'Weekday' },
    { name: 'Wednesday', type: 'Weekday' },
    { name: 'Thursday', type: 'Weekday' },
    { name: 'Friday', type: 'Weekday' },
    { name: 'Saturday', type: 'Saturday' },
  ];

  // Hours 08:00 to 17:00
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  // Precompute predictions for Weekday and Saturday
  const weekdayPreds = predictDay(location, 'Weekday');
  const saturdayPreds = predictDay(location, 'Saturday');

  // Build grid data
  const grid: CellData[][] = days.map((d) => {
    const preds = d.type === 'Saturday' ? saturdayPreds : weekdayPreds;
    return hours.map((h) => {
      const p = preds.find((item) => item.hour === h) || {
        hour: h,
        isOpen: false,
        arrivals: 0,
        capacity: 0,
        expectedWaitMin: 0,
        lowWaitMin: 0,
        highWaitMin: 0,
        crowdLevel: 'Closed' as CrowdLevel,
        drivers: ['Closed'],
      };
      return {
        dayName: d.name,
        dayType: d.type,
        hour: h,
        prediction: p,
      };
    });
  });

  // Find quietest open cell across all open cells
  let quietestCell: CellData | null = null;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.prediction.isOpen) {
        if (!quietestCell || cell.prediction.expectedWaitMin < quietestCell.prediction.expectedWaitMin) {
          quietestCell = cell;
        }
      }
    }
  }

  const getCellBg = (level: CrowdLevel, isOpen: boolean) => {
    if (!isOpen) return 'bg-slate-200 border-slate-300';
    if (level === 'Low') return 'bg-teal-500 text-white';
    if (level === 'Moderate') return 'bg-amber-400 text-slate-900';
    if (level === 'High') return 'bg-orange-500 text-white';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Weekly Crowd Heatmap
          </h3>
          <p className="text-xs text-slate-500">
            Compare hour-by-hour wait intensity across all operating days (Mon–Sat)
          </p>
        </div>

        {quietestCell && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-teal-500 text-teal-600" />
            <span>
              Quietest week slot: {quietestCell.dayName} at {quietestCell.hour}:00 (~{quietestCell.prediction.expectedWaitMin}m)
            </span>
          </div>
        )}
      </div>

      {/* Heatmap Grid Container with horizontal scrolling on mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px] space-y-2">
          {/* Header row: Hours */}
          <div className="grid grid-cols-11 gap-1.5 text-center text-[11px] font-mono font-bold text-slate-400">
            <div className="text-left font-sans text-slate-500 font-bold">Day</div>
            {hours.map((h) => (
              <div key={h}>{h.toString().padStart(2, '0')}:00</div>
            ))}
          </div>

          {/* Day Rows */}
          {grid.map((row, rIdx) => (
            <div key={row[0].dayName} className="grid grid-cols-11 gap-1.5 items-center">
              {/* Day Label */}
              <div className="text-xs font-bold text-slate-700 truncate pr-1">
                {row[0].dayName.slice(0, 3)}
              </div>

              {/* Hour Cells */}
              {row.map((cell) => {
                const isQuiet =
                  quietestCell &&
                  quietestCell.dayName === cell.dayName &&
                  quietestCell.hour === cell.hour;
                const isOpen = cell.prediction.isOpen;
                const bg = getCellBg(cell.prediction.crowdLevel, isOpen);

                return (
                  <div
                    key={cell.hour}
                    className={`relative h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 hover:z-10 hover:shadow-md ${bg}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => onSelectSlot && onSelectSlot(cell.dayName, cell.hour)}
                  >
                    {isOpen ? (
                      <>
                        <span className="font-mono text-xs font-extrabold leading-none">
                          {cell.prediction.expectedWaitMin}m
                        </span>
                        {isQuiet && (
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-900 absolute top-1 right-1" />
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">✕</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip / Inspection Bar */}
      {hoveredCell && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono text-sm">
              {hoveredCell.dayName} at {hoveredCell.hour.toString().padStart(2, '0')}:00
            </span>
            <CrowdBadge level={hoveredCell.prediction.crowdLevel} size="sm" />
          </div>

          {hoveredCell.prediction.isOpen ? (
            <div className="flex items-center gap-4 text-xs">
              <span>
                Expected wait: <strong className="text-blue-300 font-mono">~{hoveredCell.prediction.expectedWaitMin} min</strong>
              </span>
              <span>
                Range: <strong className="text-slate-300 font-mono">{hoveredCell.prediction.lowWaitMin}–{hoveredCell.prediction.highWaitMin}m</strong>
              </span>
              <span>
                Arrivals: <strong className="text-slate-300 font-mono">{hoveredCell.prediction.arrivals}/hr</strong>
              </span>
            </div>
          ) : (
            <span className="text-slate-400">Closed during this time slot</span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-teal-500" />
            <span>Low Crowd</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-400" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-500" />
            <span>Very High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300" />
            <span>Closed</span>
          </div>
        </div>

        <span className="text-slate-400 italic">
          Hover or tap any square to view details
        </span>
      </div>
    </div>
  );
};
