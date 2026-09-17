"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/app/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function PushSubscribeBanner() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission !== "default") return;
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      if (!registration) return;
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled && !existing) setVisible(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleActivate() {
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      const json = subscription.toJSON();
      if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
        await subscribeToPush({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
      }
    } finally {
      setPending(false);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
      <p className="text-sm text-foreground">
        Active les rappels pour ne pas oublier de verser.
      </p>
      <button
        type="button"
        onClick={handleActivate}
        disabled={pending}
        className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        Activer les rappels
      </button>
    </div>
  );
}
