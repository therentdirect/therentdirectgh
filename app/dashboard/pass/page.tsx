"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type UserPass = {
  id: string;
  status: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  hubtel_client_reference: string | null;
  hubtel_checkout_id: string | null;
  hubtel_payment_status: string | null;
  paid_at: string | null;
  first_inspection_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export default function InspectionPassPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pass, setPass] = useState<UserPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPass();
  }, []);

  async function loadPass() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage("Please login to buy an Inspection Pass.");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .single();

    if (profileData) setProfile(profileData);

    const { data: passData } = await supabase
      .from("user_passes")
      .select("*")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (passData) setPass(passData);

    setLoading(false);
  }

  async function startHubtelPayment() {
    setPaying(true);
    setMessage("");

    try {
      if (!user?.email) {
        setMessage("Please login again before making payment.");
        setPaying(false);
        return;
      }

      const fullName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : "RentDirect User";

      const response = await fetch("/api/hubtel/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          username: profile?.username || "",
          phone: profile?.phone || "",
          name: fullName || profile?.username || "RentDirect User",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || "Could not start Hubtel payment.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      setMessage(error.message || "Something went wrong starting payment.");
      setPaying(false);
    }
  }

  const isPaidNotStarted = pass?.status === "paid_not_started";

  const isActive =
    pass?.status === "active" &&
    pass?.expires_at &&
    new Date(pass.expires_at) > new Date();

  const isPending = pass?.status === "pending_verification";
  const isRejected = pass?.status === "rejected";

  const daysRemaining = pass?.expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(pass.expires_at).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  if (loading) {
    return (
      <main className="rounded-[28px] bg-white p-10 text-center text-neutral-500">
        Loading Inspection Pass...
      </main>
    );
  }

  return (
    <main className="space-y-5">
      <section className="rounded-[28px] bg-black p-6 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">30-Day Inspection Pass</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-300">
              Pay once, unlock landlord contacts instantly, and start your
              30-day access when you schedule your first inspection.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 px-5 py-4 text-right">
            <p className="text-xs text-neutral-300">Pass Fee</p>
            <h2 className="text-3xl font-black text-yellow-400">GH₵250</h2>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-3 text-center text-sm font-black text-yellow-700">
          {message}
        </div>
      )}

      {isActive ? (
        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
                Current Pass
              </p>
              <h2 className="mt-1 text-2xl font-black">Inspection Pass Active</h2>
            </div>

            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">
              Active
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Info label="Amount" value="GH₵250" />
            <Info label="Days Remaining" value={daysRemaining} />
            <Info
              label="Expires On"
              value={new Date(pass!.expires_at!).toLocaleDateString()}
            />
          </div>

          <Link
            href="/dashboard/apartments"
            className="mt-5 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </section>
      ) : isPaidNotStarted ? (
        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
                Current Pass
              </p>
              <h2 className="mt-1 text-2xl font-black">Payment Successful</h2>
            </div>

            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">
              Contacts Unlocked
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Info label="Amount" value="GH₵250" />
            <Info label="Pass Status" value="Paid, not started" />
            <Info
              label="30 Days Starts"
              value="When you schedule your first inspection"
            />
          </div>

          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
            Your landlord contacts are now unlocked. Your 30-day countdown will
            start only after you schedule your first inspection.
          </div>

          <Link
            href="/dashboard/apartments"
            className="mt-5 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </section>
      ) : isPending ? (
        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
                Current Pass
              </p>
              <h2 className="mt-1 text-2xl font-black">Payment Processing</h2>
            </div>

            <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-700">
              Pending
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Info label="Payment Method" value={pass?.payment_method} />
            <Info
              label="Reference"
              value={pass?.hubtel_client_reference || pass?.payment_reference}
            />
            <Info label="Amount" value={`GH₵${pass?.amount || 250}`} />
          </div>

          <p className="mt-5 text-sm font-bold text-neutral-500">
            Your payment is being processed by Hubtel. Refresh this page after a
            few seconds if the status does not update automatically.
          </p>

          <button
            type="button"
            onClick={loadPass}
            className="mt-4 rounded-full bg-black px-6 py-3 font-black text-white hover:bg-neutral-800"
          >
            Refresh Status
          </button>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">What Your Pass Gives You</h2>

            <p className="mt-2 text-sm text-neutral-500">
              Get direct access to landlords without agent commissions.
            </p>

            <div className="mt-5 grid gap-3">
              <Benefit text="Unlock landlord phone numbers instantly after payment" />
              <Benefit text="Schedule inspections directly with landlords" />
              <Benefit text="Your 30-day access starts from your first inspection" />
              <Benefit text="No agent commissions or scouting stress" />
            </div>

            <div className="mt-6 rounded-[24px] bg-neutral-50 p-5">
              <p className="text-sm font-bold text-neutral-500">
                Secure payment powered by Hubtel
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Pay with Mobile Money, bank card, Hubtel wallet, or other
                supported payment methods.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Buy Inspection Pass</h2>

            <p className="mt-2 text-sm text-neutral-500">
              Pay GH₵250 securely. Landlord contacts unlock instantly after
              successful payment.
            </p>

            <div className="mt-5 rounded-[24px] border border-neutral-200 p-5">
              <p className="text-sm text-neutral-500">Inspection Pass Fee</p>
              <h3 className="mt-2 text-4xl font-black text-yellow-600">
                GH₵250
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                Valid for 30 days starting from your first scheduled inspection.
              </p>
            </div>

            {isRejected && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                Your previous payment was not successful. Please try again.
              </div>
            )}

            <button
              type="button"
              onClick={startHubtelPayment}
              disabled={paying}
              className="mt-5 w-full rounded-full bg-yellow-400 p-4 font-black text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {paying ? "Opening Hubtel Checkout..." : "Pay GH₵250 with Hubtel"}
            </button>

            <p className="mt-4 text-center text-xs font-bold text-neutral-400">
              You will be redirected to Hubtel to complete payment securely.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Benefit({ text }: { text: string }) {
  return <div className="rounded-2xl bg-neutral-50 p-4 font-black">{text}</div>;
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 font-black text-neutral-900">{value || "Not added"}</p>
    </div>
  );
}