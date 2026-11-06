# Welcome to my personal website! *ੈ𑁍༘⋆

This is a personal project I started for fun just to test out my html capabilities and introduce myself to the world! I hope you enjoy poking around and learning a bit more about me!

## What it is

The whole site is a tiny retro computer.

1. **Lock screen.** Visitors land on a lock screen (afternoon purple-forest wallpaper, a big clock, twinkling stars and pastel dragons). Clicking anywhere unlocks it (except on a dragon: see below).
2. **Desktop.** A few slow, quiet yellow stars twinkle in the sky. A row of app icons: **Explorer** (a pixel dragon curled around a globe), **LinkedIn**, **GitHub**, **Projects** and **Mail**. The little purple dragon button on the taskbar (next to the clock) switches pastel dragons flying around the desktop on and off; they start off. The little dragons are clickable (on the lock screen too): a click makes yellow sparkles pop out, knocks the dragon back a little, and then it zooms off at high speed for about 5 seconds before calming down.
3. **Tabs group together.** Explorer opens my bio in a teal browser window. Opening LinkedIn, GitHub, Projects or Mail adds each one as another tab in that same window (LinkedIn and GitHub show a profile card with a button to the real profile).
4. **Pull tabs apart.** **Drag a tab out of the window to make it its own little browser**, then move it anywhere. Drag a tab (or a one-tab window) onto another window's tab strip to put it back. Windows can also be dragged by their title bar, resized by their edges or corner grip, minimised to the taskbar, maximised, or closed. The start menu has every app plus "Lock screen".

On phone-sized screens windows simply fill the screen (dragging and resizing are off).

Built with React + TypeScript + Vite.

## Running it

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build      # type-checks and writes the finished site to dist/
npm run preview    # serves the dist/ build locally
```

## Where to change things

| I want to...                                  | Edit                                          |
| --------------------------------------------- | --------------------------------------------- |
| Change any text, project, email or link       | `src/config/siteConfig.ts` (search for `TODO`) |
| Add, remove or reorder desktop apps (and which page each opens) | `src/apps.ts`               |
| Add a brand new page (tab content)            | copy `src/pages/AboutPage.tsx`, then register it in `src/pages.ts` and give it an app in `src/apps.ts` |
| Redraw an app icon (e.g. the dragon globe)    | `src/art/appIcons.ts` (icons are drawn as text) |
| Redraw dragons, stars and small icons         | `src/art/sprites.ts`                          |
| Change the forest wallpaper (sky, sun, trees) | `src/art/landscape.ts`                        |
| Change the lock screen's text                 | `SITE` in `src/config/siteConfig.ts`          |
| Change how many stars twinkle on the lock screen | `STAR_COUNT` in `src/components/TwinklingStars.tsx` |
| Change how many stars twinkle on the desktop, and how slowly | `DESKTOP_STARS` in `src/components/Desktop.tsx` |
| Change how many dragons fly, or their size and speed | `DRAGONS` in `src/components/DragonSky.tsx` |
| Change what clicking a dragon does (knock-back, speed-up time, sparkles) | `CLICK` and `SPARKLES` in `src/components/DragonSky.tsx`; sparkle look is `.sparkle` in `src/styles/lock-screen.css` |
| Change window sizes (default, pulled-out tab, smallest) | top of `src/state/desktopReducer.ts` |
| Change colours, fonts or how chunky the pixels are | `src/styles/theme.css` (`--px` is one art pixel) |

## How the code is organised

```
src/
  main.tsx                 entry point (fonts + styles)
  App.tsx                  just renders <Desktop />
  apps.ts                  the desktop apps (icon + which pages they open)
  pages.ts                 the pages that can appear as browser tabs
  types.ts                 shared TypeScript types
  config/siteConfig.ts     all the words and links on the site
  art/                     pixel art as text (sprites, app icons) and the wallpaper painter
  state/                   the window manager
    desktopReducer.ts        rules for opening, moving, closing windows and moving tabs (pure logic)
    DesktopProvider.tsx      holds the windows and shares them with the components
    useDesktop.ts            the hook components use to talk to the window manager
    windowDrag.ts            dragging a window by its title bar
    tabDrag.ts               dragging a tab out, into another window, or to reorder
  hooks/                   the clock
  components/              Desktop, LockScreen, DesktopIcons, Taskbar, sprites, wallpaper, stars, dragons
    browser/               the browser window: tabs, toolbar, window buttons, resize handles
  pages/                   one component per tab (Bio, Projects, Contact, LinkedIn, GitHub)
  styles/                  theme.css, desktop.css, lock-screen.css, browser.css, pages.css
```

Every file starts with a comment explaining what it does, and every component and function has a doc comment.
