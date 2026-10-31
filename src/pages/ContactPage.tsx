/**
 * ContactPage: how to reach Veronica.
 * The email address and links come from `CONTACT` in `src/config/siteConfig.ts`.
 */
import { PageShell } from '../components/PageShell';
import { CONTACT } from '../config/siteConfig';

export function ContactPage() {
  return (
    <PageShell title={CONTACT.heading}>
      <section className="panel">
        <p>{CONTACT.intro}</p>
        <p>
          Email me at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </p>
        {CONTACT.links.length > 0 && (
          <div className="button-row">
            {CONTACT.links.map((link) => (
              <a key={link.url} className="pixel-button" href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
