/**
 * useClock: returns the current time as text (e.g. "3:42 PM") for the taskbar.
 * It re-checks every 15 seconds, which is plenty for a clock without seconds.
 */
import { useEffect, useState } from 'react';

const REFRESH_MS = 15_000;

export function useClock(): string {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
