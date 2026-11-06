/**
 * TwinklingStars: a scatter of little yellow stars that fade and shrink in
 * and out at different speeds, like stars winking.
 *
 * The star positions are generated from a fixed seed, so the sky looks the
 * same every visit. Stars never land in the "keep clear" box, which on the lock
 * screen is the centre, where the clock and greeting live.
 *
 * The lock screen uses the defaults below. The desktop uses fewer, slower stars
 * (see `Desktop.tsx`) by passing `count`, `slowness`, `seed` and `keepClear`.
 * To change the lock screen's star count, edit `STAR_COUNT`.
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { STAR_BIG, STAR_SMALL, STAR_TINY } from '../art/sprites';
import { createRandom } from '../art/random';
import type { Sprite } from '../types';
import { PixelSprite } from './PixelSprite';

/** How many stars to scatter on the lock screen. */
const STAR_COUNT = 22;
/** Seed for the random layout; try another number for a different sky. */
const STAR_SEED = 2024;
/** A box on the screen (in %) that stars stay out of. */
export interface ClearZone {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The part of the lock screen kept clear for its clock and greeting. */
const KEEP_CLEAR: ClearZone = { left: 20, right: 80, top: 12, bottom: 88 };

/** One star: which picture, how big, where, and how it twinkles. */
interface Star {
  sprite: Sprite;
  /** Size of each sprite pixel, in multiples of `--px`. */
  scale: number;
  /** Position of the star's centre, in % of the screen. */
  left: number;
  top: number;
  /** Seconds for one twinkle, and a head start so stars aren't in sync. */
  duration: number;
  delay: number;
}

/** Builds the list of stars. Mostly tiny ones, a few small, and the odd big one. */
function createStars(count: number, keepClear: ClearZone, seed: number, slowness: number): Star[] {
  const rand = createRandom(seed);
  const stars: Star[] = [];

  while (stars.length < count) {
    const left = 4 + rand() * 92;
    const top = 6 + rand() * 88;
    const insideClearZone = left > keepClear.left && left < keepClear.right && top > keepClear.top && top < keepClear.bottom;
    if (insideClearZone) continue;

    const size = rand();
    const [sprite, scale] = size < 0.6 ? [STAR_TINY, 1.2] : size < 0.9 ? [STAR_SMALL, 1] : [STAR_BIG, 0.9];
    stars.push({ sprite, scale, left, top, duration: (1.2 + rand() * 1.6) * slowness, delay: rand() * 2 * slowness });
  }
  return stars;
}

interface TwinklingStarsProps {
  /** How many stars to scatter. */
  count?: number;
  /** Stars never land inside this box. */
  keepClear?: ClearZone;
  /** How slowly they twinkle: 1 is the lock screen's speed, 2 is twice as slow. */
  slowness?: number;
  /** Seed for the random layout; try another number for a different sky. */
  seed?: number;
}

export function TwinklingStars({ count = STAR_COUNT, keepClear = KEEP_CLEAR, slowness = 1, seed = STAR_SEED }: TwinklingStarsProps) {
  // The layout only depends on the settings, so it is built once (not on every render).
  const stars = useMemo(
    () => createStars(count, keepClear, seed, slowness),
    [count, keepClear, seed, slowness],
  );

  return (
    <div className="sky" aria-hidden="true">
      {stars.map((star, index) => (
        <span
          key={index}
          className="star"
          style={
            {
              '--left': `${star.left}%`,
              '--top': `${star.top}%`,
              '--twinkle': `${star.duration}s`,
              '--delay': `${star.delay}s`,
            } as CSSProperties
          }
        >
          <PixelSprite sprite={star.sprite} scale={star.scale} />
        </span>
      ))}
    </div>
  );
}
