import React, { useState } from 'react';
import { LocationData, HourlyPrediction, CrowdLevel } from '../../types';
import { predictDay } from '../../services/predictionService';
import { CrowdBadge } from '../common/CrowdBadge';
import { Clock, Sparkles, Info } from 'lucide-react';

interface DayDialProps {
  location: LocationData;
  dayType: 'Weekday' | 'Saturday' | 'Sunday';
  currentHour: number;
  currentMinute?: number;
  onSelectHour?: (hour: number) => void;
  className?: string;
}

export const DayDial: React.FC<DayDialProps> = ({
  location,
  dayType,
  currentHour,
  currentMinute = 0,
  onSelectHour,
  className = '',
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const predictions = predictDay(location, dayType, {
    demoCurrentHour: currentHour,
    demoClockTimestamp: Date.now(),
  });

  const activeHour = hoveredHour !== null ? hoveredHour : currentHour;
  const activePred = predictions.find((p) => p.hour === activeHour) || predictions[currentHour] || predictions[12];

  // SVG Geometry Constants
  const size = 320;
  const center = size / 2;
  const outerRadius = 135;
  const innerRadius = 95;

  const crowdColors: Record<CrowdLevel, string> = {
    Low: '#14A3A3',       // Teal
    Moderate: '#F59E0B',  // Amber
    High: '#F97316',      // Orange
    'Very High': '#EF4444', // Red
    Closed: '#1E293B',    // Dark slate
  };

  // 24 hours -> 15 deg per hour
  const needleAngle = ((currentHour + currentMinute / 60) * 15 - 90);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = outerRadius + 8;
  const needleX = center + needleLength * Math.cos(needleRad);
  const needleY = center + needleLength * Math.sin(needleRad);

  // Helper to create an SVG arc path
  const makeArcPath = (startDeg: number, endDeg: number, rOut: number, rIn: number) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = center + rOut * Math.cos(startRad);
    const y1 = center + rOut * Math.sin(startRad);
    const x2 = center + rOut * Math.cos(endRad);
    const y2 = center + rOut * Math.sin(endRad);

    const x3 = center + rIn * Math.cos(endRad);
    const y3 = center + rIn * Math.sin(endRad);
    const x4 = center + rIn * Math.cos(startRad);
    const y4 = center + rIn * Math.sin(startRad);

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 0 0 ${x4} ${y4} Z`;
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Dial SVG Container */}
      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] filter drop-shadow-2xl">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform transition-transform duration-300"
        >
          <defs>
            {/* Glow effect for active needle */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Soft inner shadow gradient */}
            <radialGradient id="dialBg" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#0B1B3A" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#050C1A" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Background circular plate */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius + 14}
            fill="url(#dialBg)"
            stroke="#1E2D4A"
            strokeWidth="1.5"
          />

          {/* Clock face ticks (00, 06, 12, 18) */}
          {[
            { hour: 0, label: '00' },
            { hour: 6, label: '06' },
            { hour: 12, label: '12' },
            { hour: 18, label: '18' },
          ].map(({ hour, label }) => {
            const rad = ((hour * 15 - 90) * Math.PI) / 180;
            const tx = center + (outerRadius + 8) * Math.cos(rad);
            const ty = center + (outerRadius + 8) * Math.sin(rad);
            return (
              <text
                key={label}
                x={tx}
                y={ty + 3}
                fill="#64748B"
                fontSize="9"
                fontWeight="700"
                fontFamily="system-ui, monospace"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}

          {/* 24 Hour Segments */}
          {predictions.map((pred) => {
            const h = pred.hour;
            const startAngle = h * 15 - 90 + 0.8;
            const endAngle = (h + 1) * 15 - 90 - 0.8;
            const isHovered = hoveredHour === h;
            const isCurrent = currentHour === h;
            const rOut = isHovered ? outerRadius + 4 : outerRadius;
            const rIn = isHovered ? innerRadius - 2 : innerRadius;
            const color = crowdColors[pred.crowdLevel];

            return (
              <path
                key={h}
                d={makeArcPath(startAngle, endAngle, rOut, rIn)}
                fill={color}
                stroke={isHovered ? '#FFFFFF' : isCurrent ? '#38BDF8' : '#0B1B3A'}
                strokeWidth={isHovered ? 2 : isCurrent ? 1.5 : 1}
                className="cursor-pointer transition-all duration-150 hover:brightness-125"
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                onClick={() => onSelectHour && onSelectHour(h)}
              >
                <title>
                  {`${h.toString().padStart(2, '0')}:00 - ${pred.isOpen ? `~${pred.expectedWaitMin}m wait (${pred.crowdLevel})` : 'Closed'}`}
                </title>
              </path>
            );
          })}

          {/* Center Display Disc */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius - 4}
            fill="#09142A"
            stroke="#1E2D4A"
            strokeWidth="1.5"
          />

          {/* Current Time Needle */}
          <g>
            <line
              x1={center}
              y1={center}
              x2={needleX}
              y2={needleY}
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#glow)"
              className="transition-all duration-300 ease-out"
            />
            {/* Needle tip indicator */}
            <circle
              cx={needleX}
              cy={needleY}
              r="4"
              fill="#FFFFFF"
              stroke="#0284C7"
              strokeWidth="2"
            />
            {/* Pivot pin */}
            <circle
              cx={center}
              cy={center}
              r="6"
              fill="#1F4FE0"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </g>
        </svg>

        {/* Center Text HUD (Inside Inner Disc) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="font-mono text-[11px] font-bold tracking-widest text-blue-300 uppercase">
            {activeHour.toString().padStart(2, '0')}:00
            {hoveredHour === null && ' (NOW)'}
          </span>
          <div className="mt-0.5">
            {activePred?.isOpen ? (
              <>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  ~{activePred.expectedWaitMin}
                </span>
                <span className="text-xs font-semibold text-slate-300 ml-1">min</span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold text-slate-400">Closed</span>
            )}
          </div>
          <div className="mt-1">
            <CrowdBadge
              level={activePred?.isOpen ? activePred.crowdLevel : 'Closed'}
              size="sm"
            />
          </div>
          {activePred?.isOpen && (
            <span className="text-[10px] text-slate-400 font-mono mt-1">
              Range: {activePred.lowWaitMin}–{activePred.highWaitMin}m
            </span>
          )}
        </div>
      </div>

      {/* Mini Legend Below Dial */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14A3A3]" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span>Mod</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span>V.High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B] border border-slate-600" />
          <span>Closed</span>
        </div>
      </div>
    </div>
  );
};
