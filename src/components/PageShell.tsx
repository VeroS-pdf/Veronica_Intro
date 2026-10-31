/**
 * PageShell: the common frame for every content page (About, Projects, ...).
 * It supplies the underlined heading and consistent spacing so each page only
 * has to provide its own content.
 */
import type { ReactNode } from 'react';

interface PageShellProps {
  /** Page heading, shown in big underlined pixel letters. */
  title: string;
  /** The page's content. */
  children: ReactNode;
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <article className="page">
      <h1 className="page__title">
        <span>{title}</span>
      </h1>
      {children}
    </article>
  );
}
