'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { identityFor } from '@/lib/identity';
import { MascotFigure } from './mascots';

type Spark = { id: number; dx: number; dy: number };
type Flourish = { k: number; type: 'hop' | 'wiggle' | 'jump' };

// Full literal class names so Tailwind's content scanner keeps them.
const FLOURISH_CLASS: Record<Flourish['type'], string> = {
  hop: 'animate-mascot-hop',
  wiggle: 'animate-mascot-wiggle',
  jump: 'animate-mascot-jump',
};

/**
 * A small animal unique to each business that roams its strip while you read the
 * reviews. The *look* (animal + colour) is deterministic from the slug; the
 * *motion* is random every visit — it wanders to fresh spots, throws in idle
 * hops, perks up when you hover, and jumps with a sparkle burst when clicked.
 * Honours prefers-reduced-motion (then it just sits and waves).
 */
export function Mascot({ slug, className = '' }: { slug: string; className?: string }) {
  const id = identityFor(slug);
  const [left, setLeft] = useState(8); // position across the strip, in %
  const [dur, setDur] = useState(2.4); // travel time for the current move, s
  const [face, setFace] = useState(1); // 1 faces right, -1 faces left
  const [flourish, setFlourish] = useState<Flourish>({ k: 0, type: 'hop' });
  const [sparks, setSparks] = useState<Spark[]>([]);
  const leftRef = useRef(8);
  const fk = useRef(0);
  const sid = useRef(0);

  const doFlourish = useCallback((type: Flourish['type']) => {
    fk.current += 1;
    setFlourish({ k: fk.current, type });
  }, []);

  // Autonomous wander — a fresh random path on every mount.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const move = () => {
      if (!alive) return;
      const target = 4 + Math.random() * 80;
      const dist = Math.abs(target - leftRef.current);
      const seconds = Math.max(1, dist / 22) * (0.8 + Math.random() * 0.7);
      setFace(target >= leftRef.current ? 1 : -1);
      setDur(seconds);
      setLeft(target);
      leftRef.current = target;
      if (Math.random() < 0.55) doFlourish(Math.random() < 0.5 ? 'hop' : 'wiggle');
      timer = setTimeout(move, seconds * 1000 + 500 + Math.random() * 1900);
    };
    timer = setTimeout(move, 500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [doFlourish]);

  const celebrate = useCallback(() => {
    doFlourish('jump');
    const burst: Spark[] = Array.from({ length: 7 }, () => {
      sid.current += 1;
      const a = Math.random() * Math.PI * 2;
      const r = 16 + Math.random() * 18;
      return { id: sid.current, dx: Math.cos(a) * r, dy: Math.sin(a) * r - 10 };
    });
    setSparks((s) => [...s, ...burst]);
    const ids = new Set(burst.map((b) => b.id));
    setTimeout(() => setSparks((s) => s.filter((x) => !ids.has(x.id))), 650);
  }, [doFlourish]);

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div
        className="absolute bottom-0 motion-reduce:!transition-none"
        style={{ left: `${left}%`, transition: `left ${dur}s ease-in-out` }}
      >
        <button
          type="button"
          aria-label={`Play with ${slug}'s mascot`}
          onClick={celebrate}
          onPointerEnter={() => doFlourish('wiggle')}
          className="pointer-events-auto block cursor-pointer rounded-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{ color: id.ink, transform: `scaleX(${face})` }}
        >
          <span className="block animate-mascot-idle motion-reduce:animate-none">
            <span
              key={flourish.k}
              className={`block ${FLOURISH_CLASS[flourish.type]} motion-reduce:animate-none`}
            >
              <MascotFigure kind={id.mascot} />
            </span>
          </span>
        </button>
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute left-1/2 top-1/3 h-1.5 w-1.5 rounded-full animate-sparkle"
            style={
              {
                backgroundColor: id.tone,
                '--dx': `${s.dx}px`,
                '--dy': `${s.dy}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
