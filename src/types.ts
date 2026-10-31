/**
 * Shared TypeScript types for the whole site.
 *
 * Keeping them in one file means you can skim this to understand the "shape"
 * of the project before reading any component.
 */
import type { ComponentType } from 'react';

/**
 * Unique identifier for a browser tab / page (for example `"about"`).
 * It is only used internally to keep track of which page is showing.
 */
export type TabId = string;

/**
 * Props that the browser window passes to EVERY page component.
 * Most pages ignore them; only the welcome page needs them.
 */
export interface PageProps {
  /** `true` once the visitor has clicked the welcome text. */
  entered: boolean;
  /** Call this to "enter" the site, which makes the other tabs appear. */
  onEnter: () => void;
}

/**
 * Describes one browser tab. The list of tabs lives in `src/tabs.ts`.
 */
export interface TabDefinition {
  /** Unique id, also used as the React key. */
  id: TabId;
  /** Text shown on the tab itself. */
  title: string;
  /** Fake URL path shown in the address bar, e.g. `"projects"`. */
  path: string;
  /** The React component rendered inside the browser window for this tab. */
  Page: ComponentType<PageProps>;
}

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
