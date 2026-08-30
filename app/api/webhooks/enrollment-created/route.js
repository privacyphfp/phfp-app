import { supabaseAdmin } from '@/lib/supabase/admin';
import { isValidWebhookSecret, notifyUsers } from '@/lib/notify';
import { sendEmail } from '@/lib/email';
import { enrollmentConfirmationEmail } from '@/lib/emailTemplates';
import { ADMIN_ROLES } from '@/lib/roles';

// Fired by the on_enrollment_created database trigger (see migration
// 0033) right after a student enrolls. Notifies:
// - Every admin-tier user, by email + push — every enrollment needs a
//   look either way (new roster entry, and if there's money involved,
//   someone has to verify it).
// - The course's instructor, if they have a real linked account
//   (course_offerings.instructor_id, as opposed to a free-text
//   instructor_name for someone who hasn't signed up yet) — a lighter
//   notice with no payment detail, that's not their job.
// - The student themselves, by email only — a plain confirmation that
//   their enrollment was received (see lib/emailTemplates.js).
export async function POST(request) {
  if (!isValidWebhookSecret(request)) {
    return Response.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  try {
    const { enrollmentId } = await request.json();

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select(
        'id, enrollment_type, tithe_amount, profiles(email, full_name, first_name, last_name), course_offerings(price, start_date, end_date, location, is_online, instructor_id, courses(name))'
      )
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) return Response.json({ ok: true });

    const { data: admins } = await supabaseAdmin.from('profiles').select('id').in('role', ADMIN_ROLES);
    const adminIds = new Set((admins ?? []).map((a) => a.id));

    const studentName =
      enrollment.profiles?.full_name ||
      [enrollment.profiles?.first_name, enrollment.profiles?.last_name].filter(Boolean).join(' ') ||
      'A student';
    const courseName = enrollment.course_offerings?.courses?.name || 'a course';
    const needsPayment = (enrollment.course_offerings?.price ?? 0) > 0 || enrollment.enrollment_type === 'review';
    const isReview = enrollment.enrollment_type === 'review';

    const adminSummary = `${studentName} enrolled in ${courseName} (${isReview ? 'Review' : 'New'})${
      needsPayment ? ' — payment needs verification' : ''
    }.`;

    await notifyUsers({
      userIds: [...adminIds],
      emailSubject: `New enrollment: ${studentName} — ${courseName}`,
      emailHtml: `<p>${adminSummary}</p><p><a href="https://phfp-app.vercel.app/admin">Open Admin Dashboard</a></p>`,
      pushPayload: {
        title: 'New enrollment',
        body: adminSummary,
        url: '/admin',
      },
    });

    // Instructor gets a lighter version — no payment-verification detail,
    // that's staff's job, not theirs. Skipped if they're also admin-tier
    // (already notified above) or don't have a linked account yet.
    const instructorId = enrollment.course_offerings?.instructor_id;
    if (instructorId && !adminIds.has(instructorId)) {
      const instructorSummary = `${studentName} enrolled in your course: ${courseName} (${isReview ? 'Review' : 'New'}).`;
      await notifyUsers({
        userIds: [instructorId],
        emailSubject: `New student enrolled — ${courseName}`,
        emailHtml: `<p>${instructorSummary}</p>`,
        pushPayload: {
          title: 'New student enrolled',
          body: instructorSummary,
          url: '/student',
        },
      });
    }

    // Confirms to the student that their enrollment was received — not
    // that payment is verified, that's a separate step staff does.
    if (enrollment.profiles?.email) {
      const { subject, html } = enrollmentConfirmationEmail({
        studentName,
        courseName,
        startDate: enrollment.course_offerings?.start_date,
        endDate: enrollment.course_offerings?.end_date,
        location: enrollment.course_offerings?.location,
        isOnline: enrollment.course_offerings?.is_online,
        isReview,
      });
      await sendEmail({ to: enrollment.profiles.email, subject, html });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('enrollment-created webhook failed:', err);
    return Response.json({ ok: true });
  }
}
