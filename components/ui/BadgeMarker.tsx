import React from 'react';
import clsx from 'clsx';

export type ThreatLevel = 'benign' | 'low' | 'suspicious' | 'critical' | 'verified';

interface BadgeMarkerProps {
  level: ThreatLevel;
  label?: string;
  className?: string;
}

export function BadgeMarker({ level, label, className }: BadgeMarkerProps) {
  const configs: Record<ThreatLevel, { marker: string; defaultLabel: string; colorClass: string }> = {
    benign: {
      marker: '—',
      defaultLabel: 'Normal',
      colorClass: 'text-ink-muted',
    },
    low: {
      marker: '△',
      defaultLabel: 'Low',
      colorClass: 'text-caution',
    },
    suspicious: {
      marker: '◇',
      defaultLabel: 'Suspicious',
      colorClass: 'text-caution font-medium',
    },
    critical: {
      marker: '■',
      defaultLabel: 'Critical',
      colorClass: 'text-signal font-semibold',
    },
    verified: {
      marker: '✓',
      defaultLabel: 'Verified',
      colorClass: 'text-verified font-medium',
    },
  };

  const config = configs[level] || configs.benign;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-mono tabular-nums select-none',
        config.colorClass,
        className
      )}
    >
      <span aria-hidden="true" className="text-[11px] leading-none">
        {config.marker}
      </span>
      <span>{displayLabel}</span>
    </span>
  );
}
