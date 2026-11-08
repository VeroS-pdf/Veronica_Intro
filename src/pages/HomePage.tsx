/**
 * HomePage: what the browser shows when its Home button is pressed. A little
 * mushroom house with a chimney, in a bright forest.
 *
 * The picture is painted by `src/art/mushroomHome.ts` onto a tiny canvas that
 * fills the browser's screen and is scaled up without smoothing. The canvas follows
 * the shape of the window: wider windows get more forest either side, and tall,
 * narrow ones (a phone) get more sky and treetops above, so the house always fits.
 * It is painted again if the window is resized.
 * Smoke curls up from the chimney in slow, stepped puffs; visitors who prefer
 * reduced motion get a still picture with the smoke frozen mid-curl.
 */
import { useEffect, useRef, useState } from 'react';
import { HOME_SCENE_HEIGHT, paintMushroomHome, paintSmoke } from '../art/mushroomHome';

/** The narrowest and widest the picture gets, and the tallest, in art pixels, however the window is shaped. */
const MIN_WIDTH = 100;
const MAX_WIDTH = 320;
const MAX_HEIGHT = 230;
/** How many times a second the smoke moves. Low, for a retro stepping look. */
const SMOKE_FPS = 8;

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

  // Paint the scene, then keep puffing smoke over it. (Changing the canvas size clears it, so this reruns then.)
  const { width, height } = size;
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    // The scene is painted once, off screen; each moment of smoke is drawn over a fresh copy of it.
    const scene = document.createElement('canvas');
    scene.width = width;
    scene.height = height;
    const sceneContext = scene.getContext('2d');
    if (!sceneContext) return;
    const { chimney } = paintMushroomHome(sceneContext, width, height);

    const draw = (seconds: number) => {
      context.drawImage(scene, 0, 0);
      paintSmoke(context, chimney, seconds);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(2.4);
      return;
    }

    let frame = 0;
    let lastStep = -1;
    const start = performance.now();
    const tick = (now: number) => {
      const step = Math.floor(((now - start) / 1000) * SMOKE_FPS);
      if (step !== lastStep) {
        lastStep = step;
        draw(step / SMOKE_FPS);
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
        aria-label="A little mushroom house with a chimney, in a bright forest"
      />
    </div>
  );
}
