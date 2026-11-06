/**
 * TabDragGhost: the floating preview shown while a tab is being dragged.
 *
 * It draws a small label that follows the pointer and, when letting go would
 * pull the tab out into a new window, a dashed outline of where that window
 * would appear. It ignores the mouse, so it never gets in the way of the drop.
 *
 * The drag code updates it through a setter function (see `setterRef`) rather
 * than React state in the parent, so the rest of the page doesn't re-render
 * on every mouse movement.
 */
import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { TabGhost } from '../state/tabDrag';

/** A function that shows a ghost, or hides it when given `null`. */
export type GhostSetter = (ghost: TabGhost | null) => void;

interface TabDragGhostProps {
  /** This component stores its setter here for the drag code to call. */
  setterRef: MutableRefObject<GhostSetter | null>;
}

export function TabDragGhost({ setterRef }: TabDragGhostProps) {
  const [ghost, setGhost] = useState<TabGhost | null>(null);

  useEffect(() => {
    setterRef.current = setGhost;
    return () => {
      setterRef.current = null;
    };
  }, [setterRef]);

  if (!ghost) return null;
  return (
    <div className="tab-ghost" aria-hidden="true">
      {ghost.outline && (
        <div
          className="tab-ghost__window"
          style={{
            left: ghost.outline.x,
            top: ghost.outline.y,
            width: ghost.outline.width,
            height: ghost.outline.height,
          }}
        />
      )}
      <div className="tab-ghost__label" style={{ left: ghost.x, top: ghost.y }}>
        {ghost.title}
      </div>
    </div>
  );
}
