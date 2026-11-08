/**
 * Pixel-art sprites, drawn as text.
 *
 * Want to tweak or add a picture? Edit the rows below: every character is one
 * pixel, `.` is see-through, and the letters map to colours in the sprite's
 * palette. All rows of a sprite must have the same length (a warning appears in
 * the browser console during `npm run dev` if they don't).
 *
 * The colours are CSS variables defined in `src/styles/theme.css`, so changing
 * the theme there recolours every sprite at once.
 */
import type { Sprite } from '../types';

/**
 * Letter -> colour lookup shared by the small interface sprites and stars.
 *
 * - `w` white        - `l` light teal   - `b` teal
 * - `d` plum outline - `t` dark teal    - `p` pink
 * - `y` yellow       - `o` gold
 */
export const PALETTE = {
  w: 'var(--white)',
  l: 'var(--teal-300)',
  b: 'var(--teal-500)',
  d: 'var(--ink)',
  t: 'var(--teal-ink)',
  p: 'var(--pink)',
  y: 'var(--yellow)',
  o: 'var(--gold)',
} as const;

/** Letter -> colour lookup for the dragons: four shades of a single purple. */
const DRAGON_PALETTE = {
  l: 'var(--dragon-light)',
  m: 'var(--dragon-mid)',
  d: 'var(--dragon-deep)',
  e: 'var(--dragon-eye)',
} as const;

/* ------------------------------------------------------------------------ */
/* Welcome screen: stars and dragons                                        */
/* ------------------------------------------------------------------------ */

/** Smallest star: a three-pixel plus sign. */
export const STAR_TINY: Sprite = {
  palette: PALETTE,
  rows: [
    '.y.',
    'yyy',
    '.y.',
  ],
};

/** Small four-point sparkle with a golden centre. */
export const STAR_SMALL: Sprite = {
  palette: PALETTE,
  rows: [
    '..y..',
    '.yyy.',
    'yyoyy',
    '.yyy.',
    '..y..',
  ],
};

/** Big five-point star with a golden outline. */
export const STAR_BIG: Sprite = {
  palette: PALETTE,
  rows: [
    '.....o.....',
    '....oyo....',
    '....oyo....',
    'ooooyyyoooo',
    'oyyyyyyyyyo',
    '.oyyyyyyyo.',
    '..oyyyyyo..',
    '..oyyyyyo..',
    '.oyyyoyyyo.',
    '.oyyo.oyyo.',
    '.ooo...ooo.',
  ],
};

/**
 * Dragon, wings raised. Faces right.
 * `l` light, `m` mid, `d` deep (outline), `e` eye.
 */
export const DRAGON_WINGS_UP: Sprite = {
  palette: DRAGON_PALETTE,
  rows: [
    '..............d.............',
    '.............dld............',
    '.......d....dlmd............',
    '......dldd..dlmld...........',
    '.......dmlddllmld...........',
    '.......dlmllllmlld..d.......',
    '........dmllllmlld.ddd......',
    '.........dmlllmllld.dddd....',
    '.........dlmlmlllllddmmmd...',
    '..........dmlmllllldmmemmd..',
    '...d......dlmmlllldmmmmmmmd.',
    '..ddd......dmmllldmmmmmmmmmd',
    '...d......dddmlldmmmmdddddd.',
    '..dmd...ddmmmmmmmmmmmd......',
    '..dmmdddmmmmmmmmmmmmd.......',
    '..dmmmmmmmmmmmmmmmmd........',
    '...dmmmmmmmmmmmmmmd.........',
    '....dmmmmllmlllmld..........',
    '.....ddddddmdddmd...........',
    '.........dddddddd...........',
    '..........dd..dd............',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
  ],
};

/**
 * Dragon, wings lowered. Same body as `DRAGON_WINGS_UP`; the flight animation
 * swaps between the two frames to make the wings flap.
 */
export const DRAGON_WINGS_DOWN: Sprite = {
  palette: DRAGON_PALETTE,
  rows: [
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '....................d.......',
    '...................ddd......',
    '....................dddd....',
    '....................dmmmd...',
    '...................dmmemmd..',
    '...d..............dmmmmmmmd.',
    '..ddd............dmmmmmmmmmd',
    '...d......dddddddmmmmdddddd.',
    '..dmd...ddmmllmmmmmmmd......',
    '..dmmdddmmmlllllmmmmd.......',
    '..dmmmmmmllllmlllmmd........',
    '...dmmmmllllmmlllmd.........',
    '....dmmmlllmmlllld..........',
    '.....ddlllmlmllld...........',
    '.....dlllmllmlldd...........',
    '....dlllmllmlldd............',
    '....dllmlllmld..............',
    '...dllmllllmld..............',
    '...dlddddlmld...............',
    '....d...dlmd................',
    '.........dd.................',
  ],
};

/**
 * Tiny dragon for the taskbar's "show flying dragons" button.
 * Same four purples as the big dragons: `l` light, `m` mid, `d` outline, `e` eye.
 */
export const DRAGON_ICON: Sprite = {
  palette: DRAGON_PALETTE,
  rows: [
    '...d..dld.......',
    '..dldddld..d....',
    '...dllllldddd...',
    '...dllllld.dddd.',
    '....dlllld.dmemd',
    '.....dlllddmmmmm',
    '....ddmmmdmmmddd',
    '.d.dmmmmmmmmmd..',
    'dmdmmmmmmmmmmd..',
    'dmmmmmmmmmmmd...',
    '.dmmmmmmmmmd....',
    '..ddddmddmd.....',
    '......d..d......',
  ],
};

/* ------------------------------------------------------------------------ */
/* Desktop and browser interface                                            */
/* ------------------------------------------------------------------------ */

/** Pink heart used on the taskbar's start button. */
export const HEART: Sprite = {
  palette: PALETTE,
  rows: [
    '.pp.pp.',
    'pwppppp',
    'ppppppp',
    '.ppppp.',
    '..ppp..',
    '...p...',
  ],
};

/** Mini browser window used as the desktop icon and taskbar icon. */
export const BROWSER_ICON: Sprite = {
  palette: PALETTE,
  rows: [
    'dddddddddddddddd',
    'dbbbbbbbbbbbwbwd',
    'dddddddddddddddd',
    'dlwwwwwwwwwwwwld',
    'dwwwwwwwwwwwwwwd',
    'dwwwwwwwyywwwwwd',
    'dwwwwwwyyyywwwwd',
    'dwwwwwwwyywwwwwd',
    'dwwwwwwwwwwwwwwd',
    'dwwwwwwwwwwwwwwd',
    'dddddddddddddddd',
  ],
};

/** Back arrow for the toolbar. */
export const ARROW_LEFT: Sprite = {
  palette: PALETTE,
  rows: [
    '...t',
    '..tt',
    '.ttt',
    'tttt',
    '.ttt',
    '..tt',
    '...t',
  ],
};

/** Forward arrow for the toolbar. */
export const ARROW_RIGHT: Sprite = {
  palette: PALETTE,
  rows: [
    't...',
    'tt..',
    'ttt.',
    'tttt',
    'ttt.',
    'tt..',
    't...',
  ],
};

/** Previous and next month arrows for the calendar: the toolbar arrows, recoloured to the taskbar's purple. */
export const CALENDAR_PREV: Sprite = { palette: { t: 'var(--lilac-text)' }, rows: ARROW_LEFT.rows };
export const CALENDAR_NEXT: Sprite = { palette: { t: 'var(--lilac-text)' }, rows: ARROW_RIGHT.rows };

/** Little house for the toolbar's home button. */
export const HOME: Sprite = {
  palette: PALETTE,
  rows: [
    '....t....',
    '...ttt...',
    '..ttttt..',
    '.ttttttt.',
    'ttttttttt',
    '.ttttttt.',
    '.ttt.ttt.',
    '.ttt.ttt.',
  ],
};

/** Window control: minimise. */
export const CTRL_MINIMIZE: Sprite = {
  palette: PALETTE,
  rows: [
    '.......',
    '.......',
    '.......',
    '.......',
    '.ttttt.',
    '.ttttt.',
    '.......',
  ],
};

/** Window control: maximise / restore. */
export const CTRL_MAXIMIZE: Sprite = {
  palette: PALETTE,
  rows: [
    'ttttttt',
    't.....t',
    't.....t',
    't.....t',
    't.....t',
    't.....t',
    'ttttttt',
  ],
};

/** Window control: close. */
export const CTRL_CLOSE: Sprite = {
  palette: PALETTE,
  rows: [
    'tt...tt',
    'ttt.ttt',
    '.ttttt.',
    '..ttt..',
    '.ttttt.',
    'ttt.ttt',
    'tt...tt',
  ],
};

/** The small "x" on each browser tab, which closes just that tab. */
export const TAB_CLOSE: Sprite = {
  palette: PALETTE,
  rows: [
    't...t',
    '.t.t.',
    '..t..',
    '.t.t.',
    't...t',
  ],
};

/** Dotted grip in the window's bottom-right corner that shows it can be resized. */
export const GRIP: Sprite = {
  palette: PALETTE,
  rows: [
    '....t',
    '.....',
    '..t.t',
    '.....',
    't.t.t',
  ],
};

/** Padlock for the start menu's "Lock screen" item. */
export const LOCK: Sprite = {
  palette: PALETTE,
  rows: [
    '..ttt..',
    '.t...t.',
    '.t...t.',
    'ttttttt',
    'tttwttt',
    'tttwttt',
    'ttttttt',
    'ttttttt',
  ],
};

/**
 * A tiny picture (a sun over two mountains) shown inside an empty frame on the Photos page,
 * until a real picture is added. `s` sun, `m` and `M` the mountains.
 */
export const PICTURE_PLACEHOLDER: Sprite = {
  palette: { s: 'var(--yellow)', m: 'var(--blue-line)', M: 'var(--blue-soft)' },
  rows: [
    '..........ss..',
    '.........ssss.',
    '..........ss..',
    '.....m........',
    '....mmm...M...',
    '...mmmmm.MMM..',
    '..mmmmmmMMMMM.',
    '.mmmmmmmMMMMMM',
    'mmmmmmmmMMMMMM',
  ],
};

