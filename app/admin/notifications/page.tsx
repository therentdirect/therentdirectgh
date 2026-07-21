"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [audience, setAudience] = useState<"all" | "specific">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("RentDirect Ghana");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/dashboard/notifications");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    async function protectAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin-login");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      if (
        adminProfile?.role !== "admin" &&
        adminProfile?.role !== "super_admin"
      ) {
        await supabase.auth.signOut();
        router.replace("/admin-login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("created_at", { ascending: false });

      if (error) {
        setStatus("Unable to load registered users.");
        setStatusType("error");
      } else {
        setProfiles(data || []);
      }

      setLoadingUsers(false);
    }

    void protectAndLoad();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("");
    setStatusType("");

    if (!title.trim()) {
      setStatus("Enter a notification title.");
      setStatusType("error");
      return;
    }

    if (!message.trim()) {
      setStatus("Enter a notification message.");
      setStatusType("error");
      return;
    }

    if (audience === "specific" && !selectedUserId) {
      setStatus("Select the user who should receive the notification.");
      setStatusType("error");
      return;
    }

    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your admin session has expired. Please log in again.");
      }

      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          audience,
          userId: audience === "specific" ? selectedUserId : undefined,
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || "/dashboard/notifications",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to send notification.");
      }

      setStatus(
        `Notification sent successfully to ${result.sent || 0} device${
          result.sent === 1 ? "" : "s"
        }.`
      );
      setStatusType("success");
      setMessage("");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to send notification."
      );
      setStatusType("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="space-y-8">
      <section className="rounded-[30px] bg-black p-8 text-white">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Push Notifications
        </h1>

        <p className="mt-3 max-w-3xl text-neutral-300">
          Send important updates, new apartment alerts, inspection reminders,
          and announcements directly to subscribed users.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[30px] bg-white p-8 shadow-sm"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-600">
              New Message
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Send Notification
            </h2>
          </div>

          <div className="mt-8">
            <label className="text-sm font-black text-neutral-700">
              Audience
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAudience("all")}
                className={`rounded-2xl border px-5 py-4 text-left font-black transition ${
                  audience === "all"
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-neutral-200 bg-white hover:border-yellow-400"
                }`}
              >
                All subscribed users
              </button>

              <button
                type="button"
                onClick={() => setAudience("specific")}
                className={`rounded-2xl border px-5 py-4 text-left font-black transition ${
                  audience === "specific"
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-neutral-200 bg-white hover:border-yellow-400"
                }`}
              >
                One specific user
              </button>
            </div>
          </div>

          {audience === "specific" && (
            <div className="mt-6">
              <label
                htmlFor="notification-user"
                className="text-sm font-black text-neutral-700"
              >
                Select user
              </label>

              <select
                id="notification-user"
                value={selectedUserId}
                onChange={(event) =>
                  setSelectedUserId(event.target.value)
                }
                disabled={loadingUsers}
                className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 font-bold outline-none focus:border-yellow-400"
              >
                <option value="">
                  {loadingUsers ? "Loading users..." : "Choose a user"}
                </option>

                {profiles.map((profile) => {
                  const fullName = [
                    profile.first_name,
                    profile.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <option key={profile.id} value={profile.id}>
                      {fullName || "RentDirect User"}
                      {profile.email ? ` — ${profile.email}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="mt-6">
            <label
              htmlFor="notification-title"
              className="text-sm font-black text-neutral-700"
            >
              Notification title
            </label>

            <input
              id="notification-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="RentDirect Ghana"
              className="mt-3 w-full rounded-2xl border border-neutral-200 px-5 py-4 font-bold outline-none focus:border-yellow-400"
            />
          </div>

          <div className="mt-6">
            <label
              htmlFor="notification-message"
              className="text-sm font-black text-neutral-700"
            >
              Message
            </label>

            <textarea
              id="notification-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={250}
              rows={6}
              placeholder="A new verified apartment is available in East Legon..."
              className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 px-5 py-4 font-bold outline-none focus:border-yellow-400"
            />

            <p className="mt-2 text-right text-xs font-bold text-neutral-400">
              {message.length}/250
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="notification-url"
              className="text-sm font-black text-neutral-700"
            >
              Destination link
            </label>

            <input
              id="notification-url"
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="/dashboard/apartments"
              className="mt-3 w-full rounded-2xl border border-neutral-200 px-5 py-4 font-bold outline-none focus:border-yellow-400"
            />

            <p className="mt-2 text-xs font-bold text-neutral-400">
              Users will be taken to this page when they click the notification.
            </p>
          </div>

          {status && (
            <div
              className={`mt-6 rounded-2xl p-4 font-bold ${
                statusType === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="mt-8 w-full rounded-2xl bg-black px-6 py-4 font-black text-yellow-400 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending Notification..." : "Send Notification"}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[30px] bg-yellow-400 p-8 text-black">
            <p className="text-sm font-black uppercase tracking-[0.3em]">
              Subscribers
            </p>

            <h2 className="mt-4 text-5xl font-black">
              {profiles.length}
            </h2>

            <p className="mt-3 font-bold">
              Registered users available for individual selection.
            </p>
          </div>

          <div className="rounded-[30px] bg-black p-8 text-white">
            <h2 className="text-2xl font-black">
              Suggested messages
            </h2>

            <div className="mt-6 space-y-4">
              <Suggestion
                title="New apartment"
                message="A new verified apartment has been listed. Open RentDirect to view it."
                onUse={(value) => {
                  setTitle("New Apartment Available");
                  setMessage(value);
                  setUrl("/dashboard/apartments");
                }}
              />

              <Suggestion
                title="Inspection reminder"
                message="Reminder: You have an upcoming apartment inspection. Check your inspection details."
                onUse={(value) => {
                  setTitle("Inspection Reminder");
                  setMessage(value);
                  setUrl("/dashboard/inspections");
                }}
              />

              <Suggestion
                title="Pass reminder"
                message="Your RentDirect inspection pass will expire soon. Renew it to continue unlocking landlord contacts."
                onUse={(value) => {
                  setTitle("Inspection Pass Reminder");
                  setMessage(value);
                  setUrl("/dashboard/pass");
                }}
              />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Suggestion({
  title,
  message,
  onUse,
}: {
  title: string;
  message: string;
  onUse: (message: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onUse(message)}
      className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-left transition hover:border-yellow-400"
    >
      <p className="font-black text-yellow-400">{title}</p>
      <p className="mt-2 text-sm text-neutral-300">{message}</p>
    </button>
  );
}
