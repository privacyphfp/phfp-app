'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const VIEW_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'dayGridMonth', label: 'Month' },
  { value: 'timeGridWeek', label: 'Week' },
  { value: 'timeGridDay', label: 'Day' },
];

export default function CalendarView({ events }) {
  const router = useRouter();
  const calendarRef = useRef(null);
  const [title, setTitle] = useState('');
  const [activeView, setActiveView] = useState('dayGridMonth');

  function handleViewSelect(e) {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const value = e.target.value;
    // "Today" is a jump-to-now action, not its own view — it always lands
    // back on the month view rather than staying selected itself.
    if (value === 'today') {
      api.today();
      api.changeView('dayGridMonth');
    } else {
      api.changeView(value);
    }
  }

  const navButtonClass =
    'rounded-lg border border-brand-blue/30 px-2.5 py-1.5 text-sm text-brand-blue transition-colors hover:bg-brand-blue/10';

  return (
    <div className="rounded-2xl border border-brand-gold/40 bg-white/70 p-1.5 shadow-sm sm:p-4 dark:bg-white/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand-blue-dark">{title}</h2>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => calendarRef.current?.getApi().prev()} aria-label="Previous" className={navButtonClass}>
            ‹
          </button>
          <button type="button" onClick={() => calendarRef.current?.getApi().next()} aria-label="Next" className={navButtonClass}>
            ›
          </button>
          <select
            value={activeView}
            onChange={handleViewSelect}
            className="rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          >
            {VIEW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        datesSet={(arg) => {
          setTitle(arg.view.title);
          setActiveView(arg.view.type);
        }}
        views={{
          timeGridWeek: {
            dayHeaderContent: (arg) => `${arg.date.toLocaleDateString('en-US', { weekday: 'short' })} ${arg.date.getDate()}`,
          },
        }}
        height="auto"
        events={events}
        eventContent={(arg) => {
          const instructor = arg.event.extendedProps.instructor;
          return (
            <div className="fc-event-lines">
              <div className="fc-event-line-main">{arg.event.title}</div>
              {instructor && <div className="fc-event-line-sub">{instructor}</div>}
            </div>
          );
        }}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          if (info.event.extendedProps.href) {
            router.push(info.event.extendedProps.href);
          }
        }}
      />
    </div>
  );
}
