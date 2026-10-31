/**
 * ResizeHandles: invisible grab areas around the browser window's edges and
 * corners, plus a dotted grip in the bottom-right corner.
 *
 * Drag any edge or corner to make the window bigger or smaller. The window
 * stays centred on the desktop, so an edge follows the mouse by changing the
 * size by double the mouse's movement. The grip can also be focused and moved
 * with the arrow keys.
 */
import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { GRIP } from '../../art/sprites';
import { PixelSprite } from '../PixelSprite';

/** Smallest the window may be, in screen pixels. */
export const MIN_WINDOW_SIZE = { width: 360, height: 300 };
/** How far each arrow-key press changes the size, in screen pixels. */
const KEYBOARD_STEP = 32;

/** A window size in screen pixels. */
export interface WindowSize {
  width: number;
  height: number;
}

type Edge = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';
const EDGES: readonly Edge[] = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];

/** What we remember about the mouse and window when a drag starts. */
interface DragStart {
  edge: Edge;
  pointerX: number;
  pointerY: number;
  size: WindowSize;
  max: WindowSize;
}

interface ResizeHandlesProps {
  /** The browser window element being resized. */
  windowRef: RefObject<HTMLElement | null>;
  /** Called with the new size while the visitor drags or presses arrow keys. */
  onResize: (size: WindowSize) => void;
}

/** Keeps `value` between `min` and `max`. */
const clamp = (value: number, min: number, max: number) => Math.round(Math.max(min, Math.min(max, value)));

/**
 * Reads the window's current size and the biggest size that still fits on the
 * desktop (the space its parent leaves after padding).
 */
function measure(windowEl: HTMLElement | null): { size: WindowSize; max: WindowSize } | null {
  const parent = windowEl?.parentElement;
  if (!windowEl || !parent) return null;
  const style = getComputedStyle(parent);
  return {
    // offsetWidth/Height ignore the open animation's scaling, unlike getBoundingClientRect.
    size: { width: windowEl.offsetWidth, height: windowEl.offsetHeight },
    max: {
      width: parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      height: parent.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
    },
  };
}

export function ResizeHandles({ windowRef, onResize }: ResizeHandlesProps) {
  // A ref (not a plain variable) so the drag survives the re-renders the resizing itself causes.
  const drag = useRef<DragStart | null>(null);

  const startDrag = (edge: Edge) => (event: PointerEvent<HTMLElement>) => {
    const measured = measure(windowRef.current);
    if (!measured || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { edge, pointerX: event.clientX, pointerY: event.clientY, ...measured };
    event.preventDefault();
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start) return;
    // Which way each axis grows: +1 = dragging right/down grows it, -1 = left/up grows it, 0 = untouched.
    const directionX = start.edge.includes('e') ? 1 : start.edge.includes('w') ? -1 : 0;
    const directionY = start.edge.includes('s') ? 1 : start.edge.includes('n') ? -1 : 0;
    // The window stays centred, so each side moves by half the size change: double the pointer's travel.
    onResize({
      width: clamp(
        start.size.width + 2 * directionX * (event.clientX - start.pointerX),
        MIN_WINDOW_SIZE.width,
        start.max.width,
      ),
      height: clamp(
        start.size.height + 2 * directionY * (event.clientY - start.pointerY),
        MIN_WINDOW_SIZE.height,
        start.max.height,
      ),
    });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onGripKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const measured = measure(windowRef.current);
    if (!measured) return;
    const change = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[event.key];
    if (!change) return;
    event.preventDefault();
    onResize({
      width: clamp(measured.size.width + change[0] * KEYBOARD_STEP, MIN_WINDOW_SIZE.width, measured.max.width),
      height: clamp(measured.size.height + change[1] * KEYBOARD_STEP, MIN_WINDOW_SIZE.height, measured.max.height),
    });
  };

  const pointerProps = (edge: Edge) => ({
    onPointerDown: startDrag(edge),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  });

  return (
    <>
      {EDGES.map((edge) =>
        edge === 'se' ? (
          <button
            key={edge}
            type="button"
            className="resize resize--se"
            aria-label="Resize window (arrow keys)"
            onKeyDown={onGripKeyDown}
            {...pointerProps(edge)}
          >
            <PixelSprite sprite={GRIP} scale={0.75} />
          </button>
        ) : (
          <div key={edge} className={`resize resize--${edge}`} aria-hidden="true" {...pointerProps(edge)} />
        ),
      )}
    </>
  );
}
