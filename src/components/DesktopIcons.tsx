/**
 * DesktopIcons: the app icons down the left side of the desktop.
 *
 * Clicking one opens that app (see `src/apps.ts`). If the app is already open,
 * its window is brought to the front instead of opening a second copy.
 */
import { APPS } from '../apps';
import { useDesktop } from '../state/useDesktop';
import { PixelSprite } from './PixelSprite';

export function DesktopIcons() {
  const { openApp } = useDesktop();

  return (
    <nav className="desktop__icons" aria-label="Applications">
      {APPS.map((app) => (
        <button key={app.id} type="button" className="desktop-icon" onClick={() => openApp(app)}>
          <PixelSprite sprite={app.icon} scale={0.75} />
          <span>{app.label}</span>
        </button>
      ))}
    </nav>
  );
}
