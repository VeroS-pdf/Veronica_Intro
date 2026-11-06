/**
 * ResizeHandles: invisible grab areas around a window's edges and corners,
 * plus a dotted grip in the bottom-right corner.
 *
 * Drag an edge or corner to resize; the opposite edge stays where it is, like
 * any desktop window. A window can't be dragged smaller than `MIN_WINDOW_SIZE`
 * or out past the edges of the desktop. The grip can also be focused and moved
 * with the arrow keys.
 */
import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { GRIP } from '../../art/sprites';
import { MIN_WINDOW_SIZE } from '../../state/desktopReducer';
import { useDesktop } from '../../state/useDesktop';
import type { Rect, Size } from '../../types';
import { PixelSprite } from '../PixelSprite';

/** How far each arrow-key press changes the size, in screen pixels. */
const KEYBOARD_STEP = 32;

type Edge = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';
const EDGES: readonly Edge[] = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];

/** What we remember about the mouse and window when a drag starts. */
interface DragStart {
  edge: Edge;
  pointerX: number;
  pointerY: number;
  rect: Rect;
  bounds: Size;
}

interface ResizeHandlesProps {
  /** The window's current position and size. */
  rect: Rect;
  /** Called with the new position and size while the visitor drags or presses arrow keys. */
  onResize: (rect: Rect) => void;
}

/** Keeps `value` between `min` and `max`. */
const clamp = (value: number, min: number, max: number) => Math.round(Math.min(max, Math.max(min, value)));

/**
 * Works out a window's new rectangle while an edge or corner is dragged.
 *
 * @param start The drag's starting state.
 * @param dx How far the pointer has moved horizontally since the drag began.
 * @param dy How far the pointer has moved vertically since the drag began.
 */
function resizedRect(start: DragStart, dx: number, dy: number): Rect {
  const { edge, rect, bounds } = start;
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;

  // The edge being dragged follows the pointer; the opposite edge stays put.
  // A window that already pokes past the desktop edge is allowed to stay that way.
  if (edge.includes('e')) right = clamp(right + dx, left + MIN_WINDOW_SIZE.width, Math.max(bounds.width, right));
  if (edge.includes('w')) left = clamp(left + dx, Math.min(0, left), right - MIN_WINDOW_SIZE.width);
  if (edge.includes('s')) bottom = clamp(bottom + dy, top + MIN_WINDOW_SIZE.height, Math.max(bounds.height, bottom));
  if (edge.includes('n')) top = clamp(top + dy, Math.min(0, top), bottom - MIN_WINDOW_SIZE.height);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function ResizeHandles({ rect, onResize }: ResizeHandlesProps) {
  const { getBounds } = useDesktop();
  // A ref (not a plain variable) so the drag survives the re-renders the resizing itself causes.
  const drag = useRef<DragStart | null>(null);

  const startDrag = (edge: Edge) => (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { edge, pointerX: event.clientX, pointerY: event.clientY, rect, bounds: getBounds() };
    event.preventDefault();
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start) return;
    onResize(resizedRect(start, event.clientX - start.pointerX, event.clientY - start.pointerY));
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onGripKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const change = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[event.key];
    if (!change) return;
    event.preventDefault();
    const bounds = getBounds();
    onResize({
      ...rect,
      width: clamp(rect.width + change[0] * KEYBOARD_STEP, MIN_WINDOW_SIZE.width, Math.max(rect.width, bounds.width - rect.x)),
      height: clamp(rect.height + change[1] * KEYBOARD_STEP, MIN_WINDOW_SIZE.height, Math.max(rect.height, bounds.height - rect.y)),
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
