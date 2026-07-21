"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function convertVapidKey(base64String: string) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0))
  );
}

export default function PushNotificationButton() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkStatus() {
      const isSupported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setSupported(isSupported);

      if (!isSupported) return;

      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      setEnabled(Boolean(subscription));
    }

    checkStatus();
  }, []);

  async function enableNotifications() {
    setLoading(true);
    setMessage("");

    try {
      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        setMessage(
          "Notification permission was not granted."
        );
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setMessage(
          "Please log in before enabling notifications."
        );
        return;
      }

      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setMessage("The public notification key is missing.");
        return;
      }

      const registration =
        await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              convertVapidKey(publicKey),
          });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: data.user.id,
          subscription: subscription.toJSON(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to enable notifications."
        );
      }

      setEnabled(true);
      setMessage("Notifications enabled successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to enable notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications() {
    setLoading(true);
    setMessage("");

    try {
      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        await subscription.unsubscribe();
      }

      setEnabled(false);
      setMessage("Notifications disabled.");
    } catch {
      setMessage("Unable to disable notifications.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="fixed bottom-20 right-5 z-[100]">
      <button
        type="button"
        disabled={loading}
        onClick={
          enabled
            ? disableNotifications
            : enableNotifications
        }
        className="rounded-full bg-black px-5 py-3 text-sm font-black text-white shadow-2xl transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Please wait..."
          : enabled
            ? "Notifications On"
            : "Enable Notifications"}
      </button>

      {message && (
        <div className="mt-2 max-w-64 rounded-2xl bg-white p-3 text-xs font-bold text-neutral-700 shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
}
