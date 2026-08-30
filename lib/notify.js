import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { sendPushToSubscriptions } from '@/lib/push';

// The header Supabase's Database Webhook is configured to send back, so
// these routes can tell a real webhook call from a random request. See
// supabase/migrations/0033_push_subscriptions_and_webhooks.sql.
export function isValidWebhookSecret(request) {
  const secret = request.headers.get('x-webhook-secret');
  return !!process.env.WEBHOOK_SECRET && secret === process.env.WEBHOOK_SECRET;
}

// Notifies a set of users by email and/or push. Never throws — a
// notification failing to send should never surface as an error to
// whoever triggered it (the webhook caller gets a 200 either way).
//
// `onlyEmailIfOptedIn`: for broadcast-style notices (new course/event) we
// only email people who checked "Email" under Communications on their
// profile. Admin alerts (new enrollment, payment to verify) skip that —
// staff always get those regardless of their own comms preference.
export async function notifyUsers({ userIds, emailSubject, emailHtml, onlyEmailIfOptedIn = false, pushPayload }) {
  const ids = [...new Set(userIds ?? [])].filter(Boolean);
  if (!ids.length) return;

  const [{ data: recipients }, { data: subscriptions }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, email, updates_via_email').in('id', ids),
    supabaseAdmin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', ids),
  ]);

  if (emailSubject && emailHtml) {
    await Promise.all(
      (recipients ?? [])
        .filter((r) => r.email && (!onlyEmailIfOptedIn || r.updates_via_email))
        .map((r) => sendEmail({ to: r.email, subject: emailSubject, html: emailHtml }))
    );
  }

  if (pushPayload && subscriptions?.length) {
    const { staleIds } = await sendPushToSubscriptions(subscriptions, pushPayload);
    if (staleIds.length) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', staleIds);
    }
  }
}
