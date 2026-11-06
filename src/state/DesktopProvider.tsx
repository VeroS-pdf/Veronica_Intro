/**
 * DesktopProvider: owns the window manager.
 *
 * It keeps the list of open windows (using the reducer in `desktopReducer.ts`)
 * and shares simple functions such as `openApp`, `closeWindow` or
 * `beginTabDrag` with every component through `useDesktop()`
 * (see `useDesktop.ts`).
 */
import { useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { TabDragGhost } from '../components/TabDragGhost';
import type { GhostSetter } from '../components/TabDragGhost';
import { getPage } from '../pages';
import type { Size } from '../types';
import { INITIAL_DESKTOP_STATE, desktopReducer, getActiveWindowId } from './desktopReducer';
import { startTabDrag } from './tabDrag';
import { isPhoneLayout } from './viewport';
import { DesktopContext } from './useDesktop';
import type { DesktopApi } from './useDesktop';
import { startWindowDrag } from './windowDrag';

export function DesktopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(desktopReducer, INITIAL_DESKTOP_STATE);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const ghostSetter = useRef<GhostSetter | null>(null);

  // Drag handlers run long after the render that created them, so they read the newest state from here.
  const latest = useRef(state);
  latest.current = state;

  const api = useMemo<DesktopApi>(() => {
    const getBounds = (): Size => {
      const element = workspaceRef.current;
      return element
        ? { width: element.clientWidth, height: element.clientHeight }
        : { width: window.innerWidth, height: window.innerHeight };
    };

    const findWindow = (id: string) => latest.current.windows.find((win) => win.id === id);

    return {
      windows: state.windows,
      activeWindowId: getActiveWindowId(state),
      workspaceRef,
      getBounds,
      openApp: (app) => dispatch({ type: 'open', pages: app.pages, bounds: getBounds() }),
      focusWindow: (id) => dispatch({ type: 'focus', id }),
      closeWindow: (id) => dispatch({ type: 'close', id }),
      closeTab: (id, page) => dispatch({ type: 'closeTab', id, page }),
      minimizeWindow: (id) => dispatch({ type: 'minimize', id }),
      toggleMaximize: (id) => dispatch({ type: 'toggleMaximize', id }),
      setRect: (id, rect) => dispatch({ type: 'setRect', id, rect }),
      selectTab: (id, page) => dispatch({ type: 'selectTab', id, page }),
      back: (id) => dispatch({ type: 'back', id }),
      forward: (id) => dispatch({ type: 'forward', id }),

      beginTabDrag: (event, windowId, page) => {
        const win = findWindow(windowId);
        if (event.button !== 0 || !win || isPhoneLayout()) return;
        startTabDrag(event, event.currentTarget, windowId, page, getPage(page).title, {
          getWorkspaceOrigin: () => {
            const box = workspaceRef.current?.getBoundingClientRect();
            return { x: box?.left ?? 0, y: box?.top ?? 0 };
          },
          getBounds,
          moveTab: (movedPage, toWindow, index) => dispatch({ type: 'moveTab', page: movedPage, toWindow, index }),
          detachTab: (detachedPage, at) =>
            dispatch({ type: 'detachTab', page: detachedPage, at, bounds: getBounds() }),
          setGhost: (ghost) => ghostSetter.current?.(ghost),
        });
      },

      beginWindowDrag: (event, windowId) => {
        const win = findWindow(windowId);
        if (event.button !== 0 || !win || win.maximized || isPhoneLayout()) return;
        startWindowDrag(event, win.rect, {
          getBounds,
          setRect: (rect) => dispatch({ type: 'setRect', id: windowId, rect }),
          windowElement: document
            .querySelector<HTMLElement>(`.window__titlebar[data-window-id="${windowId}"]`)
            ?.closest<HTMLElement>('.window') ?? null,
          // A one-tab window can be dropped onto another window's tab strip to join it.
          merge:
            win.tabs.length === 1
              ? {
                  page: win.tabs[0],
                  moveTab: (page, toWindow, index) => dispatch({ type: 'moveTab', page, toWindow, index }),
                }
              : undefined,
        });
      },
    };
  }, [state]);

  return (
    <DesktopContext.Provider value={api}>
      {children}
      <TabDragGhost setterRef={ghostSetter} />
    </DesktopContext.Provider>
  );
}
