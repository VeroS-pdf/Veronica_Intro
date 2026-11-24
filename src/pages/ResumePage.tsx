/**
 * ResumePage: shows the resume PDF inside the browser window, in a tab of its own.
 *
 * The tab shows the whole page of the resume as a preview, with two buttons above it:
 *  - "open full size" expands the PDF to fill the entire screen, with the PDF viewer's
 *    own toolbar for zooming and printing (the close button or Escape brings you back).
 *    This happens inside the site, so it works even where a browser would block a new tab.
 *  - "download" saves the file.
 * Clicking the preview also opens it full size.
 *
 * While this page is visible the desktop's faint scanlines are switched off, so no lines
 * cross the resume (see `clearScreen` in `src/pages.ts`).
 *
 * The PDF sits in the `public/resume/` folder; its file name and the button labels live in
 * `RESUME` inside `src/config/siteConfig.ts`. Browsers that can't show a PDF inside a page
 * (many phones) get a short note and a link that opens the PDF in a new browser tab.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RESUME } from '../config/siteConfig';

/** Where the PDF really is (`BASE_URL` keeps this right wherever the site is hosted). */
const resumeUrl = `${import.meta.env.BASE_URL}resume/${RESUME.file}`;

/** Whether this browser can show a PDF inside a page. (If it can't tell, assume it can.) */
const canShowPdf = typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false;

/** The note shown in place of the PDF when it can't be displayed (or hasn't loaded). */
function PdfFallback() {
  return (
    <p className="resume__fallback">
      This browser can&rsquo;t show the PDF here. Use the buttons above to open or download my resume.
    </p>
  );
}

/** The full-screen reader: the PDF with its own toolbar, over everything else on the screen. */
function ResumeFullSize({ onClose }: { onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const latestOnClose = useRef(onClose);
  latestOnClose.current = onClose;

  // Focus the close button, and let Escape close the reader.
  useEffect(() => {
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') latestOnClose.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // It is placed straight on the page (not inside the browser window) so it can cover the whole screen.
  return createPortal(
    <div className="resume-full" role="dialog" aria-modal="true" aria-label="Resume, full size">
      <div className="resume-full__bar">
        <h2 className="resume-full__title">{RESUME.heading}</h2>
        <div className="resume-full__buttons">
          <a className="pixel-button" href={resumeUrl} download>
            {RESUME.downloadLabel}
          </a>
          <button type="button" className="pixel-button" ref={closeButton} onClick={onClose}>
            {RESUME.closeLabel}
          </button>
        </div>
      </div>
      <object className="resume-full__pdf" data={`${resumeUrl}#view=FitH&navpanes=0`} type="application/pdf" aria-label="Resume (PDF)">
        <PdfFallback />
      </object>
    </div>,
    document.body,
  );
}

export function ResumePage() {
  const [fullSize, setFullSize] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);

  const closeFullSize = () => {
    setFullSize(false);
    openButton.current?.focus();
  };

  return (
    <article className="resume">
      <header className="resume__bar">
        <h1 className="resume__title">
          <span>{RESUME.heading}</span>
        </h1>
        <div className="resume__buttons">
          {canShowPdf ? (
            <button type="button" className="pixel-button" ref={openButton} onClick={() => setFullSize(true)}>
              {RESUME.openLabel}
            </button>
          ) : (
            <a className="pixel-button" href={resumeUrl} target="_blank" rel="noopener noreferrer">
              {RESUME.openLabel}
            </a>
          )}
          <a className="pixel-button" href={resumeUrl} download>
            {RESUME.downloadLabel}
          </a>
        </div>
      </header>

      {canShowPdf ? (
        <>
          <div className="resume__preview">
            {/* The bits after `#` hint to the PDF viewer: show the whole page, with none of its own buttons or sidebar. */}
            <object
              className="resume__pdf"
              data={`${resumeUrl}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              aria-label="Resume (PDF)"
            >
              <PdfFallback />
            </object>
            {/* The PDF viewer would swallow clicks and scrolling, so a see-through button sits on top instead. */}
            <button
              type="button"
              className="resume__preview-button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => setFullSize(true)}
            />
          </div>
          <p className="resume__hint">click the page to open it full size</p>
        </>
      ) : (
        <div className="panel">
          <PdfFallback />
        </div>
      )}

      {fullSize && <ResumeFullSize onClose={closeFullSize} />}
    </article>
  );
}
