/**
 * TwinklingStars: a scatter of little yellow stars that fade and shrink in
 * and out at different speeds, like stars winking.
 *
 * The star positions are generated once from a fixed seed, so the sky looks
 * the same every visit. Stars never land on the centre of the screen, where
 * the welcome text lives. To change how many there are, edit `STAR_COUNT`.
 */
import type { CSSProperties } from 'react';
import { STAR_BIG, STAR_SMALL, STAR_TINY } from '../art/sprites';
import { createRandom } from '../art/random';
import type { Sprite } from '../types';
import { PixelSprite } from './PixelSprite';

/** How many stars to scatter. */
const STAR_COUNT = 22;
/** Seed for the random layout; try another number for a different sky. */
const STAR_SEED = 2024;
/** The part of the screen (in %) kept clear for the welcome text. */
const KEEP_CLEAR = { left: 18, right: 82, top: 32, bottom: 70 };

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
function createStars(): Star[] {
  const rand = createRandom(STAR_SEED);
  const stars: Star[] = [];

  while (stars.length < STAR_COUNT) {
    const left = 4 + rand() * 92;
    const top = 6 + rand() * 88;
    const insideClearZone =
      left > KEEP_CLEAR.left && left < KEEP_CLEAR.right && top > KEEP_CLEAR.top && top < KEEP_CLEAR.bottom;
    if (insideClearZone) continue;

    const size = rand();
    const [sprite, scale] = size < 0.6 ? [STAR_TINY, 1.2] : size < 0.9 ? [STAR_SMALL, 1] : [STAR_BIG, 0.9];
    stars.push({ sprite, scale, left, top, duration: 1.2 + rand() * 1.6, delay: rand() * 2 });
  }
  return stars;
}

/** Created once when the page loads, not on every render. */
const STARS = createStars();

export function TwinklingStars() {
  return (
    <div className="sky" aria-hidden="true">
      {STARS.map((star, index) => (
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
