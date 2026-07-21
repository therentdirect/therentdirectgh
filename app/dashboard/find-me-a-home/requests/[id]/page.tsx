"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ApartmentRequest = {
  id: string;
  user_id: string;
  user_email?: string | null;
  customer_name?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;

  preferred_region?: string | null;
  preferred_city?: string | null;
  preferred_locations?: string[] | string | null;

  apartment_type?: string | null;
  bedrooms?: number | null;
  furnished_preference?: string | null;

  minimum_budget?: number | null;
  maximum_budget?: number | null;
  payment_frequency?: string | null;

  rental_duration_years?: number | null;
  preferred_move_in_date?: string | null;
  additional_requirements?: string | null;

  budget_flexibility?: string | null;
  move_urgency?: string | null;
  nearby_areas_preference?: string | null;

  service_fee?: number | null;
  payment_status?: string | null;
  request_status?: string | null;

  assigned_scout_name?: string | null;
  latest_update?: string | null;
  search_started_at?: string | null;
  search_expires_at?: string | null;
  extension_expires_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

const statusLabels: Record<string, string> = {
  payment_pending: "Awaiting Payment",
  pending: "Pending",
  paid: "Payment Confirmed",
  search_started: "Search Started",
  searching: "Searching",
  apartments_found: "Apartments Found",
  inspection_scheduled: "Inspection Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const budgetFlexibilityLabels: Record<string, string> = {
  strict: "Only search within my budget",
  up_to_10_percent: "Show up to 10% above budget",
  up_to_20_percent: "Show up to 20% above budget",
  contact_first: "Contact me before exceeding budget",
};

const urgencyLabels: Record<string, string> = {
  within_7_days: "Within 7 days",
  within_14_days: "Within 14 days",
  within_30_days: "Within 30 days",
  no_rush: "No rush",
};

const nearbyPreferenceLabels: Record<string, string> = {
  selected_locations_only: "Only selected locations",
  nearby_areas_allowed: "Nearby areas are allowed",
  contact_first: "Contact me before searching nearby areas",
};

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return "Not specified";

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatLocations(value?: string[] | string | null) {
  if (!value) return "Not specified";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not specified";
  }

  return value;
}

function readableStatus(value?: string | null) {
  if (!value) return "Pending";

  return (
    statusLabels[value] ||
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null;

  const end = new Date(endDate);

  if (Number.isNaN(end.getTime())) return null;

  const difference = end.getTime() - Date.now();

  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

export default function ApartmentRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const requestId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [requestData, setRequestData] =
    useState<ApartmentRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRequest() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      if (!requestId) {
        setMessage("The apartment request ID is missing.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("apartment_requests")
        .select("*")
        .eq("id", requestId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Apartment request loading error:", error);
        setMessage(error.message || "We could not load this request.");
        setLoading(false);
        return;
      }

      if (!data) {
        setMessage(
          "This apartment request was not found or you do not have permission to view it."
        );
        setLoading(false);
        return;
      }

      setRequestData(data as ApartmentRequest);
      setLoading(false);
    }

    void loadRequest();
  }, [requestId, router]);

  const paymentStatus = String(
    requestData?.payment_status || "unpaid"
  ).toLowerCase();

  const requestStatus = String(
    requestData?.request_status || "payment_pending"
  ).toLowerCase();

  const hasPaid = [
    "paid",
    "successful",
    "success",
    "completed",
    "confirmed",
  ].includes(paymentStatus);

  const daysRemaining = useMemo(() => {
    if (!requestData) return null;

    return getDaysRemaining(
      requestData.extension_expires_at ||
        requestData.search_expires_at
    );
  }, [requestData]);

  const timeline = [
    {
      title: "Request Submitted",
      description: "Your apartment requirements were received.",
      complete: Boolean(requestData?.created_at),
      active: !hasPaid,
    },
    {
      title: "Payment Confirmed",
      description: "Your GH₵450 apartment-search payment is confirmed.",
      complete: hasPaid,
      active: !hasPaid,
    },
    {
      title: "Search Started",
      description: "Our team has started searching for suitable homes.",
      complete: [
        "search_started",
        "searching",
        "apartments_found",
        "inspection_scheduled",
        "completed",
      ].includes(requestStatus),
      active: hasPaid && ["paid", "payment_confirmed"].includes(requestStatus),
    },
    {
      title: "Apartments Found",
      description: "Matching apartment options will appear here.",
      complete: [
        "apartments_found",
        "inspection_scheduled",
        "completed",
      ].includes(requestStatus),
      active: requestStatus === "searching",
    },
    {
      title: "Inspection Scheduled",
      description: "An inspection has been arranged.",
      complete: ["inspection_scheduled", "completed"].includes(requestStatus),
      active: requestStatus === "apartments_found",
    },
    {
      title: "Search Completed",
      description: "Your apartment search request has been completed.",
      complete: requestStatus === "completed",
      active: requestStatus === "inspection_scheduled",
    },
  ];

  async function handlePayment() {
    if (!requestData) return;

    setPaying(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/hubtel/apartment-request/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request_id: requestData.id,
            user_id: requestData.user_id,
            email: requestData.user_email,
            name: requestData.customer_name,
            phone:
              requestData.whatsapp_number ||
              requestData.phone ||
              "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "We could not start the Hubtel payment."
        );
      }

      if (!result?.checkoutUrl) {
        throw new Error("Hubtel did not return a checkout link.");
      }

      window.location.href = result.checkoutUrl;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "We could not start your payment.";

      setMessage(errorMessage);
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <main className="rounded-[32px] border border-neutral-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-neutral-200 border-t-yellow-400" />

        <p className="mt-4 font-bold text-neutral-500">
          Loading your apartment request...
        </p>
      </main>
    );
  }

  if (!requestData) {
    return (
      <main className="rounded-[32px] border border-red-200 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
          !
        </div>

        <h1 className="mt-5 text-2xl font-black text-neutral-900">
          Request unavailable
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-neutral-500">
          {message ||
            "This apartment request could not be found."}
        </p>

        <Link
          href="/dashboard/find-me-a-home"
          className="mt-7 inline-flex rounded-full bg-black px-7 py-4 text-sm font-black text-white hover:bg-neutral-800"
        >
          Submit a New Request
        </Link>
      </main>
    );
  }

  const requestReference = `RD-${new Date(
    requestData.created_at || Date.now()
  ).getFullYear()}-${requestData.id.slice(0, 8).toUpperCase()}`;

  return (
    <main className="space-y-7 pb-16">
      <section className="overflow-hidden rounded-[34px] bg-black p-6 text-white shadow-xl md:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-400">
              RentDirect Apartment Search
            </p>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              Your home search request
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-neutral-300 md:text-base">
              Follow your payment, search progress, matching apartments
              and inspection updates from this page.
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
              Request ID
            </p>

            <p className="mt-2 text-lg font-black text-yellow-400">
              {requestReference}
            </p>

            <p className="mt-2 text-xs font-semibold text-neutral-300">
              Submitted {formatDate(requestData.created_at)}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-black text-red-700">
          {message}
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[26px] border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Search Status
          </p>

          <p className="mt-3 text-xl font-black text-neutral-900">
            {readableStatus(requestData.request_status)}
          </p>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Payment
          </p>

          <p
            className={`mt-3 text-xl font-black ${
              hasPaid ? "text-green-600" : "text-amber-600"
            }`}
          >
            {hasPaid ? "Paid" : "Unpaid"}
          </p>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Days Remaining
          </p>

          <p className="mt-3 text-xl font-black text-neutral-900">
            {daysRemaining !== null
              ? daysRemaining
              : hasPaid
                ? "30"
                : "Starts after payment"}
          </p>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Search Team
          </p>

          <p className="mt-3 text-xl font-black text-neutral-900">
            RentDirect Search Team
          </p>

          <p className="mt-2 text-sm font-medium leading-6 text-neutral-500">
            Your request is being handled securely by our apartment search team.
          </p>
        </div>
      </section>

      <section className="grid gap-7 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-7">
          <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
                  Request summary
                </p>

                <h2 className="mt-2 text-2xl font-black text-neutral-900">
                  Your apartment requirements
                </h2>
              </div>

              <Link
                href="/dashboard/find-me-a-home"
                className="text-sm font-black text-neutral-600 underline underline-offset-4"
              >
                Submit another request
              </Link>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <DetailCard
                label="Customer"
                value={requestData.customer_name || "Not provided"}
              />

              <DetailCard
                label="Contact Number"
                value={
                  requestData.whatsapp_number ||
                  requestData.phone ||
                  "Not provided"
                }
              />

              <DetailCard
                label="Region"
                value={requestData.preferred_region || "Not specified"}
              />

              <DetailCard
                label="City or Town"
                value={requestData.preferred_city || "Not specified"}
              />

              <DetailCard
                label="Preferred Areas"
                value={formatLocations(
                  requestData.preferred_locations
                )}
                wide
              />

              <DetailCard
                label="Apartment Type"
                value={requestData.apartment_type || "Not specified"}
              />

              <DetailCard
                label="Bedrooms"
                value={
                  requestData.bedrooms
                    ? String(requestData.bedrooms)
                    : "Not applicable"
                }
              />

              <DetailCard
                label="Furnishing"
                value={
                  requestData.furnished_preference ||
                  "No preference"
                }
              />

              <DetailCard
                label="Budget"
                value={`${formatMoney(
                  requestData.minimum_budget
                )} – ${formatMoney(
                  requestData.maximum_budget
                )} ${
                  requestData.payment_frequency === "Yearly"
                    ? "per year"
                    : "per month"
                }`}
                wide
              />

              <DetailCard
                label="Budget Flexibility"
                value={
                  budgetFlexibilityLabels[
                    requestData.budget_flexibility || ""
                  ] || "Contact me first"
                }
              />

              <DetailCard
                label="Move Urgency"
                value={
                  urgencyLabels[requestData.move_urgency || ""] ||
                  "Within 30 days"
                }
              />

              <DetailCard
                label="Nearby Areas"
                value={
                  nearbyPreferenceLabels[
                    requestData.nearby_areas_preference || ""
                  ] || "Contact me first"
                }
              />

              <DetailCard
                label="Move-in Date"
                value={formatDate(
                  requestData.preferred_move_in_date
                )}
              />

              <DetailCard
                label="Rental Duration"
                value={
                  requestData.rental_duration_years
                    ? `${requestData.rental_duration_years} ${
                        requestData.rental_duration_years === 1
                          ? "year"
                          : "years"
                      }`
                    : "Not specified"
                }
              />

              <DetailCard
                label="Additional Requirements"
                value={
                  requestData.additional_requirements ||
                  "No additional requirements"
                }
                wide
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
              Search progress
            </p>

            <h2 className="mt-2 text-2xl font-black text-neutral-900">
              Request timeline
            </h2>

            <div className="mt-8 space-y-1">
              {timeline.map((item, index) => (
                <div
                  key={item.title}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        item.complete
                          ? "bg-green-100 text-green-700"
                          : item.active
                            ? "bg-yellow-400 text-black"
                            : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {item.complete ? "✓" : index + 1}
                    </div>

                    {index < timeline.length - 1 && (
                      <div className="h-14 w-0.5 bg-neutral-200" />
                    )}
                  </div>

                  <div className="pb-6 pt-1">
                    <h3 className="font-black text-neutral-900">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-neutral-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
              Latest update
            </p>

            <h2 className="mt-2 text-2xl font-black text-neutral-900">
              Message from RentDirect
            </h2>

            <div className="mt-6 rounded-[24px] bg-neutral-50 p-5">
              <p className="text-sm font-semibold leading-7 text-neutral-600">
                {requestData.latest_update ||
                  (hasPaid
                    ? "Your payment has been received. Our team will update you when the apartment search begins."
                    : "Complete your GH₵450 payment to activate the apartment search service.")}
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {!hasPaid ? (
            <div className="rounded-[32px] bg-black p-6 text-white shadow-xl md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
                Secure payment
              </p>

              <h2 className="mt-3 text-3xl font-black">
                GH₵
                {Number(
                  requestData.service_fee || 450
                ).toLocaleString()}
              </h2>

              <p className="mt-3 text-sm font-medium leading-7 text-neutral-300">
                Pay once to activate your RentDirect apartment search.
              </p>

              <div className="mt-6 space-y-3 text-sm font-bold text-neutral-200">
                <p>✓ 30-day active search</p>
                <p>✓ Free 15-day extension if needed</p>
                <p>✓ Photos and videos before inspection</p>
                <p>✓ Direct landlord connection</p>
                <p>✓ No RentDirect inspection fee</p>
                <p>✓ No agent commission</p>
              </div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={paying}
                className="mt-7 w-full rounded-full bg-yellow-400 px-6 py-4 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying
                  ? "Opening Hubtel..."
                  : "Pay Securely with Hubtel"}
              </button>

              <p className="mt-4 text-center text-xs font-semibold leading-5 text-neutral-400">
                The service fee is not apartment rent, advance,
                security deposit or a landlord payment.
              </p>
            </div>
          ) : (
            <div className="rounded-[32px] border border-green-200 bg-green-50 p-6 shadow-sm md:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-black text-green-700">
                ✓
              </div>

              <h2 className="mt-5 text-2xl font-black text-green-900">
                Payment confirmed
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-green-800">
                Your apartment search service is active. RentDirect
                will update this page as the search progresses.
              </p>

              <p className="mt-4 text-xs font-black uppercase tracking-widest text-green-700">
                Paid {formatDate(requestData.paid_at)}
              </p>
            </div>
          )}

          <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="font-black text-neutral-900">
              Search period
            </h3>

            <p className="mt-3 text-sm font-medium leading-7 text-neutral-500">
              The initial search runs for 30 days. If no suitable
              apartment is found, RentDirect adds a free 15-day
              extension.
            </p>

            <div className="mt-5 rounded-2xl bg-yellow-50 p-4">
              <p className="text-sm font-black text-neutral-900">
                Maximum search period: 45 days
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="font-black text-neutral-900">
              Need help?
            </h3>

            <p className="mt-3 text-sm font-medium leading-7 text-neutral-500">
              Contact RentDirect support and provide your request ID
              for faster assistance.
            </p>

            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-full border border-neutral-300 px-6 py-3 text-sm font-black text-neutral-800 hover:bg-neutral-100"
            >
              Contact Support
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DetailCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border border-neutral-200 bg-neutral-50 p-5 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black leading-6 text-neutral-900">
        {value}
      </p>
    </div>
  );
}
