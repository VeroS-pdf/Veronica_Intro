/**
 * Clock hooks.
 *
 * `useNow` returns the current time as a `Date`, refreshed every 15 seconds
 * (plenty for a clock without seconds). `useClock` returns it already
 * formatted as text for the taskbar, e.g. "3:42 PM".
 */
import { useEffect, useState } from 'react';

const REFRESH_MS = 15_000;

/** The current date and time, kept fresh. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

/** The current time as short text, e.g. "3:42 PM". */
export function useClock(): string {
  return useNow().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
