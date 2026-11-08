/**
 * The list of pages that can appear in browser tabs.
 *
 * HOW TO ADD A NEW PAGE
 *  1. Create a component in `src/pages/` (copy `AboutPage.tsx` as a starting point).
 *  2. Import it below and add an entry to `PAGES`.
 *  3. Decide which app opens it, in `src/apps.ts`.
 *
 * The one exception is the Home page, which no app opens: the browser's Home button does
 * (see `HOME_PAGE_ID` below).
 *
 * A page can only be open once at a time. Visitors can drag a tab out of a
 * window to give it a window of its own, and drag it back in later.
 */
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { GitHubPage } from './pages/GitHubPage';
import { HomePage } from './pages/HomePage';
import { LinkedInPage } from './pages/LinkedInPage';
import { PhotosPage } from './pages/PhotosPage';
import { ProjectsPage } from './pages/ProjectsPage';
import type { PageDefinition, PageId } from './types';

/** The page the browser's Home button shows: a mushroom house in a bright forest. */
export const HOME_PAGE_ID: PageId = 'home';

export const PAGES: readonly PageDefinition[] = [
  { id: 'about', title: 'Bio', path: 'bio', Page: AboutPage },
  { id: 'projects', title: 'Projects', path: 'projects', Page: ProjectsPage },
  { id: 'photos', title: 'Photos', path: 'photos', Page: PhotosPage },
  { id: 'contact', title: 'Contact', path: 'contact', Page: ContactPage },
  { id: 'linkedin', title: 'LinkedIn', path: 'linkedin', Page: LinkedInPage },
  { id: 'github', title: 'GitHub', path: 'github', Page: GitHubPage },
  { id: HOME_PAGE_ID, title: 'Home', path: 'home', Page: HomePage },
];

/**
 * Looks up a page by its id.
 *
 * @param id A page id from `PAGES`.
 * @throws If no page has that id (this means a typo in `src/apps.ts` or `PAGES`).
 */
export function getPage(id: PageId): PageDefinition {
  const page = PAGES.find((candidate) => candidate.id === id);
  if (!page) throw new Error(`Unknown page id: "${id}"`);
  return page;
}
