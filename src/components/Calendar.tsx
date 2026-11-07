/**
 * Calendar: the small calendar that pops up above the taskbar clock.
 *
 * It shows today's full date at the top, then one month at a time with arrows
 * to page backwards and forwards, and today's date highlighted. Days that
 * belong to the neighbouring months are dimmed. A "Today" button (only usable
 * when you have paged away) jumps back to the current month.
 *
 * `Taskbar.tsx` shows and hides it; this file only draws it. To start weeks on
 * Monday instead of Sunday, change `WEEK_STARTS_ON`.
 */
import { useState } from 'react';
import { CALENDAR_NEXT, CALENDAR_PREV } from '../art/sprites';
import { useNow } from '../hooks/useClock';
import { PixelSprite } from './PixelSprite';

/** Which day each week starts on: 0 is Sunday, 1 is Monday, and so on. */
const WEEK_STARTS_ON = 0;
/** Weeks drawn for every month. Always six, so the popup never changes height as you page. */
const WEEKS_SHOWN = 6;

/** The month being looked at. `month` counts from 0, so January is 0. */
interface MonthView {
  year: number;
  month: number;
}

/** The month that `date` falls in. */
function monthOf(date: Date): MonthView {
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** Whether two dates are the same calendar day (ignoring the time). */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Short weekday names in column order, e.g. Sun, Mon, Tue... in the visitor's language. */
function weekdayNames(): string[] {
  // 1 January 2023 was a Sunday, so counting forward from it visits each weekday in turn.
  return Array.from({ length: 7 }, (_, column) =>
    new Date(2023, 0, 1 + ((WEEK_STARTS_ON + column) % 7)).toLocaleDateString([], { weekday: 'short' }),
  );
}

/**
 * Every day to draw for a month, as rows of seven. The days just before and
 * after the month fill out the first and last rows.
 */
function monthWeeks({ year, month }: MonthView): Date[][] {
  const firstColumn = (new Date(year, month, 1).getDay() - WEEK_STARTS_ON + 7) % 7;
  // `new Date` rolls days past the end (or before the start) of a month into the neighbouring month.
  return Array.from({ length: WEEKS_SHOWN }, (_, week) =>
    Array.from({ length: 7 }, (_, column) => new Date(year, month, 1 - firstColumn + week * 7 + column)),
  );
}

export function Calendar() {
  const now = useNow();
  const [view, setView] = useState<MonthView>(() => monthOf(now));

  const thisMonth = monthOf(now);
  const viewingThisMonth = view.year === thisMonth.year && view.month === thisMonth.month;

  /** Pages forwards (1) or backwards (-1) by whole months. */
  const shiftMonth = (months: number) => setView(monthOf(new Date(view.year, view.month + months, 1)));

  const monthTitle = new Date(view.year, view.month, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });
  const todayText = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="calendar pixel-border" role="dialog" aria-label="Calendar">
      <p className="calendar__today">{todayText}</p>

      <div className="calendar__nav">
        <button type="button" className="calendar__arrow pixel-round" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <PixelSprite sprite={CALENDAR_PREV} scale={0.75} />
        </button>
        {/* `aria-live` makes screen readers announce the new month after an arrow is pressed. */}
        <h2 className="calendar__month" aria-live="polite">
          {monthTitle}
        </h2>
        <button type="button" className="calendar__arrow pixel-round" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <PixelSprite sprite={CALENDAR_NEXT} scale={0.75} />
        </button>
      </div>

      <table className="calendar__grid">
        <thead>
          <tr>
            {weekdayNames().map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(view).map((week) => (
            <tr key={week[0].getTime()}>
              {week.map((day) => {
                const isToday = isSameDay(day, now);
                const outside = day.getMonth() !== view.month;
                return (
                  <td key={day.getTime()} aria-current={isToday ? 'date' : undefined}>
                    <span
                      className={`calendar__day${outside ? ' calendar__day--outside' : ''}${isToday ? ' calendar__day--today' : ''}`}
                    >
                      {day.getDate()}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Hidden (but still taking up room) while already on the current month. */}
      <button
        type="button"
        className="calendar__reset pixel-round"
        disabled={viewingThisMonth}
        onClick={() => setView(thisMonth)}
      >
        Today
      </button>
    </div>
  );
}
