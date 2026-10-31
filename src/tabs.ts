/**
 * The list of browser tabs: add, remove or reorder pages here.
 *
 * HOW TO ADD A NEW PAGE
 *  1. Create a component in `src/pages/` (copy `AboutPage.tsx` as a starting point).
 *  2. Import it below and add an entry to `TABS`.
 *  That's it. The tab, address bar text and navigation are all handled for you.
 *
 * The FIRST entry is the welcome page. It is always visible; every other tab
 * appears (with a little pop animation) after the visitor clicks the welcome text.
 */
import { SITE } from './config/siteConfig';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LinkedInPage } from './pages/LinkedInPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WelcomePage } from './pages/WelcomePage';
import type { TabDefinition } from './types';

/** Id of the welcome tab, which is also where the toolbar's home button goes. */
export const HOME_TAB_ID = 'home';

export const TABS: readonly TabDefinition[] = [
  { id: HOME_TAB_ID, title: SITE.welcomeTabTitle, path: 'home', Page: WelcomePage },
  { id: 'about', title: 'About', path: 'about', Page: AboutPage },
  { id: 'projects', title: 'Projects', path: 'projects', Page: ProjectsPage },
  { id: 'contact', title: 'Contact', path: 'contact', Page: ContactPage },
  { id: 'linkedin', title: 'LinkedIn', path: 'linkedin', Page: LinkedInPage },
];
