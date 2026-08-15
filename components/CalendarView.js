'use client';

import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView({ events }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-brand-gold/40 bg-white/70 p-4 shadow-sm dark:bg-white/5">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'title', center: '', right: 'today,prev,next' }}
        footerToolbar={{ left: '', center: 'dayGridMonth,timeGridWeek,timeGridDay', right: '' }}
        height="auto"
        events={events}
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
