/**
 * The mushroom cottage: a round, pale-pink house under a big dome of terracotta roof tiles, with an
 * arched door, a round-topped window, a little dormer window, ivy and pink flowers climbing
 * everywhere, and stone steps winding up the side. It is what the browser's Home button shows
 * (`mushroomHome.ts` paints the forest around it and `src/pages/HomePage.tsx` puts it on screen).
 *
 * Like the rest of the pictures, it is painted one pixel at a time onto a tiny canvas that the
 * browser then scales up without smoothing.
 *
 * HOW THE PICTURE IS DESCRIBED
 *  - Positions inside the house are written as "house pixels": `[across, down]` counted from the
 *    top-left corner of the cottage, which is about 64 pixels wide and 74 tall (the steps and ivy stick
 *    out a little on the right). `paintCottage` turns them into canvas pixels.
 *  - The roof and walls are free-form shapes made from a few points (see `ROOF_POINTS` and
 *    `WALL_POINTS`). Move a point to reshape them.
 *  - Want different colours? Edit `COLORS`. Want more or fewer flowers? Look for `blossom(` and
 *    `ivyBlob(` in `paintCottage`.
 *  - The door is drawn by `paintDoor`, which can also draw it swung open (the bunny comes out of it,
 *    see `bunny.ts`).
 */
import { createRandom } from './random';
import { BAYER_4, ellipse, lit, paintMask, pixel, polygonMask, ramp, rect, smoothClosed } from './pixelPaint';
import type { Point } from './pixelPaint';

/** The arched opening of the front door, in canvas pixels. The door and the bunny are drawn in it. */
export interface DoorSpot {
  /** Column of the middle of the doorway. */
  x: number;
  /** Row of the top of the arch. */
  top: number;
  /** Row of the bottom of the doorway (the doorstep is just below it). */
  bottom: number;
  /** The doorway is `half` pixels to the left and to the right of `x` at its widest (so `half * 2 + 1` wide). */
  half: number;
}

/** What `paintCottage` tells the rest of the scene about the house it just painted. */
export interface Cottage {
  /** Where the chimney opens, so smoke can be drawn above it. */
  chimney: { x: number; y: number };
  /** The front doorway. */
  door: DoorSpot;
  /** Where the house's shadow ends on the right (canvas column), so the garden can keep clear of the steps. */
  right: number;
  /** Where the house's left edge is (canvas column). */
  left: number;
}

/** Colours. Lists run from darkest (or most shaded) to lightest. */
const COLORS = {
  /** Terracotta roof tiles: the shaded, middle and sunlit tone of each part of a tile. */
  tileBody: ['#cf5a2c', '#e9703b', '#f4864f'],
  tileTop: ['#ea8f60', '#f9ae85', '#ffc9a6'],
  tileGap: ['#7d2619', '#9a331f', '#b43f22'],
  roofOutline: '#6b1a1a',
  roofRim: '#8f2b1c',
  /** Pale pink walls, from sunlit (left) to shaded (right). */
  wall: ['#fff4ec', '#ffe4d8', '#fdd2c4', '#f3b8a5'],
  wallOutline: '#b0604a',
  wallShadow: '#e8ac98',
  stripe: '#ffc9e1',
  stripeLight: '#ffdcee',
  /** Door, its arched frame, and the room you glimpse when it is open. */
  wood: '#c96a40',
  woodMid: '#a94a2e',
  woodDark: '#6c2a1b',
  knob: '#f9b43c',
  knobShine: '#fff0a8',
  frame: '#fff2e8',
  frameShade: '#ffd5e4',
  frameOutline: '#a85a42',
  roomTop: '#4a2a36',
  roomMid: '#7a4a3c',
  roomFloor: '#cc8c58',
  lantern: '#ffe9a6',
  lanternGlow: '#f7b46e',
  /** The orange brick ledge under the round window, and the chimney. */
  brick: ['#9c3d22', '#d9693b', '#f3a073'],
  chimney: '#b8452a',
  chimneyDark: '#8f2f1f',
  chimneyMortar: '#ecbca4',
  chimneyCap: '#7a2a1e',
  chimneyCapLight: '#a8472f',
  chimneyHole: '#3b2a2f',
  /** Stone steps. */
  stoneTop: '#fde8dc',
  stoneFace: '#f4c4af',
  stoneSide: '#e3a690',
  stoneOutline: '#a8553f',
  /** Ivy, dark to light, and the flowers growing in it. */
  ivy: ['#2c6428', '#43902f', '#6cb83a', '#a4dc56'],
  ivyBright: '#d6ee74',
  blossom: '#ff7cb4',
  blossomLight: '#ffd0e6',
  blossomDark: '#df4f98',
  tendril: '#ee8a3e',
  tendrilDark: '#c85f27',
  /** Shadow on the grass. */
  shadow: '#5db856',
} as const;

/** The cottage is about this tall (in canvas pixels); `paintCottage` puts the doorstep on the line it is given. */
const HOUSE_HEIGHT = 74;
/** Which column of the cottage (counted from its left edge) is its middle; the house is centred on this. */
const HOUSE_MIDDLE = 28;

/** The dome of the roof, traced as a smooth outline: peak at the top, swelling out to the right, resting on the walls. */
const ROOF_POINTS: readonly Point[] = [
  [26.3, 0.2], [30.4, 0.7], [34.9, 2.7], [38.1, 6.4], [40.4, 10.5], [41.7, 15], [43.5, 19.6], [46.3, 23.2],
  [49.9, 26.8], [53.1, 30], [54.6, 34.1], [54.3, 37.3], [52.6, 40.5], [49.9, 43.2],
  // the underside (the rim), right to left
  [46.3, 45.9], [41.7, 48.2], [35.4, 49.3], [29, 48.9], [22.6, 47.7], [16.3, 46.2], [10.8, 44.4], [7.2, 42.7],
  [4, 41.7], [1.7, 40.2],
  // up the left side
  [0.4, 37.3], [0.1, 34.1], [0.8, 30.9], [2.6, 28.2], [6.3, 25.5], [9.5, 22.2], [12, 17.7], [13, 13.7],
  [14.5, 9.7], [17, 6.2], [20, 3.2], [23, 1.2],
];

/** The round cream walls under the roof (the roof hides their top). */
const WALL_POINTS: readonly Point[] = [
  [5.4, 44], [49.5, 44], [49.5, 61.8], [47.2, 66.4], [41.7, 70], [32.6, 72.7], [23.5, 73.8], [17.2, 73.7],
  [10.8, 72.7], [6.5, 70], [5.4, 66],
];

/** One flat stone step: its box and colour of the top. */
interface Step {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The stone steps winding up the right side, lowest first. */
const STEPS: readonly Step[] = [
  { x: 41, y: 68, w: 16, h: 7 },
  { x: 46, y: 61, w: 12, h: 7 },
  { x: 50, y: 55, w: 10, h: 6 },
];

/**
 * Half the width of an arch at row `y`: a straight-sided doorway or window whose top is a half circle.
 * `top` is the row of the topmost pixel and `half` the arch's radius.
 */
export function archHalfWidth(half: number, top: number, y: number): number {
  const rise = y - top;
  if (rise >= half) return half;
  const t = (half - (rise + 0.5)) / half;
  return Math.max(1, Math.round(half * Math.sqrt(1 - t * t)));
}

/** A small stable number (0 or more) for a pair of whole numbers, so tiles get different looks without randomness. */
function hash(a: number, b: number): number {
  return (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0;
}

/** A blob of ivy: a lumpy oval of leaf-green, darker underneath, with a few bright leaves. */
function ivyBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rand: () => number): void {
  ellipse(ctx, cx, cy, rx, ry, (x, y, dx, dy) => {
    if (dx * dx + dy * dy > 0.72 && dy > 0.05) return COLORS.ivy[0];
    return ramp(COLORS.ivy, 0.55 - dx * 0.25 - dy * 0.35 + (rand() - 0.5) * 0.6, x, y);
  });
  const leaves = Math.round(rx * ry * 0.35);
  for (let i = 0; i < leaves; i++) {
    const x = cx + (rand() * 2 - 1) * rx * 0.8;
    const y = cy + (rand() * 2 - 1) * ry * 0.8;
    pixel(ctx, x, y, COLORS.ivy[3]);
    pixel(ctx, x + 1, y + 1, COLORS.ivy[2]);
  }
}

/** A small pink flower: a plus shape (or a full square) with a pale middle and a deeper shade underneath. */
function blossom(ctx: CanvasRenderingContext2D, x: number, y: number, shape: 'plus' | 'square' = 'plus'): void {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const corner = dx !== 0 && dy !== 0;
      if (corner && shape === 'plus') continue;
      pixel(ctx, x + dx, y + dy, dy === 1 || (dx === 1 && dy === 0) ? COLORS.blossomDark : COLORS.blossom);
    }
  }
  pixel(ctx, x, y, COLORS.blossomLight);
  if (shape === 'square') pixel(ctx, x - 1, y - 1, COLORS.blossomLight);
}

/** A pair of ivy leaves reaching out along a line, to soften the edge where plants meet the wall. */
function tendrilOfLeaves(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, count: number): void {
  for (let i = 0; i < count; i++) {
    pixel(ctx, x + dx * i, y + dy * i, COLORS.ivy[1]);
    pixel(ctx, x + dx * i + 1, y + dy * i, COLORS.ivy[3]);
    pixel(ctx, x + dx * i, y + dy * i + 1, COLORS.ivy[0]);
  }
}

/** Where each tile in a row of roof tiles starts (house pixels). Tiles are 6 to 8 pixels wide, a little different in every row. */
const tileStarts = new Map<number, number[]>();
function tileStartsOfRow(row: number): number[] {
  let starts = tileStarts.get(row);
  if (!starts) {
    starts = [];
    for (let x = -40 - (hash(row, 7) % 7); x < 140; x += 6 + (hash(row, x) % 3)) starts.push(x);
    tileStarts.set(row, starts);
  }
  return starts;
}

/** The colour of a roof tile pixel. `x` and `y` are house pixels; the tiles curve with the dome. */
function roofColor(x: number, y: number): string {
  // The rows of tiles sag in the middle, like the lines of a dome seen from slightly above.
  const bow = 6 * Math.max(0, 1 - ((x - 27) / 30) ** 2);
  const v = y - bow;
  const row = Math.floor(v / 4);
  const inRow = Math.floor(v - row * 4);

  // Which tile of this row is the pixel on, and how far along it?
  const starts = tileStartsOfRow(row);
  let index = 0;
  while (index + 1 < starts.length && starts[index + 1] <= x) index++;
  const inCol = x - starts[index];
  const width = starts[index + 1] - starts[index];

  // Light comes from the top left, so the right and the bottom of the dome are in shade.
  const l = lit((x - 27) / 30, (y - 24) / 28);
  let tone = l < 0.3 ? 0 : l > 0.62 ? 2 : 1;
  // Every few tiles are a touch darker, so the roof doesn't look stamped out.
  if (tone > 0 && hash(index + row * 31, row) % 5 === 0) tone -= 1;

  // A dark line round each tile (its bottom and right edge), and a pale highlight along its top.
  if (inRow === 3 || inCol === width - 1) return COLORS.tileGap[tone];
  if (inRow === 0 && inCol >= 1 && inCol <= width - 3) return COLORS.tileTop[tone];
  return COLORS.tileBody[tone];
}

/** Paints the arched frame and the door's doorway. `rows` and `half` describe the opening, as in `DoorSpot`. */
function paintDoorFrame(ctx: CanvasRenderingContext2D, door: DoorSpot): void {
  const outerHalf = door.half + 3;
  const outerTop = door.top - 3;
  for (let y = outerTop; y <= door.bottom; y++) {
    const half = archHalfWidth(outerHalf, outerTop, y);
    for (let x = door.x - half; x <= door.x + half; x++) {
      const edge = x === door.x - half || x === door.x + half || y === outerTop;
      pixel(ctx, x, y, edge ? COLORS.frameOutline : x > door.x + 1 ? COLORS.frameShade : COLORS.frame);
    }
  }
}

/**
 * The room you can see through the open doorway: dark and cosy, with a warm floor and a hanging lantern.
 * `x`/`y` are canvas pixels inside the doorway.
 */
function roomColor(door: DoorSpot, x: number, y: number): string {
  const t = (y - door.top) / (door.bottom - door.top);
  const lantern = Math.hypot(x - (door.x + 3), y - (door.top + 8));
  if (lantern < 1.2) return COLORS.lantern;
  // a dithered halo of warm light around it
  if (lantern < 3.4 && 1 - (lantern - 1.2) / 2.2 > BAYER_4[y & 3][x & 3] / 16) return COLORS.lanternGlow;
  if (t > 0.88) return ramp([COLORS.roomMid, COLORS.roomFloor], (t - 0.88) / 0.12, x, y);
  return ramp([COLORS.roomTop, COLORS.roomMid], t / 0.88, x, y);
}

/**
 * Paints the front door in its doorway, swung open by `openness`: 0 is shut, 1 is wide open (a thin
 * sliver of door left against the wall, and the room beyond showing).
 *
 * The cottage is painted with a shut door; the bunny's visit (see `bunny.ts`) repaints the doorway
 * with this on every frame.
 */
export function paintDoor(ctx: CanvasRenderingContext2D, door: DoorSpot, openness: number): void {
  const left = door.x - door.half;
  const fullWidth = door.half * 2 + 1;
  // The door swings about its left hinge, so it narrows towards the left. Never thinner than 2 pixels.
  const leafWidth = openness <= 0 ? fullWidth : Math.max(2, Math.round(fullWidth * (1 - openness)));

  for (let y = door.top; y <= door.bottom; y++) {
    const half = archHalfWidth(door.half, door.top, y);
    for (let x = door.x - half; x <= door.x + half; x++) {
      const along = x - left;
      if (along >= leafWidth) {
        pixel(ctx, x, y, roomColor(door, x, y));
        continue;
      }
      const edge = x === door.x - half || along === leafWidth - 1 || y === door.top;
      const seam = leafWidth >= 6 && (along === Math.round(leafWidth / 3) || along === Math.round((leafWidth * 2) / 3));
      pixel(ctx, x, y, edge ? COLORS.woodDark : seam ? COLORS.woodMid : COLORS.wood);
    }
  }
  if (leafWidth >= 8) {
    // the golden knob on the side away from the hinge
    const knobX = left + leafWidth - 4;
    rect(ctx, knobX, door.top + 12, 2, 2, COLORS.knob);
    pixel(ctx, knobX, door.top + 12, COLORS.knobShine);
  }
}

/** Is the doorway open air at this column and row? (Used by the bunny to stay inside the doorway while it is still indoors.) */
export function doorwayHalfWidth(door: DoorSpot, y: number): number {
  return archHalfWidth(door.half, door.top, y);
}

/**
 * Paints the whole cottage so that its middle is at column `cx` and its doorstep at row `baseY`.
 *
 * @returns Where the chimney opens, where the door is, and how far left and right the house reaches.
 */
export function paintCottage(ctx: CanvasRenderingContext2D, cx: number, baseY: number): Cottage {
  const rand = createRandom(53);
  const ox = cx - HOUSE_MIDDLE;
  const oy = baseY - HOUSE_HEIGHT;
  /** House pixels to canvas pixels. */
  const shift = (points: readonly Point[]): Point[] => points.map(([x, y]) => [ox + x, oy + y]);

  const roofMask = polygonMask(smoothClosed(shift(ROOF_POINTS)));
  const wallMask = polygonMask(smoothClosed(shift(WALL_POINTS), 3));

  // Where the roof ends in each column, so the walls can be shaded just underneath it.
  const roofBottom = new Map<number, number>();
  for (let x = roofMask.x0; x < roofMask.x0 + roofMask.w; x++) {
    for (let y = roofMask.y0 + roofMask.h - 1; y >= roofMask.y0; y--) {
      if (roofMask.has(x, y)) {
        roofBottom.set(x, y);
        break;
      }
    }
  }

  // a soft shadow on the grass
  ellipse(ctx, ox + 31, baseY + 1, 36, 3.6, () => COLORS.shadow);

  // The walls, pale in the light on the left and a little peachy on the right, with a pink streak of reflected light.
  paintMask(ctx, wallMask, (x, y, edge) => {
    const hx = x - ox;
    if (edge) return COLORS.wallOutline;
    const under = y - (roofBottom.get(x) ?? -1000);
    if (under >= 1 && under <= 2) return COLORS.wallShadow;
    if (under === 3) return ramp([COLORS.wallShadow, COLORS.wall[2]], 0.5, x, y);
    if (hx >= 26 && hx <= 28) return hx === 27 ? COLORS.stripeLight : COLORS.stripe;
    // flat bands of colour, light on the left to shaded on the right
    const across = (hx - 5) / 45;
    return across < 0.24 ? COLORS.wall[0] : across < 0.46 ? COLORS.wall[1] : across < 0.75 ? COLORS.wall[2] : COLORS.wall[3];
  });

  // The front door: an arched frame with the door inside it.
  const door: DoorSpot = { x: ox + 17, top: oy + 55, bottom: baseY - 1, half: 6 };
  paintDoorFrame(ctx, door);
  paintDoor(ctx, door, 0);
  // the doorstep
  rect(ctx, door.x - 10, baseY, 21, 1, COLORS.stoneTop);
  rect(ctx, door.x - 10, baseY + 1, 21, 1, COLORS.stoneSide);
  rect(ctx, door.x - 10, baseY, 1, 2, COLORS.stoneOutline);
  rect(ctx, door.x + 10, baseY, 1, 2, COLORS.stoneOutline);
  rect(ctx, door.x - 10, baseY + 2, 21, 1, COLORS.stoneOutline);

  // The round-topped window beside it, so full of plants that you can't see in. (The roof hides its top.)
  const windowX = ox + 42;
  const windowTop = oy + 47;
  for (let y = windowTop; y <= oy + 60; y++) {
    const half = archHalfWidth(5, windowTop, y);
    for (let x = windowX - half; x <= windowX + half; x++) {
      const edge = x === windowX - half || x === windowX + half || y === oy + 60;
      // a cream frame just inside the dark outline (on the lit left and top), then plants filling the glass
      const frame = x === windowX - half + 1 || y === windowTop + 1 || y === oy + 59;
      pixel(ctx, x, y, edge ? COLORS.frameOutline : frame ? COLORS.frame : ramp(COLORS.ivy, 0.45 + (rand() - 0.5) * 0.8, x, y));
    }
  }
  blossom(ctx, windowX - 2, oy + 53);
  blossom(ctx, windowX + 2, oy + 56);
  pixel(ctx, windowX, oy + 51, COLORS.blossomLight);
  // the orange brick ledge under it
  for (let y = oy + 61; y <= oy + 65; y++) {
    for (let x = ox + 34; x <= ox + 44; x++) {
      const edge = x === ox + 34 || x === ox + 44 || y === oy + 65 || y === oy + 61;
      const gap = y === oy + 63 || (x - ox + (y < oy + 63 ? 0 : 3)) % 6 === 0;
      pixel(ctx, x, y, edge ? COLORS.brick[0] : gap ? COLORS.brick[0] : y === oy + 62 || y === oy + 64 ? COLORS.brick[2] : COLORS.brick[1]);
    }
  }

  // The chimney (behind the roof, which hides its foot), on the right slope near the peak.
  const chimneyLeft = ox + 32;
  const chimneyTop = oy - 5;
  for (let y = chimneyTop + 2; y < oy + 12; y++) {
    for (let x = chimneyLeft; x < chimneyLeft + 6; x++) {
      const row = Math.floor((y - chimneyTop) / 3);
      const gap = (y - chimneyTop) % 3 === 2 || (x - chimneyLeft + (row % 2) * 2) % 4 === 3;
      pixel(ctx, x, y, gap ? COLORS.chimneyMortar : x >= chimneyLeft + 4 ? COLORS.chimneyDark : COLORS.chimney);
    }
  }
  rect(ctx, chimneyLeft - 1, chimneyTop, 8, 3, COLORS.chimneyCap);
  rect(ctx, chimneyLeft - 1, chimneyTop, 8, 1, COLORS.chimneyCapLight);
  rect(ctx, chimneyLeft + 1, chimneyTop, 4, 1, COLORS.chimneyHole);

  // The roof: terracotta tiles with a dark outline, and a thicker dark line along the rim.
  paintMask(ctx, roofMask, (x, y, edge) => {
    if (edge) return COLORS.roofOutline;
    if (!roofMask.has(x, y + 2) || (!roofMask.has(x - 1, y + 1) && !roofMask.has(x, y + 1))) return COLORS.roofRim;
    return roofColor(x - ox, y - oy);
  });

  // The little dormer window in the roof, with a dark arch around it and ivy peeping out.
  const dormerX = ox + 20;
  const dormerTop = oy + 19;
  for (let y = dormerTop - 2; y <= oy + 32; y++) {
    const ring = archHalfWidth(7, dormerTop - 2, y);
    const frame = archHalfWidth(5, dormerTop, y + (y < dormerTop ? 2 : 0));
    for (let x = dormerX - ring; x <= dormerX + ring; x++) {
      const dx = Math.abs(x - dormerX);
      if (dx === ring || y === dormerTop - 2) pixel(ctx, x, y, COLORS.roofOutline);
      else if (y >= dormerTop && dx <= frame) {
        const rim = dx === frame || y === dormerTop;
        pixel(ctx, x, y, rim ? COLORS.frame : dx >= frame - 1 && x > dormerX ? COLORS.frameShade : ramp(COLORS.ivy, 0.5 + (rand() - 0.5) * 0.8, x, y));
      }
    }
  }
  blossom(ctx, dormerX - 1, oy + 26);
  blossom(ctx, dormerX + 2, oy + 29);
  ivyBlob(ctx, dormerX - 3, oy + 31, 3, 2, rand);

  // Ivy and big pink flowers tumbling over the left edge of the roof.
  ivyBlob(ctx, ox + 8, oy + 22, 3.2, 3.6, rand);
  ivyBlob(ctx, ox + 6, oy + 33, 4.2, 4.4, rand);
  ivyBlob(ctx, ox + 11, oy + 36, 4.2, 4.6, rand);
  blossom(ctx, ox + 4, oy + 28);
  blossom(ctx, ox + 3, oy + 31);
  blossom(ctx, ox + 5, oy + 28, 'square');
  blossom(ctx, ox + 9, oy + 38);
  blossom(ctx, ox + 8, oy + 35);
  blossom(ctx, ox + 11, oy + 33);
  tendrilOfLeaves(ctx, ox + 11, oy + 24, 1, -1, 2);

  // Flowers and leaves climbing the wall at the bottom left, with a curl of orange vine.
  ivyBlob(ctx, ox + 5, oy + 54, 2.8, 3.4, rand);
  ivyBlob(ctx, ox + 7, oy + 61, 2.6, 3.2, rand);
  blossom(ctx, ox + 4, oy + 52);
  blossom(ctx, ox + 5, oy + 56);
  blossom(ctx, ox + 7, oy + 60);
  blossom(ctx, ox + 7, oy + 63);
  for (const [vx, vy] of [[2, 66], [3, 65], [4, 65], [5, 66], [5, 67], [4, 68], [3, 68], [2, 69]] as const) {
    pixel(ctx, ox + vx, oy + vy, vy > 66 ? COLORS.tendrilDark : COLORS.tendril);
  }

  // The stone steps winding up the right side, to a little brick landing at the top.
  for (const step of STEPS) {
    const x = ox + step.x;
    const y = oy + step.y;
    for (let sy = y; sy < y + step.h; sy++) {
      for (let sx = x; sx < x + step.w; sx++) {
        const edge = sx === x || sx === x + step.w - 1 || sy === y + step.h - 1 || sy === y;
        const top = sy < y + Math.round(step.h * 0.45);
        pixel(ctx, sx, sy, edge ? COLORS.stoneOutline : top ? COLORS.stoneTop : sx > x + step.w - 4 ? COLORS.stoneSide : COLORS.stoneFace);
      }
    }
  }
  for (let y = oy + 47; y < oy + 56; y++) {
    for (let x = ox + 51; x < ox + 59; x++) {
      const edge = x === ox + 51 || x === ox + 58 || y === oy + 47;
      const gap = (y - oy) % 3 === 0 || (x - ox + (Math.floor((y - oy) / 3) % 2) * 2) % 4 === 0;
      pixel(ctx, x, y, edge ? COLORS.brick[0] : gap ? COLORS.brick[0] : COLORS.brick[1]);
    }
  }
  // Ivy swallowing the steps, with pink flowers dotted through it.
  ivyBlob(ctx, ox + 59, oy + 70, 6.5, 5, rand);
  ivyBlob(ctx, ox + 51, oy + 74, 7, 3, rand);
  ivyBlob(ctx, ox + 62, oy + 62, 3.6, 7, rand);
  ivyBlob(ctx, ox + 58, oy + 53, 3, 4.5, rand);
  ivyBlob(ctx, ox + 56, oy + 65, 3.4, 2.4, rand);
  for (const [fx, fy] of [[60, 61], [59, 66], [55, 69], [59, 71], [63, 69], [58, 75], [62, 74], [57, 56]] as const) {
    blossom(ctx, ox + fx, oy + fy, 'square');
  }
  tendrilOfLeaves(ctx, ox + 52, oy + 66, 1, -1, 3);

  return {
    chimney: { x: chimneyLeft + 3, y: chimneyTop },
    door,
    left: ox,
    right: ox + 66,
  };
}
