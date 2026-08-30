import webpush from 'web-push';

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

// Sends one push payload to every subscription row passed in (already
// fetched by the caller — this module doesn't touch the database itself,
// so it works the same from any API route). A subscription that's gone
// stale (410/404 — the browser unsubscribed or the device is gone) is
// reported back so the caller can delete it; any other failure is just
// logged and skipped, never thrown, so one bad subscription can't stop
// the rest from being notified.
export async function sendPushToSubscriptions(subscriptions, payload) {
  if (!ensureConfigured()) {
    return { sent: 0, staleIds: [], error: 'Web push not configured (VAPID keys missing).' };
  }

  const body = JSON.stringify(payload);
  let sent = 0;
  const staleIds = [];

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(sub.id);
        }
        // Other errors (rate limiting, payload too large, etc.) are
        // skipped silently — not worth failing the whole batch over.
      }
    })
  );

  return { sent, staleIds };
}
