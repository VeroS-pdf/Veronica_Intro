/**
 * Moving a window by dragging its title bar.
 *
 * `startWindowDrag` is called when the mouse goes down on the title bar (or on
 * the only tab of a one-tab window). It listens on the whole page, so the drag
 * keeps working even if the pointer moves faster than the window, until the
 * mouse is released.
 *
 * A window with a single tab can also be dropped onto another window's tab
 * strip: its tab joins that window, like putting a browser tab back. While
 * hovering over such a strip, the strip is outlined.
 */
import type { PageId, Rect, Size } from '../types';
import { clampRect } from './desktopReducer';
import { insertionIndex } from './tabDrag';

/** What the drag needs from the rest of the app. */
interface WindowDragDeps {
  /** Current size of the desktop area, so the window can be kept on screen. */
  getBounds: () => Size;
  /** Called with the window's new position as it moves. */
  setRect: (rect: Rect) => void;
  /** The window being dragged, so it can be made click-through while it moves. */
  windowElement: HTMLElement | null;
  /** Provide this for a one-tab window to allow dropping its tab onto another window. */
  merge?: {
    page: PageId;
    moveTab: (page: PageId, toWindow: string, index: number) => void;
  };
}

/** CSS class that outlines the tab strip a dragged window would join. */
const DROP_TARGET_CLASS = 'window__titlebar--drop-target';

/**
 * Starts dragging a window.
 *
 * @param pointer Where the mouse was when the drag started.
 * @param startRect The window's position and size at that moment.
 */
export function startWindowDrag(pointer: { clientX: number; clientY: number }, startRect: Rect, deps: WindowDragDeps): void {
  document.body.classList.add('is-moving-window');
  // While it moves, the dragged window must not block the mouse from seeing what is beneath it.
  if (deps.merge && deps.windowElement) deps.windowElement.style.pointerEvents = 'none';

  let dropTarget: HTMLElement | null = null;

  /** Outlines the tab strip under the pointer (if any) as the place the tab would go. */
  const updateDropTarget = (x: number, y: number) => {
    const next = deps.merge ? (document.elementFromPoint(x, y)?.closest<HTMLElement>('.window__titlebar') ?? null) : null;
    if (next === dropTarget) return;
    dropTarget?.classList.remove(DROP_TARGET_CLASS);
    next?.classList.add(DROP_TARGET_CLASS);
    dropTarget = next;
  };

  const onMove = (event: PointerEvent) => {
    deps.setRect(
      clampRect(
        {
          ...startRect,
          x: startRect.x + event.clientX - pointer.clientX,
          y: startRect.y + event.clientY - pointer.clientY,
        },
        deps.getBounds(),
      ),
    );
    updateDropTarget(event.clientX, event.clientY);
  };

  const onUp = (event: PointerEvent) => {
    const targetId = dropTarget?.dataset.windowId;
    if (deps.merge && dropTarget && targetId) {
      deps.merge.moveTab(deps.merge.page, targetId, insertionIndex(dropTarget, event.clientX, deps.merge.page));
    }
    stop();
  };

  const stop = () => {
    dropTarget?.classList.remove(DROP_TARGET_CLASS);
    document.body.classList.remove('is-moving-window');
    if (deps.windowElement) deps.windowElement.style.pointerEvents = '';
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', stop);
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', stop);
}
