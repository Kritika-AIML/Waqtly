import React, { useState } from 'react';
import { HourlyPrediction, CrowdLevel } from '../../types';
import { CrowdBadge } from '../common/CrowdBadge';
import { BarChart3, LineChart, Sparkles, AlertCircle, Info } from 'lucide-react';

interface HourlyForecastChartProps {
  predictions: HourlyPrediction[];
  currentHour?: number;
  highlightHour?: number;
  onSelectHour?: (hour: number) => void;
  className?: string;
}

export const HourlyForecastChart: React.FC<HourlyForecastChartProps> = ({
  predictions,
  currentHour,
  highlightHour,
  onSelectHour,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'wait' | 'crowd'>('wait');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Filter to daytime hours 07:00 to 19:00 for optimal readability, or full range of non-zero hours
  // Let's display hours 07:00 to 18:00 (12 slots)
  const displaySlots = predictions.filter((p) => p.hour >= 7 && p.hour <= 18);

  const maxWait = Math.max(
    30,
    ...displaySlots.map((p) => (p.isOpen ? Math.max(p.highWaitMin, p.expectedWaitMin) : 0))
  );

  const crowdLevelScores: Record<CrowdLevel, number> = {
    Closed: 0,
    Low: 1,
    Moderate: 2,
    High: 3,
    'Very High': 4,
  };

  const crowdLevelColors: Record<CrowdLevel, string> = {
    Closed: '#94A3B8',
    Low: '#14B8A6',
    Moderate: '#F59E0B',
    High: '#F97316',
    'Very High': '#EF4444',
  };

  const activeHoveredPred = hoveredHour !== null ? predictions.find((p) => p.hour === hoveredHour) : null;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs ${className}`}>
      {/* Header controls: View mode (Wait vs Crowd) & Chart Type */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Hourly Profile
          </div>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">
            {viewMode === 'wait' ? 'Estimated wait duration (min)' : 'Crowd density level'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Wait vs Crowd Toggle */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('wait')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'wait'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wait (min)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('crowd')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'crowd'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Crowd level
            </button>
          </div>

          {/* Bar vs Line Toggle */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Bar chart view"
              aria-label="Bar chart view"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'line' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Line chart view"
              aria-label="Line chart view"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Chart Canvas */}
      <div className="relative w-full h-64 sm:h-72 select-none">
        {/* SVG Visualization */}
        <svg
          viewBox="0 0 600 240"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Pattern for closed slots */}
            <pattern id="closedHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#E2E8F0" strokeWidth="2.5" />
            </pattern>
            {/* Gradient for bars */}
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F4FE0" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 200 - ratio * 170;
            const valLabel =
              viewMode === 'wait'
                ? Math.round(ratio * maxWait) + 'm'
                : ratio === 0
                ? 'Closed'
                : ratio === 0.25
                ? 'Low'
                : ratio === 0.5
                ? 'Mod'
                : ratio === 0.75
                ? 'High'
                : 'V.High';
            return (
              <g key={ratio}>
                <line
                  x1="35"
                  y1={y}
                  x2="595"
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? undefined : '3 3'}
                />
                <text
                  x="28"
                  y={y + 3}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Render Demand Sensitivity Shaded Band in wait view (if line chart or background) */}
          {viewMode === 'wait' && (
            <path
              d={(() => {
                const step = (595 - 45) / displaySlots.length;
                const upperPoints: string[] = [];
                const lowerPoints: string[] = [];
                displaySlots.forEach((slot, i) => {
                  const x = 45 + i * step + step / 2;
                  if (!slot.isOpen) {
                    upperPoints.push(`${x},200`);
                    lowerPoints.unshift(`${x},200`);
                  } else {
                    const yHigh = 200 - (slot.highWaitMin / maxWait) * 170;
                    const yLow = 200 - (slot.lowWaitMin / maxWait) * 170;
                    upperPoints.push(`${x},${yHigh}`);
                    lowerPoints.unshift(`${x},${yLow}`);
                  }
                });
                return `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;
              })()}
              fill="url(#rangeGrad)"
              stroke="#93C5FD"
              strokeWidth="0.75"
              strokeDasharray="2 2"
            />
          )}

          {/* Render Slots (Bars or Line) */}
          {displaySlots.map((slot, i) => {
            const step = (595 - 45) / displaySlots.length;
            const x = 45 + i * step;
            const barW = Math.max(14, step * 0.65);
            const barX = x + (step - barW) / 2;
            const isCurrent = currentHour === slot.hour;
            const isHighlighted = highlightHour === slot.hour;
            const isHovered = hoveredHour === slot.hour;

            const waitHeight = slot.isOpen ? (slot.expectedWaitMin / maxWait) * 170 : 0;
            const crowdScore = crowdLevelScores[slot.crowdLevel];
            const crowdHeight = (crowdScore / 4) * 170;
            const activeHeight = viewMode === 'wait' ? waitHeight : crowdHeight;
            const barY = 200 - activeHeight;

            return (
              <g
                key={slot.hour}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHour(slot.hour)}
                onMouseLeave={() => setHoveredHour(null)}
                onClick={() => onSelectHour && onSelectHour(slot.hour)}
              >
                {/* Background column highlight on hover */}
                {isHovered && (
                  <rect
                    x={x}
                    y="25"
                    width={step}
                    height="180"
                    fill="#F8FAFC"
                    rx="4"
                    opacity="0.8"
                  />
                )}

                {/* If slot is closed, show diagonal hatched block */}
                {!slot.isOpen ? (
                  <g>
                    <rect
                      x={barX}
                      y="70"
                      width={barW}
                      height="130"
                      fill="url(#closedHatch)"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                      rx="3"
                    />
                    <text
                      x={barX + barW / 2}
                      y="140"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      fontWeight="600"
                      transform={`rotate(-90 ${barX + barW / 2} 140)`}
                    >
                      CLOSED
                    </text>
                  </g>
                ) : chartType === 'bar' ? (
                  /* Bar element */
                  <g>
                    {/* Error line / sensitivity whiskers for wait mode */}
                    {viewMode === 'wait' && slot.isOpen && (
                      <g stroke="#3B82F6" strokeWidth="1.2">
                        <line
                          x1={barX + barW / 2}
                          y1={200 - (slot.lowWaitMin / maxWait) * 170}
                          x2={barX + barW / 2}
                          y2={200 - (slot.highWaitMin / maxWait) * 170}
                        />
                        <line
                          x1={barX + barW / 2 - 3}
                          y1={200 - (slot.highWaitMin / maxWait) * 170}
                          x2={barX + barW / 2 + 3}
                          y2={200 - (slot.highWaitMin / maxWait) * 170}
                        />
                        <line
                          x1={barX + barW / 2 - 3}
                          y1={200 - (slot.lowWaitMin / maxWait) * 170}
                          x2={barX + barW / 2 + 3}
                          y2={200 - (slot.lowWaitMin / maxWait) * 170}
                        />
                      </g>
                    )}

                    <rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={Math.max(4, activeHeight)}
                      rx="4"
                      fill={
                        viewMode === 'crowd'
                          ? crowdLevelColors[slot.crowdLevel]
                          : isHighlighted
                          ? '#14A3A3'
                          : isCurrent
                          ? '#1F4FE0'
                          : isHovered
                          ? '#2563EB'
                          : '#3B82F6'
                      }
                      stroke={isHighlighted ? '#0D9488' : isCurrent ? '#1D4ED8' : 'none'}
                      strokeWidth={isHighlighted || isCurrent ? '2' : '0'}
                      className="transition-all duration-150"
                    />

                    {/* Numeric wait value label above bar */}
                    {slot.isOpen && viewMode === 'wait' && (
                      <text
                        x={barX + barW / 2}
                        y={barY - 7}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {slot.expectedWaitMin}m
                      </text>
                    )}
                  </g>
                ) : null}

                {/* Current Hour indicator pill */}
                {isCurrent && (
                  <circle
                    cx={barX + barW / 2}
                    cy="212"
                    r="3.5"
                    fill="#1F4FE0"
                  />
                )}

                {/* Hour label below baseline */}
                <text
                  x={barX + barW / 2}
                  y="226"
                  textAnchor="middle"
                  fill={isCurrent ? '#1F4FE0' : isHovered ? '#0F172A' : '#64748B'}
                  fontSize={isCurrent ? '10' : '9'}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                >
                  {slot.hour.toString().padStart(2, '0')}:00
                </text>
              </g>
            );
          })}

          {/* Line Chart alternative mode overlay */}
          {chartType === 'line' && (
            <g>
              <polyline
                fill="none"
                stroke="#1F4FE0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={displaySlots
                  .map((slot, i) => {
                    const step = (595 - 45) / displaySlots.length;
                    const x = 45 + i * step + step / 2;
                    if (!slot.isOpen) return null;
                    const val =
                      viewMode === 'wait'
                        ? (slot.expectedWaitMin / maxWait) * 170
                        : (crowdLevelScores[slot.crowdLevel] / 4) * 170;
                    const y = 200 - val;
                    return `${x},${y}`;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
              {displaySlots.map((slot, i) => {
                if (!slot.isOpen) return null;
                const step = (595 - 45) / displaySlots.length;
                const x = 45 + i * step + step / 2;
                const val =
                  viewMode === 'wait'
                    ? (slot.expectedWaitMin / maxWait) * 170
                    : (crowdLevelScores[slot.crowdLevel] / 4) * 170;
                const y = 200 - val;
                const isHovered = hoveredHour === slot.hour;
                const isCurrent = currentHour === slot.hour;
                return (
                  <circle
                    key={slot.hour}
                    cx={x}
                    cy={y}
                    r={isHovered ? '5' : isCurrent ? '4.5' : '3.5'}
                    fill={isCurrent ? '#1F4FE0' : '#FFFFFF'}
                    stroke="#1F4FE0"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {activeHoveredPred && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs w-72 animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700 mb-2">
              <span className="font-bold text-white font-mono text-sm">
                {activeHoveredPred.hour.toString().padStart(2, '0')}:00 –{' '}
                {(activeHoveredPred.hour + 1).toString().padStart(2, '0')}:00
              </span>
              <CrowdBadge level={activeHoveredPred.crowdLevel} size="sm" />
            </div>

            {activeHoveredPred.isOpen ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Expected wait:</span>
                  <span className="font-bold text-white text-sm">
                    ~{activeHoveredPred.expectedWaitMin} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Range if demand is 15% lower / higher:</span>
                  <span className="font-mono text-blue-200">
                    {activeHoveredPred.lowWaitMin}–{activeHoveredPred.highWaitMin} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Arrivals vs capacity:</span>
                  <span>
                    {activeHoveredPred.arrivals} / {activeHoveredPred.capacity} per hr
                  </span>
                </div>

                {activeHoveredPred.drivers.length > 0 && (
                  <div className="pt-1.5 mt-1 border-t border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                      Key drivers:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc pl-3">
                      {activeHoveredPred.drivers.slice(0, 2).map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-xs py-1">
                Location is closed during this hour. Backlog resets to 0.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer: Legend & Sensitivity explanation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
            <span>Expected Wait</span>
          </div>
          {viewMode === 'wait' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2 bg-blue-100 border border-blue-300 inline-block rounded-xs" />
              <span>Range if demand is 15% lower / higher</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 border border-slate-300 inline-block rounded-xs bg-slate-100" />
            <span>Closed Slot</span>
          </div>
          {currentHour !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span className="font-medium text-slate-700">Current Demo Hour</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Hover or tap any slot for drivers & volume metrics
        </div>
      </div>
    </div>
  );
};
