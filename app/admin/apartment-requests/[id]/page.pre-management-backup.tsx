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
  created_at: string;
};

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

export default function ApartmentRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<ApartmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function protectAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
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
        router.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("apartment_requests")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setMessage("Request not found.");
        setLoading(false);
        return;
      }

      setRequest(data as ApartmentRequest);
      setLoading(false);
    }

    void protectAndLoad();
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <p className="font-bold text-neutral-500">Loading request...</p>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <h1 className="text-2xl font-black">Request unavailable</h1>
        <p className="mt-3 text-red-600">{message}</p>

        <Link
          href="/admin/apartment-requests"
          className="mt-6 inline-flex rounded-full bg-black px-6 py-3 font-black text-white"
        >
          Back to Requests
        </Link>
      </main>
    );
  }

  const reference = `RD-${new Date(request.created_at).getFullYear()}-${request.id
    .slice(0, 8)
    .toUpperCase()}`;

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
        <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
          {message}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <InfoCard title="Customer Information">
          <InfoRow label="Name" value={request.customer_name} />
          <InfoRow label="Email" value={request.user_email} />
          <InfoRow label="Phone" value={request.phone} />
          <InfoRow label="WhatsApp" value={request.whatsapp_number} />
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
          <InfoRow label="Paid at" value={formatDate(request.paid_at)} />
        </InfoCard>

        <InfoCard title="Apartment Preference">
          <InfoRow label="Region" value={request.preferred_region} />
          <InfoRow label="City" value={request.preferred_city} />
          <InfoRow
            label="Preferred locations"
            value={request.preferred_locations}
          />
          <InfoRow label="Apartment type" value={request.apartment_type} />
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
            value={formatDate(request.preferred_move_in_date)}
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
            value={request.assigned_scout_name || "Not assigned"}
          />
          <InfoRow
            label="Scout phone"
            value={request.assigned_scout_phone || "Not provided"}
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
            label="Extension expires"
            value={formatDate(request.extension_expires_at)}
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
          <InfoRow label="Latest update" value={request.latest_update} />
          <InfoRow label="Tenant update" value={request.tenant_update} />
          <InfoRow label="Admin notes" value={request.admin_notes} />
        </InfoCard>
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
      <h2 className="text-xl font-black text-neutral-900">{title}</h2>
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
