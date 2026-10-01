import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'signal' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'exam';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-colors select-none rounded-[2px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          {
            'bg-ink text-paper hover:bg-ink/90 active:bg-ink': variant === 'primary',
            'bg-paper text-ink border border-rule hover:bg-ground active:bg-paper': variant === 'secondary',
            'bg-signal text-paper hover:bg-signal/90 active:bg-signal': variant === 'signal',
            'bg-transparent text-ink-muted hover:text-ink hover:bg-ground/60': variant === 'ghost',
          },
          {
            'text-xs px-2.5 py-1 min-h-[30px]': size === 'sm',
            'text-sm px-4 py-2 min-h-[38px]': size === 'md',
            'text-base px-6 py-3 min-h-[46px]': size === 'lg',
            'text-base px-6 py-3.5 min-h-[44px] w-full text-left': size === 'exam',
          },
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
