import { identityFor, seededRng, type Identity } from '@/lib/identity';

/**
 * A generative banner unique to each business. Pure SVG, seeded by slug, tinted
 * to the business's identity colour. A soft vertical gradient gives depth; the
 * motif sits on top in higher-contrast ink + highlight tones. Pass `ambient` on
 * the detail hero to let the motif drift slowly.
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
  return (
    <svg
      viewBox="0 0 120 48"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={id.glow} />
          <stop offset="1" stopColor={id.wash} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="48" fill={`url(#${gid})`} />
      <g className={ambient ? 'animate-pattern-drift motion-reduce:animate-none' : undefined}>
        <Motif identity={id} />
      </g>
    </svg>
  );
}

/** The seeded geometric figure drawn over the gradient. One per pattern kind. */
function Motif({ identity }: { identity: Identity }) {
  const r = seededRng(identity.seed ^ 0x9e3779b9);
  const { ink, tone, glow, pattern } = identity;

  switch (pattern) {
    case 'arcs': {
      const cx = 24 + r() * 72;
      const cy = 10 + r() * 30;
      return (
        <g fill="none">
          {[6, 12, 18, 24, 30].map((rad, i) => (
            <circle
              key={rad}
              cx={cx}
              cy={cy}
              r={rad}
              stroke={i % 2 ? ink : tone}
              strokeWidth={i % 2 ? 1.8 : 1.2}
              strokeOpacity={0.65 - i * 0.07}
            />
          ))}
        </g>
      );
    }
    case 'grid': {
      const dots = [];
      for (let x = 7; x < 120; x += 10)
        for (let y = 7; y < 48; y += 10) {
          const big = (x + y) % 30 === 0;
          dots.push(
            <circle key={`${x}-${y}`} cx={x} cy={y} r={big ? 2.4 : 1.4} fill={big ? ink : tone} />,
          );
        }
      return <g fillOpacity="0.75">{dots}</g>;
    }
    case 'waves': {
      const lines = [10, 19, 28, 37].map((base, i) => {
        let d = `M0 ${base}`;
        for (let x = 0; x <= 120; x += 5) {
          const y = base + Math.sin(x / 15 + i * 1.2) * 4.5;
          d += ` L${x} ${y.toFixed(1)}`;
        }
        return (
          <path
            key={base}
            d={d}
            fill="none"
            stroke={i % 2 ? ink : tone}
            strokeWidth="1.8"
            strokeOpacity="0.6"
          />
        );
      });
      return <g strokeLinecap="round">{lines}</g>;
    }
    case 'scatter': {
      const circ = Array.from({ length: 18 }, (_, i) => (
        <circle
          key={i}
          cx={(r() * 120).toFixed(1)}
          cy={(r() * 48).toFixed(1)}
          r={(1.5 + r() * 4.5).toFixed(1)}
          fill={i % 4 === 0 ? ink : i % 4 === 1 ? glow : tone}
          fillOpacity="0.55"
        />
      ));
      return <g>{circ}</g>;
    }
    case 'bloom': {
      const cx = 30 + r() * 60;
      const cy = 24;
      const petals = Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <ellipse
            key={i}
            cx={cx + Math.cos(a) * 12}
            cy={cy + Math.sin(a) * 9}
            rx="6"
            ry="2.6"
            fill={i % 2 ? ink : tone}
            fillOpacity="0.5"
            transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 12} ${cy + Math.sin(a) * 9})`}
          />
        );
      });
      return (
        <g>
          {petals}
          <circle cx={cx} cy={cy} r="4" fill={ink} fillOpacity="0.8" />
        </g>
      );
    }
    case 'checker': {
      const sq = [];
      for (let x = 0; x < 120; x += 12)
        for (let y = 0; y < 48; y += 12)
          if ((x / 12 + y / 12) % 2 === 0)
            sq.push(<rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" fill={tone} />);
      return <g fillOpacity="0.45">{sq}</g>;
    }
    case 'rays':
    default: {
      const lines = Array.from({ length: 11 }, (_, i) => (
        <line
          key={i}
          x1={i * 14 - 24}
          y1="48"
          x2={i * 14 + 24}
          y2="0"
          stroke={i % 2 ? ink : tone}
          strokeWidth={i % 2 ? 2 : 1.3}
          strokeOpacity="0.5"
        />
      ));
      return <g>{lines}</g>;
    }
  }
}
