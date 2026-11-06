/**
 * Dragging a browser tab around, like in a real browser.
 *
 *  - Drop it on any window's tab strip: the tab joins that window at that spot
 *    (this also reorders tabs inside the same window).
 *  - Drop it anywhere else: the tab is pulled out into its own new window,
 *    placed where you let go.
 *  - Press Escape to cancel.
 *
 * While dragging, a floating label follows the pointer, plus a dashed outline
 * of the new window when letting go would create one. The drag only starts
 * after the pointer has moved a few pixels, so ordinary clicks still select tabs.
 */
import type { PageId, Point, Rect, Size } from '../types';
import { detachedRect } from './desktopReducer';

/** What the floating drag preview should show. */
export interface TabGhost {
  /** Text on the floating label. */
  title: string;
  /** Pointer position on the screen. */
  x: number;
  y: number;
  /** Dashed outline of the window that would be created (screen coordinates), or `null`. */
  outline: Rect | null;
}

/** What the drag needs from the rest of the app. */
interface TabDragDeps {
  /** Screen position of the desktop area's top-left corner. */
  getWorkspaceOrigin: () => Point;
  /** Size of the desktop area. */
  getBounds: () => Size;
  /** Called when the tab is dropped on a tab strip. */
  moveTab: (page: PageId, toWindow: string, index: number) => void;
  /** Called when the tab is dropped on the desktop. `at` is relative to the desktop area. */
  detachTab: (page: PageId, at: Point) => void;
  /** Shows (or with `null`, hides) the floating preview. */
  setGhost: (ghost: TabGhost | null) => void;
}

/** How far the pointer must move before a press becomes a drag. */
const DRAG_THRESHOLD = 6;
/** Extra room around a window's own title bar where letting go does NOT pull the tab out. */
const OWN_STRIP_MARGIN = 24;

/** Where a dragged tab would go if released now. */
type DropTarget = { kind: 'strip'; windowId: string; index: number } | { kind: 'desktop' };

/**
 * Works out which tab position the pointer is over in a window's title bar.
 *
 * @param titlebar The `.window__titlebar` element.
 * @param clientX Pointer's horizontal position.
 * @param dragged The tab being dragged (ignored, so it doesn't count itself).
 */
export function insertionIndex(titlebar: HTMLElement, clientX: number, dragged: PageId): number {
  const tabs = [...titlebar.querySelectorAll<HTMLElement>('.tab')].filter((tab) => tab.dataset.page !== dragged);
  return tabs.filter((tab) => {
    const box = tab.getBoundingClientRect();
    return clientX > box.left + box.width / 2;
  }).length;
}

/**
 * Starts a tab drag. Call it when the mouse goes down on a tab.
 *
 * @param pointer The pointer event that pressed the tab.
 * @param tabElement The tab that was pressed (dimmed while dragging).
 * @param windowId Window the tab currently lives in.
 * @param page The page the tab shows.
 * @param title The tab's text, shown on the floating label.
 */
export function startTabDrag(
  pointer: { clientX: number; clientY: number; pointerId: number },
  tabElement: HTMLElement,
  windowId: string,
  page: PageId,
  title: string,
  deps: TabDragDeps,
): void {
  const startX = pointer.clientX;
  const startY = pointer.clientY;
  let dragging = false;

  // Touch pointers are "captured" by the pressed element, which would stop us seeing what's under the finger.
  try {
    tabElement.releasePointerCapture(pointer.pointerId);
  } catch {
    // Nothing was captured; that's fine.
  }

  /** Finds what is under the pointer and decides where the tab would go. */
  const findTarget = (x: number, y: number): DropTarget => {
    const bar = document.elementFromPoint(x, y)?.closest<HTMLElement>('.window__titlebar');
    if (bar?.dataset.windowId) {
      return { kind: 'strip', windowId: bar.dataset.windowId, index: insertionIndex(bar, x, page) };
    }
    // Forgiving zone around the tab's own window, so a sloppy sideways drag doesn't tear the tab off.
    const own = document.querySelector<HTMLElement>(`.window__titlebar[data-window-id="${windowId}"]`);
    if (own) {
      const box = own.getBoundingClientRect();
      const near =
        x >= box.left - OWN_STRIP_MARGIN &&
        x <= box.right + OWN_STRIP_MARGIN &&
        y >= box.top - OWN_STRIP_MARGIN &&
        y <= box.bottom + OWN_STRIP_MARGIN;
      if (near) return { kind: 'strip', windowId, index: insertionIndex(own, x, page) };
    }
    return { kind: 'desktop' };
  };

  /** The pointer position relative to the desktop area. */
  const relativeToWorkspace = (x: number, y: number): Point => {
    const origin = deps.getWorkspaceOrigin();
    return { x: x - origin.x, y: y - origin.y };
  };

  const onMove = (event: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) < DRAG_THRESHOLD) return;
      dragging = true;
      tabElement.classList.add('tab--dragging');
      document.body.classList.add('is-dragging-tab');
    }

    const target = findTarget(event.clientX, event.clientY);
    let outline: Rect | null = null;
    if (target.kind === 'desktop') {
      const origin = deps.getWorkspaceOrigin();
      const landing = detachedRect(relativeToWorkspace(event.clientX, event.clientY), deps.getBounds());
      outline = { ...landing, x: landing.x + origin.x, y: landing.y + origin.y };
    }
    deps.setGhost({ title, x: event.clientX, y: event.clientY, outline });
  };

  /** Removes everything this drag added to the page. */
  const cleanup = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    document.removeEventListener('keydown', onKeyDown);
    tabElement.classList.remove('tab--dragging');
    document.body.classList.remove('is-dragging-tab');
    deps.setGhost(null);
  };

  /** After a real drag the browser still sends a "click"; swallow it so the tab isn't also selected. */
  const swallowNextClick = () => {
    const swallow = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    document.addEventListener('click', swallow, { capture: true, once: true });
    window.setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 0);
  };

  const onUp = (event: PointerEvent) => {
    cleanup();
    if (!dragging) return; // it was just a click
    swallowNextClick();
    const target = findTarget(event.clientX, event.clientY);
    if (target.kind === 'strip') {
      deps.moveTab(page, target.windowId, target.index);
    } else {
      deps.detachTab(page, relativeToWorkspace(event.clientX, event.clientY));
    }
  };

  const onCancel = () => {
    cleanup();
    if (dragging) swallowNextClick();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onCancel();
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onCancel);
  document.addEventListener('keydown', onKeyDown);
}
