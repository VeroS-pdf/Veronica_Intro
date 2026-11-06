/**
 * Desktop: the whole computer, filling the page.
 *
 * Layers, from back to front:
 *   wallpaper -> flying dragons (optional) -> scanlines -> app icons -> windows
 *   -> giant dragon (rare) -> taskbar -> lock screen
 *
 * The little dragon button on the taskbar switches the flying dragons on and
 * off. They start off, so the desktop is calm until a visitor asks for them.
 * While they are on, there is a small chance every few minutes that a giant
 * dragon sweeps across the screen (see `useGiantDragon.ts`).
 *
 * The site starts locked. Clicking the lock screen "unlocks" it (the lock
 * screen slides away); "Lock screen" in the start menu locks it again without
 * closing any windows.
 *
 * The windows themselves are managed by `DesktopProvider`
 * (see `src/state/DesktopProvider.tsx`).
 */
import { useEffect, useState } from 'react';
import { useGiantDragon } from '../hooks/useGiantDragon';
import { DesktopProvider } from '../state/DesktopProvider';
import { useDesktop } from '../state/useDesktop';
import { BrowserWindow } from './browser/BrowserWindow';
import { DesktopIcons } from './DesktopIcons';
import { DragonSky } from './DragonSky';
import { GiantDragon } from './GiantDragon';
import { LockScreen } from './LockScreen';
import { PixelLandscape } from './PixelLandscape';
import { Taskbar } from './Taskbar';

/** `locked`: lock screen showing. `unlocking`: it is sliding away. `unlocked`: desktop is usable. */
type LockPhase = 'locked' | 'unlocking' | 'unlocked';

/** How long the slide-away animation takes (keep in sync with `.lock-screen--leaving` in desktop.css). */
const UNLOCK_ANIMATION_MS = 700;

/** The desktop contents; it lives inside the provider so it can use the window manager. */
function DesktopScreen() {
  const { windows, workspaceRef } = useDesktop();
  const [lockPhase, setLockPhase] = useState<LockPhase>('locked');
  /** Whether dragons are flying around the desktop (toggled from the taskbar). */
  const [dragonsOn, setDragonsOn] = useState(false);
  // The giant dragon only visits while the desktop is unlocked and the dragons are on.
  const giantDragon = useGiantDragon(dragonsOn && lockPhase === 'unlocked');

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

      {/* Dragons fly above the wallpaper but behind every icon and window, and never over the taskbar. */}
      {dragonsOn && (
        <div className="desktop-sky">
          <DragonSky />
        </div>
      )}

      <div className="desktop__scanlines" aria-hidden="true" />

      {giantDragon.flying && <GiantDragon onDone={giantDragon.finish} />}

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
