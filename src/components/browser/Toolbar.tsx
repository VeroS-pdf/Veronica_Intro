/**
 * Toolbar: the browser's navigation row (back, forward, home and address bar).
 */
import { ARROW_LEFT, ARROW_RIGHT, HOME } from '../../art/sprites';
import { PixelSprite } from '../PixelSprite';

interface ToolbarProps {
  /** Text to show in the address bar, e.g. "www.veronicas-website.web/about". */
  address: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
}

export function Toolbar({ address, canGoBack, canGoForward, onBack, onForward, onHome }: ToolbarProps) {
  return (
    <div className="toolbar">
      <button type="button" className="toolbar__button pixel-round" onClick={onBack} disabled={!canGoBack} aria-label="Back">
        <PixelSprite sprite={ARROW_LEFT} scale={0.75} />
      </button>
      <button
        type="button"
        className="toolbar__button pixel-round"
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Forward"
      >
        <PixelSprite sprite={ARROW_RIGHT} scale={0.75} />
      </button>
      <button type="button" className="toolbar__button pixel-round" onClick={onHome} aria-label="Home">
        <PixelSprite sprite={HOME} scale={0.75} />
      </button>
      <div className="address-bar pixel-border" aria-label="Address">
        {address}
      </div>
    </div>
  );
}
