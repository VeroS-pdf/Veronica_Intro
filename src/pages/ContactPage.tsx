/**
 * ContactPage: how to reach Veronica.
 * The email address, the "email" button, its help message and any extra links come from `CONTACT`
 * in `src/config/siteConfig.ts`.
 *
 * The "email" button is a `mailto:` link, which opens the visitor's email app with a new message to my address.
 * But that only does something visible if their computer has an email app set up (many don't, especially
 * people who use Gmail or Outlook in a web page), so pressing it also copies my address and shows a note
 * with the address and a button that writes the email in Gmail. Either way, they can always reach me.
 */
import { useEffect, useRef, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { CONTACT } from '../config/siteConfig';

/** Copies text to the clipboard. Returns whether it worked (some browsers don't allow it). */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fall through to the older way, which works in more places.
  }
  try {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.appendChild(box);
    box.select();
    const worked = document.execCommand('copy');
    box.remove();
    return worked;
  } catch {
    return false;
  }
}

/** Opens a new message to my address in Gmail, in the visitor's browser. */
const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}`;

export function ContactPage() {
  /** `null` until the email button is pressed; then whether my address was copied to the clipboard. */
  const [copied, setCopied] = useState<boolean | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // When the note appears (and again when its text changes), scroll it into view so its buttons aren't hiding below
  // the bottom of the window.
  useEffect(() => {
    if (copied !== null) noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [copied]);

  const onEmailPressed = () => {
    // The link itself still opens the email app. Here we also copy the address (this has to start right away, while
    // the browser still counts the press as the visitor's own action) and show the help note.
    setCopied(false);
    void copyToClipboard(CONTACT.email).then(setCopied);
  };

  return (
    <PageShell title={CONTACT.heading}>
      <section className="panel">
        <p>{CONTACT.intro}</p>
        <p>
          Email me at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </p>
        <div className="button-row">
          <a className="pixel-button" href={`mailto:${CONTACT.email}`} onClick={onEmailPressed}>
            {CONTACT.emailButtonLabel}
          </a>
          {CONTACT.links.map((link) => (
            <a key={link.url} className="pixel-button" href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </div>

        {copied !== null && (
          <div className="contact-note" role="status" ref={noteRef}>
            <p>{copied ? CONTACT.emailHelp.copied : CONTACT.emailHelp.notCopied}</p>
            <p className="contact-note__address">{CONTACT.email}</p>
            <div className="button-row">
              <a className="pixel-button" href={gmailUrl} target="_blank" rel="noopener noreferrer">
                {CONTACT.emailHelp.gmailLabel}
              </a>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
