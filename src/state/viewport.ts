/**
 * Small helper about the screen size.
 *
 * On phone-sized screens (up to 640px wide, matching the CSS) every window is
 * full screen, so dragging, resizing and detaching tabs are switched off.
 */

/** The widest screen (in pixels) that counts as phone-sized. Keep this in step with the CSS (`max-width: 640px`). */
export const PHONE_MAX_WIDTH = 640;

/** `true` when the screen is phone-sized and windows can't be dragged around. */
export function isPhoneLayout(): boolean {
  return window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`).matches;
}
