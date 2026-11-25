/**
 * PixelLandscape: the desktop wallpaper (a purple pixel-art forest at dusk).
 *
 * The scene is painted onto a very small canvas (see `src/art/landscape.ts`)
 * and stretched to fill the screen without smoothing (`image-rendering:
 * pixelated` in `desktop.css`). The canvas width follows the screen's aspect
 * ratio, so the picture is never cropped awkwardly on phones or ultrawide monitors.
 *
 * Resizing: the picture is repainted at the new width on the very same frame the
 * screen changes size, so the old picture is never left stretched to the wrong
 * shape (which is what looked like "zooming in and then readjusting"). The painter
 * keeps the forest steady between widths, so while the window is dragged the trees
 * just slide in and out at the edges.
 */
import { useLayoutEffect, useRef } from 'react';
import { paintLandscape } from '../art/landscape';

/** Height of the wallpaper canvas in art pixels. Lower = chunkier pixels. */
const CANVAS_HEIGHT = 180;
/** Keeps the canvas from getting absurdly narrow or wide. */
const MIN_WIDTH = 100;
const MAX_WIDTH = 480;

/**
 * The canvas width (in art pixels) that matches a screen of the given size. It is rounded to an even
 * number so the centre of the picture, which everything is placed around, sits on a whole pixel.
 */
function canvasWidthFor(screenWidth: number, screenHeight: number): number {
  const wanted = (CANVAS_HEIGHT * screenWidth) / Math.max(1, screenHeight);
  const even = Math.round(wanted / 2) * 2;
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, even));
}

export function PixelLandscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Paint before the first frame is shown, then repaint whenever the canvas's own size changes.
  // (A ResizeObserver runs after the page is laid out but before it is drawn, in the same frame,
  // so there is never a frame showing the old picture at the new size. Changing the canvas's width
  // clears it, which is why it is only changed when the width really is different.)
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let paintedWidth = 0;
    const fitToScreen = () => {
      const width = canvasWidthFor(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
      if (width === paintedWidth) return;
      paintedWidth = width;
      canvas.width = width;
      paintLandscape(ctx, width, CANVAS_HEIGHT);
    };

    fitToScreen();
    const observer = new ResizeObserver(fitToScreen);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // No `width` here on purpose: the effect above sets it, and React must not reset it on a re-render.
  return <canvas ref={canvasRef} className="wallpaper" height={CANVAS_HEIGHT} aria-hidden="true" />;
}
