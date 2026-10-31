/**
 * Small, fast, seedable random number generator (mulberry32).
 *
 * Seeded randomness means the same seed always gives the same sequence, which
 * keeps the wallpaper and the star field identical on every visit.
 *
 * @param seed Any integer.
 * @returns A function that returns a new number in [0, 1) each time it is called.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
