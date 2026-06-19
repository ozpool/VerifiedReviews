interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Renders a dashed-border stamp motif instead of the standard solid border */
  stamp?: boolean;
}

/**
 * Surface container. Two visual modes:
 * - default: thin solid border on warm off-white
 * - stamp: dashed accent border — used for "verified" callouts
 */
export function Card({ children, className = '', stamp = false }: CardProps) {
  return (
    <div
      className={[
        'rounded bg-paper p-6',
        stamp
          ? 'border-2 border-dashed border-accent'
          : 'border border-border',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/** Thin horizontal rule for use inside a Card or as a section divider */
export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-t border-border ${className}`} />;
}
