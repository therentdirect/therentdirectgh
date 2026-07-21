"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  user_id: string;
  apartment_request_id: string | null;
  title: string;
  message: string;
  notification_type: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const difference = now.getTime() - date.getTime();
  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "payment_confirmed":
      return "💳";
    case "search_started":
      return "🔍";
    case "progress_update":
      return "📢";
    case "apartments_found":
      return "🏠";
    case "inspection_scheduled":
      return "📅";
    case "search_extended":
      return "⏳";
    case "request_completed":
      return "✅";
    default:
      return "🔔";
  }
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id,user_id,apartment_request_id,title,message,notification_type,action_url,is_read,read_at,created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notification loading error:", error);
      setErrorMessage(
        "We could not load your notifications. Please refresh the page."
      );
      setLoading(false);
      return;
    }

    setNotifications((data as Notification[]) || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(notificationId: string) {
    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
              read_at: now,
            }
          : notification
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
      })
      .eq("id", notificationId);

    if (error) {
      console.error("Mark notification as read error:", error);
      await loadNotifications();
    }
  }

  async function markAllAsRead() {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.is_read
    );

    if (unreadNotifications.length === 0) return;

    setMarkingAll(true);

    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at || now,
      }))
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Mark all notifications as read error:", error);
      setErrorMessage(
        "Some notifications could not be marked as read. Please try again."
      );
      await loadNotifications();
    }

    setMarkingAll(false);
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div className="space-y-8">
      <div className="rounded-[36px] bg-gradient-to-r from-black via-neutral-900 to-black p-8 text-white shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          Dashboard
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black">🔔 Notifications</h1>

            <p className="mt-4 max-w-2xl leading-7 text-neutral-300">
              Stay informed about your payments, apartment search, inspections
              and important RentDirect updates.
            </p>
          </div>

          <div className="w-fit rounded-full bg-white/10 px-5 py-3 text-sm font-black">
            {unreadCount} unread
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-neutral-900">
            Recent Notifications
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Newest notifications appear first.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {markingAll
              ? "Marking..."
              : unreadCount === 0
                ? "All Read"
                : "Mark All as Read"}
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-[30px] border border-neutral-200 bg-white p-6"
            >
              <div className="h-5 w-48 rounded bg-neutral-200" />
              <div className="mt-4 h-4 w-full rounded bg-neutral-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm md:p-20">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 text-5xl">
            🔔
          </div>

          <h3 className="mt-8 text-3xl font-black text-neutral-900">
            No Notifications Yet
          </h3>

          <p className="mx-auto mt-4 max-w-xl leading-8 text-neutral-500">
            Once your apartment search begins, payment is confirmed or an
            important update is available, you will see it here.
          </p>

          <Link
            href="/dashboard/find-me-a-home"
            className="mt-8 inline-flex rounded-full bg-black px-8 py-4 text-sm font-black text-white hover:bg-neutral-800"
          >
            Go to Find Me a Home
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const notificationContent = (
              <div
                className={`relative rounded-[30px] border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  notification.is_read
                    ? "border-neutral-200 bg-white"
                    : "border-yellow-300 bg-yellow-50"
                }`}
              >
                {!notification.is_read && (
                  <span className="absolute right-5 top-5 h-3 w-3 rounded-full bg-red-500" />
                )}

                <div className="flex gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      notification.is_read
                        ? "bg-neutral-100"
                        : "bg-yellow-400"
                    }`}
                  >
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="pr-6">
                      <h3 className="text-lg font-black text-neutral-900">
                        {notification.title}
                      </h3>

                      <p className="mt-2 leading-7 text-neutral-600">
                        {notification.message}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                        {formatNotificationTime(notification.created_at)}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              markAsRead(notification.id);
                            }}
                            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-black text-neutral-700 hover:bg-neutral-100"
                          >
                            Mark as Read
                          </button>
                        )}

                        {notification.action_url && (
                          <span className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">
                            View Update →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );

            if (notification.action_url) {
              return (
                <Link
                  key={notification.id}
                  href={notification.action_url}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                  className="block"
                >
                  {notificationContent}
                </Link>
              );
            }

            return (
              <div key={notification.id}>
                {notificationContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
