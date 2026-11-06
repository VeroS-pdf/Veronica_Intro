/**
 * Desktop: the whole computer, filling the page.
 *
 * Layers, from back to front:
 *   wallpaper -> twinkling stars -> flying dragons (optional) -> scanlines
 *   -> app icons -> windows -> taskbar -> lock screen
 *
 * A few slow, quiet stars always twinkle in the sky. The little dragon button
 * on the taskbar switches the flying dragons on and off. They start off, so the
 * desktop is calm until a visitor asks for them.
 *
 * The site starts locked. Clicking the lock screen "unlocks" it (the lock
 * screen slides away); "Lock screen" in the start menu locks it again without
 * closing any windows.
 *
 * The windows themselves are managed by `DesktopProvider`
 * (see `src/state/DesktopProvider.tsx`).
 */
import { useEffect, useState } from 'react';
import { DesktopProvider } from '../state/DesktopProvider';
import { useDesktop } from '../state/useDesktop';
import { BrowserWindow } from './browser/BrowserWindow';
import { DesktopIcons } from './DesktopIcons';
import { DragonSky } from './DragonSky';
import { LockScreen } from './LockScreen';
import { PixelLandscape } from './PixelLandscape';
import { Taskbar } from './Taskbar';
import { TwinklingStars } from './TwinklingStars';
import type { ClearZone } from './TwinklingStars';

/** `locked`: lock screen showing. `unlocking`: it is sliding away. `unlocked`: desktop is usable. */
type LockPhase = 'locked' | 'unlocking' | 'unlocked';

/** How long the slide-away animation takes (keep in sync with `.lock-screen--leaving` in desktop.css). */
const UNLOCK_ANIMATION_MS = 700;

/**
 * The desktop's stars: far fewer than on the lock screen, and they twinkle more slowly.
 * Edit `count` for more or fewer stars, `slowness` for slower or faster twinkling
 * (1 is the lock screen's speed). The strip down the left is kept clear for the app icons.
 */
const DESKTOP_STARS = { count: 8, slowness: 2.2, seed: 77 };
const DESKTOP_STARS_KEEP_CLEAR: ClearZone = { left: 0, right: 18, top: 0, bottom: 100 };

/** The desktop contents; it lives inside the provider so it can use the window manager. */
function DesktopScreen() {
  const { windows, workspaceRef } = useDesktop();
  const [lockPhase, setLockPhase] = useState<LockPhase>('locked');
  /** Whether dragons are flying around the desktop (toggled from the taskbar). */
  const [dragonsOn, setDragonsOn] = useState(false);

  // After the slide-away animation, remove the lock screen. With reduced motion there is no animation to wait for.
  useEffect(() => {
    if (lockPhase !== 'unlocking') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setLockPhase('unlocked'), reducedMotion ? 0 : UNLOCK_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [lockPhase]);

  return (
    <div className="desktop">
      <PixelLandscape />

      {/* A few slow stars twinkle above the wallpaper but behind everything else, never over the taskbar. */}
      <div className="desktop-stars">
        <TwinklingStars {...DESKTOP_STARS} keepClear={DESKTOP_STARS_KEEP_CLEAR} />
      </div>

      {/* Dragons fly above the wallpaper but behind every icon and window, and never over the taskbar. */}
      {dragonsOn && (
        <div className="desktop-sky">
          <DragonSky />
        </div>
      )}

      <div className="desktop__scanlines" aria-hidden="true" />

      {/* `inert` keeps keyboard focus and screen readers out of the desktop while it is locked. */}
      <div className="desktop__layer" inert={lockPhase === 'locked'}>
        <DesktopIcons />
        <div className="workspace" ref={workspaceRef}>
          {windows.map((win) => (
            <BrowserWindow key={win.id} window={win} />
          ))}
        </div>
        <Taskbar
          onLock={() => setLockPhase('locked')}
          dragonsOn={dragonsOn}
          onToggleDragons={() => setDragonsOn((on) => !on)}
        />
      </div>

      {lockPhase !== 'unlocked' && (
        <LockScreen
          leaving={lockPhase === 'unlocking'}
          onUnlock={() => setLockPhase((phase) => (phase === 'locked' ? 'unlocking' : phase))}
        />
      )}
    </div>
  );
}

export function Desktop() {
  return (
    <DesktopProvider>
      <DesktopScreen />
    </DesktopProvider>
  );
}
