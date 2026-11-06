/**
 * TabStrip: the row of browser tabs along the top of a window.
 *
 * Clicking a tab shows its page. Pressing and dragging a tab starts a tab
 * drag (handled by the parent through `onTabPointerDown`), which can pull the
 * tab out into its own window or move it into another window.
 */
import type { PointerEvent } from 'react';
import type { PageDefinition, PageId } from '../../types';

interface TabStripProps {
  /** Pages to show as tabs, in order. */
  tabs: readonly PageDefinition[];
  /** Id of the page currently showing. */
  activeId: PageId;
  /** Called with a page's id when its tab is clicked. */
  onSelect: (id: PageId) => void;
  /** Called when the mouse goes down on a tab (to begin a drag). */
  onTabPointerDown: (event: PointerEvent<HTMLElement>, id: PageId) => void;
}

export function TabStrip({ tabs, activeId, onSelect, onTabPointerDown }: TabStripProps) {
  return (
    <nav className="tab-strip" aria-label="Browser tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab${tab.id === activeId ? ' tab--active' : ''}`}
          // The drag code uses this to tell tabs apart.
          data-page={tab.id}
          aria-current={tab.id === activeId ? 'page' : undefined}
          title={tab.title}
          onClick={() => onSelect(tab.id)}
          onPointerDown={(event) => onTabPointerDown(event, tab.id)}
        >
          <span className="tab__label">{tab.title}</span>
        </button>
      ))}
    </nav>
  );
}
