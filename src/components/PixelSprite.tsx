/**
 * PixelSprite: draws a `Sprite` (pixel art written as text) as a crisp SVG.
 *
 * Size is controlled by the CSS variable `--px` (one "art pixel" on screen,
 * set in `src/styles/theme.css`). A sprite that is 11 columns wide and drawn
 * at `scale={2}` is `11 * 2 * var(--px)` pixels wide, so the whole site can be
 * made chunkier or finer by changing a single variable.
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Sprite } from '../types';

interface PixelSpriteProps {
  /** The sprite to draw (see `src/art/sprites.ts`). */
  sprite: Sprite;
  /** Screen size of one sprite pixel, in multiples of `--px`. Defaults to 1. */
  scale?: number;
  /** Optional extra CSS class(es). */
  className?: string;
  /** Optional inline styles (e.g. positioning). */
  style?: CSSProperties;
  /**
   * Accessible description. Leave empty for purely decorative art
   * (the sprite is then hidden from screen readers).
   */
  label?: string;
}

/**
 * Turns the text rows of a sprite into one SVG path per colour.
 *
 * Neighbouring pixels of the same colour on a row are merged into a single
 * rectangle, which keeps the SVG small and avoids hairline gaps between pixels.
 *
 * @param sprite The sprite to convert.
 * @returns A list of `{ fill, d }` entries, one per colour used.
 */
function spriteToPaths(sprite: Sprite): { fill: string; d: string }[] {
  const pathByKey = new Map<string, string>();

  sprite.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === key) run++;

      if (key !== '.' && key !== ' ') {
        // `M x y h run v 1 h -run z` draws a run-by-1 rectangle.
        const rect = `M${x} ${y}h${run}v1h-${run}z`;
        pathByKey.set(key, (pathByKey.get(key) ?? '') + rect);
      }
      x += run;
    }
  });

  return [...pathByKey.entries()].flatMap(([key, d]) => {
    const fill = sprite.palette[key];
    if (!fill) {
      if (import.meta.env.DEV) console.warn(`PixelSprite: no palette colour for "${key}"`);
      return [];
    }
    return [{ fill, d }];
  });
}

export function PixelSprite({ sprite, scale = 1, className, style, label }: PixelSpriteProps) {
  const cols = sprite.rows[0]?.length ?? 0;
  const rows = sprite.rows.length;

  if (import.meta.env.DEV && sprite.rows.some((row) => row.length !== cols)) {
    console.warn('PixelSprite: all rows of a sprite must be the same length', sprite.rows);
  }

  const paths = useMemo(() => spriteToPaths(sprite), [sprite]);

  return (
    <svg
      className={`sprite${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      style={{ width: `calc(var(--px) * ${cols * scale})`, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {paths.map(({ fill, d }) => (
        <path key={fill} d={d} style={{ fill }} />
      ))}
    </svg>
  );
}
