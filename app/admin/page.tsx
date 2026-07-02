"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ActivityFeed from "./components/ActivityFeed";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin-login");
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password changed successfully. Please login again.");
    setNewPassword("");
    await supabase.auth.signOut();
    router.replace("/admin-login");
  }

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

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayUsers, setTodayUsers] = useState(0);
  const [todayInspections, setTodayInspections] = useState(0);
  const [todaySuccessfulPayments, setTodaySuccessfulPayments] = useState(0);
  const [todayFailedPayments, setTodayFailedPayments] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);

  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthUsers, setMonthUsers] = useState(0);
  const [monthInspections, setMonthInspections] = useState(0);
  const [monthSuccessfulPayments, setMonthSuccessfulPayments] = useState(0);
  const [monthFailedPayments, setMonthFailedPayments] = useState(0);
  const [monthReviews, setMonthReviews] = useState(0);

  useEffect(() => {
    async function protectAdminPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/admin-login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", data.user.email)
        .maybeSingle();

      if (profile?.role !== "admin" && profile?.role !== "super_admin") {
        await supabase.auth.signOut();
        router.replace("/admin-login");
        return;
      }

      loadStats();
    }

    protectAdminPage();
  }, [router]);

  useEffect(() => {
    let warningTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    const logoutAdmin = async () => {
      await supabase.auth.signOut();
      router.replace("/admin-login");
    };

    const resetTimer = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownTimer);

      setShowTimeoutWarning(false);
      setCountdown(60);

      warningTimer = setTimeout(() => {
        setShowTimeoutWarning(true);
        setCountdown(60);

        countdownTimer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 19 * 60 * 1000);

      logoutTimer = setTimeout(logoutAdmin, 20 * 60 * 1000);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownTimer);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

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
      .in("status", ["paid_not_started", "active", "expired"]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const { data: todayPaidPasses } = await supabase
      .from("user_passes")
      .select("amount")
      .in("status", ["paid_not_started", "active", "expired"])
      .gte("created_at", todayIso);

    const todayRevenueTotal =
      todayPaidPasses?.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ) || 0;

    const { count: newUsersToday } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso);

    const { count: inspectionsToday } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso);

    const { count: successfulPaymentsToday } = await supabase
      .from("user_passes")
      .select("*", { count: "exact", head: true })
      .in("status", ["paid_not_started", "active", "expired"])
      .gte("created_at", todayIso);

    const { count: failedPaymentsToday } = await supabase
      .from("user_passes")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", todayIso);

    const { count: reviewsToday } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    const { data: monthPaidPasses } = await supabase
      .from("user_passes")
      .select("amount")
      .in("status", ["paid_not_started", "active", "expired"])
      .gte("created_at", monthIso);

    const monthRevenueTotal =
      monthPaidPasses?.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ) || 0;

    const { count: newUsersThisMonth } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthIso);

    const { count: inspectionsThisMonth } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthIso);

    const { count: successfulPaymentsThisMonth } = await supabase
      .from("user_passes")
      .select("*", { count: "exact", head: true })
      .in("status", ["paid_not_started", "active", "expired"])
      .gte("created_at", monthIso);

    const { count: failedPaymentsThisMonth } = await supabase
      .from("user_passes")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", monthIso);

    const { count: reviewsThisMonth } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthIso);

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

    setTodayRevenue(todayRevenueTotal);
    setTodayUsers(newUsersToday || 0);
    setTodayInspections(inspectionsToday || 0);
    setTodaySuccessfulPayments(successfulPaymentsToday || 0);
    setTodayFailedPayments(failedPaymentsToday || 0);
    setTodayReviews(reviewsToday || 0);

    setMonthRevenue(monthRevenueTotal);
    setMonthUsers(newUsersThisMonth || 0);
    setMonthInspections(inspectionsThisMonth || 0);
    setMonthSuccessfulPayments(successfulPaymentsThisMonth || 0);
    setMonthFailedPayments(failedPaymentsThisMonth || 0);
    setMonthReviews(reviewsThisMonth || 0);

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

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/properties/new"
            className="inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Add New Property
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-full bg-red-600 px-6 py-3 font-black text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-black text-yellow-700">
          Loading dashboard...
        </div>
      )}

      <section className="rounded-[30px] bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-600">
              Today's Performance
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Business Snapshot
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Live summary of today's users, payments, inspections and reviews.
            </p>
          </div>

          <button
            onClick={loadStats}
            className="rounded-full bg-black px-5 py-3 text-sm font-black text-yellow-400 hover:bg-neutral-800"
          >
            Refresh Stats
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <TodayCard title="Revenue Today" value={`GH₵${todayRevenue}`} note="Successful pass sales" />
          <TodayCard title="New Users" value={todayUsers} note="Registered today" />
          <TodayCard title="Inspections" value={todayInspections} note="Booked today" />
          <TodayCard title="Successful Payments" value={todaySuccessfulPayments} note="Completed today" />
          <TodayCard title="Failed Payments" value={todayFailedPayments} note="Failed/cancelled today" />
          <TodayCard title="Reviews" value={todayReviews} note="Submitted today" />
        </div>
      </section>

      <section className="rounded-[30px] bg-black p-8 text-white shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          This Month
        </p>

        <h2 className="mt-2 text-3xl font-black">
          Monthly Performance
        </h2>

        <p className="mt-2 text-sm text-neutral-400">
          Summary of RentDirect activity since the beginning of this month.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MonthCard title="Revenue This Month" value={`GH₵${monthRevenue}`} note="Successful pass sales" />
          <MonthCard title="New Users" value={monthUsers} note="Registered this month" />
          <MonthCard title="Inspections" value={monthInspections} note="Booked this month" />
          <MonthCard title="Successful Payments" value={monthSuccessfulPayments} note="Completed this month" />
          <MonthCard title="Failed Payments" value={monthFailedPayments} note="Failed/cancelled this month" />
          <MonthCard title="Reviews" value={monthReviews} note="Submitted this month" />
        </div>
      </section>

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

      <ActivityFeed />

      <section className="rounded-[30px] bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black">Change Password</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Update your admin password securely.
        </p>

        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <input
            type="password"
            placeholder="Enter new admin password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-5 py-4 font-bold outline-none focus:border-yellow-400"
          />

          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="rounded-2xl bg-black px-6 py-4 font-black text-yellow-400 hover:bg-neutral-800 disabled:opacity-60"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
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

      {showTimeoutWarning && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-3xl bg-black p-6 text-white shadow-2xl border border-yellow-400">
          <h2 className="text-xl font-black text-yellow-400">
            Session Expiring
          </h2>

          <p className="mt-3 text-sm text-neutral-300">
            You will be logged out in {countdown} seconds due to inactivity.
          </p>

          <button
            onClick={() => {
              setShowTimeoutWarning(false);
              setCountdown(60);
            }}
            className="mt-5 rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300"
          >
            Stay Logged In
          </button>
        </div>
      )}
    </main>
  );
}

function MonthCard({
  title,
  value,
  note,
}: {
  title: string;
  value: any;
  note: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/10 p-5">
      <p className="text-sm font-bold text-neutral-300">{title}</p>
      <h3 className="mt-3 text-3xl font-black text-yellow-400">{value}</h3>
      <p className="mt-2 text-xs font-bold text-neutral-400">{note}</p>
    </div>
  );
}

function TodayCard({
  title,
  value,
  note,
}: {
  title: string;
  value: any;
  note: string;
}) {
  return (
    <div className="rounded-[22px] bg-neutral-50 p-5">
      <p className="text-sm font-bold text-neutral-500">{title}</p>
      <h3 className="mt-3 text-3xl font-black">{value}</h3>
      <p className="mt-2 text-xs font-bold text-neutral-400">{note}</p>
    </div>
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