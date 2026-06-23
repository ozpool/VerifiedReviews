import { identityFor, type Identity } from '@/lib/identity';
import { Motif } from './businessMotifs';

/**
 * A generative banner unique to each business. Pure SVG, seeded by slug, tinted
 * to the business's identity colour.
 *
 * The background is a rich two-hue gradient (the business hue blended into an
 * analogous neighbour) that's vivid at the TOP and fades to a light wash at the
 * BOTTOM — so the header reads as a colourful, eye-catching strip while the lower
 * band stays pale enough for the dark mascot to pop where it roams. A soft
 * top-left sheen adds depth. Pass `ambient` on the detail hero to drift the motif.
 */
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
  const gid = `vr-grad-${id.seed}`;
  const sid = `vr-sheen-${id.seed}`;
  const h = id.hue;
  const hA = (h + 40) % 360; // a vivid analogous neighbour
  const hB = (h + 340) % 360; // and one the other way — a richer 3-hue sweep

  return (
    <svg
      viewBox="0 0 120 48"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.42" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 85% 60%)`} />
          <stop offset="0.45" stopColor={`hsl(${hA} 80% 66%)`} />
          <stop offset="1" stopColor={`hsl(${hB} 74% 86%)`} />
        </linearGradient>
        <radialGradient id={sid} cx="0.22" cy="0.06" r="0.95">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="120" height="48" fill={`url(#${gid})`} />
      <rect x="0" y="0" width="120" height="48" fill={`url(#${sid})`} />
      <g className={ambient ? 'animate-pattern-drift motion-reduce:animate-none' : undefined}>
        <Motif identity={id} />
      </g>
    </svg>
  );
}
