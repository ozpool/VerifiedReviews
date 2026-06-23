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
 * The ten creatures. Bodies use `currentColor` (the business tint set by the
 * caller); faces use paper/ink for contrast. Drawn in a 44×44 box, decorative
 * only. The Record type forces every MascotKind to have a figure — add a kind to
 * MASCOTS and TypeScript makes you draw it here.
 */
export const FIGURES: Record<MascotKind, ReactNode> = {
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
  bear: (
    <g>
      <circle cx="13" cy="13" r="6" fill="currentColor" />
      <circle cx="31" cy="13" r="6" fill="currentColor" />
      <circle cx="13" cy="13" r="2.8" fill={PAPER} />
      <circle cx="31" cy="13" r="2.8" fill={PAPER} />
      <circle cx="22" cy="26" r="15" fill="currentColor" />
      {eye(17, 24)}
      {eye(27, 24)}
      <ellipse cx="22" cy="31" rx="6" ry="4.5" fill={PAPER} />
      <circle cx="22" cy="29.5" r="2" fill={INK} />
    </g>
  ),
  panda: (
    <g>
      <circle cx="12" cy="12" r="5.5" fill={INK} />
      <circle cx="32" cy="12" r="5.5" fill={INK} />
      <circle cx="22" cy="25" r="15" fill="currentColor" />
      <ellipse cx="16" cy="23" rx="4.4" ry="5.6" fill={INK} transform="rotate(-18 16 23)" />
      <ellipse cx="28" cy="23" rx="4.4" ry="5.6" fill={INK} transform="rotate(18 28 23)" />
      <circle cx="16.5" cy="23.5" r="1.9" fill={PAPER} />
      <circle cx="27.5" cy="23.5" r="1.9" fill={PAPER} />
      <ellipse cx="22" cy="31" rx="3" ry="2.2" fill={INK} />
    </g>
  ),
  frog: (
    <g>
      <ellipse cx="22" cy="28" rx="16" ry="12" fill="currentColor" />
      <circle cx="14" cy="14" r="6" fill="currentColor" />
      <circle cx="30" cy="14" r="6" fill="currentColor" />
      <circle cx="14" cy="13" r="3.2" fill={PAPER} />
      <circle cx="30" cy="13" r="3.2" fill={PAPER} />
      <circle cx="14" cy="13" r="1.8" fill={INK} />
      <circle cx="30" cy="13" r="1.8" fill={INK} />
      <path
        d="M12 30 Q22 38 32 30"
        fill="none"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  ),
  penguin: (
    <g>
      <ellipse cx="22" cy="24" rx="13" ry="17" fill="currentColor" />
      <ellipse cx="22" cy="27" rx="8" ry="12" fill={PAPER} />
      {eye(18, 17)}
      {eye(26, 17)}
      <polygon points="22,20 18.5,23 25.5,23" fill={NOSE} />
      <path d="M11 40 L18 37 M33 40 L26 37" stroke={NOSE} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  deer: (
    <g>
      <path
        d="M14 7 L11 1 M14 7 L18 2 M30 7 L33 1 M30 7 L26 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="10,11 16,18 8,19" fill="currentColor" />
      <polygon points="34,11 28,18 36,19" fill="currentColor" />
      <ellipse cx="22" cy="27" rx="11" ry="13" fill="currentColor" />
      {eye(18, 25)}
      {eye(26, 25)}
      <ellipse cx="22" cy="32" rx="3.4" ry="2.6" fill={INK} />
    </g>
  ),
  hedgehog: (
    <g>
      <path
        d="M4 33 L7 16 L11 28 L15 13 L19 27 L23 12 L27 27 L31 15 L35 29 L38 19 L40 33 Z"
        fill="currentColor"
      />
      <path d="M22 38 Q31 40 39 33 L40 30 Q31 36 22 33 Z" fill="currentColor" />
      <circle cx="39" cy="31" r="1.9" fill={INK} />
      {eye(32, 29)}
      <path
        d="M27 33 Q31 35 35 33"
        fill="none"
        stroke={INK}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  ),
};
