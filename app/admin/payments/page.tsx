"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserPass = {
  id: string;
  user_id: string;
  user_email: string;
  username: string;
  user_phone: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_proof_url: string;
  status: string;
  approved_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export default function AdminPaymentsPage() {
  const [passes, setPasses] = useState<UserPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user_passes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    }

    if (data) {
      setPasses(data);
    }

    setLoading(false);
  };

  const approvePass = async (passId: string) => {
    const confirmApprove = confirm(
      "Approve this payment and activate a 30-day Inspection Pass?"
    );

    if (!confirmApprove) return;

    setMessage("Approving payment...");

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 30);

    const { error } = await supabase
      .from("user_passes")
      .update({
        status: "active",
        approved_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", passId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Payment approved. Inspection Pass is now active for 30 days.");
    fetchPasses();
  };

  const rejectPass = async (passId: string) => {
    const confirmReject = confirm("Reject this payment?");
    if (!confirmReject) return;

    setMessage("Rejecting payment...");

    const { error } = await supabase
      .from("user_passes")
      .update({
        status: "rejected",
      })
      .eq("id", passId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Payment rejected.");
    fetchPasses();
  };

  const approvedRevenue = useMemo(() => {
    return passes
      .filter((item) => item.status === "active")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [passes]);

  const pendingCount = passes.filter(
    (item) => item.status === "pending_verification"
  ).length;

  const activeCount = passes.filter((item) => item.status === "active").length;

  const rejectedCount = passes.filter((item) => item.status === "rejected").length;

  const filteredPasses = useMemo(() => {
    if (!filter) return passes;

    return passes.filter((item) => item.status === filter);
  }, [passes, filter]);

  const statusBadge = (status: string) => {
    if (status === "active") {
      return "bg-green-100 text-green-700";
    }

    if (status === "pending_verification") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <main className="space-y-8">
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
          <button
            onClick={() => setSelectedProof(null)}
            className="absolute right-6 top-6 rounded-full bg-white px-4 py-2 font-bold text-black"
          >
            ✕ Close
          </button>

          <img
            src={selectedProof}
            alt="Payment proof"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}

      <section className="rounded-3xl bg-gradient-to-r from-[#07111F] via-[#0B1220] to-[#111827] p-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-3 text-4xl font-bold">Payments & Revenue</h1>

        <p className="mt-3 max-w-2xl text-slate-300">
          Review Inspection Pass payments, approve access, reject invalid
          receipts, and monitor revenue.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-semibold text-yellow-700">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approved Revenue</p>
          <h2 className="mt-2 text-3xl font-bold">GH₵{approvedRevenue}</h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Payments</p>
          <h2 className="mt-2 text-3xl font-bold">{pendingCount}</h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Passes</p>
          <h2 className="mt-2 text-3xl font-bold">{activeCount}</h2>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rejected Payments</p>
          <h2 className="mt-2 text-3xl font-bold">{rejectedCount}</h2>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Inspection Pass Payments</h2>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-3"
          >
            <option value="">All Payments</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="active">Active / Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-500">
            Loading payments...
          </p>
        ) : filteredPasses.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            No payments found.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Phone</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Method</th>
                  <th className="pb-4">Reference</th>
                  <th className="pb-4">Proof</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Submitted</th>
                  <th className="pb-4">Expires</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPasses.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-4">
                      <p className="font-bold">
                        {item.username || "No username"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.user_email}
                      </p>
                    </td>

                    <td className="py-4 text-slate-600">
                      {item.user_phone || "Not added"}
                    </td>

                    <td className="py-4 font-bold">GH₵{item.amount}</td>

                    <td className="py-4 text-slate-600">
                      {item.payment_method || "Not added"}
                    </td>

                    <td className="py-4 text-slate-600">
                      {item.payment_reference || "Not added"}
                    </td>

                    <td className="py-4">
                      {item.payment_proof_url ? (
                        <button
                          onClick={() => setSelectedProof(item.payment_proof_url)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                        >
                          View Proof
                        </button>
                      ) : (
                        "No proof"
                      )}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${statusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {item.expires_at
                        ? new Date(item.expires_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="py-4">
                      {item.status === "pending_verification" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => approvePass(item.id)}
                            className="rounded-xl bg-green-100 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-200"
                          >
                            ✅ Approve
                          </button>

                          <button
                            onClick={() => rejectPass(item.id)}
                            className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No action
                        </span>
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