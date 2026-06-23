import type { ReactNode } from 'react';
import type { MascotKind } from '@/lib/identity';

const PAPER = '#F9F6F1';
const INK = '#1A1A18';
const NOSE = '#D4541A';

/** A pupil with a paper catch-light. */
function eye(cx: number, cy: number): ReactNode {
  return (
    <>
      <circle cx={cx} cy={cy} r="3.1" fill={INK} />
      <circle cx={cx + 1} cy={cy - 1} r="0.9" fill={PAPER} />
    </>
  );
}

/**
 * Compact, characterful creatures. The body uses `currentColor` (the business
 * tint set by the caller); faces use paper/ink for contrast. Drawn at ~44px,
 * decorative only.
 */
export function MascotFigure({ kind }: { kind: MascotKind }) {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" className="overflow-visible">
      {FIGURES[kind]}
    </svg>
  );
}

const FIGURES: Record<MascotKind, ReactNode> = {
  fox: (
    <g>
      <polygon points="8,6 17,17 6,19" fill="currentColor" />
      <polygon points="36,6 27,17 38,19" fill="currentColor" />
      <path d="M22 9 C32 9 34 24 22 39 C10 24 12 9 22 9 Z" fill="currentColor" />
      <path d="M22 25 C28 25 29 32 22 39 C15 32 16 25 22 25 Z" fill={PAPER} />
      {eye(17, 22)}
      {eye(27, 22)}
      <circle cx="22" cy="31" r="1.9" fill={INK} />
    </g>
  ),
  cat: (
    <g>
      <polygon points="9,7 16,18 7,18" fill="currentColor" />
      <polygon points="35,7 28,18 37,18" fill="currentColor" />
      <circle cx="22" cy="25" r="14" fill="currentColor" />
      {eye(16, 23)}
      {eye(28, 23)}
      <polygon points="22,27 20,29.5 24,29.5" fill={INK} />
      <path
        d="M20 31 Q22 33 24 31"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line x1="4" y1="25" x2="13" y2="26" stroke={PAPER} strokeWidth="1" />
      <line x1="40" y1="25" x2="31" y2="26" stroke={PAPER} strokeWidth="1" />
    </g>
  ),
  owl: (
    <g>
      <polygon points="11,6 17,16 9,17" fill="currentColor" />
      <polygon points="33,6 27,16 35,17" fill="currentColor" />
      <ellipse cx="22" cy="24" rx="14" ry="16" fill="currentColor" />
      <circle cx="16" cy="22" r="6" fill={PAPER} />
      <circle cx="28" cy="22" r="6" fill={PAPER} />
      <circle cx="16" cy="22" r="2.8" fill={INK} />
      <circle cx="28" cy="22" r="2.8" fill={INK} />
      <polygon points="22,25 19,28 25,28" fill={NOSE} />
      <path
        d="M13 37 L17 32 M31 37 L27 32"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </g>
  ),
  rabbit: (
    <g>
      <ellipse cx="16" cy="11" rx="3.4" ry="10" fill="currentColor" />
      <ellipse cx="28" cy="11" rx="3.4" ry="10" fill="currentColor" />
      <ellipse cx="16" cy="11" rx="1.5" ry="7" fill={PAPER} />
      <ellipse cx="28" cy="11" rx="1.5" ry="7" fill={PAPER} />
      <circle cx="22" cy="29" r="12" fill="currentColor" />
      {eye(17, 28)}
      {eye(27, 28)}
      <circle cx="22" cy="32" r="1.8" fill={NOSE} />
    </g>
  ),
};
