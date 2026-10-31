/**
 * TabStrip: the row of browser tabs along the top of the window.
 *
 * Tabs after the first one animate in (staggered) the first time they are
 * rendered, which is what makes them "appear" when the visitor enters the site.
 */
import type { CSSProperties } from 'react';
import type { TabDefinition, TabId } from '../../types';

interface TabStripProps {
  /** Tabs to show, in order. */
  tabs: readonly TabDefinition[];
  /** Id of the tab whose page is currently showing. */
  activeId: TabId;
  /** Called with a tab's id when it is clicked. */
  onSelect: (id: TabId) => void;
}

export function TabStrip({ tabs, activeId, onSelect }: TabStripProps) {
  return (
    <nav className="tab-strip" aria-label="Browser tabs">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          className={`tab${tab.id === activeId ? ' tab--active' : ''}`}
          // `--i` staggers the pop-in animation: later tabs appear a beat after earlier ones.
          style={{ '--i': index } as CSSProperties}
          aria-current={tab.id === activeId ? 'page' : undefined}
          title={tab.title}
          onClick={() => onSelect(tab.id)}
        >
          <span className="tab__label">{tab.title}</span>
        </button>
      ))}
    </nav>
  );
}
