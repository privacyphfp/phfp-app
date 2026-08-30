import { supabaseAdmin } from '@/lib/supabase/admin';
import { isValidWebhookSecret, notifyUsers } from '@/lib/notify';
import { formatCourseDateRange } from '@/lib/dateRange';

// Fired by the on_event_created database trigger (see migration 0033)
// when admin schedules a new event. Same opt-in rules as
// offering-created — see that route for the reasoning.
export async function POST(request) {
  if (!isValidWebhookSecret(request)) {
    return Response.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  try {
    const { eventId } = await request.json();

    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, title, start_date, end_date, location, is_online')
      .eq('id', eventId)
      .single();

    if (!event) return Response.json({ ok: true });

    const { data: students } = await supabaseAdmin.from('profiles').select('id').in('role', ['student', 'volunteer']);

    const dateRange = formatCourseDateRange(event.start_date, event.end_date);
    const where = event.is_online ? 'Online' : event.location || 'TBD';
    const summary = `${event.title} — ${dateRange} · ${where}`;
    const url = 'https://phfp-app.vercel.app/calendar';

    await notifyUsers({
      userIds: (students ?? []).map((s) => s.id),
      onlyEmailIfOptedIn: true,
      emailSubject: `New event: ${event.title}`,
      emailHtml: `<p>A new event was just scheduled:</p><p><strong>${summary}</strong></p><p><a href="${url}">View on Calendar →</a></p>`,
      pushPayload: {
        title: 'New event',
        body: summary,
        url: '/calendar',
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('event-created webhook failed:', err);
    return Response.json({ ok: true });
  }
}
