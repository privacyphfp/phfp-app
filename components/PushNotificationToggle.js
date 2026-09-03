'use client';

import { useEffect, useState } from 'react';

// Converts the VAPID public key (base64url, from the server) into the
// Uint8Array format the Push API wants.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function subscribe() {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    });

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not save subscription.');
    }
    return true;
  }

  useEffect(() => {
    // navigator/window aren't available during SSR, so browser-capability
    // detection can only happen once mounted on the client — an
    // unavoidable one-shot effect, not a value derivable from props/state.
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(false);
      return;
    }

    (async () => {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        setEnabled(true);
        return;
      }

      if (Notification.permission === 'denied') {
        setBlocked(true);
        return;
      }

      // On by default: the FIRST time this browser ever lands here, ask
      // automatically instead of waiting for them to find and click a
      // button — someone who forgets to opt in just never hears about
      // anything. Only ever auto-prompted once per browser though (see
      // the localStorage flag below) — if they ignored/dismissed it that
      // one time, re-popping the native prompt on every single visit
      // would just be nagging, so after that it's back to a plain
      // visible button they can click on their own terms.
      let alreadyPrompted = true;
      try {
        alreadyPrompted = localStorage.getItem('phfp-push-prompted') === '1';
      } catch {
        // Storage can throw (private browsing, blocked cookies, etc.) —
        // treat as "already prompted" so we fail toward the safer,
        // less-intrusive manual-button path instead of retrying forever.
      }
      if (alreadyPrompted) return;

      try {
        const success = await subscribe();
        setEnabled(success);
      } catch {
        // Silent — a transient failure on an unprompted attempt
        // shouldn't surface an error message out of nowhere. The manual
        // button below still works.
      } finally {
        try {
          localStorage.setItem('phfp-push-prompted', '1');
        } catch {
          // Ignored — worst case we auto-prompt again next visit, which
          // is no worse than before this change.
        }
      }
    })();
  }, []);

  async function handleEnable() {
    setError(null);
    setLoading(true);
    try {
      if (Notification.permission === 'denied') {
        setError('Notifications are blocked for this site in your browser settings.');
        return;
      }
      const success = await subscribe();
      if (!success) {
        setError('Please allow notifications to turn this on.');
        return;
      }
      setEnabled(true);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setEnabled(false);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <button
          type="button"
          onClick={handleDisable}
          disabled={loading}
          className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
        >
          🔔 Notifications on — turn off
        </button>
      ) : blocked ? (
        <span className="text-xs text-brand-ink/40">
          🔕 Notifications blocked — allow them for this site in your browser settings if you&apos;d like updates.
        </span>
      ) : (
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
        >
          {loading ? 'Turning on…' : '🔕 Turn on notifications'}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
