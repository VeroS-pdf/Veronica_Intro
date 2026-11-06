/**
 * Taskbar: the strip along the bottom of the desktop.
 *
 * Contains a start button (which opens a menu of the apps plus "Lock screen"),
 * one button for every open window, a little dragon button that switches the
 * flying dragons on the desktop on and off, and a clock on the right. Clicking
 * a window's button brings it to the front; clicking the front window's button
 * minimises it.
 */
import { useEffect, useRef, useState } from 'react';
import { APPS } from '../apps';
import { BROWSER_ICON, DRAGON_ICON, HEART, LOCK } from '../art/sprites';
import { useClock } from '../hooks/useClock';
import { getPage } from '../pages';
import { useDesktop } from '../state/useDesktop';
import { PixelSprite } from './PixelSprite';

interface TaskbarProps {
  /** Called when "Lock screen" is chosen in the start menu. */
  onLock: () => void;
  /** Whether dragons are currently flying on the desktop. */
  dragonsOn: boolean;
  /** Called when the dragon button is clicked. */
  onToggleDragons: () => void;
}

export function Taskbar({ onLock, dragonsOn, onToggleDragons }: TaskbarProps) {
  const desktop = useDesktop();
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
            {APPS.map((app) => (
              <li key={app.id} role="none">
                <button type="button" role="menuitem" onClick={choose(() => desktop.openApp(app))}>
                  <PixelSprite sprite={app.icon} scale={0.5} />
                  {app.label}
                </button>
              </li>
            ))}
            <li role="none" className="start-menu__divider" />
            <li role="none">
              <button type="button" role="menuitem" onClick={choose(onLock)}>
                <PixelSprite sprite={LOCK} scale={0.75} />
                Lock screen
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

      <div className="taskbar__tasks">
        {desktop.windows.map((win) => {
          const isFront = desktop.activeWindowId === win.id;
          return (
            <button
              key={win.id}
              type="button"
              className={`taskbar__button taskbar__task pixel-round${isFront ? ' taskbar__task--active' : ''}`}
              aria-pressed={isFront}
              onClick={() => (isFront ? desktop.minimizeWindow(win.id) : desktop.focusWindow(win.id))}
            >
              <PixelSprite sprite={BROWSER_ICON} scale={0.75} />
              <span>{getPage(win.activeTab).title}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={`taskbar__button taskbar__dragons pixel-round${dragonsOn ? ' taskbar__dragons--on' : ''}`}
        aria-pressed={dragonsOn}
        aria-label="Flying dragons"
        title={dragonsOn ? 'Flying dragons: on' : 'Flying dragons: off'}
        onClick={onToggleDragons}
      >
        <PixelSprite sprite={DRAGON_ICON} scale={0.5} />
      </button>

      <time className="taskbar__clock">{clock}</time>
    </footer>
  );
}
