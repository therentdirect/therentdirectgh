"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ApartmentRequest = {
  id: string;
  customer_name: string | null;
  user_email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  preferred_region: string | null;
  preferred_city: string | null;
  apartment_type: string | null;
  minimum_budget: number | null;
  maximum_budget: number | null;
  payment_frequency: string | null;
  service_fee: number | null;
  payment_status: string | null;
  request_status: string | null;
  assigned_scout_name: string | null;
  search_expires_at: string | null;
  extension_expires_at: string | null;
  created_at: string;
};

const statusOptions = [
  { value: "", label: "All Requests" },
  { value: "payment_pending", label: "Awaiting Payment" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "search_started", label: "Search Started" },
  { value: "searching", label: "Searching" },
  { value: "apartments_found", label: "Apartments Found" },
  { value: "inspection_scheduled", label: "Inspection Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return "Not set";

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readableStatus(value?: string | null) {
  if (!value) return "Pending";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPaid(status?: string | null) {
  return [
    "paid",
    "successful",
    "success",
    "completed",
    "confirmed",
  ].includes(String(status || "").toLowerCase());
}

function statusStyle(status?: string | null) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "searching":
    case "search_started":
      return "bg-blue-100 text-blue-700";
    case "apartments_found":
      return "bg-purple-100 text-purple-700";
    case "inspection_scheduled":
      return "bg-cyan-100 text-cyan-700";
    case "expired":
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function AdminApartmentRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<ApartmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function protectAndLoad() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/admin-login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      if (
        profile?.role !== "admin" &&
        profile?.role !== "super_admin"
      ) {
        await supabase.auth.signOut();
        router.replace("/admin-login");
        return;
      }

      await loadRequests();
    }

    void protectAndLoad();
  }, [router]);

  async function loadRequests() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("apartment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    setRequests((data || []) as ApartmentRequest[]);
    setLoading(false);
  }

  const statistics = useMemo(() => {
    return {
      total: requests.length,
      paid: requests.filter((item) =>
        isPaid(item.payment_status)
      ).length,
      searching: requests.filter((item) =>
        ["search_started", "searching"].includes(
          String(item.request_status)
        )
      ).length,
      found: requests.filter(
        (item) => item.request_status === "apartments_found"
      ).length,
      completed: requests.filter(
        (item) => item.request_status === "completed"
      ).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesStatus =
        !statusFilter || item.request_status === statusFilter;

      const paid = isPaid(item.payment_status);

      const matchesPayment =
        !paymentFilter ||
        (paymentFilter === "paid" && paid) ||
        (paymentFilter === "unpaid" && !paid);

      const requestReference = `RD-${new Date(
        item.created_at
      ).getFullYear()}-${item.id.slice(0, 8)}`.toLowerCase();

      const matchesSearch =
        !cleanSearch ||
        String(item.customer_name || "")
          .toLowerCase()
          .includes(cleanSearch) ||
        String(item.user_email || "")
          .toLowerCase()
          .includes(cleanSearch) ||
        String(item.phone || "")
          .toLowerCase()
          .includes(cleanSearch) ||
        String(item.whatsapp_number || "")
          .toLowerCase()
          .includes(cleanSearch) ||
        item.id.toLowerCase().includes(cleanSearch) ||
        requestReference.includes(cleanSearch);

      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [requests, statusFilter, paymentFilter, search]);

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-neutral-200 border-t-yellow-400" />

        <p className="mt-4 font-bold text-neutral-500">
          Loading apartment search requests...
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-[32px] bg-black p-7 text-white shadow-xl md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
              RentDirect Admin
            </p>

            <h1 className="mt-3 text-3xl font-black md:text-5xl">
              Apartment Search Requests
            </h1>

            <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-neutral-300">
              Manage Find Me a Home customers, payments, scouts,
              search progress and completion.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-black text-black hover:bg-yellow-300"
          >
            Refresh Requests
          </button>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center font-bold text-red-700">
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Requests" value={statistics.total} />
        <StatCard label="Paid Requests" value={statistics.paid} />
        <StatCard label="Currently Searching" value={statistics.searching} />
        <StatCard label="Apartments Found" value={statistics.found} />
        <StatCard label="Completed" value={statistics.completed} />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-sm md:p-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_230px_200px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, email or request ID..."
            className="rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm font-semibold outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm font-bold outline-none focus:border-yellow-400"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value)
            }
            className="rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm font-bold outline-none focus:border-yellow-400"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-neutral-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>

          {(search || statusFilter || paymentFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPaymentFilter("");
              }}
              className="text-sm font-black text-yellow-700 underline underline-offset-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-2xl">
              🏠
            </div>

            <h2 className="mt-5 text-xl font-black">
              No requests found
            </h2>

            <p className="mt-2 text-sm font-medium text-neutral-500">
              Apartment-search requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-6 py-5">Request</th>
                  <th className="px-6 py-5">Customer</th>
                  <th className="px-6 py-5">Location</th>
                  <th className="px-6 py-5">Property</th>
                  <th className="px-6 py-5">Budget</th>
                  <th className="px-6 py-5">Payment</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Scout</th>
                  <th className="px-6 py-5">Submitted</th>
                  <th className="px-6 py-5">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((item) => {
                  const paid = isPaid(item.payment_status);

                  const reference = `RD-${new Date(
                    item.created_at
                  ).getFullYear()}-${item.id
                    .slice(0, 8)
                    .toUpperCase()}`;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black text-neutral-900">
                          {reference}
                        </p>

                        <p className="mt-1 text-xs font-medium text-neutral-400">
                          {item.id.slice(0, 18)}...
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-black text-neutral-900">
                          {item.customer_name || "Unnamed customer"}
                        </p>

                        <p className="mt-1 text-sm font-medium text-neutral-500">
                          {item.phone ||
                            item.whatsapp_number ||
                            "No phone"}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                          {item.user_email || "No email"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-neutral-800">
                          {item.preferred_city || "Not specified"}
                        </p>

                        <p className="mt-1 text-sm text-neutral-500">
                          {item.preferred_region || "No region"}
                        </p>
                      </td>

                      <td className="px-6 py-5 font-bold text-neutral-700">
                        {item.apartment_type || "Not specified"}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-black text-neutral-900">
                          {formatMoney(item.minimum_budget)}
                          {" – "}
                          {formatMoney(item.maximum_budget)}
                        </p>

                        <p className="mt-1 text-xs font-medium text-neutral-400">
                          {item.payment_frequency === "Yearly"
                            ? "Per year"
                            : "Per month"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-black ${
                            paid
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {paid ? "Paid" : "Unpaid"}
                        </span>

                        <p className="mt-2 text-xs font-bold text-neutral-500">
                          GH₵{Number(item.service_fee || 450)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-black ${statusStyle(
                            item.request_status
                          )}`}
                        >
                          {readableStatus(item.request_status)}
                        </span>
                      </td>

                      <td className="px-6 py-5 font-bold text-neutral-700">
                        {item.assigned_scout_name || "Not assigned"}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-neutral-500">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/apartment-requests/${item.id}`}
                          className="inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-black text-white hover:bg-neutral-800"
                        >
                          View Request
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-neutral-900">
        {value}
      </p>
    </div>
  );
}
