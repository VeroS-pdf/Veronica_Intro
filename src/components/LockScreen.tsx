/**
 * LockScreen: what visitors see first, like a computer's lock screen.
 *
 * It shows the afternoon forest wallpaper with a big clock and the welcome
 * greeting, while twinkling stars and pastel dragons drift across. Clicking
 * anywhere (or pressing Enter or Space) "unlocks" the computer: the screen
 * slides up to reveal the desktop.
 *
 * The parent (`Desktop`) decides when it is shown. `leaving` plays the
 * slide-up animation.
 */
import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { SITE } from '../config/siteConfig';
import { useNow } from '../hooks/useClock';
import { DragonSky } from './DragonSky';
import { PixelLandscape } from './PixelLandscape';
import { TwinklingStars } from './TwinklingStars';

interface LockScreenProps {
  /** `true` while the screen slides away after being clicked. */
  leaving: boolean;
  /** Called when the visitor clicks or presses a key to unlock. */
  onUnlock: () => void;
}

export function LockScreen({ leaving, onUnlock }: LockScreenProps) {
  const now = useNow();
  const screenRef = useRef<HTMLDivElement>(null);

  // Focus the screen so Enter or Space works without clicking first.
  useEffect(() => {
    screenRef.current?.focus();
  }, []);

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onUnlock();
    }
  };

  return (
    <div
      ref={screenRef}
      className={`lock-screen${leaving ? ' lock-screen--leaving' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Locked. Click anywhere or press Enter to unlock."
      onClick={onUnlock}
      onKeyDown={onKeyDown}
    >
      <PixelLandscape />
      <div className="lock-screen__tint" aria-hidden="true" />
      <TwinklingStars />
      <DragonSky />

      <div className="lock-screen__content">
        <time className="lock-screen__time">{time}</time>
        <p className="lock-screen__date">{date}</p>
        <h1 className="lock-screen__title">
          {SITE.welcomeTitleLines.map((line) => (
            <span key={line} className="lock-screen__line">
              {line}
            </span>
          ))}
        </h1>
        <p className="lock-screen__hint">{SITE.unlockHint}</p>
      </div>
    </div>
  );
}
