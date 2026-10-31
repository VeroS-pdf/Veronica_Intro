/**
 * Procedural pixel-art landscape: the purple forest wallpaper, in the afternoon.
 *
 * Everything is drawn one pixel at a time onto a tiny canvas (about 180 pixels
 * tall) which the browser then scales up without smoothing, giving the chunky
 * retro look. A seeded random generator is used, so the same seed always paints
 * the same forest and the same clouds.
 *
 * Want a different mood? Edit `COLORS` for the palette, or `FOREST_LAYERS` to
 * add, remove, or reshape rows of trees.
 */
import { createRandom } from './random';

/** Colours used by the landscape: pastel afternoon sky, soft purple trees. */
const COLORS = {
  /** Sky gradient, from the top of the screen down to the horizon. */
  sky: ['#8cb6ef', '#a2c3f2', '#b8cef4', '#cfd8f6', '#e5dcf6', '#f6e1f0', '#fde8e3'],
  sun: '#fff2a6',
  sunRim: '#ffe48a',
  sunGlow: '#fff8cf',
  cloud: '#ffffff',
  cloudShade: '#e1d6f5',
  ridge: '#c9b4ee',
  mist: '#f4dcef',
  ground: '#553c93',
} as const;

/** Colours for one row of trees. `light` is the sun-lit edge, `dark` the shaded edge. */
interface TreeColors {
  body: string;
  light: string;
  dark: string;
}

/** Describes one row of pine trees; later entries are drawn in front. */
interface ForestLayer {
  /** Where the trees' feet sit, as a fraction of the canvas height (0 = top). */
  baseY: number;
  /** Shortest and tallest tree, in canvas pixels. */
  heightRange: [number, number];
  /** Minimum and maximum horizontal gap between trees, in canvas pixels. */
  gapRange: [number, number];
  /** Tree colours for this layer. */
  colors: TreeColors;
  /** Whether to fade a band of mist over this layer's lower half. */
  mist: boolean;
}

/** Back-to-front rows of trees: far (pale and small) to near (deeper and tall). */
const FOREST_LAYERS: readonly ForestLayer[] = [
  {
    baseY: 0.64,
    heightRange: [14, 26],
    gapRange: [3, 7],
    colors: { body: '#b9a0e6', light: '#cfbaf2', dark: '#a58bd8' },
    mist: true,
  },
  {
    baseY: 0.74,
    heightRange: [26, 44],
    gapRange: [5, 11],
    colors: { body: '#9d80d6', light: '#b59ce4', dark: '#8868c4' },
    mist: true,
  },
  {
    baseY: 0.86,
    heightRange: [40, 66],
    gapRange: [9, 18],
    colors: { body: '#7f60bd', light: '#9a7fd2', dark: '#6a4ba8' },
    mist: false,
  },
];

/** Big trees that frame the left and right edges of the screen. */
const FRAME_TREES: TreeColors = { body: '#5f43a0', light: '#7c60bd', dark: '#4d3489' };

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
function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Paints the afternoon sky as dithered colour bands from the top down to `horizonY`.
 * Between two bands, pixels alternate in a checkerboard pattern for a soft gradient.
 */
function paintSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number): void {
  const bands = COLORS.sky;
  for (let y = 0; y < height; y++) {
    const t = Math.min(1, y / horizonY) * (bands.length - 1);
    const lower = Math.floor(t);
    const upper = Math.min(bands.length - 1, lower + 1);
    const mix = t - lower;
    for (let x = 0; x < width; x++) {
      const threshold = BAYER_4[y % 4][x % 4] / 16;
      pixel(ctx, x, y, mix > threshold ? bands[upper] : bands[lower]);
    }
  }
}

/** Paints the sun with a dithered glow and a thin warm rim. */
function paintSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const glow = 10;
  for (let y = cy - radius - glow; y <= cy + radius + glow; y++) {
    for (let x = cx - radius - glow; x <= cx + radius + glow; x++) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance <= radius) {
        pixel(ctx, x, y, distance > radius - 1.2 ? COLORS.sunRim : COLORS.sun);
      } else if (distance <= radius + glow) {
        const strength = 1 - (distance - radius) / glow;
        if (BAYER_4[((y % 4) + 4) % 4][((x % 4) + 4) % 4] / 16 < strength * 0.55) {
          pixel(ctx, x, y, COLORS.sunGlow);
        }
      }
    }
  }
}

/**
 * Paints one fluffy cloud: a few overlapping round puffs with a flat underside
 * that is shaded a soft lilac.
 *
 * @param cx Horizontal centre of the cloud.
 * @param baseY Y coordinate of the flat bottom.
 * @param width Overall width in canvas pixels.
 */
function paintCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  width: number,
  rand: () => number,
): void {
  const puffCount = 4 + Math.floor(rand() * 2);
  const puffs = Array.from({ length: puffCount }, (_, i) => {
    const t = i / (puffCount - 1); // 0 at the left end, 1 at the right end
    const radius = width * (0.12 + 0.12 * Math.sin(Math.PI * t) + rand() * 0.03);
    return { x: cx + (t - 0.5) * width * 0.8, y: baseY - radius * 0.7, radius };
  });

  const top = Math.floor(Math.min(...puffs.map((p) => p.y - p.radius)));
  for (let y = top; y <= baseY; y++) {
    for (let x = Math.floor(cx - width / 2 - 4); x <= Math.ceil(cx + width / 2 + 4); x++) {
      const inside = puffs.some((p) => Math.hypot(x - p.x, (y - p.y) * 1.15) <= p.radius);
      if (inside) pixel(ctx, x, y, y >= baseY - 1 ? COLORS.cloudShade : COLORS.cloud);
    }
  }
}

/** Scatters a handful of clouds across the upper sky. */
function paintClouds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: () => number,
): void {
  const count = Math.max(3, Math.round(width / 70));
  for (let i = 0; i < count; i++) {
    const cloudWidth = 28 + rand() * 28;
    paintCloud(ctx, rand() * width, height * (0.1 + rand() * 0.28), cloudWidth, rand);
  }
}

/** Paints a wavy mountain ridge that fills everything beneath it. */
function paintRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseY: number,
  rand: () => number,
): void {
  const phaseA = rand() * Math.PI * 2;
  const phaseB = rand() * Math.PI * 2;
  for (let x = 0; x < width; x++) {
    const y = baseY + Math.sin(x * 0.045 + phaseA) * 7 + Math.sin(x * 0.13 + phaseB) * 3;
    rect(ctx, x, y, 1, height - y, COLORS.ridge);
  }
}

/** Paints a dithered band of mist that gets denser towards its bottom edge. */
function paintMist(ctx: CanvasRenderingContext2D, width: number, topY: number, thickness: number): void {
  for (let row = 0; row < thickness; row++) {
    const density = (row / thickness) * 0.85;
    for (let x = 0; x < width; x++) {
      const y = topY + row;
      if (BAYER_4[y % 4][x % 4] / 16 < density) pixel(ctx, x, y, COLORS.mist);
    }
  }
}

/**
 * Paints one pine tree: a trunk plus stacked, stepped triangles.
 *
 * @param cx Horizontal centre of the tree.
 * @param baseY Y coordinate of the tree's feet.
 * @param height Total height, in canvas pixels.
 * @param colors Body colour plus lit and shaded edge colours.
 */
function paintPine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  height: number,
  colors: TreeColors,
): void {
  const trunkHeight = Math.max(1, Math.round(height * 0.04));
  const crownHeight = height - trunkHeight;
  const tiers = Math.max(2, Math.round(crownHeight / 7));
  const tierHeight = crownHeight / tiers;
  const maxHalfWidth = Math.max(2, Math.round(crownHeight * 0.28));
  const topY = baseY - height;

  for (let row = 0; row < crownHeight; row++) {
    const tier = Math.min(tiers - 1, Math.floor(row / tierHeight));
    const progressInTier = (row - tier * tierHeight) / tierHeight;
    // Each tier starts narrower than the previous one ended, giving the "branches".
    const reach = ((tier + 1) / tiers) * (0.55 + 0.45 * progressInTier);
    const half = Math.max(0, Math.round(reach * maxHalfWidth));
    const y = topY + row;

    rect(ctx, cx - half, y, half * 2 + 1, 1, colors.body);
    if (half >= 2) {
      pixel(ctx, cx + half, y, colors.light); // the sun is on the right
      pixel(ctx, cx - half, y, colors.dark);
    }
  }
  // The trunk uses the body colour so it melts into the ground of its own row.
  rect(ctx, cx - 1, baseY - trunkHeight, 3, trunkHeight, colors.body);
}

/**
 * Paints one row of trees across the whole width, plus the solid ground
 * underneath it so that no sky shows through below the trunks.
 */
function paintForest(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layer: ForestLayer,
  rand: () => number,
): void {
  const baseY = Math.round(layer.baseY * height);
  const [minH, maxH] = layer.heightRange;
  const [minGap, maxGap] = layer.gapRange;

  // A few pixels of "undergrowth" above the feet fill the gaps between trunks.
  const undergrowth = 4;
  rect(ctx, 0, baseY - undergrowth, width, height - baseY + undergrowth, layer.colors.body);

  for (let x = -3; x < width + 3; x += minGap + rand() * (maxGap - minGap)) {
    const treeHeight = minH + rand() * (maxH - minH);
    paintPine(ctx, x, baseY, treeHeight, layer.colors);
  }
}

/**
 * Paints the complete landscape onto a canvas.
 *
 * @param ctx 2D drawing context of the (small) canvas.
 * @param width Canvas width in pixels.
 * @param height Canvas height in pixels.
 * @param seed Changes the cloud and tree placement.
 */
export function paintLandscape(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed = 7,
): void {
  const rand = createRandom(seed);
  const horizonY = Math.round(height * 0.55);

  paintSky(ctx, width, height, horizonY);
  paintSun(ctx, Math.round(width * 0.8), Math.round(height * 0.2), Math.max(9, Math.round(height * 0.075)));
  paintClouds(ctx, width, height, rand);
  paintRidge(ctx, width, height, Math.round(height * 0.55), rand);

  FOREST_LAYERS.forEach((layer) => {
    paintForest(ctx, width, height, layer, rand);
    if (layer.mist) {
      paintMist(ctx, width, Math.round(layer.baseY * height) - 6, 14);
    }
  });

  // Solid ground plus a few big trees framing the left and right edges.
  rect(ctx, 0, Math.round(height * 0.93), width, height, COLORS.ground);
  paintPine(ctx, Math.round(width * 0.03), height + 8, height * 0.85, FRAME_TREES);
  paintPine(ctx, Math.round(width * 0.1), height + 8, height * 0.55, FRAME_TREES);
  paintPine(ctx, Math.round(width * 0.97), height + 8, height * 0.78, FRAME_TREES);
  paintPine(ctx, Math.round(width * 0.9), height + 8, height * 0.5, FRAME_TREES);
}
