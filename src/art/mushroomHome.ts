/**
 * The mushroom house: a little home with a red spotted cap, a round door, a
 * chimney and a window box, tucked into a bright, sunny forest clearing. It is
 * what the browser's Home button shows (see `src/pages/HomePage.tsx`).
 *
 * Like the wallpaper (`landscape.ts`), the scene is painted one pixel at a time
 * onto a tiny canvas, which the browser then scales up without smoothing. The
 * canvas follows the shape of the window: on wide windows it gets wider (more
 * forest either side), on tall narrow ones (a phone) it gets taller (more sky and
 * treetops above), and the house always sits in the middle. A seeded random generator is used, so the trees and
 * flowers are the same every time.
 *
 * Want different colours? Edit `COLORS`. Want a different house? It is drawn in
 * `paintMushroomHouse`. The chimney's smoke is drawn separately (and moves) in
 * `paintSmoke`.
 */
import { createRandom } from './random';

/** The scene's usual height in art pixels (lower = chunkier pixels). Tall, narrow windows get a taller canvas. */
export const HOME_SCENE_HEIGHT = 108;

/** Where the chimney's opening is, in the scene's own pixels (the smoke starts here). */
export interface HomeScene {
  chimney: { x: number; y: number };
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
  /** The mushroom's cap, from shade to light, plus its outline, spots and underside. */
  cap: ['#b02a4a', '#cb3d58', '#e04f63', '#f56f80'],
  capOutline: '#9a2c4b',
  spot: '#fffdf8',
  spotShade: '#ffd9e1',
  gills: '#f8d8c6',
  gillsShade: '#e7bba9',
  /** The house itself (the mushroom's stem): from the lit side to the shaded side. */
  wall: ['#fffaf0', '#fff0d2', '#f6dfb2', '#e8c892'],
  wallOutline: '#c79d69',
  /** Door, window and window box. */
  wood: '#a8714e',
  woodDark: '#6b4230',
  woodMid: '#8d5a3b',
  knob: '#ffd23d',
  glass: '#c4ebff',
  glassShine: '#f4fcff',
  /** Chimney and its smoke. */
  brick: '#cf6a4f',
  brickShade: '#b5553f',
  mortar: '#f3dcc0',
  chimneyTop: '#8f5543',
  chimneyTopLight: '#b06d57',
  chimneyHole: '#3b2a2f',
  smoke: '#ffffff',
  smokeShade: '#dfe3f4',
  smokeEdge: '#bcc3e0',
  /** Odds and ends. */
  stone: '#f6ead0',
  stoneShade: '#d9c79f',
  fence: '#fff7e2',
  fenceShade: '#e4d1ad',
  petals: ['#ff9fc0', '#fff4a3', '#ffffff', '#c9a8ff', '#ffb27d'],
} as const;

/** 4x4 Bayer matrix: gives the checkerboard-style dithering used by old games. */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** Paints a single pixel. Coordinates are rounded so nothing gets anti-aliased. */
function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

/** Paints a filled rectangle with rounded (whole-pixel) coordinates. */
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Picks one colour out of a list that fade into each other, with a checkerboard blend between
 * neighbours so the fade looks like pixel art. `t` is 0 (first colour) to 1 (last colour).
 */
function ramp(colors: readonly string[], t: number, x: number, y: number): string {
  const scaled = Math.min(1, Math.max(0, t)) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const threshold = BAYER_4[Math.floor(y) & 3][Math.floor(x) & 3] / 16;
  return scaled - index > threshold ? colors[index + 1] : colors[index];
}

/**
 * Fills an oval. `colorAt` is asked for each pixel inside it (with the pixel's offset from the
 * middle, in the oval's own units) and returns a colour, or `null` to leave that pixel alone.
 */
function ellipse(
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
const lit = (dx: number, dy: number) => 0.5 - dx * 0.32 - dy * 0.45;

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
function paintPath(ctx: CanvasRenderingContext2D, cx: number, doorY: number, height: number): void {
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const y = doorY + 3 + t * (height - doorY - 2);
    const x = cx + 2 + Math.sin(t * 2.6) * 9 + t * 7;
    const rx = 4 + t * 4.5;
    const ry = 1.8 + t * 1.6;
    ellipse(ctx, x, y, rx, ry, (_x, _y, _dx, dy) => (dy > 0.35 ? COLORS.stoneShade : COLORS.stone));
  }
}

/* ------------------------------------------------------------------------ */
/* The house                                                                */
/* ------------------------------------------------------------------------ */

/** A little spotted toadstool (not the house!): used to decorate the garden. */
function paintToadstool(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number): void {
  rect(ctx, x, baseY - size, Math.max(2, Math.round(size * 0.6)), size, COLORS.wall[1]);
  ellipse(ctx, x + size * 0.3 + 0.5, baseY - size, size * 0.95, size * 0.65, (px, py, dx, dy) => (py > baseY - size ? null : ramp(COLORS.cap, lit(dx, dy), px, py)));
  pixel(ctx, x + size * 0.1, baseY - size - size * 0.35, COLORS.spot);
}

/** A few pickets of white fence, with two rails. */
function paintFence(ctx: CanvasRenderingContext2D, x: number, y: number, length: number): void {
  rect(ctx, x, y + 3, length, 1, COLORS.fenceShade);
  rect(ctx, x, y + 6, length, 1, COLORS.fenceShade);
  for (let px = x; px < x + length; px += 4) {
    rect(ctx, px, y, 2, 9, COLORS.fence);
    pixel(ctx, px + 1, y + 8, COLORS.fenceShade);
    pixel(ctx, px, y - 1, COLORS.fence);
  }
}

/**
 * Paints the mushroom house, with its base on the grass at `baseY` and its middle at `cx`, and
 * returns where its chimney opens.
 */
function paintMushroomHouse(ctx: CanvasRenderingContext2D, cx: number, baseY: number): HomeScene {
  const capCy = 66; // the cap's lower rim, which sits on top of the walls
  const capRx = 38;
  const capRy = 34;
  const wallTop = capCy + 1;

  // a soft shadow on the grass
  ellipse(ctx, cx, baseY + 1, 25, 3.2, () => COLORS.grassDark);

  // The walls: a round, cream stem, a little wider at the bottom, shaded toward the right.
  for (let y = wallTop; y <= baseY; y++) {
    const half = 16 + ((y - wallTop) / (baseY - wallTop)) * 2.5;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const u = (x - cx) / half;
      const isEdge = x === Math.round(cx - half) || x === Math.round(cx + half) || y === baseY;
      pixel(ctx, x, y, isEdge ? COLORS.wallOutline : ramp(COLORS.wall, (u + 1) / 2 * 0.85 + 0.05, x, y));
    }
  }

  // The round front door, with planks, a golden knob and a stone step.
  const doorTop = 75;
  for (let y = doorTop; y <= baseY; y++) {
    const half = y < 80 ? Math.round(5 * Math.sqrt(1 - ((80.5 - y) / 5.5) ** 2)) : 5;
    for (let x = cx - half; x <= cx + half; x++) {
      const edge = x === cx - half || x === cx + half || y === doorTop;
      const plank = (x - cx + 5) % 4 === 3;
      pixel(ctx, x, y, edge ? COLORS.woodDark : plank ? COLORS.woodMid : COLORS.wood);
    }
  }
  rect(ctx, cx + 2, 84, 2, 2, COLORS.knob);
  rect(ctx, cx - 7, baseY + 1, 15, 2, COLORS.stone);
  rect(ctx, cx - 7, baseY + 2, 15, 1, COLORS.stoneShade);

  // Two round windows with window boxes full of flowers.
  for (const wx of [cx - 11.5, cx + 11.5]) {
    ellipse(ctx, wx, 77.5, 3.6, 3.6, (_x, _y, dx, dy) => (Math.hypot(dx, dy) > 0.78 ? COLORS.woodDark : COLORS.glass));
    pixel(ctx, wx - 1, 76, COLORS.glassShine);
    rect(ctx, wx - 0.5, 74.6, 1, 6, COLORS.woodDark);
    rect(ctx, wx - 3, 77, 6, 1, COLORS.woodDark);
    rect(ctx, wx - 4.5, 82, 9, 2, COLORS.woodMid);
    rect(ctx, wx - 4.5, 83, 9, 1, COLORS.woodDark);
    [COLORS.petals[0], COLORS.petals[1], COLORS.petals[3], COLORS.petals[0], COLORS.petals[2]].forEach((petal, i) => {
      pixel(ctx, wx - 3.5 + i * 2, 81, petal);
      pixel(ctx, wx - 3.5 + i * 2 + 1, 81, COLORS.grassDark);
    });
  }

  // The cap: a big red dome, lit from the top left, with a dark outline and white spots.
  const surface = (x: number) => capCy - capRy * Math.sqrt(Math.max(0, 1 - ((x - cx) / capRx) ** 2));
  const inDome = (x: number, y: number) =>
    ((x + 0.5 - cx) / capRx) ** 2 + ((y + 0.5 - capCy) / capRy) ** 2 <= 1 && y + 0.5 <= capCy;
  ellipse(ctx, cx, capCy, capRx, capRy, (x, y, dx, dy) => {
    if (y + 0.5 > capCy) return null;
    // a pixel with open air to its left, right or above it is on the edge: give it the dark outline
    if (!inDome(x - 1, y) || !inDome(x + 1, y) || !inDome(x, y - 1)) return COLORS.capOutline;
    return ramp(COLORS.cap, lit(dx, dy), x, y);
  });

  // White spots (squashed a little toward the edges, as if curving around the dome).
  const spots: readonly (readonly [number, number, number])[] = [
    [-23, -15, 5.5],
    [-8, -27, 4.2],
    [11, -21, 6],
    [27, -9, 4],
    [-31, -5, 3.2],
    [-9, -9, 3.6],
    [2, -17, 2.6],
    [21, -26, 2.4],
  ];
  for (const [dx, dy, r] of spots) {
    const squash = 1 - Math.min(0.6, Math.abs(dx) / capRx * 0.5);
    ellipse(ctx, cx + dx, capCy + dy, r * squash, r * 0.8, (_x, _y, ex, ey) => (ex * 0.5 + ey * 0.7 > 0.2 ? COLORS.spotShade : COLORS.spot));
  }

  // The underside of the cap, where it meets the walls.
  for (let i = 0; i < 4; i++) {
    const half = capRx * Math.sqrt(1 - (i / 4.6) ** 2);
    const color = i === 0 ? COLORS.capOutline : i === 1 ? COLORS.gills : i === 2 ? COLORS.gillsShade : COLORS.capOutline;
    rect(ctx, cx - half + (i === 3 ? 4 : 0), capCy + i, half * 2 - (i === 3 ? 8 : 0), 1, color);
  }

  // The chimney: bricks standing on the cap, following the curve of the dome at its foot.
  const chimneyLeft = cx + 19;
  const chimneyWidth = 8;
  const chimneyTop = 25;
  for (let x = chimneyLeft; x < chimneyLeft + chimneyWidth; x++) {
    const bottom = Math.ceil(surface(x)) + 1;
    for (let y = chimneyTop + 2; y <= bottom; y++) {
      const row = Math.floor((y - chimneyTop) / 3);
      const brickEnd = (x - chimneyLeft + (row % 2) * 2) % 4 === 3;
      const mortarLine = (y - chimneyTop) % 3 === 2;
      let color: string = x >= chimneyLeft + chimneyWidth - 2 ? COLORS.brickShade : COLORS.brick;
      if (mortarLine || brickEnd) color = COLORS.mortar;
      pixel(ctx, x, y, color);
    }
  }
  rect(ctx, chimneyLeft - 1, chimneyTop, chimneyWidth + 2, 3, COLORS.chimneyTop);
  rect(ctx, chimneyLeft - 1, chimneyTop, chimneyWidth + 2, 1, COLORS.chimneyTopLight);
  rect(ctx, chimneyLeft + 1, chimneyTop, chimneyWidth - 2, 1, COLORS.chimneyHole);

  return { chimney: { x: chimneyLeft + chimneyWidth / 2, y: chimneyTop } };
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
 * @returns Where the chimney opens (in canvas pixels), so smoke can be drawn above it.
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
  const doorBaseY = 91;

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

  // The garden: flowers, the path, a fence and toadstools around the house.
  paintFlowers(ctx, width, height, groundY, rand, [cx - 26, 70, cx + 30, doorBaseY + 4]);
  paintPath(ctx, cx, doorBaseY, height);
  paintFence(ctx, cx + 24, 84, 22);
  paintToadstool(ctx, cx - 28, doorBaseY, 4);
  paintToadstool(ctx, cx - 23, doorBaseY + 2, 3);
  paintToadstool(ctx, cx + 33, doorBaseY + 5, 3);
  const scene = paintMushroomHouse(ctx, cx, doorBaseY);

  // The big trees at either edge, with a few tufts of grass in front of everything.
  const crown = Math.min(1, Math.max(0.6, (width - 60) / 110));
  paintFrameTree(ctx, Math.round(width * 0.045) + 5, top, height, crown, rand);
  paintFrameTree(ctx, width - Math.round(width * 0.05) - 5, top, height, crown, rand);
  for (let i = 0; i < width * 0.5; i++) {
    const x = Math.floor(rand() * width);
    const y = height - 1 - Math.floor(rand() * 4);
    rect(ctx, x, y - 1, 1, 2, COLORS.grassDark);
  }
  paintButterfly(ctx, cx - 40, 56, '#ffb3d1', '#ff7fb0');
  paintButterfly(ctx, cx + 43, 62, '#fff2a0', '#ffd23d');

  ctx.restore();
  return { chimney: { x: scene.chimney.x, y: scene.chimney.y + extra } };
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
  ctx.save();
  for (let i = 0; i < puffs; i++) {
    // Each puff is a different distance along its journey. Time is stepped, so it moves in little jumps.
    const t = Math.floor((((seconds / period + i / puffs) % 1) + 1) % 1 * 28) / 28;
    const radius = 1.8 + t * 4.4;
    const x = chimney.x + Math.sin((t * 1.8 + i * 0.7) * Math.PI) * 2.8 + t * 7;
    const y = chimney.y - 2 - t * 25;
    ctx.globalAlpha = Math.min(1, Math.max(0, 1 - t) ** 0.8 * 1.1);
    // a white puff with a soft lavender edge (so it still shows against the bright sky) and a little shade underneath
    ellipse(ctx, x, y, radius, radius * 0.85, (_px, _py, dx, dy) => {
      if (dx * dx + dy * dy > 0.55) return COLORS.smokeEdge;
      return dx * 0.5 + dy * 0.7 > 0.15 ? COLORS.smokeShade : COLORS.smoke;
    });
  }
  ctx.restore();
}
