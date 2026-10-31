/**
 * ProjectsPage: a grid of project cards.
 * Add or edit cards in `PROJECTS` inside `src/config/siteConfig.ts`.
 */
import { PageShell } from '../components/PageShell';
import { PROJECTS } from '../config/siteConfig';

export function ProjectsPage() {
  return (
    <PageShell title="Projects">
      <div className="card-grid">
        {PROJECTS.map((project) => (
          <article key={project.name} className="panel project">
            <h2>{project.name}</h2>
            <p>{project.description}</p>
            <ul className="tags">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            {project.url && (
              <a className="pixel-button" href={project.url} target="_blank" rel="noopener noreferrer">
                View project
              </a>
            )}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
