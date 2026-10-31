/**
 * AboutPage: a short intro plus a few quick facts.
 * The words come from `ABOUT` in `src/config/siteConfig.ts`.
 */
import { PageShell } from '../components/PageShell';
import { ABOUT } from '../config/siteConfig';

export function AboutPage() {
  return (
    <PageShell title={ABOUT.heading}>
      <section className="panel">
        {ABOUT.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </section>

      <section className="panel">
        <dl className="facts">
          {ABOUT.facts.map(({ label, value }) => (
            <div key={label} className="facts__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PageShell>
  );
}
