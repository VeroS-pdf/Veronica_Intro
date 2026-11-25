/**
 * Procedural pixel-art landscape: the purple forest wallpaper, in the afternoon.
 *
 * Everything is drawn one pixel at a time onto a tiny canvas (about 180 pixels
 * tall) which the browser then scales up without smoothing, giving the chunky
 * retro look. A seeded random generator is used, so the same seed always paints
 * the same forest and the same clouds.
 *
 * The picture is built to survive being repainted at a different width: every tree,
 * cloud and wave of the ridge is placed relative to the CENTRE of the canvas and has
 * its own little random generator, so making the screen wider or narrower just
 * reveals or hides forest at the two edges instead of reshuffling everything. That
 * is what lets the wallpaper be repainted on every frame of a window resize and
 * still look like one steady picture being resized.
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

/**
 * Where the big framing trees stand: how far in from the left or right edge of the screen (in canvas
 * pixels) and how tall they are (as a fraction of the canvas height). They stay glued to the edges
 * however wide the screen gets.
 */
const FRAME_TREE_SPOTS: readonly { side: 'left' | 'right'; inset: number; heightFraction: number }[] = [
  { side: 'left', inset: 9, heightFraction: 0.85 },
  { side: 'left', inset: 29, heightFraction: 0.55 },
  { side: 'right', inset: 9, heightFraction: 0.78 },
  { side: 'right', inset: 29, heightFraction: 0.5 },
];

/** How much ordinary trees may stick out past the screen edge and still be drawn (so they slide into view smoothly). */
const TREE_EDGE_MARGIN = 24;

/** Clouds sit in evenly spaced slots (one cloud per slot, nudged a little) counted out from the centre of the sky. */
const CLOUD_SPACING = 70;
/** Enough slots to cover the widest wallpaper canvas (480 pixels) plus a cloud's own width. */
const CLOUD_SLOTS = 9;

/** 4x4 Bayer matrix: gives the checkerboard-style dithering used by old games. */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** The sky colours as red/green/blue numbers, so the sky can be written straight into the canvas's pixel data. */
const SKY_RGB: readonly (readonly [number, number, number])[] = COLORS.sky.map((hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]);

/** Position within the 4-pixel dither pattern; works for negative numbers too. */
function ditherIndex(n: number): number {
  return ((Math.round(n) % 4) + 4) % 4;
}

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
 *
 * The sky is written straight into the canvas's pixel data (one go) rather than pixel by pixel,
 * because it covers the whole canvas and has to be quick enough to redraw while a window is resized.
 * The checkerboard is lined up with the centre `cx`, so it doesn't shimmer when the width changes.
 */
function paintSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  cx: number,
): void {
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const column = Array.from({ length: width }, (_, x) => ditherIndex(x - cx));
  const last = SKY_RGB.length - 1;

  let i = 0;
  for (let y = 0; y < height; y++) {
    const t = Math.min(1, y / horizonY) * last;
    const lower = Math.floor(t);
    const upper = Math.min(last, lower + 1);
    const mix = t - lower;
    const bayerRow = BAYER_4[y % 4];
    for (let x = 0; x < width; x++) {
      const [r, g, b] = mix > bayerRow[column[x]] / 16 ? SKY_RGB[upper] : SKY_RGB[lower];
      data[i++] = r;
      data[i++] = g;
      data[i++] = b;
      data[i++] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
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
        if (BAYER_4[ditherIndex(y - cy)][ditherIndex(x - cx)] / 16 < strength * 0.55) {
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

/**
 * Scatters clouds across the upper sky. Each cloud belongs to a numbered slot counted out from the
 * centre and gets its own random generator, so a given cloud always looks the same and stays in the
 * same place relative to the centre, whatever the width of the canvas.
 */
function paintClouds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  seed: number,
): void {
  for (let slot = 0; slot < CLOUD_SLOTS; slot++) {
    const rand = createRandom(seed * 1000 + 100 + slot);
    const cloudWidth = 28 + rand() * 28;
    const x = cx + (slot - (CLOUD_SLOTS - 1) / 2) * CLOUD_SPACING + (rand() - 0.5) * CLOUD_SPACING * 0.9;
    const baseY = height * (0.1 + rand() * 0.28);
    // Clouds that are completely off-screen aren't worth drawing.
    if (x + cloudWidth / 2 + 4 < 0 || x - cloudWidth / 2 - 4 > width) continue;
    paintCloud(ctx, Math.round(x), baseY, cloudWidth, rand);
  }
}

/**
 * Paints a wavy mountain ridge that fills everything beneath it. The waves are measured from the
 * centre `cx`, so the same hills stay put when the width changes.
 */
function paintRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseY: number,
  cx: number,
  seed: number,
): void {
  const rand = createRandom(seed * 1000 + 50);
  const phaseA = rand() * Math.PI * 2;
  const phaseB = rand() * Math.PI * 2;
  for (let x = 0; x < width; x++) {
    const along = x - cx;
    const y = baseY + Math.sin(along * 0.045 + phaseA) * 7 + Math.sin(along * 0.13 + phaseB) * 3;
    rect(ctx, x, y, 1, height - y, COLORS.ridge);
  }
}

/** Paints a dithered band of mist that gets denser towards its bottom edge. */
function paintMist(
  ctx: CanvasRenderingContext2D,
  width: number,
  topY: number,
  thickness: number,
  cx: number,
): void {
  for (let row = 0; row < thickness; row++) {
    const density = (row / thickness) * 0.85;
    const y = topY + row;
    for (let x = 0; x < width; x++) {
      if (BAYER_4[ditherIndex(y)][ditherIndex(x - cx)] / 16 < density) pixel(ctx, x, y, COLORS.mist);
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
 * Decides where one row of trees stands and how tall each one is, as distances from the centre.
 *
 * Trees are planted outwards from the middle, to the right and then to the left, each side with its
 * own random generator. Because a side's sequence of gaps and heights never depends on how far it
 * is asked to go, a wider canvas gets exactly the same trees as a narrower one plus a few more at
 * the ends. Returned left to right.
 */
function plantTrees(
  layer: ForestLayer,
  layerIndex: number,
  seed: number,
  halfWidth: number,
): { offset: number; height: number }[] {
  const [minH, maxH] = layer.heightRange;
  const [minGap, maxGap] = layer.gapRange;
  const reach = halfWidth + TREE_EDGE_MARGIN;
  const trees: { offset: number; height: number }[] = [];

  ([1, -1] as const).forEach((direction, sideIndex) => {
    const rand = createRandom(seed * 1000 + layerIndex * 2 + sideIndex);
    const nextGap = () => minGap + rand() * (maxGap - minGap);
    let offset = direction === 1 ? 0 : -nextGap();
    while (Math.abs(offset) <= reach) {
      trees.push({ offset, height: minH + rand() * (maxH - minH) });
      offset += direction * nextGap();
    }
  });

  return trees.sort((a, b) => a.offset - b.offset);
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
  layerIndex: number,
  cx: number,
  seed: number,
): void {
  const baseY = Math.round(layer.baseY * height);

  // A few pixels of "undergrowth" above the feet fill the gaps between trunks.
  const undergrowth = 4;
  rect(ctx, 0, baseY - undergrowth, width, height - baseY + undergrowth, layer.colors.body);

  for (const tree of plantTrees(layer, layerIndex, seed, width / 2)) {
    paintPine(ctx, cx + tree.offset, baseY, tree.height, layer.colors);
  }
}

/**
 * Paints the complete landscape onto a canvas.
 *
 * @param ctx 2D drawing context of the (small) canvas.
 * @param width Canvas width in pixels. An even number keeps the centre on a whole pixel.
 * @param height Canvas height in pixels.
 * @param seed Changes the cloud and tree placement.
 */
export function paintLandscape(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed = 7,
): void {
  /** The middle of the canvas: trees, clouds and hills are all placed relative to this. */
  const cx = Math.round(width / 2);
  const horizonY = Math.round(height * 0.55);

  paintSky(ctx, width, height, horizonY, cx);
  paintSun(ctx, Math.round(width * 0.8), Math.round(height * 0.2), Math.max(9, Math.round(height * 0.075)));
  paintClouds(ctx, width, height, cx, seed);
  paintRidge(ctx, width, height, Math.round(height * 0.55), cx, seed);

  FOREST_LAYERS.forEach((layer, index) => {
    paintForest(ctx, width, height, layer, index, cx, seed);
    if (layer.mist) {
      paintMist(ctx, width, Math.round(layer.baseY * height) - 6, 14, cx);
    }
  });

  // A few big trees framing the left and right edges. (There is no separate strip of ground along the bottom: the
  // nearest row of trees already fills everything down to the bottom edge.)
  for (const spot of FRAME_TREE_SPOTS) {
    const x = spot.side === 'left' ? spot.inset : width - spot.inset;
    paintPine(ctx, x, height + 8, height * spot.heightFraction, FRAME_TREES);
  }
}
