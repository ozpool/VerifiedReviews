/**
 * Star rating display. Renders five glyphs filled to the nearest half, in the
 * accent colour. Decorative — the accessible value is announced via aria-label.
 */
export function RatingStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return <Star key={i} fill={fill} className={dim} />;
      })}
    </span>
  );
}

function Star({ fill, className }: { fill: number; className: string }) {
  // fill is 0..1 for this star; clip a foreground copy to that width.
  const pct = `${Math.round(fill * 100)}%`;
  return (
    <span className={`relative inline-block ${className}`} aria-hidden="true">
      <Glyph className="absolute inset-0 text-border" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: pct }}>
        <Glyph className="text-accent" />
      </span>
    </span>
  );
}

function Glyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-full h-full ${className}`}>
      <path d="M10 1.5l2.6 5.27 5.82.846-4.21 4.104.994 5.797L10 14.84l-5.204 2.737.994-5.797L1.58 7.616l5.82-.846L10 1.5z" />
    </svg>
  );
}
