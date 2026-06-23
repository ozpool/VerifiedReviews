import { seededRng, type Identity } from '@/lib/identity';

/**
 * The seeded geometric figure drawn over the business gradient — one branch per
 * pattern kind. Pure SVG, deterministic from the identity seed. Opacities and
 * weights are tuned to read boldly on the vivid banner gradient. Keeping this in
 * its own file lets BusinessPattern stay a thin wrapper.
 */
export function Motif({ identity }: { identity: Identity }) {
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
              strokeWidth={i % 2 ? 2.2 : 1.5}
              strokeOpacity={0.85 - i * 0.06}
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
            <circle key={`${x}-${y}`} cx={x} cy={y} r={big ? 2.6 : 1.5} fill={big ? ink : tone} />,
          );
        }
      return <g fillOpacity="0.9">{dots}</g>;
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
            strokeWidth="2.2"
            strokeOpacity="0.8"
          />
        );
      });
      return <g strokeLinecap="round">{lines}</g>;
    }
    case 'scatter': {
      const circ = Array.from({ length: 20 }, (_, i) => (
        <circle
          key={i}
          cx={(r() * 120).toFixed(1)}
          cy={(r() * 48).toFixed(1)}
          r={(1.8 + r() * 4.8).toFixed(1)}
          fill={i % 4 === 0 ? ink : i % 4 === 1 ? glow : tone}
          fillOpacity="0.78"
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
            rx="6.5"
            ry="2.8"
            fill={i % 2 ? ink : tone}
            fillOpacity="0.72"
            transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 12} ${cy + Math.sin(a) * 9})`}
          />
        );
      });
      return (
        <g>
          {petals}
          <circle cx={cx} cy={cy} r="4.2" fill={ink} fillOpacity="0.95" />
        </g>
      );
    }
    case 'checker': {
      const sq = [];
      for (let x = 0; x < 120; x += 12)
        for (let y = 0; y < 48; y += 12)
          if ((x / 12 + y / 12) % 2 === 0)
            sq.push(<rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" fill={tone} />);
      return <g fillOpacity="0.6">{sq}</g>;
    }
    case 'petals': {
      // A tiled field of four-petal flowers — soft, floral, repeating.
      const flowers = [];
      for (let x = 14; x < 120; x += 22)
        for (let y = 12; y < 48; y += 20) {
          const c = (x + y) % 2 ? ink : tone;
          flowers.push(
            <g key={`${x}-${y}`} fill={c} fillOpacity="0.72">
              <ellipse cx={x} cy={y - 5} rx="2.6" ry="5.2" />
              <ellipse cx={x} cy={y + 5} rx="2.6" ry="5.2" />
              <ellipse cx={x - 5} cy={y} rx="5.2" ry="2.6" />
              <ellipse cx={x + 5} cy={y} rx="5.2" ry="2.6" />
              <circle cx={x} cy={y} r="1.9" fill={glow} fillOpacity="1" />
            </g>,
          );
        }
      return <g>{flowers}</g>;
    }
    case 'rings': {
      // A handful of concentric "targets" scattered around the band.
      const targets = Array.from({ length: 6 }, (_, i) => {
        const cx = 12 + r() * 96;
        const cy = 8 + r() * 32;
        return (
          <g key={i} fill="none">
            <circle cx={cx} cy={cy} r="9" stroke={tone} strokeWidth="1.8" strokeOpacity="0.8" />
            <circle cx={cx} cy={cy} r="5" stroke={ink} strokeWidth="2" strokeOpacity="0.85" />
            <circle cx={cx} cy={cy} r="1.8" fill={ink} fillOpacity="0.95" />
          </g>
        );
      });
      return <g>{targets}</g>;
    }
    case 'weave': {
      // Basket weave: alternating short horizontal and vertical strokes.
      const strokes = [];
      for (let x = 4; x < 120; x += 12)
        for (let y = 4; y < 48; y += 12) {
          const horiz = (x / 12 + y / 12) % 2 === 0;
          strokes.push(
            <rect
              key={`${x}-${y}`}
              x={horiz ? x : x + 3.5}
              y={horiz ? y + 3.5 : y}
              width={horiz ? 10 : 3}
              height={horiz ? 3 : 10}
              rx="1.5"
              fill={horiz ? ink : tone}
              fillOpacity="0.72"
            />,
          );
        }
      return <g>{strokes}</g>;
    }
    case 'confetti': {
      // Festive scatter of little rotated dashes and squares.
      const bits = Array.from({ length: 30 }, (_, i) => {
        const x = r() * 120;
        const y = r() * 48;
        const rot = r() * 180;
        const c = i % 3 === 0 ? ink : i % 3 === 1 ? glow : tone;
        return i % 2 ? (
          <rect
            key={i}
            x={x}
            y={y}
            width="5"
            height="2.2"
            rx="1"
            fill={c}
            fillOpacity="0.82"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        ) : (
          <rect
            key={i}
            x={x}
            y={y}
            width="3.4"
            height="3.4"
            rx="0.6"
            fill={c}
            fillOpacity="0.78"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        );
      });
      return <g>{bits}</g>;
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
          strokeWidth={i % 2 ? 2.4 : 1.6}
          strokeOpacity="0.7"
        />
      ));
      return <g>{lines}</g>;
    }
  }
}
