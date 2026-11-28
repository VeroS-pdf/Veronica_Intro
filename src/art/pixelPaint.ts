/**
 * Small pixel-painting helpers shared by the mushroom house scene (`mushroomHome.ts`), the cottage
 * itself (`mushroomCottage.ts`) and the bunny (`bunny.ts`).
 *
 * Everything here paints whole pixels only (coordinates are rounded), so nothing gets smoothed
 * and the picture keeps its chunky retro look when the browser scales it up.
 */

/** 4x4 Bayer matrix: gives the checkerboard-style dithering used by old games. */
export const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** Paints a single pixel. Coordinates are rounded so nothing gets anti-aliased. */
export function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

/** Paints a filled rectangle with rounded (whole-pixel) coordinates. */
export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Picks one colour out of a list that fade into each other, with a checkerboard blend between
 * neighbours so the fade looks like pixel art. `t` is 0 (first colour) to 1 (last colour).
 */
export function ramp(colors: readonly string[], t: number, x: number, y: number): string {
  const scaled = Math.min(1, Math.max(0, t)) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const threshold = BAYER_4[Math.floor(y) & 3][Math.floor(x) & 3] / 16;
  return scaled - index > threshold ? colors[index + 1] : colors[index];
}

/**
 * Fills an oval. `colorAt` is asked for each pixel inside it (with the pixel's offset from the
 * middle, in the oval's own units) and returns a colour, or `null` to leave that pixel alone.
 */
export function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  colorAt: (x: number, y: number, dx: number, dy: number) => string | null,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const color = colorAt(x, y, dx, dy);
      if (color) pixel(ctx, x, y, color);
    }
  }
}

/** How lit a spot is when the light comes from the top left (0 = in shade, 1 = full sun). */
export const lit = (dx: number, dy: number) => 0.5 - dx * 0.32 - dy * 0.45;

/* ------------------------------------------------------------------------ */
/* Free-form shapes                                                         */
/* ------------------------------------------------------------------------ */

/** A point as `[across, down]`. */
export type Point = readonly [number, number];

/**
 * Turns a handful of points into a smooth, closed outline that passes through every one of them
 * (a Catmull-Rom curve). It lets a shape such as the cottage's roof be described with just a few
 * points read off a drawing.
 */
export function smoothClosed(points: readonly Point[], stepsPerSegment = 5): Point[] {
  const n = points.length;
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i + n - 1) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/** The whole pixels covered by a shape, found once so they can be asked about quickly. */
export interface Mask {
  /** Left and top of the box that holds the shape, in canvas pixels. */
  x0: number;
  y0: number;
  /** Size of that box. */
  w: number;
  h: number;
  /** Is the pixel at (`x`, `y`) part of the shape? */
  has(x: number, y: number): boolean;
}

/** Works out which whole pixels lie inside a closed outline (a pixel counts when its middle is inside). */
export function polygonMask(polygon: readonly Point[]): Mask {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs));
  const y0 = Math.floor(Math.min(...ys));
  const w = Math.ceil(Math.max(...xs)) - x0 + 1;
  const h = Math.ceil(Math.max(...ys)) - y0 + 1;
  const cells = new Uint8Array(w * h);

  for (let row = 0; row < h; row++) {
    const py = y0 + row + 0.5;
    for (let col = 0; col < w; col++) {
      const px = x0 + col + 0.5;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) cells[row * w + col] = 1;
    }
  }

  return {
    x0,
    y0,
    w,
    h,
    has: (x, y) => x >= x0 && y >= y0 && x < x0 + w && y < y0 + h && cells[(y - y0) * w + (x - x0)] === 1,
  };
}

/**
 * Paints every pixel of a shape. `colorAt` is asked for each one and says whether it sits on the
 * shape's edge (it has open air above, below, left or right of it), so the edge can get an outline
 * colour. Return `null` to leave a pixel alone.
 */
export function paintMask(
  ctx: CanvasRenderingContext2D,
  mask: Mask,
  colorAt: (x: number, y: number, edge: boolean) => string | null,
): void {
  for (let y = mask.y0; y < mask.y0 + mask.h; y++) {
    for (let x = mask.x0; x < mask.x0 + mask.w; x++) {
      if (!mask.has(x, y)) continue;
      const edge = !mask.has(x - 1, y) || !mask.has(x + 1, y) || !mask.has(x, y - 1) || !mask.has(x, y + 1);
      const color = colorAt(x, y, edge);
      if (color) pixel(ctx, x, y, color);
    }
  }
}
