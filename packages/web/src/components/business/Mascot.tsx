'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { identityFor } from '@/lib/identity';
import { MascotFigure } from './mascots';

type Spark = { id: number; dx: number; dy: number; small: boolean };
type FlourishType = 'hop' | 'wiggle' | 'jump' | 'spin' | 'bounce' | 'nod';
type Flourish = { k: number; type: FlourishType };

// Full literal class names so Tailwind's content scanner keeps them.
const FLOURISH_CLASS: Record<FlourishType, string> = {
  hop: 'animate-mascot-hop',
  wiggle: 'animate-mascot-wiggle',
  jump: 'animate-mascot-jump',
  spin: 'animate-mascot-spin',
  bounce: 'animate-mascot-bounce',
  nod: 'animate-mascot-nod',
};

const IDLE_MOVES: FlourishType[] = ['hop', 'wiggle', 'bounce', 'nod'];
const HOVER_MOVES: FlourishType[] = ['wiggle', 'bounce', 'nod'];
const CLICK_MOVES: FlourishType[] = ['jump', 'spin'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/**
 * A small animal unique to each business that roams its strip while you read the
 * reviews. The *look* (animal + colour) is deterministic from the slug; the
 * *motion* is random every visit — it wanders to fresh spots, throws in idle
 * hops/wiggles/bounces/nods, sometimes sparkles on its own, perks up when you
 * hover, and jumps or spins with a sparkle burst when clicked. Honours
 * prefers-reduced-motion (then it just sits and waves).
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

  const doFlourish = useCallback((type: FlourishType) => {
    fk.current += 1;
    setFlourish({ k: fk.current, type });
  }, []);

  const burst = useCallback((count: number, small: boolean) => {
    const made: Spark[] = Array.from({ length: count }, () => {
      sid.current += 1;
      const a = Math.random() * Math.PI * 2;
      const r = (small ? 9 : 16) + Math.random() * (small ? 10 : 18);
      return { id: sid.current, dx: Math.cos(a) * r, dy: Math.sin(a) * r - 8, small };
    });
    setSparks((s) => [...s, ...made]);
    const ids = new Set(made.map((b) => b.id));
    setTimeout(() => setSparks((s) => s.filter((x) => !ids.has(x.id))), 700);
  }, []);

  // Autonomous wander — a fresh random path on every mount, livelier than a
  // straight pace: frequent flourishes and the odd spontaneous sparkle.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const move = () => {
      if (!alive) return;
      const target = 4 + Math.random() * 80;
      const dist = Math.abs(target - leftRef.current);
      const seconds = Math.max(0.9, dist / 26) * (0.7 + Math.random() * 0.6);
      setFace(target >= leftRef.current ? 1 : -1);
      setDur(seconds);
      setLeft(target);
      leftRef.current = target;
      if (Math.random() < 0.7) doFlourish(pick(IDLE_MOVES));
      if (Math.random() < 0.3) burst(4, true); // spontaneous little emote
      timer = setTimeout(move, seconds * 1000 + 300 + Math.random() * 1200);
    };
    timer = setTimeout(move, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [doFlourish, burst]);

  const celebrate = useCallback(() => {
    doFlourish(pick(CLICK_MOVES));
    burst(10, false);
  }, [doFlourish, burst]);

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
          onPointerEnter={() => doFlourish(pick(HOVER_MOVES))}
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
            className="absolute left-1/2 top-1/3 rounded-full animate-sparkle"
            style={
              {
                width: s.small ? '4px' : '6px',
                height: s.small ? '4px' : '6px',
                backgroundColor: s.small ? id.tone : id.ink,
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
