import React from 'react';
import { CrowdLevel } from '../../types';
import { CheckCircle2, Clock, Flame, AlertCircle, Ban } from 'lucide-react';

interface CrowdBadgeProps {
  level: CrowdLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CrowdBadge: React.FC<CrowdBadgeProps> = ({
  level,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    CrowdLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    Low: {
      label: 'Low crowd',
      bg: 'bg-teal-50',
      text: 'text-teal-900',
      border: 'border-teal-300',
      icon: CheckCircle2,
    },
    Moderate: {
      label: 'Moderate crowd',
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-300',
      icon: Clock,
    },
    High: {
      label: 'High crowd',
      bg: 'bg-orange-50',
      text: 'text-orange-950',
      border: 'border-orange-300',
      icon: Flame,
    },
    'Very High': {
      label: 'Very high crowd',
      bg: 'bg-rose-50',
      text: 'text-rose-950',
      border: 'border-rose-300',
      icon: AlertCircle,
    },
    Closed: {
      label: 'Closed',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      icon: Ban,
    },
  };

  const conf = configs[level] || configs.Closed;
  const IconComponent = conf.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <IconComponent className={size === 'lg' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span>{conf.label}</span>
    </span>
  );
};
