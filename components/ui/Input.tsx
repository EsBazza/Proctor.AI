import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={clsx(
          'w-full bg-paper text-ink border rounded-[2px] px-3.5 py-2.5 text-sm transition-colors',
          'placeholder:text-ink-muted/60',
          'focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink',
          'disabled:bg-ground disabled:text-ink-muted disabled:cursor-not-allowed',
          error ? 'border-signal ring-1 ring-signal' : 'border-rule',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
