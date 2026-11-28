/**
 * HomePage: what the browser shows when its Home button is pressed. A little
 * mushroom cottage with a terracotta roof, in a bright forest.
 *
 * The picture is painted by `src/art/mushroomHome.ts` (the forest) and `src/art/mushroomCottage.ts`
 * (the house) onto a tiny canvas that fills the browser's screen and is scaled up without smoothing.
 * The canvas follows the shape of the window: wider windows get more forest either side, and tall,
 * narrow ones (a phone) get more sky and treetops above, so the house always fits.
 * It is painted again if the window is resized.
 *
 * Two things move: smoke curls up from the chimney in slow, stepped puffs, and a few moments after
 * the page opens a little white bunny comes out of the front door, waves hello and goes back in
 * (that animation lives in `src/art/bunny.ts`, and plays every time the Home page opens). Visitors who
 * prefer reduced motion get a still picture with the smoke frozen mid-curl and no bunny.
 */
import { useEffect, useRef, useState } from 'react';
import { paintBunnyVisit } from '../art/bunny';
import { HOME_SCENE_HEIGHT, paintMushroomHome, paintSmoke } from '../art/mushroomHome';

/** The narrowest and widest the picture gets, and the tallest, in art pixels, however the window is shaped. */
const MIN_WIDTH = 100;
const MAX_WIDTH = 320;
const MAX_HEIGHT = 230;
/** How many times a second the smoke and the bunny move. Low, for a retro stepping look. */
const FPS = 8;

/** A canvas size (in art pixels) with the same shape as an area `boxWidth` by `boxHeight` pixels. */
function sceneSizeFor(boxWidth: number, boxHeight: number): { width: number; height: number } {
  const aspect = boxWidth / Math.max(1, boxHeight);
  // Wide areas: the usual height, as wide as needed. Tall, narrow areas: the narrowest width, as tall as needed.
  if (HOME_SCENE_HEIGHT * aspect >= MIN_WIDTH) {
    return { width: Math.min(MAX_WIDTH, Math.round(HOME_SCENE_HEIGHT * aspect)), height: HOME_SCENE_HEIGHT };
  }
  return { width: MIN_WIDTH, height: Math.min(MAX_HEIGHT, Math.round(MIN_WIDTH / aspect)) };
}

export function HomePage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(() => sceneSizeFor(16, 9));
  /** When this page opened (set once). The smoke and the bunny's visit are timed from here, so resizing the window doesn't restart them. */
  const openedAt = useRef<number | null>(null);

  // Keep the picture the same shape as the area it fills (re-measured a moment after the window stops changing).
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let timer: number | undefined;
    const measure = () => {
      const next = sceneSizeFor(box.clientWidth, box.clientHeight);
      setSize((current) => (current.width === next.width && current.height === next.height ? current : next));
    };
    measure();
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    });
    observer.observe(box);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Paint the scene, then keep puffing smoke over it and play the bunny's visit. (Changing the canvas size clears it, so this reruns then.)
  const { width, height } = size;
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    // The scene is painted once, off screen; each moment of animation is drawn over a fresh copy of it.
    const scene = document.createElement('canvas');
    scene.width = width;
    scene.height = height;
    const sceneContext = scene.getContext('2d');
    if (!sceneContext) return;
    const { chimney, door } = paintMushroomHome(sceneContext, width, height);

    const draw = (seconds: number, withBunny: boolean) => {
      context.drawImage(scene, 0, 0);
      paintSmoke(context, chimney, seconds);
      if (withBunny) paintBunnyVisit(context, door, seconds);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(2.4, false);
      return;
    }

    if (openedAt.current === null) openedAt.current = performance.now();
    const start = openedAt.current;
    let frame = 0;
    let lastStep = -1;
    const tick = (now: number) => {
      const step = Math.floor(((now - start) / 1000) * FPS);
      if (step !== lastStep) {
        lastStep = step;
        draw(step / FPS, true);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [width, height]);

  return (
    <div className="home" ref={boxRef}>
      <canvas
        ref={canvasRef}
        className="home__scene"
        width={width}
        height={height}
        role="img"
        aria-label="A little mushroom cottage with a terracotta roof, in a bright forest. A small white bunny comes out of the door, waves hello and goes back in."
      />
    </div>
  );
}
