/**
 * Shared TypeScript types for the whole site.
 *
 * Keeping them in one file means you can skim this to understand the "shape"
 * of the project before reading any component.
 */
import type { ComponentType } from 'react';

/**
 * Unique identifier for a page (for example `"about"`).
 * A page shows up as one browser tab; each page can only be open once.
 */
export type PageId = string;

/**
 * Describes one page that can be shown in a browser tab.
 * The list of pages lives in `src/pages.ts`.
 */
export interface PageDefinition {
  /** Unique id, also used as the React key. */
  id: PageId;
  /** Text shown on the tab itself. */
  title: string;
  /** Fake URL path shown in the address bar, e.g. `"projects"`. */
  path: string;
  /** The React component rendered inside the browser window for this page. */
  Page: ComponentType;
}

/**
 * Describes one desktop app (an icon on the desktop and in the start menu).
 * The list of apps lives in `src/apps.ts`.
 */
export interface AppDefinition {
  /** Unique id. */
  id: string;
  /** Name shown under the icon. */
  label: string;
  /** The pixel-art icon (see `src/art/appIcons.ts`). */
  icon: Sprite;
  /**
   * Pages (tabs) the app opens in a browser window. The first one is the main
   * page: it is the one shown first, and opening the app again just brings the
   * window that holds it to the front.
   */
  pages: readonly PageId[];
}

/** A position on the screen, in pixels. */
export interface Point {
  x: number;
  y: number;
}

/** A width and height, in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** A window's position (top-left corner) and size, in pixels. */
export interface Rect extends Point, Size {}

/**
 * A pixel-art image drawn from text.
 *
 * Each string in `rows` is one row of pixels and each character is one pixel.
 * `.` (or a space) means "transparent"; every other character is looked up in
 * `palette` to find its colour. All rows must be the same length.
 *
 * @example
 * const dot: Sprite = { rows: ['.w.', 'www', '.w.'], palette: { w: 'white' } };
 */
export interface Sprite {
  /** Rows of pixel characters, top to bottom. */
  rows: readonly string[];
  /** Maps a pixel character to any CSS colour (CSS variables are allowed). */
  palette: Readonly<Record<string, string>>;
}
