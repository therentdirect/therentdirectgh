"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Inspection = {
  id: string;
  user_email: string;
  property_id: string;
  property_title: string;
  property_location: string;
  landlord_name: string;
  landlord_phone: string;
  landlord_whatsapp: string;
  inspection_status: string;
  created_at: string;
};

export default function UserInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setMessage("Please login again to view your inspections.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("inspections")
      .select("*")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    if (data) setInspections(data);

    setLoading(false);
  }

  const confirmed = useMemo(
    () =>
      inspections.filter((item) => item.inspection_status === "confirmed")
        .length,
    [inspections]
  );

  const expired = useMemo(
    () =>
      inspections.filter((item) => item.inspection_status === "expired").length,
    [inspections]
  );

  return (
    <main className="space-y-5">
      <section className="rounded-[28px] bg-black p-6 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect
        </p>

        <h1 className="mt-2 text-3xl font-black">My Inspections</h1>

        <p className="mt-2 max-w-2xl text-sm text-neutral-300">
          Track every apartment inspection you have scheduled with landlords.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-3 text-center text-sm font-black text-yellow-700">
          {message}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <Card label="Total" value={inspections.length} />
        <Card label="Confirmed" value={confirmed} />
        <Card label="Expired" value={expired} />
      </section>

      {loading ? (
        <section className="rounded-[28px] bg-white p-10 text-center text-neutral-500">
          Loading your inspections...
        </section>
      ) : inspections.length === 0 ? (
        <section className="rounded-[28px] bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-black">No inspections yet</h2>

          <p className="mt-3 text-sm text-neutral-500">
            When you schedule an inspection with a landlord, it will appear here.
          </p>

          <Link
            href="/dashboard/apartments"
            className="mt-5 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </section>
      ) : (
        <section className="grid gap-4">
          {inspections.map((item) => {
            const isExpired = item.inspection_status === "expired";
            const whatsappNumber = item.landlord_whatsapp?.replace(/\D/g, "");
            const whatsappLink = whatsappNumber
              ? `https://wa.me/233${whatsappNumber.slice(-9)}`
              : "#";

            return (
              <article
                key={item.id}
                className="rounded-[24px] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">
                      {item.property_title}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      📍 {item.property_location}
                    </p>

                    <p className="mt-1 text-xs font-bold text-neutral-400">
                      Scheduled on{" "}
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      isExpired
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isExpired ? "Inspection Expired" : "Confirmed"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Info label="Landlord" value={item.landlord_name} />
                  <Info label="Phone" value={item.landlord_phone} />
                  <Info
                    label="Status"
                    value={
                      isExpired
                        ? "Previous Inspection Expired"
                        : "Inspection Confirmed"
                    }
                  />
                </div>

                {isExpired ? (
                  <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-600">
                    Your previous inspection has expired. Purchase a new
                    Inspection Pass to schedule another inspection.
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={`tel:${item.landlord_phone}`}
                      className="rounded-full bg-black px-5 py-3 text-sm font-black text-white hover:bg-neutral-800"
                    >
                      📞 Call Landlord
                    </a>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      className="rounded-full bg-[#25D366] px-5 py-3 text-sm font-black text-white hover:bg-[#1EBE5D]"
                    >
                      💬 WhatsApp
                    </a>

                    <Link
                      href={`/dashboard/apartments/${item.property_id}`}
                      className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-black text-black hover:bg-yellow-300"
                    >
                      View Property
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <h2 className="mt-1 text-2xl font-black">{value}</h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 font-black text-neutral-900">{value || "Not added"}</p>
    </div>
  );
}