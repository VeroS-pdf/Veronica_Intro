/**
 * WindowControls: the three small white squares in the top-right corner of the
 * browser window (minimise, maximise/restore, close), as in the reference art.
 */
import { CTRL_CLOSE, CTRL_MAXIMIZE, CTRL_MINIMIZE } from '../../art/sprites';
import { PixelSprite } from '../PixelSprite';

interface WindowControlsProps {
  /** Whether the window currently fills the whole desktop. */
  maximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function WindowControls({ maximized, onMinimize, onToggleMaximize, onClose }: WindowControlsProps) {
  return (
    <div className="window-controls">
      <button type="button" className="window-controls__button pixel-border" onClick={onMinimize} aria-label="Minimize window">
        <PixelSprite sprite={CTRL_MINIMIZE} scale={0.75} />
      </button>
      <button
        type="button"
        className="window-controls__button pixel-border"
        onClick={onToggleMaximize}
        aria-label={maximized ? 'Restore window size' : 'Maximize window'}
      >
        <PixelSprite sprite={CTRL_MAXIMIZE} scale={0.75} />
      </button>
      <button type="button" className="window-controls__button pixel-border" onClick={onClose} aria-label="Close window">
        <PixelSprite sprite={CTRL_CLOSE} scale={0.75} />
      </button>
    </div>
  );
}
