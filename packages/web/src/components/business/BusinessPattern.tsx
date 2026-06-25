import { identityFor, type Identity } from '@/lib/identity';
import { Motif } from './businessMotifs';

/**
 * A generative banner unique to each business. Pure SVG, seeded by slug.
 *
 * Monochrome by design: the strip is the warm paper tone with a faint top sheen,
 * and the seeded motif is drawn in charcoal ink. Colour is deliberately removed
 * from the background so the business's tinted mascot is the one bright thing that
 * pops against it. Distinction between businesses comes from the *pattern* (and the
 * animal), not from a loud gradient. Pass `ambient` on the detail hero to drift it.
 */

// Fixed ink palette — same for every business. Tuned to read crisply on paper.
const PATTERN_TONES = {
  ink: '#38352D', // strong strokes / figures
  tone: '#A89F92', // mid-weight fills
  glow: '#5B554A', // focal points (kept monochrome, not the brand accent)
} as const;

export function BusinessPattern({
  slug,
  identity,
  ambient = false,
  className = '',
}: {
  slug?: string;
  identity?: Identity;
  ambient?: boolean;
  className?: string;
}) {
  const id = identity ?? identityFor(slug ?? '');
  // Drive placement/pattern from the real identity, but force monochrome tones.
  const mono: Identity = { ...id, ...PATTERN_TONES };
  const sid = `vr-sheen-${id.seed}`;

  return (
    <svg
      viewBox="0 0 120 48"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={sid} cx="0.2" cy="0.0" r="1.1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Warm paper base, a touch deeper than the card so the strip has presence. */}
      <rect x="0" y="0" width="120" height="48" fill="#F1ECE3" />
      <g className={ambient ? 'animate-pattern-drift motion-reduce:animate-none' : undefined}>
        <Motif identity={mono} />
      </g>
      {/* Soft top-left sheen over the motif for a little depth. */}
      <rect x="0" y="0" width="120" height="48" fill={`url(#${sid})`} />
    </svg>
  );
}
