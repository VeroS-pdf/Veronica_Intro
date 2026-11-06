/**
 * The desktop apps: one icon each, on the desktop and in the start menu.
 *
 * HOW TO ADD AN APP
 *  1. Draw an icon in `src/art/appIcons.ts` (or reuse an existing one).
 *  2. Add an entry below. `pages` lists the page ids (see `src/pages.ts`) that
 *     the app opens as tabs; the first one is shown first.
 *
 * The apps appear in this order, top to bottom, on the desktop.
 */
import { ICON_EXPLORER, ICON_GITHUB, ICON_LINKEDIN, ICON_MAIL, ICON_PROJECTS } from './art/appIcons';
import type { AppDefinition } from './types';

export const APPS: readonly AppDefinition[] = [
  // Explorer opens Veronica's bio, with the Projects and Contact tabs beside it.
  { id: 'explorer', label: 'Explorer', icon: ICON_EXPLORER, pages: ['about', 'projects', 'contact'] },
  { id: 'linkedin', label: 'LinkedIn', icon: ICON_LINKEDIN, pages: ['linkedin'] },
  { id: 'github', label: 'GitHub', icon: ICON_GITHUB, pages: ['github'] },
  { id: 'projects', label: 'Projects', icon: ICON_PROJECTS, pages: ['projects'] },
  { id: 'mail', label: 'Mail', icon: ICON_MAIL, pages: ['contact'] },
];
