import { seededRng, type Identity } from '@/lib/identity';

/**
 * The seeded geometric figure drawn over the business strip — one branch per
 * pattern kind. Pure SVG, deterministic from the identity seed.
 *
 * Tuned for a MONOCHROME treatment: strokes are charcoal ink on warm paper, so
 * opacities and weights run a little stronger than they would over a vivid
 * gradient. `ink` is the strong tone, `tone` the mid fill, `glow` the focal accent
 * — all greys supplied by BusinessPattern. Keeping this in its own file lets
 * BusinessPattern stay a thin wrapper.
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
          {[6, 12, 18, 24, 30, 36].map((rad, i) => (
            <circle
              key={rad}
              cx={cx}
              cy={cy}
              r={rad}
              stroke={i % 2 ? ink : tone}
              strokeWidth={i % 2 ? 2 : 1.3}
              strokeOpacity={0.9 - i * 0.08}
            />
          ))}
        </g>
      );
    }
    case 'grid': {
      // Offset dot lattice — every other row is nudged half a cell for rhythm.
      const dots = [];
      let row = 0;
      for (let y = 8; y < 48; y += 9, row++) {
        const offset = row % 2 ? 5 : 0;
        for (let x = 6 + offset; x < 122; x += 10) {
          const big = (Math.round(x) + y) % 3 === 0;
          dots.push(
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={big ? 2.4 : 1.3}
              fill={big ? ink : tone}
              fillOpacity={big ? 0.9 : 0.7}
            />,
          );
        }
      }
      return <g>{dots}</g>;
    }
    case 'waves': {
      // Five layered sine bands, each a touch different in phase and amplitude.
      const lines = [8, 16, 24, 32, 40].map((base, i) => {
        const amp = 3.5 + (i % 2) * 1.8;
        let d = `M0 ${base}`;
        for (let x = 0; x <= 120; x += 4) {
          const y = base + Math.sin(x / 13 + i * 0.9) * amp;
          d += ` L${x} ${y.toFixed(1)}`;
        }
        return (
          <path
            key={base}
            d={d}
            fill="none"
            stroke={i % 2 ? ink : tone}
            strokeWidth={i % 2 ? 2 : 1.4}
            strokeOpacity={i % 2 ? 0.85 : 0.6}
          />
        );
      });
      return <g strokeLinecap="round">{lines}</g>;
    }
    case 'scatter': {
      const circ = Array.from({ length: 22 }, (_, i) => (
        <circle
          key={i}
          cx={(r() * 120).toFixed(1)}
          cy={(r() * 48).toFixed(1)}
          r={(1.6 + r() * 4.6).toFixed(1)}
          fill={i % 4 === 0 ? glow : i % 4 === 1 ? ink : tone}
          fillOpacity={i % 4 === 1 ? 0.85 : 0.6}
        />
      ));
      return <g>{circ}</g>;
    }
    case 'bloom': {
      const cx = 30 + r() * 60;
      const cy = 24;
      const petals = Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <ellipse
            key={i}
            cx={cx + Math.cos(a) * 12}
            cy={cy + Math.sin(a) * 9}
            rx="6.5"
            ry="2.6"
            fill={i % 2 ? ink : tone}
            fillOpacity={i % 2 ? 0.8 : 0.55}
            transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 12} ${cy + Math.sin(a) * 9})`}
          />
        );
      });
      return (
        <g>
          {petals}
          <circle cx={cx} cy={cy} r="4" fill={glow} fillOpacity="0.95" />
        </g>
      );
    }
    case 'checker': {
      // Fine 8px checker — subtle texture rather than a heavy board.
      const sq = [];
      for (let x = 0; x < 120; x += 8)
        for (let y = 0; y < 48; y += 8)
          if ((x / 8 + y / 8) % 2 === 0)
            sq.push(
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="8"
                height="8"
                fill={tone}
                fillOpacity="0.4"
              />,
            );
      return <g>{sq}</g>;
    }
    case 'petals': {
      // A tiled field of four-petal flowers — soft, floral, repeating.
      const flowers = [];
      for (let x = 14; x < 120; x += 22)
        for (let y = 12; y < 48; y += 20) {
          const c = (x + y) % 2 ? ink : tone;
          flowers.push(
            <g key={`${x}-${y}`} fill={c} fillOpacity="0.7">
              <ellipse cx={x} cy={y - 5} rx="2.6" ry="5.2" />
              <ellipse cx={x} cy={y + 5} rx="2.6" ry="5.2" />
              <ellipse cx={x - 5} cy={y} rx="5.2" ry="2.6" />
              <ellipse cx={x + 5} cy={y} rx="5.2" ry="2.6" />
              <circle cx={x} cy={y} r="1.8" fill={glow} fillOpacity="1" />
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
            <circle cx={cx} cy={cy} r="9" stroke={tone} strokeWidth="1.6" strokeOpacity="0.6" />
            <circle cx={cx} cy={cy} r="5" stroke={ink} strokeWidth="1.8" strokeOpacity="0.9" />
            <circle cx={cx} cy={cy} r="1.6" fill={glow} fillOpacity="0.95" />
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
              fillOpacity={horiz ? 0.7 : 0.5}
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
        const c = i % 3 === 0 ? glow : i % 3 === 1 ? ink : tone;
        return i % 2 ? (
          <rect
            key={i}
            x={x}
            y={y}
            width="5"
            height="2.2"
            rx="1"
            fill={c}
            fillOpacity="0.75"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        ) : (
          <rect
            key={i}
            x={x}
            y={y}
            width="3.2"
            height="3.2"
            rx="0.6"
            fill={c}
            fillOpacity="0.6"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        );
      });
      return <g>{bits}</g>;
    }
    case 'rays':
    default: {
      const lines = Array.from({ length: 13 }, (_, i) => (
        <line
          key={i}
          x1={i * 12 - 24}
          y1="48"
          x2={i * 12 + 24}
          y2="0"
          stroke={i % 2 ? ink : tone}
          strokeWidth={i % 2 ? 2.2 : 1.4}
          strokeOpacity={i % 2 ? 0.7 : 0.45}
        />
      ));
      return <g strokeLinecap="round">{lines}</g>;
    }
  }
}
