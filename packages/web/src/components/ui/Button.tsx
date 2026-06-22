import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-paper border border-accent hover:bg-accent-light hover:border-accent-light active:opacity-90',
  secondary:
    'bg-transparent text-ink border border-ink hover:bg-subtle active:opacity-80',
  ghost:
    'bg-transparent text-muted border border-transparent hover:text-ink hover:bg-subtle active:opacity-80',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

/**
 * Primary interactive element. Follows WCAG 2.2 AA:
 * - min 44×44px click target at md/lg sizes (enforced via padding)
 * - focus-visible ring for keyboard users
 * - aria-busy when loading
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        aria-busy={loading}
        className={[
          'inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide',
          'rounded transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
