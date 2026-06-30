"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type VisitorLog = {
  id: string;
  visitor_id: string;
  user_email: string | null;
  page_path: string;
  browser: string | null;
  device: string | null;
  created_at: string;
};

export default function AdminAnalyticsPage() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);

    const { data, error } = await supabase
      .from("visitor_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) setMessage(error.message);
    if (data) setLogs(data);

    setLoading(false);
  }

  const today = new Date().toDateString();

  const totalVisits = logs.length;
  const uniqueVisitors = new Set(logs.map((log) => log.visitor_id)).size;

  const todayVisits = logs.filter(
    (log) => new Date(log.created_at).toDateString() === today
  ).length;

  const loggedInVisits = logs.filter((log) => log.user_email).length;
  const guestVisits = logs.filter((log) => !log.user_email).length;

  const pageStats = useMemo(() => {
    const pages: Record<string, number> = {};

    logs.forEach((log) => {
      pages[log.page_path] = (pages[log.page_path] || 0) + 1;
    });

    return Object.entries(pages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [logs]);

  const deviceStats = useMemo(() => {
    const devices: Record<string, number> = {};

    logs.forEach((log) => {
      const device = log.device || "Unknown";
      devices[device] = (devices[device] || 0) + 1;
    });

    return Object.entries(devices).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const browserStats = useMemo(() => {
    const browsers: Record<string, number> = {};

    logs.forEach((log) => {
      const browser = log.browser || "Unknown";
      browsers[browser] = (browsers[browser] || 0) + 1;
    });

    return Object.entries(browsers).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  return (
    <main className="space-y-8">
      <section className="rounded-[32px] bg-black p-8 text-white shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-3 text-4xl font-black">Visitor Analytics</h1>

        <p className="mt-3 max-w-2xl text-neutral-300">
          Track website visits, page views, devices, browsers and logged-in user activity.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-black text-yellow-700">
          {message}
        </div>
      )}

      {loading ? (
        <section className="rounded-[32px] bg-white p-12 text-center text-neutral-500">
          Loading analytics...
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-5">
            <Card title="Total Visits" value={totalVisits} />
            <Card title="Unique Visitors" value={uniqueVisitors} />
            <Card title="Today" value={todayVisits} />
            <Card title="Logged In" value={loggedInVisits} />
            <Card title="Guests" value={guestVisits} />
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[32px] bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-2xl font-black">Most Visited Pages</h2>

              <div className="mt-6 space-y-3">
                {pageStats.length === 0 ? (
                  <p className="text-neutral-500">No page visits yet.</p>
                ) : (
                  pageStats.map(([page, count]) => (
                    <div
                      key={page}
                      className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"
                    >
                      <p className="font-bold text-neutral-700">{page}</p>
                      <p className="font-black">{count}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Devices</h2>

              <div className="mt-6 space-y-3">
                {deviceStats.map(([device, count]) => (
                  <div
                    key={device}
                    className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"
                  >
                    <p className="font-bold">{device}</p>
                    <p className="font-black">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Browsers</h2>

              <div className="mt-6 space-y-3">
                {browserStats.map(([browser, count]) => (
                  <div
                    key={browser}
                    className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"
                  >
                    <p className="font-bold">{browser}</p>
                    <p className="font-black">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Recent Visits</h2>

              <div className="mt-6 max-h-[420px] space-y-3 overflow-y-auto">
                {logs.slice(0, 12).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-neutral-50 p-4">
                    <p className="font-black">{log.page_path}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {log.device || "Unknown"} • {log.browser || "Unknown"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {log.user_email || "Guest visitor"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-neutral-500">{title}</p>
      <h2 className="mt-2 text-3xl font-black">{value}</h2>
    </div>
  );
}