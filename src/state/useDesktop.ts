/**
 * useDesktop: the way components talk to the window manager.
 *
 * `DesktopProvider` (in `DesktopProvider.tsx`) owns the list of open windows
 * and puts these functions on a React context. Any component inside it calls
 * `useDesktop()` to open apps, move windows and so on, so nothing has to pass
 * props down through many layers.
 *
 * (The hook lives in its own file so the dev server can hot-reload
 * `DesktopProvider.tsx` without breaking the context.)
 */
import { createContext, useContext } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { AppDefinition, PageId, Rect, Size } from '../types';
import type { WindowModel } from './desktopReducer';

/** Everything components can ask the window manager to do. */
export interface DesktopApi {
  /** All open windows (including minimised ones). */
  windows: readonly WindowModel[];
  /** Id of the window in front, or `null`. */
  activeWindowId: string | null;
  /** Attach this to the element that windows are positioned inside. */
  workspaceRef: RefObject<HTMLDivElement | null>;
  /** Size of the area windows can use (the screen above the taskbar). */
  getBounds: () => Size;
  openApp: (app: AppDefinition) => void;
  focusWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  /** Closes one tab of a window (the whole window if it was the last tab). */
  closeTab: (id: string, page: PageId) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setRect: (id: string, rect: Rect) => void;
  selectTab: (id: string, page: PageId) => void;
  back: (id: string) => void;
  forward: (id: string) => void;
  /** Call when the mouse goes down on a tab of a window that has several tabs. */
  beginTabDrag: (event: ReactPointerEvent<HTMLElement>, windowId: string, page: PageId) => void;
  /** Call when the mouse goes down on a window's title bar (or the only tab of a window). */
  beginWindowDrag: (event: ReactPointerEvent<HTMLElement>, windowId: string) => void;
}

export const DesktopContext = createContext<DesktopApi | null>(null);

/** Gives a component access to the window manager. */
export function useDesktop(): DesktopApi {
  const api = useContext(DesktopContext);
  if (!api) throw new Error('useDesktop must be used inside <DesktopProvider>');
  return api;
}
