import { supabaseAdmin } from '@/lib/supabase/admin';
import { isValidWebhookSecret, notifyUsers } from '@/lib/notify';
import { formatCourseDateRange } from '@/lib/dateRange';

// Fired by the on_offering_created database trigger (see migration 0033)
// when admin schedules a new course offering. Notifies students —
// email only for those who opted into "Email" under Communications on
// their profile; push only for those who've turned it on (having a
// subscription row at all means they opted in, by definition).
export async function POST(request) {
  if (!isValidWebhookSecret(request)) {
    return Response.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  try {
    const { offeringId } = await request.json();

    const { data: offering } = await supabaseAdmin
      .from('course_offerings')
      .select('id, course_id, start_date, end_date, location, is_online, price, courses(name)')
      .eq('id', offeringId)
      .single();

    if (!offering) return Response.json({ ok: true });

    const { data: students } = await supabaseAdmin.from('profiles').select('id').in('role', ['student', 'volunteer']);

    const courseName = offering.courses?.name || 'A course';
    const dateRange = formatCourseDateRange(offering.start_date, offering.end_date);
    const where = offering.is_online ? 'Online' : offering.location || 'TBD';
    const fee = offering.price ? `₱${offering.price}` : 'Free';
    const summary = `${courseName} — ${dateRange} · ${where} · ${fee}`;
    const url = `https://phfp-app.vercel.app/courses/${offering.course_id}`;

    await notifyUsers({
      userIds: (students ?? []).map((s) => s.id),
      onlyEmailIfOptedIn: true,
      emailSubject: `New course offering: ${courseName}`,
      emailHtml: `<p>A new offering was just scheduled:</p><p><strong>${summary}</strong></p><p><a href="${url}">View course →</a></p>`,
      pushPayload: {
        title: 'New course offering',
        body: summary,
        url: `/courses/${offering.course_id}`,
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('offering-created webhook failed:', err);
    return Response.json({ ok: true });
  }
}
