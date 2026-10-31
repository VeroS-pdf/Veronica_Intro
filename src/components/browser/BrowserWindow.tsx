/**
 * BrowserWindow: the retro browser that holds the whole site.
 *
 * Layout, top to bottom:
 *   1. Title bar   - the tab strip plus the window controls
 *   2. Toolbar     - back / forward / home buttons and the address bar
 *   3. Viewport    - the page for the selected tab
 *   4. Bottom strip - the frame's lower edge, with the resize grip
 *
 * Before the visitor "enters", only the welcome tab exists. Clicking the
 * welcome text calls `enter()`, which reveals the rest of the tabs from `TABS`.
 *
 * The visitor can drag the window's edges or corners to resize it. The chosen
 * size is kept while the window is minimised or maximised and restored after.
 */
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { SITE } from '../../config/siteConfig';
import { useBrowserNavigation } from '../../hooks/useBrowserNavigation';
import { HOME_TAB_ID, TABS } from '../../tabs';
import { ResizeHandles } from './ResizeHandles';
import type { WindowSize } from './ResizeHandles';
import { TabStrip } from './TabStrip';
import { Toolbar } from './Toolbar';
import { WindowControls } from './WindowControls';

interface BrowserWindowProps {
  /** Whether the window fills the whole desktop instead of floating in the middle. */
  maximized: boolean;
  /** Hide the window but keep its state (used when minimised to the taskbar). */
  hidden: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function BrowserWindow({ maximized, hidden, onMinimize, onToggleMaximize, onClose }: BrowserWindowProps) {
  const nav = useBrowserNavigation();
  const windowRef = useRef<HTMLElement>(null);
  /** The size chosen by dragging, or `null` to use the default size from CSS. */
  const [size, setSize] = useState<WindowSize | null>(null);

  // Only the welcome tab is visible until the visitor clicks the welcome text.
  const visibleTabs = nav.entered ? TABS : TABS.filter((tab) => tab.id === HOME_TAB_ID);
  const activeTab = TABS.find((tab) => tab.id === nav.currentTabId) ?? TABS[0];
  const ActivePage = activeTab.Page;

  // The CSS reads these variables to size the window (see `.window` in browser.css).
  const sizeStyle = size
    ? ({ '--window-width': `${size.width}px`, '--window-height': `${size.height}px` } as CSSProperties)
    : undefined;

  return (
    <section
      ref={windowRef}
      className={`window${maximized ? ' window--maximized' : ''}`}
      style={sizeStyle}
      hidden={hidden}
      aria-label={`${SITE.browserName} window`}
    >
      <header className="window__titlebar">
        <TabStrip tabs={visibleTabs} activeId={activeTab.id} onSelect={nav.navigate} />
        <WindowControls
          maximized={maximized}
          onMinimize={onMinimize}
          onToggleMaximize={onToggleMaximize}
          onClose={onClose}
        />
      </header>

      <Toolbar
        address={`${SITE.addressPrefix}${activeTab.path}`}
        canGoBack={nav.canGoBack}
        canGoForward={nav.canGoForward}
        onBack={nav.back}
        onForward={nav.forward}
        onHome={() => nav.navigate(HOME_TAB_ID)}
      />

      <main className="window__viewport">
        {/* `key` restarts the page's entrance animation every time the tab changes. */}
        <div className="page-transition" key={activeTab.id}>
          <ActivePage entered={nav.entered} onEnter={nav.enter} />
        </div>
      </main>

      <footer className="window__statusbar" />

      {/* A maximised window already fills the desktop, so there is nothing to resize. */}
      {!maximized && <ResizeHandles windowRef={windowRef} onResize={setSize} />}
    </section>
  );
}
