/**
 * ProfileCard: a profile-style card used by the LinkedIn and GitHub pages.
 *
 * Shows the app's pixel icon, a name and subtitle, a short blurb, optional
 * extra content (like a list of repositories) and a button that opens the
 * real profile in a new browser tab. LinkedIn and GitHub don't allow their
 * sites to be shown inside other pages, so this card stands in for them.
 */
import type { ReactNode } from 'react';
import type { Sprite } from '../types';
import { PixelSprite } from './PixelSprite';

interface ProfileCardProps {
  /** Big pixel icon on the left. */
  icon: Sprite;
  /** Person's name. */
  name: string;
  /** Line under the name, e.g. a job title or username. */
  subtitle: string;
  /** Small label chips under the subtitle, e.g. a location. */
  details?: string[];
  /** A sentence or two about the profile. */
  blurb: string;
  /** Address of the real profile. */
  url: string;
  /** Text on the button that opens it. */
  buttonLabel: string;
  /** Extra content shown between the blurb and the button. */
  children?: ReactNode;
}

export function ProfileCard({ icon, name, subtitle, details = [], blurb, url, buttonLabel, children }: ProfileCardProps) {
  return (
    <section className="panel profile">
      <div className="profile__header">
        <PixelSprite sprite={icon} className="profile__icon" />
        <div>
          <h2>{name}</h2>
          <p className="profile__subtitle">{subtitle}</p>
          {details.length > 0 && (
            <ul className="tags">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p>{blurb}</p>
      {children}

      <div className="button-row">
        <a className="pixel-button" href={url} target="_blank" rel="noopener noreferrer">
          {buttonLabel}
        </a>
      </div>
    </section>
  );
}
