/**
 * Taskbar: the strip along the bottom of the desktop.
 *
 * Contains a start button (which opens a tiny menu), a button for the browser
 * window while it is open or minimised, and a clock on the right.
 */
import { useEffect, useRef, useState } from 'react';
import { BROWSER_ICON, HEART } from '../art/sprites';
import { SITE } from '../config/siteConfig';
import { useClock } from '../hooks/useClock';
import type { WindowState } from './Desktop';
import { PixelSprite } from './PixelSprite';

interface TaskbarProps {
  windowState: WindowState;
  /** Minimise the window if it's showing, or bring it back if it's minimised. */
  onToggleWindow: () => void;
  /** Open the browser window (e.g. after it was closed). */
  onOpenBrowser: () => void;
  /** Reset the browser to the welcome screen. */
  onReplayIntro: () => void;
}

export function Taskbar({ windowState, onToggleWindow, onOpenBrowser, onReplayIntro }: TaskbarProps) {
  const clock = useClock();
  const [menuOpen, setMenuOpen] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);

  // While the start menu is open: clicking elsewhere or pressing Escape closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!startRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  /** Runs a menu action, then closes the menu. */
  const choose = (action: () => void) => () => {
    action();
    setMenuOpen(false);
  };

  return (
    <footer className="taskbar">
      <div className="start" ref={startRef}>
        {menuOpen && (
          <ul className="start-menu pixel-border" role="menu">
            <li role="none">
              <button type="button" role="menuitem" onClick={choose(onOpenBrowser)}>
                <PixelSprite sprite={BROWSER_ICON} scale={0.75} />
                Open {SITE.browserName}
              </button>
            </li>
            <li role="none">
              <button type="button" role="menuitem" onClick={choose(onReplayIntro)}>
                <PixelSprite sprite={HEART} scale={0.75} />
                Replay intro
              </button>
            </li>
          </ul>
        )}
        <button
          type="button"
          className="taskbar__button taskbar__start pixel-round"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <PixelSprite sprite={HEART} scale={0.75} />
          <span>start</span>
        </button>
      </div>

      {windowState !== 'closed' && (
        <button
          type="button"
          className={`taskbar__button taskbar__task pixel-round${windowState === 'open' ? ' taskbar__task--active' : ''}`}
          aria-pressed={windowState === 'open'}
          onClick={onToggleWindow}
        >
          <PixelSprite sprite={BROWSER_ICON} scale={0.75} />
          <span>{SITE.browserName}</span>
        </button>
      )}

      <time className="taskbar__clock">{clock}</time>
    </footer>
  );
}
