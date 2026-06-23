/**
 * Deterministic per-business visual identity.
 *
 * Same slug always yields the same colours, pattern, and mascot — so a business
 * is instantly recognisable across the browse grid and its detail page, with
 * nothing stored anywhere. We hash the slug into a seed, then pull every choice
 * from a small seeded PRNG (pseudo-random number generator) so the output is
 * stable and repeatable rather than truly random.
 */

export const PATTERNS = ['arcs', 'grid', 'waves', 'scatter', 'rays', 'bloom', 'checker'] as const;
export const MASCOTS = ['fox', 'cat', 'owl', 'rabbit'] as const;
export const VIBES = [
  'Cozy',
  'Bright',
  'Bold',
  'Calm',
  'Lively',
  'Refined',
  'Warm',
  'Crisp',
  'Playful',
  'Classic',
  'Snug',
  'Vivid',
] as const;

export type PatternKind = (typeof PATTERNS)[number];
export type MascotKind = (typeof MASCOTS)[number];

export type Identity = {
  seed: number;
  hue: number;
  /** Strong tint for strokes / figures. */
  ink: string;
  /** Mid tint. */
  tone: string;
  /** Soft tint for fills over the paper background. */
  wash: string;
  /** Near-white highlight tint, for contrast on top of the wash. */
  glow: string;
  pattern: PatternKind;
  mascot: MascotKind;
  /** Two distinct adjectives — a tiny deterministic personality tag. */
  vibe: [string, string];
};

/** FNV-1a 32-bit hash — tiny, fast, stable across runs and platforms. */
function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — a compact seeded PRNG returning floats in [0, 1). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  // rng() is in [0, 1) and arr is always non-empty, so the index is in range.
  return arr[Math.floor(rng() * arr.length)]!;
}

export function identityFor(slug: string): Identity {
  const seed = seedFromString(slug || 'verified-reviews');
  const rng = seededRng(seed);
  const hue = Math.floor(rng() * 360);
  // Constrain saturation/lightness so every identity sits harmoniously on the
  // warm paper background — never neon, never muddy.
  const ink = `hsl(${hue} 48% 42%)`;
  const tone = `hsl(${hue} 42% 62%)`;
  const wash = `hsl(${hue} 46% 91%)`;
  const glow = `hsl(${hue} 60% 97%)`;
  const pattern = pick(rng, PATTERNS);
  const mascot = pick(rng, MASCOTS);
  // Two distinct adjectives for the personality tag.
  const v1 = pick(rng, VIBES);
  let v2 = pick(rng, VIBES);
  if (v2 === v1) v2 = VIBES[(VIBES.indexOf(v1) + 5) % VIBES.length]!;
  return { seed, hue, ink, tone, wash, glow, pattern, mascot, vibe: [v1, v2] };
}
