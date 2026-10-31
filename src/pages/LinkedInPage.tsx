/**
 * LinkedInPage: a friendly stop that sends visitors to Veronica's LinkedIn.
 *
 * LinkedIn doesn't allow its pages to be embedded inside other sites, so this
 * page shows a short blurb and a button that opens the profile in a new tab.
 * Set your profile address in `LINKEDIN` inside `src/config/siteConfig.ts`.
 */
import { PageShell } from '../components/PageShell';
import { LINKEDIN } from '../config/siteConfig';

export function LinkedInPage() {
  return (
    <PageShell title={LINKEDIN.heading}>
      <section className="panel">
        <p>{LINKEDIN.blurb}</p>
        <div className="button-row">
          <a className="pixel-button" href={LINKEDIN.url} target="_blank" rel="noopener noreferrer">
            {LINKEDIN.buttonLabel}
          </a>
        </div>
      </section>
    </PageShell>
  );
}
