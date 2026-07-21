"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ApartmentRequest = {
  id: string;
  customer_name: string | null;
  user_email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  preferred_region: string | null;
  preferred_city: string | null;
  preferred_locations: string | null;
  apartment_type: string | null;
  bedrooms: number | null;
  furnished_preference: string | null;
  minimum_budget: number | null;
  maximum_budget: number | null;
  payment_frequency: string | null;
  rental_duration_years: number | null;
  preferred_move_in_date: string | null;
  additional_requirements: string | null;
  budget_flexibility: string | null;
  move_urgency: string | null;
  nearby_areas_preference: string | null;
  service_fee: number | null;
  payment_status: string | null;
  hubtel_payment_status: string | null;
  request_status: string | null;
  assigned_scout_name: string | null;
  assigned_scout_phone: string | null;
  latest_update: string | null;
  tenant_update: string | null;
  admin_notes: string | null;
  search_started_at: string | null;
  search_expires_at: string | null;
  extension_expires_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  extended_at: string | null;
  created_at: string;
};

const REQUEST_STATUSES = [
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

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "Not provided";

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readable(value: string | null) {
  if (!value) return "Not provided";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isPaymentConfirmed(request: ApartmentRequest) {
  const statuses = [
    request.payment_status,
    request.hubtel_payment_status,
  ].map((status) => String(status || "").toLowerCase());

  return statuses.some((status) =>
    ["paid", "successful", "success", "completed", "confirmed"].includes(
      status
    )
  );
}

export default function ApartmentRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<ApartmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [assignedScoutName, setAssignedScoutName] = useState("");
  const [assignedScoutPhone, setAssignedScoutPhone] = useState("");
  const [requestStatus, setRequestStatus] = useState("payment_pending");
  const [latestUpdate, setLatestUpdate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    void protectAndLoad();
  }, [params.id, router]);

  function populateForm(data: ApartmentRequest) {
    setAssignedScoutName(data.assigned_scout_name || "");
    setAssignedScoutPhone(data.assigned_scout_phone || "");
    setRequestStatus(data.request_status || "payment_pending");
    setLatestUpdate(data.latest_update || "");
    setAdminNotes(data.admin_notes || "");
  }

  async function protectAndLoad() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/admin-login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", user.email)
      .maybeSingle();

    if (
      profileError ||
      (profile?.role !== "admin" &&
        profile?.role !== "super_admin")
    ) {
      router.replace("/dashboard");
      return;
    }

    await loadRequest();
  }

  async function loadRequest() {
    const { data, error } = await supabase
      .from("apartment_requests")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      showMessage(error.message, "error");
      setLoading(false);
      return;
    }

    if (!data) {
      showMessage("Request not found.", "error");
      setRequest(null);
      setLoading(false);
      return;
    }

    const apartmentRequest = data as ApartmentRequest;

    setRequest(apartmentRequest);
    populateForm(apartmentRequest);
    setLoading(false);
  }

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveChanges() {
    if (!request) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("apartment_requests")
      .update({
        assigned_scout_name:
          assignedScoutName.trim() || null,
        assigned_scout_phone:
          assignedScoutPhone.trim() || null,
        request_status: requestStatus,
        latest_update: latestUpdate.trim() || null,
        admin_notes: adminNotes.trim() || null,
      })
      .eq("id", request.id)
      .select("*")
      .single();

    if (error) {
      showMessage(error.message, "error");
      setSaving(false);
      return;
    }

    const updatedRequest = data as ApartmentRequest;

    setRequest(updatedRequest);
    populateForm(updatedRequest);
    showMessage(
      "Request details saved successfully.",
      "success"
    );
    setSaving(false);
  }

  async function startSearch() {
    if (!request) return;

    if (!isPaymentConfirmed(request)) {
      showMessage(
        "Payment must be confirmed before the 30-day apartment search can start.",
        "error"
      );
      return;
    }

    if (
      !assignedScoutName.trim() ||
      !assignedScoutPhone.trim()
    ) {
      showMessage(
        "Please enter the scout name and phone number before starting the search.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      "Start the 30-day apartment search now?"
    );

    if (!confirmed) return;

    setActionLoading("start");
    setMessage("");

    const startedAt = new Date();
    const expiresAt = addDays(startedAt, 30);

    const { data, error } = await supabase
      .from("apartment_requests")
      .update({
        assigned_scout_name: assignedScoutName.trim(),
        assigned_scout_phone: assignedScoutPhone.trim(),
        request_status: "search_started",
        latest_update:
          latestUpdate.trim() ||
          "Your 30-day apartment search has started. Our search officer is actively looking for apartments that match your request.",
        admin_notes: adminNotes.trim() || null,
        search_started_at: startedAt.toISOString(),
        search_expires_at: expiresAt.toISOString(),
      })
      .eq("id", request.id)
      .select("*")
      .single();

    if (error) {
      showMessage(error.message, "error");
      setActionLoading("");
      return;
    }

    const updatedRequest = data as ApartmentRequest;

    setRequest(updatedRequest);
    populateForm(updatedRequest);
    showMessage(
      "The 30-day apartment search has started.",
      "success"
    );
    setActionLoading("");
  }

  async function extendSearch() {
    if (!request) return;

    if (!request.search_started_at) {
      showMessage(
        "Start the apartment search before giving an extension.",
        "error"
      );
      return;
    }

    if (request.extension_expires_at) {
      showMessage(
        "The free 15-day extension has already been applied.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      "Give this customer the free 15-day extension?"
    );

    if (!confirmed) return;

    setActionLoading("extend");
    setMessage("");

    const extensionStart = request.search_expires_at
      ? new Date(request.search_expires_at)
      : new Date();

    const extensionExpires = addDays(extensionStart, 15);
    const extendedAt = new Date();

    const { data, error } = await supabase
      .from("apartment_requests")
      .update({
        request_status: "searching",
        extended_at: extendedAt.toISOString(),
        extension_expires_at:
          extensionExpires.toISOString(),
        latest_update:
          latestUpdate.trim() ||
          "Your apartment search has been extended for an additional 15 days at no extra cost.",
        admin_notes: adminNotes.trim() || null,
      })
      .eq("id", request.id)
      .select("*")
      .single();

    if (error) {
      showMessage(error.message, "error");
      setActionLoading("");
      return;
    }

    const updatedRequest = data as ApartmentRequest;

    setRequest(updatedRequest);
    populateForm(updatedRequest);
    showMessage(
      "The free 15-day extension has been applied.",
      "success"
    );
    setActionLoading("");
  }

  async function markCompleted() {
    if (!request) return;

    const confirmed = window.confirm(
      "Mark this apartment search request as completed?"
    );

    if (!confirmed) return;

    setActionLoading("complete");
    setMessage("");

    const completedAt = new Date();

    const { data, error } = await supabase
      .from("apartment_requests")
      .update({
        request_status: "completed",
        completed_at: completedAt.toISOString(),
        latest_update:
          latestUpdate.trim() ||
          "Your RentDirect apartment search request has been completed.",
        admin_notes: adminNotes.trim() || null,
      })
      .eq("id", request.id)
      .select("*")
      .single();

    if (error) {
      showMessage(error.message, "error");
      setActionLoading("");
      return;
    }

    const updatedRequest = data as ApartmentRequest;

    setRequest(updatedRequest);
    populateForm(updatedRequest);
    showMessage(
      "The apartment search request has been completed.",
      "success"
    );
    setActionLoading("");
  }

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-neutral-200 border-t-yellow-400" />

        <p className="mt-4 font-bold text-neutral-500">
          Loading request...
        </p>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <h1 className="text-2xl font-black">
          Request unavailable
        </h1>

        <p className="mt-3 text-red-600">
          {message || "Request not found."}
        </p>

        <Link
          href="/admin/apartment-requests"
          className="mt-6 inline-flex rounded-full bg-black px-6 py-3 font-black text-white"
        >
          Back to Requests
        </Link>
      </main>
    );
  }

  const reference = `RD-${new Date(
    request.created_at
  ).getFullYear()}-${request.id.slice(0, 8).toUpperCase()}`;

  const isBusy = saving || Boolean(actionLoading);

  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-[32px] bg-black p-7 text-white shadow-xl md:p-10">
        <Link
          href="/admin/apartment-requests"
          className="text-sm font-black text-yellow-400"
        >
          ← Back to Requests
        </Link>

        <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-3 text-3xl font-black md:text-5xl">
          {reference}
        </h1>

        <p className="mt-3 text-neutral-300">
          Submitted {formatDate(request.created_at)}
        </p>
      </section>

      {message && (
        <div
          className={`rounded-2xl border p-4 font-bold ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <InfoCard title="Customer Information">
          <InfoRow label="Name" value={request.customer_name} />
          <InfoRow label="Email" value={request.user_email} />
          <InfoRow label="Phone" value={request.phone} />
          <InfoRow
            label="WhatsApp"
            value={request.whatsapp_number}
          />
        </InfoCard>

        <InfoCard title="Request Status">
          <InfoRow
            label="Request status"
            value={readable(request.request_status)}
          />
          <InfoRow
            label="Payment status"
            value={readable(request.payment_status)}
          />
          <InfoRow
            label="Hubtel status"
            value={readable(request.hubtel_payment_status)}
          />
          <InfoRow
            label="Service fee"
            value={formatMoney(request.service_fee || 450)}
          />
          <InfoRow
            label="Paid at"
            value={formatDate(request.paid_at)}
          />
          <InfoRow
            label="Completed at"
            value={formatDate(request.completed_at)}
          />
        </InfoCard>

        <InfoCard title="Apartment Preference">
          <InfoRow
            label="Region"
            value={request.preferred_region}
          />
          <InfoRow
            label="City"
            value={request.preferred_city}
          />
          <InfoRow
            label="Preferred locations"
            value={request.preferred_locations}
          />
          <InfoRow
            label="Apartment type"
            value={request.apartment_type}
          />
          <InfoRow
            label="Bedrooms"
            value={
              request.bedrooms !== null
                ? String(request.bedrooms)
                : "Not provided"
            }
          />
          <InfoRow
            label="Furnished preference"
            value={request.furnished_preference}
          />
        </InfoCard>

        <InfoCard title="Budget and Moving">
          <InfoRow
            label="Minimum budget"
            value={formatMoney(request.minimum_budget)}
          />
          <InfoRow
            label="Maximum budget"
            value={formatMoney(request.maximum_budget)}
          />
          <InfoRow
            label="Payment frequency"
            value={request.payment_frequency}
          />
          <InfoRow
            label="Rental duration"
            value={
              request.rental_duration_years !== null
                ? `${request.rental_duration_years} year(s)`
                : "Not provided"
            }
          />
          <InfoRow
            label="Move-in date"
            value={formatDate(
              request.preferred_move_in_date
            )}
          />
          <InfoRow
            label="Move urgency"
            value={request.move_urgency}
          />
          <InfoRow
            label="Budget flexibility"
            value={request.budget_flexibility}
          />
        </InfoCard>

        <InfoCard title="Search Assignment">
          <InfoRow
            label="Assigned scout"
            value={
              request.assigned_scout_name || "Not assigned"
            }
          />
          <InfoRow
            label="Scout phone"
            value={
              request.assigned_scout_phone || "Not provided"
            }
          />
          <InfoRow
            label="Search started"
            value={formatDate(request.search_started_at)}
          />
          <InfoRow
            label="Search expires"
            value={formatDate(request.search_expires_at)}
          />
          <InfoRow
            label="Extension applied"
            value={formatDate(request.extended_at)}
          />
          <InfoRow
            label="Extension expires"
            value={formatDate(
              request.extension_expires_at
            )}
          />
        </InfoCard>

        <InfoCard title="Additional Information">
          <InfoRow
            label="Nearby areas"
            value={request.nearby_areas_preference}
          />
          <InfoRow
            label="Requirements"
            value={request.additional_requirements}
          />
          <InfoRow
            label="Latest update"
            value={request.latest_update}
          />
          <InfoRow
            label="Tenant update"
            value={request.tenant_update}
          />
          <InfoRow
            label="Admin notes"
            value={request.admin_notes}
          />
        </InfoCard>
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
            Request Controls
          </p>

          <h2 className="mt-2 text-2xl font-black text-neutral-900">
            Admin Management
          </h2>

          <p className="mt-2 text-sm font-medium text-neutral-500">
            Assign the search officer, update the customer and
            manage the search period.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <FormField label="Scout Name">
            <input
              type="text"
              value={assignedScoutName}
              onChange={(event) =>
                setAssignedScoutName(event.target.value)
              }
              placeholder="Enter search officer's name"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3.5 font-semibold outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
            />
          </FormField>

          <FormField label="Scout Phone">
            <input
              type="tel"
              value={assignedScoutPhone}
              onChange={(event) =>
                setAssignedScoutPhone(event.target.value)
              }
              placeholder="Enter phone number"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3.5 font-semibold outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Request Status">
              <select
                value={requestStatus}
                onChange={(event) =>
                  setRequestStatus(event.target.value)
                }
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3.5 font-bold outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              >
                {REQUEST_STATUSES.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="Latest Update"
              helper="This information may be shown to the customer."
            >
              <textarea
                rows={4}
                value={latestUpdate}
                onChange={(event) =>
                  setLatestUpdate(event.target.value)
                }
                placeholder="Example: We have found three apartments and are arranging inspections."
                className="w-full resize-y rounded-2xl border border-neutral-200 px-4 py-3.5 font-semibold outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="Admin Notes"
              helper="Private notes for RentDirect administrators."
            >
              <textarea
                rows={5}
                value={adminNotes}
                onChange={(event) =>
                  setAdminNotes(event.target.value)
                }
                placeholder="Add private notes about this request..."
                className="w-full resize-y rounded-2xl border border-neutral-200 px-4 py-3.5 font-semibold outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-7">
          <button
            type="button"
            onClick={saveChanges}
            disabled={isBusy}
            className="w-full rounded-2xl bg-black px-6 py-4 font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>

        <div className="mt-8 grid gap-4 border-t border-neutral-100 pt-7 md:grid-cols-3">
          <button
            type="button"
            onClick={startSearch}
            disabled={
              isBusy ||
              !isPaymentConfirmed(request) ||
              request.request_status === "completed"
            }
            className="rounded-2xl bg-yellow-400 px-5 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading === "start"
              ? "Starting Search..."
              : request.search_started_at
                ? "Restart 30-Day Search"
                : "Start 30-Day Search"}
          </button>

          <button
            type="button"
            onClick={extendSearch}
            disabled={
              isBusy ||
              !request.search_started_at ||
              Boolean(request.extension_expires_at) ||
              request.request_status === "completed"
            }
            className="rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading === "extend"
              ? "Applying Extension..."
              : request.extension_expires_at
                ? "15-Day Extension Applied"
                : "Extend 15 Days"}
          </button>

          <button
            type="button"
            onClick={markCompleted}
            disabled={
              isBusy ||
              request.request_status === "completed"
            }
            className="rounded-2xl bg-green-600 px-5 py-4 font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading === "complete"
              ? "Completing..."
              : request.request_status === "completed"
                ? "Request Completed"
                : "Mark Completed"}
          </button>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-neutral-900">
        {title}
      </h2>

      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-b border-neutral-100 pb-4 last:border-0">
      <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap font-bold text-neutral-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function FormField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-neutral-800">
        {label}
      </label>

      {children}

      {helper && (
        <p className="mt-2 text-xs font-medium text-neutral-400">
          {helper}
        </p>
      )}
    </div>
  );
}
