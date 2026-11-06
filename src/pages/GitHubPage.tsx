/**
 * GitHubPage: Veronica's GitHub info, opened by the GitHub app.
 *
 * Shows a profile card, a few featured repositories, and a button that opens
 * the real profile in a new tab. Edit the words in `GITHUB` inside
 * `src/config/siteConfig.ts`.
 */
import { ICON_GITHUB } from '../art/appIcons';
import { PageShell } from '../components/PageShell';
import { ProfileCard } from '../components/ProfileCard';
import { GITHUB } from '../config/siteConfig';

export function GitHubPage() {
  return (
    <PageShell title={GITHUB.heading}>
      <ProfileCard
        icon={ICON_GITHUB}
        name={GITHUB.name}
        subtitle={`@${GITHUB.username}`}
        blurb={GITHUB.blurb}
        url={GITHUB.url}
        buttonLabel={GITHUB.buttonLabel}
      >
        {GITHUB.repos.length > 0 && (
          <ul className="repo-list">
            {GITHUB.repos.map((repo) => (
              <li key={repo.url} className="repo">
                <a href={repo.url} target="_blank" rel="noopener noreferrer">
                  {repo.name}
                </a>
                <p>{repo.description}</p>
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </PageShell>
  );
}
