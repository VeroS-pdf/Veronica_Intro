/**
 * TwinklingStars: a scatter of little yellow stars that slowly fade in and out,
 * and reappear somewhere new each time, like stars winking around the sky.
 *
 * Each star fades from nothing up to full brightness and back to nothing (the
 * fade itself is CSS, see `.star` in `lock-screen.css`). Whenever a star has
 * completely faded out, it jumps to a fresh random spot while nobody can see it,
 * then fades back in there.
 *
 * The first positions come from a fixed seed, so the sky starts out the same on
 * every visit. Stars never land in the "keep clear" box, which on the lock
 * screen is the centre, where the clock and greeting live.
 *
 * The lock screen uses the defaults below. The desktop uses fewer, slower stars
 * (see `Desktop.tsx`) by passing `count`, `slowness`, `seed` and `keepClear`.
 * To change the lock screen's star count, edit `STAR_COUNT`.
 */
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { STAR_BIG, STAR_SMALL, STAR_TINY } from '../art/sprites';
import { createRandom } from '../art/random';
import type { Sprite } from '../types';
import { PixelSprite } from './PixelSprite';

/** How many stars to scatter on the lock screen. */
const STAR_COUNT = 22;
/** Seed for the random starting layout; try another number for a different sky. */
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

/**
 * Seconds for one full fade in and out: the shortest, plus how much longer it can be.
 * Longer fades look smoother, so keep the shortest at two seconds or more.
 */
const FADE_SECONDS = { min: 2, extra: 2 };

/** A place on the screen, as the % across and the % down of the star's centre. */
interface Spot {
  left: number;
  top: number;
}

/** One star: which picture, how big, where it starts, and how it twinkles. */
interface Star extends Spot {
  sprite: Sprite;
  /** Size of each sprite pixel, in multiples of `--px`. */
  scale: number;
  /** Seconds for one fade in and out, and a head start so stars aren't in sync. */
  duration: number;
  delay: number;
}

/**
 * Picks a random spot that is not inside the keep-clear box.
 *
 * @param keepClear The box stars stay out of.
 * @param rand Returns a random number in [0, 1); seeded for the first layout, `Math.random` after that.
 */
function pickSpot(keepClear: ClearZone, rand: () => number): Spot {
  for (;;) {
    const left = 4 + rand() * 92;
    const top = 6 + rand() * 88;
    const insideClearZone = left > keepClear.left && left < keepClear.right && top > keepClear.top && top < keepClear.bottom;
    if (!insideClearZone) return { left, top };
  }
}

/** Builds the list of stars. Mostly tiny ones, a few small, and the odd big one. */
function createStars(count: number, keepClear: ClearZone, seed: number, slowness: number): Star[] {
  const rand = createRandom(seed);
  const stars: Star[] = [];

  while (stars.length < count) {
    const spot = pickSpot(keepClear, rand);
    const size = rand();
    const [sprite, scale] = size < 0.6 ? [STAR_TINY, 1.2] : size < 0.9 ? [STAR_SMALL, 1] : [STAR_BIG, 0.9];
    stars.push({
      ...spot,
      sprite,
      scale,
      duration: (FADE_SECONDS.min + rand() * FADE_SECONDS.extra) * slowness,
      delay: rand() * 2 * slowness,
    });
  }
  return stars;
}

interface TwinklingStarProps {
  star: Star;
  keepClear: ClearZone;
}

/** One star. It remembers where it is, and moves itself after every fade-out. */
function TwinklingStar({ star, keepClear }: TwinklingStarProps) {
  const [spot, setSpot] = useState<Spot>({ left: star.left, top: star.top });

  return (
    <span
      className="star"
      style={
        {
          '--left': `${spot.left}%`,
          '--top': `${spot.top}%`,
          '--twinkle': `${star.duration}s`,
          '--delay': `${star.delay}s`,
        } as CSSProperties
      }
      // The browser says "iteration" each time the fade starts over, which is exactly when
      // the star is fully invisible, so this is the moment to slip it somewhere else.
      onAnimationIteration={() => setSpot(pickSpot(keepClear, Math.random))}
    >
      <PixelSprite sprite={star.sprite} scale={star.scale} />
    </span>
  );
}

interface TwinklingStarsProps {
  /** How many stars to scatter. */
  count?: number;
  /** Stars never land inside this box. */
  keepClear?: ClearZone;
  /** How slowly they twinkle: 1 is the lock screen's speed, 2 is twice as slow. */
  slowness?: number;
  /** Seed for the random starting layout; try another number for a different sky. */
  seed?: number;
}

export function TwinklingStars({ count = STAR_COUNT, keepClear = KEEP_CLEAR, slowness = 1, seed = STAR_SEED }: TwinklingStarsProps) {
  // The starting layout only depends on the settings, so it is built once (not on every render).
  const stars = useMemo(
    () => createStars(count, keepClear, seed, slowness),
    [count, keepClear, seed, slowness],
  );

  return (
    <div className="sky" aria-hidden="true">
      {stars.map((star, index) => (
        <TwinklingStar key={index} star={star} keepClear={keepClear} />
      ))}
    </div>
  );
}
