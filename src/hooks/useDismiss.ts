/**
 * useDismiss: closes a popup (the start menu, the calendar) when the visitor
 * clicks anywhere outside it or presses Escape, like a real computer's popups.
 *
 * Only listens while the popup is open.
 */
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * @param open Whether the popup is showing right now.
 * @param containerRef The popup together with the button that opens it; clicks inside it do not dismiss.
 * @param onDismiss Called to close the popup.
 */
export function useDismiss(open: boolean, containerRef: RefObject<HTMLElement | null>, onDismiss: () => void): void {
  // The listeners below live longer than one render, so they call whatever `onDismiss` is newest.
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) latest.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') latest.current();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, containerRef]);
}
