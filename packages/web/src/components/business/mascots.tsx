import type { MascotKind } from '@/lib/identity';
import { FIGURES } from './mascotFigures';

/**
 * Renders one business's mascot. The figure data lives in mascotFigures.tsx; this
 * is just the SVG frame. Body uses `currentColor` so the caller tints it.
 */
export function MascotFigure({ kind }: { kind: MascotKind }) {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" className="overflow-visible">
      {FIGURES[kind]}
    </svg>
  );
}
