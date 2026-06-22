/**
 * Reusable loading / empty / error state components.
 *
 * These follow the discriminated-state pattern: callers branch on a `status`
 * value and render the matching component. They're intentionally unstyled
 * beyond the design-token colours so they fit any context.
 */

// ---- Loading ----------------------------------------------------------------

interface LoadingProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const spinnerSize = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' } as const;

export function Loading({ label = 'Loading…', size = 'md' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex items-center gap-3 text-muted"
    >
      <span
        aria-hidden="true"
        className={`${spinnerSize[size]} border-2 border-current border-t-transparent rounded-full animate-spin`}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// ---- Empty ------------------------------------------------------------------

interface EmptyProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Empty({ title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      {/* Receipt stub motif */}
      <div className="w-10 h-14 border-2 border-dashed border-border rounded-sm flex items-end justify-center pb-2">
        <div className="w-5 h-px bg-border" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted max-w-xs">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ---- Error ------------------------------------------------------------------

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border border-accent/40 bg-accent-muted rounded p-4 flex flex-col gap-2"
    >
      <p className="font-display font-semibold text-accent">{title}</p>
      <p className="text-sm text-ink/80">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="self-start text-sm text-accent underline underline-offset-2 hover:text-accent-light"
        >
          Try again
        </button>
      )}
    </div>
  );
}
