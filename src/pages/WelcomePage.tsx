/**
 * WelcomePage: the first thing visitors see inside the browser.
 *
 * A white screen with big blue underlined text, little yellow stars twinkling
 * behind it, and pastel purple dragons flying around. Clicking the text calls
 * `onEnter`, which makes the other browser tabs appear.
 *
 * The stars live in `TwinklingStars.tsx` and the dragons in `DragonSky.tsx`;
 * edit those files to change how many there are or how they move.
 */
import { DragonSky } from '../components/DragonSky';
import { TwinklingStars } from '../components/TwinklingStars';
import { SITE } from '../config/siteConfig';
import type { PageProps } from '../types';

export function WelcomePage({ entered, onEnter }: PageProps) {
  return (
    <div className="welcome">
      <TwinklingStars />
      <DragonSky />

      <div className="welcome__center">
        <button type="button" className="welcome__title" onClick={onEnter}>
          {SITE.welcomeTitleLines.map((line) => (
            <span key={line} className="welcome__line">
              {line}
            </span>
          ))}
        </button>
        <p className={`welcome__hint${entered ? '' : ' welcome__hint--blink'}`} aria-live="polite">
          {entered ? SITE.exploreHint : SITE.enterHint}
        </p>
      </div>
    </div>
  );
}
