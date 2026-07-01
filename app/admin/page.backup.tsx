"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState(0);
  const [properties, setProperties] = useState(0);
  const [available, setAvailable] = useState(0);
  const [rented, setRented] = useState(0);
  const [pendingPasses, setPendingPasses] = useState(0);
  const [activePasses, setActivePasses] = useState(0);
  const [inspections, setInspections] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [pendingReviews, setPendingReviews] = useState(0);
  const [approvedReviews, setApprovedReviews] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function getCount(
    table: string,
    filter?: { column: string; value: any }
  ) {
    let query = supabase.from(table).select("*", {
      count: "exact",
      head: true,
    });

    if (filter) query = query.eq(filter.column, filter.value);

    const { count } = await query;

    return count || 0;
  }

  async function loadStats() {
    setLoading(true);

    const totalUsers = await getCount("profiles");
    const totalProperties = await getCount("properties");

    const availableHomes = await getCount("properties", {
      column: "status",
      value: "Available",
    });

    const rentedHomes = await getCount("properties", {
      column: "status",
      value: "Rented",
    });

    const pending = await getCount("user_passes", {
      column: "status",
      value: "pending_verification",
    });

    const active = await getCount("user_passes", {
      column: "status",
      value: "active",
    });

    const totalInspections = await getCount("inspections");

    const pendingReviewCount = await getCount("reviews", {
      column: "status",
      value: "pending",
    });

    const approvedReviewCount = await getCount("reviews", {
      column: "status",
      value: "approved",
    });

    const { data: approvedPasses } = await supabase
      .from("user_passes")
      .select("amount")
      .eq("status", "active");

    const totalRevenue =
      approvedPasses?.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ) || 0;

    setUsers(totalUsers);
    setProperties(totalProperties);
    setAvailable(availableHomes);
    setRented(rentedHomes);
    setPendingPasses(pending);
    setActivePasses(active);
    setInspections(totalInspections);
    setRevenue(totalRevenue);

    setPendingReviews(pendingReviewCount);
    setApprovedReviews(approvedReviewCount);

    setLoading(false);
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `GH₵${revenue}`,
      note: "Approved inspection pass payments",
      href: "/admin/payments",
    },
    {
      title: "Registered Users",
      value: users,
      note: "All RentDirect users",
      href: "/admin/users",
    },
    {
      title: "Total Properties",
      value: properties,
      note: "Properties uploaded",
      href: "/admin/properties",
    },
    {
      title: "Available Homes",
      value: available,
      note: "Currently available",
      href: "/admin/properties",
    },
    {
      title: "Rented Homes",
      value: rented,
      note: "Already rented",
      href: "/admin/properties",
    },
    {
      title: "Active Passes",
      value: activePasses,
      note: "30-day passes",
      href: "/admin/payments",
    },
    {
      title: "Pending Passes",
      value: pendingPasses,
      note: "Waiting for approval",
      href: "/admin/payments",
    },
    {
      title: "Inspection Requests",
      value: inspections,
      note: "Total inspections",
      href: "/admin/inspections",
    },
    {
      title: "Pending Reviews",
      value: pendingReviews,
      note: "Waiting for approval",
      href: "/admin/reviews",
    },
    {
      title: "Approved Reviews",
      value: approvedReviews,
      note: "Visible on website",
      href: "/admin/reviews",
    },
  ];

  return (
    <main className="space-y-8">

      <section className="rounded-[30px] bg-black p-8 text-white">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Welcome back, Joseph
        </h1>

        <p className="mt-3 max-w-3xl text-neutral-300">
          Manage properties, payments, inspections, reviews and users from one dashboard.
        </p>

        <Link
          href="/admin/properties/new"
          className="mt-6 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
        >
          Add New Property
        </Link>
      </section>

      {loading && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-black text-yellow-700">
          Loading dashboard...
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-[24px] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-sm font-bold text-neutral-500">
              {card.title}
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {card.value}
            </h2>

            <p className="mt-3 text-sm text-neutral-500">
              {card.note}
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-[30px] bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Quick Actions
          </h2>

          <div className="mt-6 grid gap-4">

            <AdminButton
              href="/admin/properties/new"
              text="Add New Property"
            />

            <AdminButton
              href="/admin/properties"
              text="Manage Properties"
            />

            <AdminButton
              href="/admin/payments"
              text="Approve Inspection Pass Payments"
            />

            <AdminButton
              href="/admin/users"
              text="View Registered Users"
            />

            <AdminButton
              href="/admin/inspections"
              text="Manage Inspections"
            />

            <AdminButton
              href="/admin/reviews"
              text="Approve Reviews"
            />

          </div>

        </div>

        <div className="rounded-[30px] bg-black p-8 text-white">

          <h2 className="text-3xl font-black">
            Revenue Overview
          </h2>

          <p className="mt-3 text-neutral-400">
            Based on approved inspection pass payments.
          </p>

          <h3 className="mt-8 text-6xl font-black text-yellow-400">
            GH₵{revenue}
          </h3>

          <Link
            href="/admin/payments"
            className="mt-8 inline-block rounded-full border border-yellow-400 px-6 py-3 font-black text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            View Payments
          </Link>

        </div>

      </section>

    </main>
  );
}

function AdminButton({
  href,
  text,
}: {
  href: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-neutral-100 px-5 py-4 font-black transition hover:bg-yellow-400"
    >
      {text}
    </Link>
  );
}