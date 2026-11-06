/**
 * The window manager's brain: a pure function that describes how the set of
 * open windows changes in response to actions (open, close, move, drag a tab
 * out, ...). It has no React or DOM code in it, so it is easy to read and test.
 *
 * Rules worth knowing:
 *  - Each page lives in exactly one window at a time.
 *  - A window with no tabs left disappears.
 *  - Windows are stacked by `z`: the highest number is in front.
 *  - All positions are in pixels, measured from the top-left of the desktop
 *    area (the screen above the taskbar).
 */
import type { PageId, Point, Rect, Size } from '../types';

/** Smallest a window may be, in screen pixels. */
export const MIN_WINDOW_SIZE: Size = { width: 360, height: 300 };
/** Size of a window opened from an app icon (shrunk to fit small screens). */
const DEFAULT_WINDOW_SIZE: Size = { width: 880, height: 600 };
/** Size of a window created by dragging a tab out of another window. */
const DETACHED_WINDOW_SIZE: Size = { width: 620, height: 460 };
/** Gap kept between a new window and the screen edge. */
const SCREEN_MARGIN = 48;
/** How much of a window must stay on screen, so it can always be grabbed again. */
const GRAB_MARGIN = 120;
/** Height of the title bar area that must stay on screen. */
const GRAB_HEIGHT = 56;
/** How far each new window is offset from the previous one. */
const CASCADE_STEP = 32;

/** Everything the window manager knows about one browser window. */
export interface WindowModel {
  id: string;
  /** Pages shown as tabs, left to right. */
  tabs: PageId[];
  /** The tab whose page is showing. */
  activeTab: PageId;
  /** Tabs visited in this window, for the back and forward buttons. */
  history: PageId[];
  /** Index into `history` of the page currently showing. */
  cursor: number;
  /** Position and size while not maximised. */
  rect: Rect;
  /** Stacking order: the highest `z` is the window in front. */
  z: number;
  minimized: boolean;
  maximized: boolean;
}

/** The whole desktop: every open window. */
export interface DesktopState {
  windows: WindowModel[];
  /** How many windows have ever been created; used to give each a unique id. */
  windowCount: number;
  /** The highest `z` handed out so far. */
  topZ: number;
}

export const INITIAL_DESKTOP_STATE: DesktopState = { windows: [], windowCount: 0, topZ: 0 };

export type DesktopAction =
  /** Open an app's pages, or bring forward the window that already holds the main page. */
  | { type: 'open'; pages: readonly PageId[]; bounds: Size }
  | { type: 'focus'; id: string }
  | { type: 'close'; id: string }
  | { type: 'minimize'; id: string }
  | { type: 'toggleMaximize'; id: string }
  | { type: 'setRect'; id: string; rect: Rect }
  | { type: 'selectTab'; id: string; page: PageId }
  | { type: 'back'; id: string }
  | { type: 'forward'; id: string }
  /** Move a tab to a window (a different one, or the same one to reorder) at a tab position. */
  | { type: 'moveTab'; page: PageId; toWindow: string; index: number }
  /** Pull a tab out into a brand new window, centred horizontally on `at`. */
  | { type: 'detachTab'; page: PageId; at: Point; bounds: Size };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Keeps a window a sensible size and keeps part of its title bar on screen.
 *
 * @param rect The wanted position and size.
 * @param bounds Size of the desktop area.
 */
export function clampRect(rect: Rect, bounds: Size): Rect {
  const width = Math.min(bounds.width, Math.max(MIN_WINDOW_SIZE.width, rect.width));
  const height = Math.min(bounds.height, Math.max(MIN_WINDOW_SIZE.height, rect.height));
  return {
    width: Math.round(width),
    height: Math.round(height),
    x: Math.round(clamp(rect.x, GRAB_MARGIN - width, bounds.width - GRAB_MARGIN)),
    y: Math.round(clamp(rect.y, 0, bounds.height - GRAB_HEIGHT)),
  };
}

/** Where a window opened from an app icon goes: centred, then cascaded down and right. */
function openRect(bounds: Size, openWindowCount: number): Rect {
  const width = Math.min(DEFAULT_WINDOW_SIZE.width, bounds.width - SCREEN_MARGIN);
  const height = Math.min(DEFAULT_WINDOW_SIZE.height, bounds.height - SCREEN_MARGIN);
  const offset = (openWindowCount % 5) * CASCADE_STEP;
  return clampRect(
    { width, height, x: (bounds.width - width) / 2 + offset, y: (bounds.height - height) / 2 + offset },
    bounds,
  );
}

/**
 * Where the window created by dragging a tab out would land: its title bar
 * sits under the pointer. Also used to draw the dashed preview while dragging.
 *
 * @param at The pointer position, relative to the desktop area.
 * @param bounds Size of the desktop area.
 */
export function detachedRect(at: Point, bounds: Size): Rect {
  const width = Math.min(DETACHED_WINDOW_SIZE.width, bounds.width - SCREEN_MARGIN);
  const height = Math.min(DETACHED_WINDOW_SIZE.height, bounds.height - SCREEN_MARGIN);
  // Keep the whole window on screen, even when dropped near an edge.
  return clampRect(
    {
      width,
      height,
      x: clamp(at.x - width / 2, 0, bounds.width - width),
      y: clamp(at.y - 24, 0, bounds.height - height),
    },
    bounds,
  );
}

/** Returns the state with window `id` in front (and un-minimised). */
function raise(state: DesktopState, id: string): DesktopState {
  const target = state.windows.find((win) => win.id === id);
  if (!target) return state;
  if (target.z === state.topZ && !target.minimized) return state; // already in front
  const z = state.topZ + 1;
  return {
    ...state,
    topZ: z,
    windows: state.windows.map((win) => (win.id === id ? { ...win, z, minimized: false } : win)),
  };
}

/** Applies `change` to one window. */
function updateWindow(state: DesktopState, id: string, change: (win: WindowModel) => WindowModel): DesktopState {
  return { ...state, windows: state.windows.map((win) => (win.id === id ? change(win) : win)) };
}

/** Makes `page` the showing tab and adds it to the back/forward history. */
function showPage(win: WindowModel, page: PageId): WindowModel {
  if (win.activeTab === page) return win;
  const history = [...win.history.slice(0, win.cursor + 1), page];
  return { ...win, activeTab: page, history, cursor: history.length - 1 };
}

/** Forgets the back/forward history after tabs were added or removed. */
function withFreshHistory(win: WindowModel): WindowModel {
  return { ...win, history: [win.activeTab], cursor: 0 };
}

/** Puts `item` into `list` at `index` (clamped to the list's length). */
function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  const at = clamp(index, 0, list.length);
  return [...list.slice(0, at), item, ...list.slice(at)];
}

/**
 * Takes `page` out of its window. The window disappears if it was the last
 * tab; otherwise a neighbouring tab becomes the showing one if needed.
 */
function removePage(state: DesktopState, page: PageId): DesktopState {
  const windows = state.windows.flatMap((win) => {
    const position = win.tabs.indexOf(page);
    if (position === -1) return [win];
    const tabs = win.tabs.filter((tab) => tab !== page);
    if (tabs.length === 0) return [];
    const activeTab = win.activeTab === page ? tabs[Math.min(position, tabs.length - 1)] : win.activeTab;
    return [withFreshHistory({ ...win, tabs, activeTab })];
  });
  return { ...state, windows };
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case 'open': {
      const mainPage = action.pages[0];
      const owner = state.windows.find((win) => win.tabs.includes(mainPage));
      if (owner) {
        // Already open somewhere: just bring that window forward and show the page.
        return updateWindow(raise(state, owner.id), owner.id, (win) => showPage(win, mainPage));
      }
      // Some of the app's other pages may already live in other windows; only open the missing ones.
      const taken = new Set(state.windows.flatMap((win) => win.tabs));
      const tabs = action.pages.filter((page) => !taken.has(page));
      const z = state.topZ + 1;
      const created: WindowModel = {
        id: `window-${state.windowCount + 1}`,
        tabs,
        activeTab: mainPage,
        history: [mainPage],
        cursor: 0,
        rect: openRect(action.bounds, state.windows.length),
        z,
        minimized: false,
        maximized: false,
      };
      return { windows: [...state.windows, created], windowCount: state.windowCount + 1, topZ: z };
    }

    case 'focus':
      return raise(state, action.id);

    case 'close':
      return { ...state, windows: state.windows.filter((win) => win.id !== action.id) };

    case 'minimize':
      return updateWindow(state, action.id, (win) => ({ ...win, minimized: true }));

    case 'toggleMaximize':
      return raise(
        updateWindow(state, action.id, (win) => ({ ...win, maximized: !win.maximized })),
        action.id,
      );

    case 'setRect':
      return updateWindow(state, action.id, (win) => ({ ...win, rect: action.rect }));

    case 'selectTab':
      return updateWindow(state, action.id, (win) => (win.tabs.includes(action.page) ? showPage(win, action.page) : win));

    case 'back':
      return updateWindow(state, action.id, (win) =>
        win.cursor > 0 ? { ...win, cursor: win.cursor - 1, activeTab: win.history[win.cursor - 1] } : win,
      );

    case 'forward':
      return updateWindow(state, action.id, (win) =>
        win.cursor < win.history.length - 1
          ? { ...win, cursor: win.cursor + 1, activeTab: win.history[win.cursor + 1] }
          : win,
      );

    case 'moveTab': {
      const source = state.windows.find((win) => win.tabs.includes(action.page));
      const destination = state.windows.find((win) => win.id === action.toWindow);
      if (!source || !destination) return state;

      if (source.id === destination.id) {
        // Same window: reorder the tabs.
        const others = source.tabs.filter((tab) => tab !== action.page);
        return raise(
          updateWindow(state, source.id, (win) => ({ ...win, tabs: insertAt(others, action.index, action.page) })),
          source.id,
        );
      }

      // Different window: take the tab out of its old window and drop it into the new one.
      const without = removePage(state, action.page);
      const moved = updateWindow(without, destination.id, (win) =>
        withFreshHistory({
          ...win,
          tabs: insertAt(win.tabs, action.index, action.page),
          activeTab: action.page,
        }),
      );
      return raise(moved, destination.id);
    }

    case 'detachTab': {
      const source = state.windows.find((win) => win.tabs.includes(action.page));
      if (!source || source.tabs.length < 2) return state; // a lone tab already has its own window
      const z = state.topZ + 1;
      const created: WindowModel = {
        id: `window-${state.windowCount + 1}`,
        tabs: [action.page],
        activeTab: action.page,
        history: [action.page],
        cursor: 0,
        rect: detachedRect(action.at, action.bounds),
        z,
        minimized: false,
        maximized: false,
      };
      const without = removePage(state, action.page);
      return { windows: [...without.windows, created], windowCount: state.windowCount + 1, topZ: z };
    }
  }
}

/** Id of the window in front (the highest `z` that isn't minimised), or `null` if none. */
export function getActiveWindowId(state: DesktopState): string | null {
  const visible = state.windows.filter((win) => !win.minimized);
  if (visible.length === 0) return null;
  return visible.reduce((front, win) => (win.z > front.z ? win : front)).id;
}
