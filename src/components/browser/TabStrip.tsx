/**
 * TabStrip: the row of browser tabs along the top of a window.
 *
 * Clicking a tab shows its page. Pressing and dragging a tab starts a tab
 * drag (handled by the parent through `onTabPointerDown`), which can pull the
 * tab out into its own window or move it into another window. The small "x" on
 * each tab closes just that tab (the window closes with its last tab).
 *
 * A tab is a box holding two buttons side by side (one that selects the page,
 * one that closes it), because a button may not sit inside another button.
 */
import type { PointerEvent } from 'react';
import { TAB_CLOSE } from '../../art/sprites';
import type { PageDefinition, PageId } from '../../types';
import { PixelSprite } from '../PixelSprite';

interface TabStripProps {
  /** Pages to show as tabs, in order. */
  tabs: readonly PageDefinition[];
  /** Id of the page currently showing. */
  activeId: PageId;
  /** Called with a page's id when its tab is clicked. */
  onSelect: (id: PageId) => void;
  /** Called with a page's id when the "x" on its tab is clicked. */
  onClose: (id: PageId) => void;
  /** Called when the mouse goes down on a tab (to begin a drag). */
  onTabPointerDown: (event: PointerEvent<HTMLElement>, id: PageId) => void;
}

export function TabStrip({ tabs, activeId, onSelect, onClose, onTabPointerDown }: TabStripProps) {
  return (
    <nav className="tab-strip" aria-label="Browser tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab${tab.id === activeId ? ' tab--active' : ''}`}
          // The drag code uses this to tell tabs apart.
          data-page={tab.id}
          onPointerDown={(event) => onTabPointerDown(event, tab.id)}
        >
          <button
            type="button"
            className="tab__select"
            aria-current={tab.id === activeId ? 'page' : undefined}
            title={tab.title}
            onClick={() => onSelect(tab.id)}
          >
            <span className="tab__label">{tab.title}</span>
          </button>
          <button
            type="button"
            className="tab__close"
            aria-label={`Close ${tab.title} tab`}
            title="Close tab"
            // Pressing the "x" must not start dragging the tab or the window.
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onClose(tab.id);
            }}
          >
            <PixelSprite sprite={TAB_CLOSE} scale={0.8} />
          </button>
        </div>
      ))}
    </nav>
  );
}
