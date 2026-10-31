/**
 * Desktop: the computer "home screen" that fills the whole page.
 *
 * It stacks, from back to front:
 *   wallpaper -> scanline overlay -> desktop icon -> browser window -> taskbar
 *
 * This component also owns the window's state (open / minimised / closed /
 * maximised). The browser's own state (current tab, history) lives inside
 * `BrowserWindow`; closing the window unmounts it, so reopening starts fresh
 * on the welcome screen.
 */
import { useState } from 'react';
import { BROWSER_ICON } from '../art/sprites';
import { SITE } from '../config/siteConfig';
import { BrowserWindow } from './browser/BrowserWindow';
import { PixelLandscape } from './PixelLandscape';
import { PixelSprite } from './PixelSprite';
import { Taskbar } from './Taskbar';

/** Whether the browser window is showing, tucked into the taskbar, or gone. */
export type WindowState = 'open' | 'minimized' | 'closed';

export function Desktop() {
  const [windowState, setWindowState] = useState<WindowState>('open');
  const [maximized, setMaximized] = useState(false);
  /** Changing this key remounts the browser, replaying the welcome intro. */
  const [session, setSession] = useState(0);

  /** Shows the browser, restoring it if it was minimised. */
  const openBrowser = () => setWindowState('open');

  /** Resets the browser to the welcome screen with only one tab. */
  const replayIntro = () => {
    setSession((count) => count + 1);
    setMaximized(false);
    setWindowState('open');
  };

  return (
    <div className="desktop">
      <PixelLandscape />
      <div className="desktop__scanlines" aria-hidden="true" />

      <div className="desktop__icons">
        <button type="button" className="desktop-icon" onClick={openBrowser}>
          <PixelSprite sprite={BROWSER_ICON} scale={2} />
          <span>{SITE.browserName}</span>
        </button>
      </div>

      <div className={`workspace${maximized ? ' workspace--maximized' : ''}`}>
        {windowState !== 'closed' && (
          <BrowserWindow
            key={session}
            maximized={maximized}
            hidden={windowState === 'minimized'}
            onMinimize={() => setWindowState('minimized')}
            onToggleMaximize={() => setMaximized((value) => !value)}
            onClose={() => {
              setMaximized(false);
              setWindowState('closed');
            }}
          />
        )}
      </div>

      <Taskbar
        windowState={windowState}
        onToggleWindow={() => setWindowState((state) => (state === 'open' ? 'minimized' : 'open'))}
        onOpenBrowser={openBrowser}
        onReplayIntro={replayIntro}
      />
    </div>
  );
}
