/**
 * LinkedInPage: Veronica's LinkedIn info, opened by the LinkedIn app.
 *
 * LinkedIn doesn't allow its pages to be embedded inside other sites, so this
 * page shows a profile card and a button that opens the real profile in a new
 * tab. Edit the words in `LINKEDIN` inside `src/config/siteConfig.ts`.
 */
import { ICON_LINKEDIN } from '../art/appIcons';
import { PageShell } from '../components/PageShell';
import { ProfileCard } from '../components/ProfileCard';
import { LINKEDIN } from '../config/siteConfig';

export function LinkedInPage() {
  return (
    <PageShell title={LINKEDIN.heading}>
      <ProfileCard
        icon={ICON_LINKEDIN}
        name={LINKEDIN.name}
        subtitle={LINKEDIN.headline}
        details={[LINKEDIN.location]}
        blurb={LINKEDIN.blurb}
        url={LINKEDIN.url}
        buttonLabel={LINKEDIN.buttonLabel}
      />
    </PageShell>
  );
}
