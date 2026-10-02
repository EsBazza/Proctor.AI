'use client';
import React, { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export interface FormattedTimeProps {
  date: string | number | Date | null | undefined;
  format?: 'time' | 'date' | 'datetime';
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  fallback?: string;
}

/**
 * Renders dates/times with 100% hydration mismatch immunity.
 * During SSR and initial hydration, it renders a deterministic UTC string with suppressHydrationWarning.
 * Once mounted on the client, it seamlessly switches to the user's localized timezone.
 */
export function FormattedTime({
  date,
  format = 'time',
  options,
  className = '',
  fallback = '—'
}: FormattedTimeProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) {
    return <span className={className}>{fallback}</span>;
  }

  // During SSR and initial client hydration, render deterministic UTC
  if (!mounted) {
    const utcOptions: Intl.DateTimeFormatOptions = {
      ...(options || {}),
      timeZone: 'UTC'
    };

    let utcString = '';
    if (format === 'date') {
      utcString = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...utcOptions
      });
    } else if (format === 'datetime') {
      utcString = d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        ...utcOptions
      });
    } else {
      utcString = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        ...utcOptions
      });
    }

    return (
      <span className={className} suppressHydrationWarning>
        {utcString}
      </span>
    );
  }

  // Once mounted in the client browser, format with the user's actual locale & timezone
  let localString = '';
  if (format === 'date') {
    localString = d.toLocaleDateString(undefined, options || {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } else if (format === 'datetime') {
    localString = d.toLocaleString(undefined, options);
  } else {
    localString = d.toLocaleTimeString(undefined, options || {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  return (
    <span className={className} suppressHydrationWarning>
      {localString}
    </span>
  );
}
