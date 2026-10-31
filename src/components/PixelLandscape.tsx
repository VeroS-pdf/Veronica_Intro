/**
 * PixelLandscape: the desktop wallpaper (a purple pixel-art forest at dusk).
 *
 * The scene is painted onto a very small canvas (see `src/art/landscape.ts`)
 * and stretched to fill the screen without smoothing (`image-rendering:
 * pixelated` in `desktop.css`). The canvas width follows the screen's aspect
 * ratio, so the picture is never cropped awkwardly on phones or ultrawide monitors.
 */
import { useEffect, useRef, useState } from 'react';
import { paintLandscape } from '../art/landscape';

/** Height of the wallpaper canvas in art pixels. Lower = chunkier pixels. */
const CANVAS_HEIGHT = 180;
/** Keeps the canvas from getting absurdly narrow or wide. */
const MIN_WIDTH = 100;
const MAX_WIDTH = 480;

/** Canvas width that matches the current window's aspect ratio. */
function canvasWidthForWindow(): number {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(CANVAS_HEIGHT * aspect)));
}

export function PixelLandscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(canvasWidthForWindow);

  // Re-measure when the window is resized (debounced so dragging stays smooth).
  useEffect(() => {
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setWidth(canvasWidthForWindow()), 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Repaint whenever the canvas size changes (changing `width` clears the canvas).
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) paintLandscape(ctx, width, CANVAS_HEIGHT);
  }, [width]);

  return <canvas ref={canvasRef} className="wallpaper" width={width} height={CANVAS_HEIGHT} aria-hidden="true" />;
}
