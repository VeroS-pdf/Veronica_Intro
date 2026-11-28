/**
 * The little white bunny who lives in the mushroom cottage. A few moments after the Home page opens, the
 * cottage door swings open, the bunny hops out onto the doorstep, smiles and waves at you, then hops
 * back in and the door closes.
 *
 * The whole visit is a list of frames (see `FRAMES` below), each lasting one eighth of a second, so it
 * moves in the stepped, retro way the smoke does. `paintBunnyVisit` paints whichever frame matches the
 * time that has passed, over the finished scene. (Nothing is painted before the visit starts or after it
 * ends, so the cottage just sits there with its door shut.)
 *
 * The bunny is drawn from a few ovals (so it can be drawn at any size, which is how it looks like it
 * is walking towards you out of the dark house) and then given a soft purple outline.
 *
 * Want a longer or shorter visit, or a different wave? Edit `FRAMES`. Want a different bunny? Edit
 * `COLORS` or `drawBunny`.
 */
import { doorwayHalfWidth, paintDoor } from './mushroomCottage';
import type { DoorSpot } from './mushroomCottage';
import { ellipse, pixel, rect } from './pixelPaint';

const COLORS = {
  fur: '#ffffff',
  furShade: '#ebe5f6',
  furDeep: '#d3c9e8',
  outline: '#7a6890',
  inner: '#ffb8d0',
  cheek: '#ffa9c3',
  nose: '#ff7fa6',
  eye: '#3b2b52',
  mouth: '#8a3d63',
  tongue: '#ff8fae',
} as const;

/** How the bunny is posed in one frame. */
interface Pose {
  /** Size: 1 is full size (out on the doorstep); smaller is further back inside the house. */
  scale: number;
  /** Seen from behind (walking away into the house): no face, but a fluffy tail. */
  back?: boolean;
  /** Which way the right arm is raised for a wave: 0 = hanging down, 1 and 2 = the two ends of a wave. */
  wave?: 0 | 1 | 2;
  /** `open` is wide awake, `blink` is shut for a moment, `happy` is smiling eyes (^ ^). */
  eyes?: 'open' | 'blink' | 'happy';
  /** `smile` is a small smile, `grin` a big open one. */
  mouth?: 'smile' | 'grin';
}

/** One frame of the visit: how far the door is open, and where the bunny is (if it can be seen). */
interface Frame {
  /** 0 = door shut, 1 = wide open. */
  door: number;
  bunny?: Pose & {
    /** Pixels to the right of the middle of the doorway. */
    dx?: number;
    /** Pixels the bunny is hopping above the ground. */
    lift?: number;
    /** `true` once it is out on the doorstep. Until then it is drawn only where the doorway is open. */
    outside?: boolean;
  };
}

/** How many frames each second. Low, for a retro stepping look (the smoke steps at the same rate). */
export const VISIT_FPS = 8;

/** Builds the list of frames for the whole visit. */
function buildFrames(): Frame[] {
  const frames: Frame[] = [];
  const add = (count: number, frame: Frame) => {
    for (let i = 0; i < count; i++) frames.push(frame);
  };

  // A moment to look at the house before anything happens.
  add(8, { door: 0 });

  // The door swings open...
  add(1, { door: 0.25 });
  add(1, { door: 0.5 });
  add(1, { door: 0.75 });
  add(1, { door: 1 });

  // ...and the bunny shows up in the room at the back, growing as it hops towards the door.
  add(2, { door: 1, bunny: { scale: 0.5, dx: -1 } });
  add(1, { door: 1, bunny: { scale: 0.6, dx: 0, lift: 1 } });
  add(1, { door: 1, bunny: { scale: 0.65, dx: 0 } });
  add(1, { door: 1, bunny: { scale: 0.75, dx: 0, lift: 1 } });
  add(2, { door: 1, bunny: { scale: 0.8, dx: 0, eyes: 'blink' } });
  add(1, { door: 1, bunny: { scale: 0.9, dx: 1, lift: 3 } });

  // It hops out onto the doorstep, a little to the right of the door...
  add(1, { door: 1, bunny: { scale: 1, dx: 3, lift: 3, outside: true } });
  add(1, { door: 1, bunny: { scale: 1, dx: 3, outside: true, mouth: 'smile' } });
  add(1, { door: 1, bunny: { scale: 1, dx: 3, outside: true, mouth: 'smile' } });

  // ...and waves hello, smiling, with a blink along the way. (Each pair of frames is one wave.)
  for (let i = 0; i < 7; i++) {
    const eyes = i === 3 ? 'blink' : i === 5 ? 'happy' : 'open';
    add(1, { door: 1, bunny: { scale: 1, dx: 3, outside: true, wave: 1, eyes, mouth: 'grin' } });
    add(1, { door: 1, bunny: { scale: 1, dx: 3, outside: true, wave: 2, eyes, mouth: 'grin', lift: 1 } });
  }
  add(2, { door: 1, bunny: { scale: 1, dx: 3, outside: true, eyes: 'happy', mouth: 'grin' } });

  // Turns around and hops back in (we see its back and fluffy tail)...
  add(1, { door: 1, bunny: { scale: 1, dx: 3, outside: true, back: true } });
  add(1, { door: 1, bunny: { scale: 1, dx: 2, lift: 3, outside: true, back: true } });
  add(1, { door: 1, bunny: { scale: 0.9, dx: 1, lift: 2, back: true } });
  add(1, { door: 1, bunny: { scale: 0.8, dx: 0, back: true } });
  add(1, { door: 1, bunny: { scale: 0.7, dx: 0, lift: 1, back: true } });
  add(1, { door: 1, bunny: { scale: 0.6, dx: -1, back: true } });
  add(1, { door: 1, bunny: { scale: 0.5, dx: -1, lift: 1, back: true } });

  // ...and the door swings shut behind it.
  add(1, { door: 0.75 });
  add(1, { door: 0.5 });
  add(1, { door: 0.25 });
  add(2, { door: 0 });

  return frames;
}

/** Every frame of the visit, in order. */
const FRAMES = buildFrames();

/** How long the whole visit lasts, in seconds, from the moment the Home page opens. */
export const VISIT_SECONDS = FRAMES.length / VISIT_FPS;

/* ------------------------------------------------------------------------ */
/* Drawing the bunny                                                        */
/* ------------------------------------------------------------------------ */

/** The bunny is drawn onto a small canvas this size: `ox` is the column of its middle, `oy` the row just under its feet. */
const SPRITE = { width: 36, height: 44, ox: 18, oy: 40 };

/**
 * Fills a tilted oval (used for the ears): like `ellipse`, but the top leans to one side by `lean`
 * (as a fraction of the oval's width).
 */
function leaningEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  lean: number,
  color: (dx: number, dy: number) => string,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const half = rx * Math.sqrt(1 - dy * dy);
    const middle = cx - dy * lean * rx * 2;
    for (let x = Math.floor(middle - half); x <= Math.ceil(middle + half); x++) {
      const dx = (x + 0.5 - middle) / rx;
      if (dx * dx + dy * dy <= 1) pixel(ctx, x, y, color(dx, dy));
    }
  }
}

/** Fur colour at a spot on a rounded shape, lit from the top left: white in the light, lilac-white in the shade. */
const furAt = (dx: number, dy: number) => (dx * 0.55 + dy * 0.8 > 0.55 ? COLORS.furShade : COLORS.fur);

/** Draws the bunny (without its outline) onto `ctx` in the given pose. */
function drawBunny(ctx: CanvasRenderingContext2D, pose: Pose): void {
  const { ox, oy } = SPRITE;
  const s = pose.scale;
  /** A spot `dx` pixels right of the bunny's middle and `dy` pixels above its feet (negative = up), at the bunny's size. */
  const at = (dx: number) => ox + 0.5 + dx * s;
  const up = (dy: number) => oy + dy * s;
  /** A single pixel at (`dx`, `dy`) in whole full-size pixels, which still lands on a whole pixel at smaller sizes. */
  const dot = (dx: number, dy: number, color: string) =>
    pixel(ctx, ox + Math.round(dx * s), oy + Math.round(dy * s), color);

  // The ears (behind the head). Pink inside, seen from the front only.
  for (const side of [-1, 1] as const) {
    leaningEllipse(ctx, at(side * 2.9), up(-20.5), 1.9 * s, 4.9 * s, side * 0.12, (dx, dy) => (dx * 0.5 + dy * 0.7 > 0.6 ? COLORS.furShade : COLORS.fur));
    // pink inside the ear when we see the front; just a soft lilac fold when we see the back
    leaningEllipse(ctx, at(side * 2.9 + side * 0.3), up(-19.8), 0.95 * s, 3.4 * s, side * 0.12, () => (pose.back ? COLORS.furShade : COLORS.inner));
  }

  // The body and feet.
  ellipse(ctx, at(0), up(-6.2), 4.4 * s, 4.4 * s, (_x, _y, dx, dy) => furAt(dx, dy));
  for (const side of [-1, 1] as const) {
    ellipse(ctx, at(side * 2.8), up(-1.3), 2.3 * s, 1.4 * s, (_x, _y, dx, dy) => (dy > 0.2 ? COLORS.furShade : furAt(dx, dy)));
  }
  // The fluffy tail, when we are looking at its back (a lilac rim keeps it from melting into the body).
  if (pose.back) {
    ellipse(ctx, at(0), up(-3.8), 3.1 * s, 3 * s, () => COLORS.furDeep);
    ellipse(ctx, at(0), up(-3.8), 2.4 * s, 2.3 * s, (_x, _y, dx, dy) => furAt(dx, dy));
  }
  // The arms hanging down.
  if (!pose.back) {
    for (const side of [-1, 1] as const) {
      if (side === 1 && pose.wave) continue;
      ellipse(ctx, at(side * 4.8), up(-6.6), 1.5 * s, 3 * s, (_x, _y, dx, dy) => (dx * side > 0.2 || dy > 0.6 ? COLORS.furDeep : COLORS.furShade));
    }
  }

  // The head, with a shaded edge underneath where it meets the body.
  ellipse(ctx, at(0), up(-13.3), 5.6 * s, 4.8 * s, (_x, _y, dx, dy) => (dy > 0.78 ? COLORS.furDeep : dy > 0.5 || dx * 0.6 + dy * 0.6 > 0.62 ? COLORS.furShade : COLORS.fur));

  // The raised arm, waving: a short chain of circles from the shoulder to the paw, first drawn a
  // little bigger in lilac (so the arm has a rim even where it overlaps the head), then in fur.
  if (pose.wave && !pose.back) {
    const [handX, handY] = pose.wave === 1 ? [7.4, -17.2] : [9.8, -15.4];
    const steps = 7;
    for (const rim of [0.9, 0] as const) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = 4.6 + (handX - 4.6) * t;
        const y = -8.4 + (handY + 8.4) * t;
        const r = (i === steps ? 1.9 : 1.55) + rim;
        ellipse(ctx, at(x), up(y), r * s, r * s, (_px, _py, dx, dy) => (rim ? COLORS.furDeep : dx * 0.5 + dy * 0.7 > 0.5 ? COLORS.furShade : COLORS.fur));
      }
    }
  }

  if (pose.back) return;

  // The face. At small sizes there is only room for two eyes.
  const eyes = pose.eyes ?? 'open';
  if (s < 0.7) {
    dot(-3, -14, COLORS.eye);
    dot(3, -14, COLORS.eye);
    return;
  }
  if (eyes === 'open') {
    for (const side of [-1, 1] as const) rect(ctx, ox + Math.round(side * 3 * s), oy + Math.round(-15 * s), 1, s >= 0.9 ? 2 : 1, COLORS.eye);
  } else if (eyes === 'blink') {
    for (const side of [-1, 1] as const) {
      for (let x = 2; x <= 4; x++) dot(side * x, -14, COLORS.eye);
    }
  } else {
    // ^ ^ : eyes crinkled up with happiness
    for (const side of [-1, 1] as const) {
      dot(side * 4, -14, COLORS.eye);
      dot(side * 3, -15, COLORS.eye);
      dot(side * 2, -14, COLORS.eye);
    }
  }
  // rosy cheeks and a little pink nose
  for (const side of [-1, 1] as const) {
    dot(side * 4, -13, COLORS.cheek);
    dot(side * 5, -13, COLORS.cheek);
  }
  dot(0, -13, COLORS.nose);
  // the smile
  if (pose.mouth === 'grin') {
    for (let x = -2; x <= 2; x++) dot(x, -12, COLORS.mouth);
    dot(-1, -11, COLORS.mouth);
    dot(0, -11, COLORS.tongue);
    dot(1, -11, COLORS.mouth);
  } else {
    dot(-2, -12, COLORS.mouth);
    dot(-1, -11, COLORS.mouth);
    dot(0, -11, COLORS.mouth);
    dot(1, -11, COLORS.mouth);
    dot(2, -12, COLORS.mouth);
  }
}

/** Gives a drawing a one-pixel outline: every empty pixel that touches a painted one is coloured in. */
function outline(canvas: HTMLCanvasElement, color: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  const source = ctx.getImageData(0, 0, width, height).data;
  const painted = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && source[(y * width + x) * 4 + 3] > 0;
  ctx.fillStyle = color;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!painted(x, y) && (painted(x - 1, y) || painted(x + 1, y) || painted(x, y - 1) || painted(x, y + 1))) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

/** Finished bunny pictures, kept so each pose is only drawn once. */
const spriteCache = new Map<string, HTMLCanvasElement>();

/** The bunny in the given pose, drawn and outlined on its own small canvas. */
function bunnySprite(pose: Pose): HTMLCanvasElement {
  const key = [pose.scale, pose.back ? 'back' : 'front', pose.wave ?? 0, pose.eyes ?? 'open', pose.mouth ?? 'smile'].join('|');
  let sprite = spriteCache.get(key);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = SPRITE.width;
    sprite.height = SPRITE.height;
    const ctx = sprite.getContext('2d');
    if (ctx) {
      drawBunny(ctx, pose);
      outline(sprite, COLORS.outline);
    }
    spriteCache.set(key, sprite);
  }
  return sprite;
}

/* ------------------------------------------------------------------------ */
/* Putting the visit on screen                                              */
/* ------------------------------------------------------------------------ */

/** Limits painting to the open doorway (so a bunny still indoors never overlaps the door frame). */
function clipToDoorway(ctx: CanvasRenderingContext2D, door: DoorSpot): void {
  ctx.beginPath();
  for (let y = door.top; y <= door.bottom; y++) {
    const half = doorwayHalfWidth(door, y);
    ctx.rect(door.x - half, y, half * 2 + 1, 1);
  }
  ctx.clip();
}

/**
 * Paints the bunny's visit as it looks `seconds` after the Home page opened: the door swinging open
 * and shut and the bunny itself. Paint the finished scene first, then call this over it. It paints
 * nothing before the visit starts or once it is over.
 *
 * @param door Where the front doorway is, as returned in `HomeScene.door`.
 */
export function paintBunnyVisit(ctx: CanvasRenderingContext2D, door: DoorSpot, seconds: number): void {
  const frame = FRAMES[Math.floor(seconds * VISIT_FPS)];
  if (!frame) return;

  if (frame.door > 0) paintDoor(ctx, door, frame.door);

  const bunny = frame.bunny;
  if (!bunny) return;
  const sprite = bunnySprite(bunny);
  // Further back means a little higher up the doorway; out on the doorstep the feet rest on the step.
  const footY = bunny.outside ? door.bottom + 2 : door.bottom + 1 - Math.round((1 - bunny.scale) * 14);
  const x = door.x + (bunny.dx ?? 0) - SPRITE.ox;
  const y = footY - (bunny.lift ?? 0) - SPRITE.oy;

  ctx.save();
  if (!bunny.outside) clipToDoorway(ctx, door);
  ctx.drawImage(sprite, x, y);
  ctx.restore();
}
