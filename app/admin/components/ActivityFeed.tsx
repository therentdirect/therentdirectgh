"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  href: string;
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();

    const interval = setInterval(() => {
      loadActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadActivities() {
    setLoading(true);

    const [usersRes, paymentsRes, inspectionsRes, reviewsRes, propertiesRes] =
      await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("user_passes").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("inspections").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("properties").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

    const feed: Activity[] = [];

    usersRes.data?.forEach((user: any) => {
      feed.push({
        id: `user-${user.id}`,
        icon: "👤",
        title: "New User Registered",
        description: `${user.first_name || "No first name"} ${user.last_name || ""} • ${user.email || "No email"}`,
        time: user.created_at,
        href: "/admin/users",
      });
    });

    paymentsRes.data?.forEach((payment: any) => {
      feed.push({
        id: `payment-${payment.id}`,
        icon: payment.status === "failed" ? "❌" : "💰",
        title: payment.status === "failed" ? "Payment Failed" : "Inspection Pass Payment",
        description: `${payment.username || payment.user_email || "Unknown user"} • GH₵${payment.amount || 250} • ${payment.status}`,
        time: payment.created_at,
        href: "/admin/payments",
      });
    });

    inspectionsRes.data?.forEach((inspection: any) => {
      feed.push({
        id: `inspection-${inspection.id}`,
        icon: "🏠",
        title: "Inspection Scheduled",
        description: `${inspection.user_name || inspection.user_email || "Unknown user"} • ${inspection.property_title || "Property"}`,
        time: inspection.created_at,
        href: "/admin/inspections",
      });
    });

    reviewsRes.data?.forEach((review: any) => {
      feed.push({
        id: `review-${review.id}`,
        icon: "⭐",
        title: "New Review Submitted",
        description: `${review.user_name || review.user_email || "User"} • ${review.status || "pending"}`,
        time: review.created_at,
        href: "/admin/reviews",
      });
    });

    propertiesRes.data?.forEach((property: any) => {
      feed.push({
        id: `property-${property.id}`,
        icon: "🏡",
        title: "Property Added",
        description: `${property.title || "New property"} • ${property.area || ""}, ${property.city || ""}`,
        time: property.created_at,
        href: "/admin/properties",
      });
    });

    feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    setActivities(feed.slice(0, 10));
    setLoading(false);
  }

  return (
    <section className="rounded-[30px] bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Live Activity Feed</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Recent activity across users, payments, inspections, reviews and properties.
          </p>
        </div>

        <button
          onClick={loadActivities}
          className="rounded-full bg-black px-5 py-3 text-sm font-black text-yellow-400 hover:bg-neutral-800"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-neutral-50 p-5 text-center font-bold text-neutral-500">
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl bg-neutral-50 p-5 text-center font-bold text-neutral-500">
            No activity yet.
          </div>
        ) : (
          activities.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start gap-4 rounded-2xl bg-neutral-50 p-4 transition hover:bg-yellow-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-black text-neutral-900">{item.title}</h3>
                <p className="mt-1 truncate text-sm font-bold text-neutral-500">
                  {item.description}
                </p>
                <p className="mt-2 text-xs font-bold text-neutral-400">
                  {new Date(item.time).toLocaleString()}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
