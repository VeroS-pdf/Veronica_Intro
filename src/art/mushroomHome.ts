/**
 * The mushroom house scene: the terracotta-roofed mushroom cottage tucked into a bright, sunny
 * forest clearing. It is what the browser's Home button shows (see `src/pages/HomePage.tsx`).
 *
 * Like the wallpaper (`landscape.ts`), the scene is painted one pixel at a time
 * onto a tiny canvas, which the browser then scales up without smoothing. The
 * canvas follows the shape of the window: on wide windows it gets wider (more
 * forest either side), on tall narrow ones (a phone) it gets taller (more sky and
 * treetops above), and the house always sits in the middle. A seeded random generator is used, so the trees and
 * flowers are the same every time.
 *
 * Want different colours? Edit `COLORS`. The house itself is drawn in `mushroomCottage.ts`. Two things
 * are drawn separately because they move: the chimney's smoke (`paintSmoke`, below) and the little
 * bunny who comes out to wave (`bunny.ts`).
 */
import { paintCottage } from './mushroomCottage';
import type { DoorSpot } from './mushroomCottage';
import { BAYER_4, ellipse, lit, pixel, ramp, rect } from './pixelPaint';
import { createRandom } from './random';

/** The scene's usual height in art pixels (lower = chunkier pixels). Tall, narrow windows get a taller canvas. */
export const HOME_SCENE_HEIGHT = 108;

/** Where things are in the scene, in the scene's own pixels, so the smoke and the bunny can be drawn in the right places. */
export interface HomeScene {
  /** The chimney's opening (the smoke starts here). */
  chimney: { x: number; y: number };
  /** The front doorway (the bunny comes out of here). */
  door: DoorSpot;
}

/** Colours, from the top (or the shade) to the light. Lists are darkest first, lightest last. */
const COLORS = {
  /** Sky, from the top down to the horizon. */
  sky: ['#9fdcff', '#b4e7ff', '#cbf0f7', '#e1f7e6', '#f1fbd9'],
  /** The warm glow around the sun. */
  glow: '#fffbd2',
  /** Grass, from the far edge of the clearing (light) to the near edge. Listed far to near. */
  grass: ['#aaef8c', '#98e27d', '#86d671', '#76ca67'],
  grassDark: '#5db856',
  grassLight: '#c1f7a2',
  /** Leaves: pale and hazy far away, richer up close. Each list goes from shade to sunlit. */
  farLeaves: ['#a0dc98', '#b2e7aa', '#c4f0ba', '#d8f8cd'],
  midLeaves: ['#62c25d', '#7bd566', '#96e57b', '#b6f29b'],
  nearLeaves: ['#46ab49', '#5fc156', '#7ad466', '#97e67d'],
  /** Tree trunks: dark side, middle, lit side. */
  farTrunk: ['#b9a98a', '#cbbc9c', '#dccfb2'],
  trunk: ['#85603f', '#a77a55', '#c49a70'],
  /** The little garden toadstools: caps from shade to light, white spots and cream stalks. */
  cap: ['#b02a4a', '#cb3d58', '#e04f63', '#f56f80'],
  spot: '#fffdf8',
  stalk: '#fff0d2',
  /** The chimney's smoke. */
  smoke: '#ffffff',
  smokeShade: '#dfe3f4',
  smokeEdge: '#bcc3e0',
  /** Odds and ends. */
  stone: '#fbe6d8',
  stoneShade: '#e9bca8',
  petals: ['#ff9fc0', '#fff4a3', '#ffffff', '#c9a8ff', '#ffb27d'],
} as const;

/* ------------------------------------------------------------------------ */
/* Sky, trees and ground                                                    */
/* ------------------------------------------------------------------------ */

/** Paints the sky as dithered colour bands from `top` (the top of the picture) down to `horizonY`. */
function paintSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, top: number): void {
  for (let y = top; y < height; y++) {
    const t = Math.max(0, Math.min(1, (y - top) / (horizonY - top)));
    for (let x = 0; x < width; x++) pixel(ctx, x, y, ramp(COLORS.sky, t, x, y));
  }
}

/** Paints a soft, dithered glow of sunlight around (`cx`, `cy`). */
function paintSunGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const closeness = 1 - Math.hypot(x - cx, y - cy) / radius;
      if (closeness > 0 && closeness > BAYER_4[y & 3][x & 3] / 16) pixel(ctx, x, y, COLORS.glow);
    }
  }
}

/** A lumpy, leafy ball of foliage: a few overlapping round bumps, each lit from the top left. */
function leafClump(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  tones: readonly string[],
  rand: () => number,
): void {
  const bumps: readonly (readonly [number, number, number])[] = [
    [0, 0, 1],
    [-0.55, 0.2, 0.62],
    [0.55, 0.15, 0.66],
    [-0.2, -0.5, 0.6],
    [0.32, -0.46, 0.55],
  ];
  for (const [bx, by, scale] of bumps) {
    const r = radius * scale;
    ellipse(ctx, cx + bx * radius, cy + by * radius, r, r * 0.92, (x, y, dx, dy) =>
      ramp(tones, lit(dx, dy) + (rand() - 0.5) * 0.1, x, y),
    );
  }
}

/** A round-topped tree: a trunk (shaded left to right) with a clump of leaves on top. */
function paintTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  trunkWidth: number,
  trunkHeight: number,
  canopyRadius: number,
  leaves: readonly string[],
  trunk: readonly string[],
  rand: () => number,
): void {
  const left = Math.round(x - trunkWidth / 2);
  for (let dx = 0; dx < trunkWidth; dx++) {
    const color = dx === 0 ? trunk[2] : dx >= trunkWidth - 1 ? trunk[0] : trunk[1];
    rect(ctx, left + dx, baseY - trunkHeight, 1, trunkHeight, color);
  }
  leafClump(ctx, x, baseY - trunkHeight - canopyRadius * 0.4, canopyRadius, leaves, rand);
}

/** A row of trees along the back, standing on the line `baseY`. Trees skip the clearing in the middle. */
function paintTreeRow(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number,
  rand: () => number,
  options: {
    gap: [number, number];
    trunkWidth: [number, number];
    trunkHeight: [number, number];
    canopy: [number, number];
    leaves: readonly string[];
    trunk: readonly string[];
    clearing: number;
  },
): void {
  const between = ([lo, hi]: [number, number]) => lo + rand() * (hi - lo);
  for (let x = -4; x < width + 4; x += between(options.gap)) {
    if (Math.abs(x - width / 2) < options.clearing) continue;
    paintTree(
      ctx,
      x,
      baseY,
      Math.round(between(options.trunkWidth)),
      Math.round(between(options.trunkHeight)),
      between(options.canopy),
      options.leaves,
      options.trunk,
      rand,
    );
  }
}

/**
 * A big tree right at the edge of the picture, with a thick trunk and a heavy crown of leaves.
 * Its crown sits at `top` (the top of the picture), and `crown` (0 to 1) shrinks it on narrow
 * pictures so it doesn't cover the house's chimney.
 */
function paintFrameTree(ctx: CanvasRenderingContext2D, x: number, top: number, height: number, crown: number, rand: () => number): void {
  const half = 6;
  const trunkTop = top + 12;
  const trunkHeight = height - trunkTop;
  for (let dx = -half; dx <= half; dx++) {
    const t = (dx + half) / (half * 2);
    rect(ctx, x + dx, trunkTop, 1, trunkHeight, ramp(COLORS.trunk.slice().reverse(), t, x + dx, 40));
  }
  // bark: short dark lines and a few patches of moss
  for (let i = 0; i < 16; i++) {
    const bx = x - half + 1 + Math.floor(rand() * (half * 2 - 2));
    const by = trunkTop + 8 + Math.floor(rand() * (trunkHeight - 12));
    rect(ctx, bx, by, 1, 3 + Math.floor(rand() * 4), COLORS.trunk[0]);
  }
  for (let i = 0; i < 4; i++) {
    const by = trunkTop + 18 + Math.floor(rand() * (trunkHeight - 38));
    ellipse(ctx, x - half + 2 + rand() * 6, by, 2.5, 1.8, (px, py) => ramp(COLORS.nearLeaves, 0.5 + (rand() - 0.5) * 0.3, px, py));
  }
  // a crown of leaves, with a branch that droops toward the clearing
  leafClump(ctx, x - 3, trunkTop, 17 * crown, COLORS.nearLeaves, rand);
  leafClump(ctx, x + 11 * crown, top + 6, 13 * crown, COLORS.nearLeaves, rand);
  leafClump(ctx, x - 14 * crown, top + 22, 11 * crown, COLORS.nearLeaves, rand);
}

/** Puffs of leaves hanging along the very top of the picture, leaving a gap where the sun shines in. */
function paintCanopyTop(ctx: CanvasRenderingContext2D, width: number, sunX: number, rand: () => number): void {
  for (let x = 14; x < width - 8; x += 15 + rand() * 6) {
    if (Math.abs(x - sunX) < 24) continue;
    leafClump(ctx, x, 0 + rand() * 4, 10 + rand() * 5, COLORS.midLeaves, rand);
  }
}

/**
 * On tall pictures, the extra height above the usual treetops is filled with a looser canopy: pale, hazy
 * leaves far away, with a few richer clusters in front, and a sunny gap where the light pours in.
 */
function paintTallCanopy(ctx: CanvasRenderingContext2D, width: number, top: number, sunX: number, rand: () => number): void {
  for (let y = top - 4; y < 2; y += 15) {
    for (let x = 2 + rand() * 8; x < width; x += 14 + rand() * 6) {
      if (Math.abs(x - sunX) < 14) continue;
      leafClump(ctx, x, y + rand() * 5, 9 + rand() * 4, COLORS.farLeaves, rand);
    }
  }
  for (let y = top - 2; y < 4; y += 24) {
    for (let x = 4 + rand() * 12; x < width; x += 24 + rand() * 12) {
      if (Math.abs(x - sunX) < 24) continue;
      leafClump(ctx, x, y + rand() * 6, 10 + rand() * 4, COLORS.midLeaves, rand);
    }
  }
}

/** Diagonal beams of sunlight slanting down through the trees, from `top` to the bottom edge. */
function paintLightShafts(ctx: CanvasRenderingContext2D, height: number, sunX: number, top: number): void {
  ctx.save();
  ctx.globalAlpha = 0.13;
  for (let k = 0; k < 5; k++) {
    const start = sunX + (k - 2) * 15;
    const shaftWidth = 6 + k * 2;
    for (let y = top; y < height; y++) {
      rect(ctx, start - (y - top) * 0.55, y, shaftWidth + (y - top) * 0.07, 1, COLORS.glow);
    }
  }
  ctx.restore();
}

/** Grass from `groundY` down to the bottom edge: light and sunny in the distance, a little deeper up close. */
function paintGround(ctx: CanvasRenderingContext2D, width: number, height: number, groundY: number, rand: () => number): void {
  for (let y = groundY; y < height; y++) {
    const t = (y - groundY) / (height - groundY);
    for (let x = 0; x < width; x++) pixel(ctx, x, y, ramp(COLORS.grass, t, x, y));
  }
  // blades and tufts
  for (let i = 0; i < width * 1.3; i++) {
    const x = Math.floor(rand() * width);
    const y = groundY + 2 + Math.floor(rand() * (height - groundY - 2));
    const dark = rand() < 0.6;
    rect(ctx, x, y, 1, 2, dark ? COLORS.grassDark : COLORS.grassLight);
    if (dark && rand() < 0.3) pixel(ctx, x + 1, y + 1, COLORS.grassDark);
  }
}

/** Tiny wildflowers scattered over the grass, each a little 2x2 bloom on a stem. */
function paintFlowers(ctx: CanvasRenderingContext2D, width: number, height: number, groundY: number, rand: () => number, keepClear: [number, number, number, number]): void {
  const [x0, y0, x1, y1] = keepClear;
  for (let i = 0; i < width * 0.45; i++) {
    const x = 1 + Math.floor(rand() * (width - 3));
    const y = groundY + 5 + Math.floor(rand() * (height - groundY - 7));
    if (x > x0 && x < x1 && y > y0 && y < y1) continue;
    const petal = COLORS.petals[Math.floor(rand() * COLORS.petals.length)];
    pixel(ctx, x, y + 2, COLORS.grassDark);
    rect(ctx, x, y, 2, 2, petal);
    pixel(ctx, x, y, petal === '#fff4a3' ? '#ffffff' : '#fff4a3');
  }
}

/** A path of pale stepping stones from the front door winding down to the bottom edge. */
function paintPath(ctx: CanvasRenderingContext2D, doorX: number, doorstepY: number, height: number): void {
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const y = doorstepY + 5 + t * (height - doorstepY - 5);
    const x = doorX + 1 + Math.sin(t * 2.6) * 5 + t * 6;
    const rx = 4 + t * 4.5;
    const ry = 1.8 + t * 1.6;
    ellipse(ctx, x, y, rx, ry, (_x, _y, _dx, dy) => (dy > 0.35 ? COLORS.stoneShade : COLORS.stone));
  }
}

/* ------------------------------------------------------------------------ */
/* Garden decorations                                                       */
/* ------------------------------------------------------------------------ */

/** A little spotted toadstool: used to decorate the garden. */
function paintToadstool(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number): void {
  rect(ctx, x, baseY - size, Math.max(2, Math.round(size * 0.6)), size, COLORS.stalk);
  ellipse(ctx, x + size * 0.3 + 0.5, baseY - size, size * 0.95, size * 0.65, (px, py, dx, dy) => (py > baseY - size ? null : ramp(COLORS.cap, lit(dx, dy), px, py)));
  pixel(ctx, x + size * 0.1, baseY - size - size * 0.35, COLORS.spot);
}

/** Two little butterflies fluttering in the clearing. */
function paintButterfly(ctx: CanvasRenderingContext2D, x: number, y: number, wing: string, tip: string): void {
  pixel(ctx, x, y + 1, '#5a4670');
  pixel(ctx, x - 1, y, wing);
  pixel(ctx, x - 2, y, tip);
  pixel(ctx, x + 1, y, wing);
  pixel(ctx, x + 2, y, tip);
  pixel(ctx, x - 1, y + 1, wing);
  pixel(ctx, x + 1, y + 1, wing);
}

/* ------------------------------------------------------------------------ */
/* Putting it together                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Paints the whole scene (everything except the smoke) onto a canvas.
 *
 * @param ctx 2D drawing context of the (small) canvas.
 * @param width Canvas width in pixels. The house is centred in it.
 * @param canvasHeight Canvas height in pixels. At least `HOME_SCENE_HEIGHT`; anything above that adds
 *   more sky, leaves and tree trunk above the house.
 * @param seed Changes the placement of trees and flowers.
 * @returns Where the chimney opens and where the front door is (in canvas pixels), so the smoke
 *   and the bunny can be drawn in the right places.
 */
export function paintMushroomHome(ctx: CanvasRenderingContext2D, width: number, canvasHeight: number, seed = 11): HomeScene {
  // The scene is always painted as if it were `HOME_SCENE_HEIGHT` tall, pushed down to make room for any extra height above.
  const extra = Math.max(0, canvasHeight - HOME_SCENE_HEIGHT);
  const height = HOME_SCENE_HEIGHT;
  const top = -extra;
  ctx.save();
  ctx.translate(0, extra);
  const rand = createRandom(seed);
  const cx = Math.round(width / 2);
  const sunX = Math.round(width * 0.78);
  const groundY = Math.round(height * 0.6);
  /** The row the doorstep sits on. */
  const doorstepY = 93;
  /** The cottage's roof and walls are centred a little left of the middle, because its steps and ivy stick out on the right. */
  const houseX = cx - 4;

  paintSky(ctx, width, height, groundY, top);
  paintSunGlow(ctx, sunX, top, 34);
  paintGround(ctx, width, height, groundY, rand);

  // Far trees: pale and hazy; then a soft haze along the ground where they stand.
  paintTreeRow(ctx, width, groundY + 2, rand, {
    gap: [6, 11],
    trunkWidth: [2, 2],
    trunkHeight: [12, 18],
    canopy: [7, 11],
    leaves: COLORS.farLeaves,
    trunk: COLORS.farTrunk,
    clearing: 0,
  });
  ctx.save();
  for (let dy = -6; dy < 4; dy++) {
    ctx.globalAlpha = 0.3 * (1 - Math.abs(dy + 1) / 6);
    rect(ctx, 0, groundY + dy, width, 1, '#ffffff');
  }
  ctx.restore();

  // Nearer trees, leaving the clearing in the middle open for the house.
  paintTreeRow(ctx, width, groundY + 16, rand, {
    gap: [13, 20],
    trunkWidth: [3, 4],
    trunkHeight: [24, 34],
    canopy: [13, 17],
    leaves: COLORS.midLeaves,
    trunk: COLORS.trunk,
    clearing: 46,
  });
  paintCanopyTop(ctx, width, sunX, rand);
  if (extra > 0) paintTallCanopy(ctx, width, top, sunX, rand);
  paintLightShafts(ctx, height, sunX, top);

  // The garden and the house: flowers, a path from the door, toadstools, and the cottage itself.
  // (Everything about where the house stands is worked out from `doorstepY` and `houseX`.)
  paintFlowers(ctx, width, height, groundY, rand, [houseX - 30, 66, houseX + 40, doorstepY + 4]);
  paintPath(ctx, houseX - 11, doorstepY, height);
  paintToadstool(ctx, houseX - 33, doorstepY + 1, 4);
  paintToadstool(ctx, houseX - 38, doorstepY + 3, 3);
  paintToadstool(ctx, houseX + 43, doorstepY + 4, 3);
  const cottage = paintCottage(ctx, houseX, doorstepY);

  // The big trees at either edge, with a few tufts of grass in front of everything.
  const crown = Math.min(1, Math.max(0.6, (width - 60) / 110));
  paintFrameTree(ctx, Math.round(width * 0.045) + 5, top, height, crown, rand);
  paintFrameTree(ctx, width - Math.round(width * 0.05) - 5, top, height, crown, rand);
  for (let i = 0; i < width * 0.5; i++) {
    const x = Math.floor(rand() * width);
    const y = height - 1 - Math.floor(rand() * 4);
    rect(ctx, x, y - 1, 1, 2, COLORS.grassDark);
  }
  paintButterfly(ctx, houseX - 44, 56, '#ffb3d1', '#ff7fb0');
  paintButterfly(ctx, houseX + 47, 62, '#fff2a0', '#ffd23d');

  ctx.restore();
  // Everything was painted `extra` pixels lower than the canvas's own coordinates, so move the answers down too.
  return {
    chimney: { x: cottage.chimney.x, y: cottage.chimney.y + extra },
    door: { ...cottage.door, top: cottage.door.top + extra, bottom: cottage.door.bottom + extra },
  };
}

/**
 * Paints the curl of smoke rising from the chimney, at one moment in time. It is drawn over
 * the finished scene every few moments, so it drifts upward, spreads and fades.
 *
 * @param seconds Time in seconds. The smoke repeats itself every few seconds.
 */
export function paintSmoke(ctx: CanvasRenderingContext2D, chimney: HomeScene['chimney'], seconds: number): void {
  const puffs = 6;
  const period = 6;
  // How far up the smoke climbs: up to 25 pixels, or less if the chimney is close to the top of the picture.
  const rise = Math.min(25, chimney.y - 2);
  ctx.save();
  for (let i = 0; i < puffs; i++) {
    // Each puff is a different distance along its journey. Time is stepped, so it moves in little jumps.
    const t = Math.floor((((seconds / period + i / puffs) % 1) + 1) % 1 * 28) / 28;
    const radius = 1.8 + t * 4.4;
    const x = chimney.x + Math.sin((t * 1.8 + i * 0.7) * Math.PI) * 2.8 + t * 7;
    const y = chimney.y - 2 - t * rise;
    ctx.globalAlpha = Math.min(1, Math.max(0, 1 - t) ** 0.8 * 1.1);
    // a white puff with a soft lavender edge (so it still shows against the bright sky) and a little shade underneath
    ellipse(ctx, x, y, radius, radius * 0.85, (_px, _py, dx, dy) => {
      if (dx * dx + dy * dy > 0.55) return COLORS.smokeEdge;
      return dx * 0.5 + dy * 0.7 > 0.15 ? COLORS.smokeShade : COLORS.smoke;
    });
  }
  ctx.restore();
}
