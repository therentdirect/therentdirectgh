"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Inspection = {
  id: string;
  user_email: string;
  user_name: string;
  user_phone: string;
  property_title: string;
  property_location: string;
  landlord_name: string;
  landlord_phone: string;
  landlord_whatsapp: string;
  inspection_status: string;
  created_at: string;
};

export default function AdminInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    if (data) setInspections(data);

    setLoading(false);
  };

  const expireInspection = async (id: string) => {
    const confirmExpire = confirm(
      "Expire this inspection? The user will see it as Previous Inspection Expired."
    );

    if (!confirmExpire) return;

    setMessage("Expiring inspection...");

    const { error } = await supabase
      .from("inspections")
      .update({ inspection_status: "expired" })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Inspection marked as expired.");
    fetchInspections();
  };

  const filteredInspections = useMemo(() => {
    const term = search.toLowerCase();

    return inspections.filter((item) => {
      const text = `${item.user_name} ${item.user_email} ${item.user_phone} ${item.property_title} ${item.property_location} ${item.landlord_name} ${item.landlord_phone} ${item.inspection_status}`.toLowerCase();
      return text.includes(term);
    });
  }, [inspections, search]);

  const confirmedCount = inspections.filter(
    (item) => item.inspection_status === "confirmed"
  ).length;

  const expiredCount = inspections.filter(
    (item) => item.inspection_status === "expired"
  ).length;

  const statusBadge = (status: string) => {
    if (status === "expired") return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
  };

  const statusLabel = (status: string) => {
    if (status === "expired") return "Expired";
    return "Confirmed";
  };

  return (
    <main className="space-y-5">
      <section className="rounded-[28px] bg-black p-6 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-2 text-3xl font-black">Inspection Records</h1>

        <p className="mt-2 max-w-2xl text-sm text-neutral-300">
          Users who scheduled inspections and were sent to landlords directly.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-3 text-center text-sm font-black text-yellow-700">
          {message}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <Card label="Confirmed" value={confirmedCount} />
        <Card label="Expired" value={expiredCount} />
        <Card label="Showing" value={filteredInspections.length} />
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">All Inspections</h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant, property, landlord..."
            className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none md:max-w-md"
          />
        </div>

        {loading ? (
          <p className="py-10 text-center text-neutral-500">
            Loading inspections...
          </p>
        ) : filteredInspections.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">
            No inspection records found.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-3">Tenant</th>
                  <th className="pb-3">Property</th>
                  <th className="pb-3">Landlord</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredInspections.map((item) => (
                  <tr key={item.id} className="border-b text-sm">
                    <td className="py-3">
                      <p className="font-black">{item.user_name || "No name"}</p>
                      <p className="text-xs text-neutral-500">{item.user_email}</p>
                      <p className="text-xs font-bold text-neutral-700">
                        {item.user_phone || "No phone"}
                      </p>
                    </td>

                    <td className="py-3">
                      <p className="font-black">{item.property_title}</p>
                      <p className="text-xs text-neutral-500">
                        {item.property_location}
                      </p>
                    </td>

                    <td className="py-3">
                      <p className="font-black">{item.landlord_name}</p>
                      <p className="text-xs text-neutral-500">
                        📞 {item.landlord_phone}
                      </p>
                      <p className="text-xs text-neutral-500">
                        💬 {item.landlord_whatsapp}
                      </p>
                    </td>

                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge(
                          item.inspection_status
                        )}`}
                      >
                        {statusLabel(item.inspection_status)}
                      </span>
                    </td>

                    <td className="py-3 text-xs text-neutral-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="py-3">
                      {item.inspection_status === "expired" ? (
                        <span className="text-xs font-bold text-neutral-400">
                          No action
                        </span>
                      ) : (
                        <button
                          onClick={() => expireInspection(item.id)}
                          className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-200"
                        >
                          ⌛ Expire
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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