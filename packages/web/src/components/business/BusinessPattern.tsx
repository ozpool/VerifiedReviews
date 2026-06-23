import { identityFor, seededRng, type Identity } from '@/lib/identity';

/**
 * A generative banner unique to each business. Pure SVG, seeded by slug, tinted
 * to the business's identity colour. Refined geometric motifs — not noise. Pass
 * either a slug or a pre-computed identity (the detail page reuses one).
 */
export function BusinessPattern({
  slug,
  identity,
  className = '',
}: {
  slug?: string;
  identity?: Identity;
  className?: string;
}) {
  const id = identity ?? identityFor(slug ?? '');
  return (
    <svg
      viewBox="0 0 120 48"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ backgroundColor: id.wash }}
    >
      <Motif identity={id} />
    </svg>
  );
}

/** The seeded geometric figure drawn over the wash. One per pattern kind. */
function Motif({ identity }: { identity: Identity }) {
  const r = seededRng(identity.seed ^ 0x9e3779b9);
  const { ink, tone, pattern } = identity;

  switch (pattern) {
    case 'arcs': {
      const cx = 24 + r() * 72;
      const cy = 8 + r() * 32;
      return (
        <g fill="none" stroke={ink} strokeOpacity="0.4">
          {[7, 14, 21, 28].map((rad) => (
            <circle key={rad} cx={cx} cy={cy} r={rad} strokeWidth="1.4" />
          ))}
        </g>
      );
    }
    case 'grid': {
      const dots = [];
      for (let x = 8; x < 120; x += 11)
        for (let y = 8; y < 48; y += 11)
          dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill={tone} />);
      return <g fillOpacity="0.7">{dots}</g>;
    }
    case 'waves': {
      const lines = [13, 24, 35].map((base, i) => {
        let d = `M0 ${base}`;
        for (let x = 0; x <= 120; x += 6) {
          const y = base + Math.sin(x / 16 + i * 1.3) * 4;
          d += ` L${x} ${y.toFixed(1)}`;
        }
        return (
          <path
            key={base}
            d={d}
            fill="none"
            stroke={i === 1 ? ink : tone}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
        );
      });
      return <g>{lines}</g>;
    }
    case 'scatter': {
      const circ = Array.from({ length: 16 }, (_, i) => (
        <circle
          key={i}
          cx={(r() * 120).toFixed(1)}
          cy={(r() * 48).toFixed(1)}
          r={(1.5 + r() * 4).toFixed(1)}
          fill={i % 3 === 0 ? ink : tone}
          fillOpacity="0.4"
        />
      ));
      return <g>{circ}</g>;
    }
    case 'rays':
    default: {
      const lines = Array.from({ length: 10 }, (_, i) => (
        <line
          key={i}
          x1={i * 15 - 24}
          y1="48"
          x2={i * 15 + 24}
          y2="0"
          stroke={i % 2 ? ink : tone}
          strokeWidth="1.6"
          strokeOpacity="0.4"
        />
      ));
      return <g>{lines}</g>;
    }
  }
}
