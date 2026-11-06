/**
 * Small helper about the screen size.
 *
 * On phone-sized screens (up to 640px wide, matching the CSS) every window is
 * full screen, so dragging, resizing and detaching tabs are switched off.
 */

/** `true` when the screen is phone-sized and windows can't be dragged around. */
export function isPhoneLayout(): boolean {
  return window.matchMedia('(max-width: 640px)').matches;
}
