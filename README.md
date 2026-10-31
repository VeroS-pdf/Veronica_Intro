# Welcome to my personal website! *ੈ𑁍༘⋆

This is a personal project I started for fun just to test out my html capabilities and introduce myself to the world! I hope you enjoy poking around and learning a bit more about me!

## What it is

The whole site is a tiny retro computer. Visitors land on a pastel desktop with a purple pixel-art forest wallpaper (taken in the afternoon) and a teal browser window with a white screen that says **"Welcome to Veronica's website!"**, with little yellow stars twinkling and pastel purple dragons flying around behind it. Clicking the text makes the other tabs (About, Projects, Contact, LinkedIn) pop in along the top of the browser, and each tab swaps the page inside the window. Visitors can drag the window's edges or the dotted grip in its bottom-right corner to make it bigger or smaller.

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
| Add, remove or reorder tabs                   | `src/tabs.ts`                                 |
| Add a brand new page                          | copy `src/pages/AboutPage.tsx`, then register it in `src/tabs.ts` |
| Change how many stars twinkle                 | `STAR_COUNT` in `src/components/TwinklingStars.tsx` |
| Change how many dragons fly, or their size and speed | `DRAGONS` in `src/components/DragonSky.tsx` |
| Redraw or add pixel art (dragons, stars, icons) | `src/art/sprites.ts` (pictures are drawn as text) |
| Change the forest wallpaper (sky, sun, trees) | `src/art/landscape.ts`                        |
| Change the smallest size the window can shrink to | `MIN_WINDOW_SIZE` in `src/components/browser/ResizeHandles.tsx` |
| Change colours, fonts or how chunky the pixels are | `src/styles/theme.css` (`--px` is one art pixel) |

## How the code is organised

```
src/
  main.tsx                 entry point (fonts + styles)
  App.tsx                  just renders <Desktop />
  tabs.ts                  the list of browser tabs
  types.ts                 shared TypeScript types
  config/siteConfig.ts     all the words and links on the site
  art/                     sprites (pixel art as text) and the wallpaper painter
  hooks/                   browser back/forward logic, taskbar clock
  components/              Desktop, Taskbar, PixelSprite, PixelLandscape,
                           TwinklingStars, DragonSky
    browser/               the browser window: tabs, toolbar, window buttons, resize handles
  pages/                   one component per tab
  styles/                  theme.css, desktop.css, browser.css, pages.css
```

Every file starts with a comment explaining what it does, and every component and function has a doc comment.
