/**
 * BrowserWindow: one retro browser window on the desktop.
 *
 * Layout, top to bottom:
 *   1. Title bar   - the tab strip plus the window controls (drag it to move the window)
 *   2. Toolbar     - back / forward / home buttons and the address bar
 *   3. Viewport    - the page for the selected tab
 *   4. Bottom strip - the frame's lower edge, with the resize grip
 *
 * What it shows (tabs, position, size, history) comes from the window manager
 * (`window` prop); all changes go back through `useDesktop()`. Tabs can be
 * dragged out into their own windows; see `src/state/tabDrag.ts`.
 */
import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { SITE } from '../../config/siteConfig';
import { getPage } from '../../pages';
import type { WindowModel } from '../../state/desktopReducer';
import { useDesktop } from '../../state/useDesktop';
import type { PageId } from '../../types';
import { ResizeHandles } from './ResizeHandles';
import { TabStrip } from './TabStrip';
import { Toolbar } from './Toolbar';
import { WindowControls } from './WindowControls';

interface BrowserWindowProps {
  /** The window to draw, from the window manager. */
  window: WindowModel;
}

export function BrowserWindow({ window: win }: BrowserWindowProps) {
  const desktop = useDesktop();
  const isActive = desktop.activeWindowId === win.id;

  const pages = win.tabs.map(getPage);
  const activePage = getPage(win.activeTab);
  const ActivePage = activePage.Page;

  // The CSS reads these variables to place and size the window (see `.window` in browser.css).
  const style = {
    '--x': `${win.rect.x}px`,
    '--y': `${win.rect.y}px`,
    '--w': `${win.rect.width}px`,
    '--h': `${win.rect.height}px`,
    '--z': win.z,
  } as CSSProperties;

  /** Dragging the empty part of the title bar moves the window. */
  const onTitlebarPointerDown = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return; // tabs and buttons handle themselves
    desktop.beginWindowDrag(event, win.id);
  };

  /** Double-clicking the empty part of the title bar maximises or restores the window. */
  const onTitlebarDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    desktop.toggleMaximize(win.id);
  };

  /** A window with several tabs drags the tab out; a window with one tab just moves. */
  const onTabPointerDown = (event: PointerEvent<HTMLElement>, page: PageId) => {
    if (win.tabs.length > 1) desktop.beginTabDrag(event, win.id, page);
    else desktop.beginWindowDrag(event, win.id);
  };

  return (
    <section
      className={`window${win.maximized ? ' window--maximized' : ''}${isActive ? '' : ' window--inactive'}`}
      style={style}
      hidden={win.minimized}
      aria-label={`${activePage.title} window`}
      // Clicking anywhere in a window brings it to the front.
      onPointerDownCapture={() => desktop.focusWindow(win.id)}
    >
      <header
        className="window__titlebar"
        data-window-id={win.id}
        onPointerDown={onTitlebarPointerDown}
        onDoubleClick={onTitlebarDoubleClick}
      >
        <TabStrip
          tabs={pages}
          activeId={win.activeTab}
          onSelect={(page) => desktop.selectTab(win.id, page)}
          onTabPointerDown={onTabPointerDown}
        />
        <WindowControls
          maximized={win.maximized}
          onMinimize={() => desktop.minimizeWindow(win.id)}
          onToggleMaximize={() => desktop.toggleMaximize(win.id)}
          onClose={() => desktop.closeWindow(win.id)}
        />
      </header>

      <Toolbar
        address={`${SITE.addressPrefix}${activePage.path}`}
        canGoBack={win.cursor > 0}
        canGoForward={win.cursor < win.history.length - 1}
        onBack={() => desktop.back(win.id)}
        onForward={() => desktop.forward(win.id)}
        onHome={() => desktop.selectTab(win.id, win.tabs[0])}
      />

      <main className="window__viewport">
        {/* `key` restarts the page's entrance animation every time the tab changes. */}
        <div className="page-transition" key={win.activeTab}>
          <ActivePage />
        </div>
      </main>

      <footer className="window__statusbar" />

      {/* A maximised window already fills the desktop, so there is nothing to resize. */}
      {!win.maximized && <ResizeHandles rect={win.rect} onResize={(rect) => desktop.setRect(win.id, rect)} />}
    </section>
  );
}
