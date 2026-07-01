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
      setMessage("Please login to buy an Inspection Pass.");
      setLoading(false);
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

    setPass(passData || null);
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

  const isPending =
    pass?.status === "pending_verification" ||
    pass?.status === "pending";

  const isFailed =
    pass?.status === "rejected" ||
    pass?.status === "failed" ||
    pass?.status === "cancelled" ||
    pass?.hubtel_payment_status === "failed" ||
    pass?.hubtel_payment_status === "cancelled";

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
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-black p-6 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-400">
          RentDirect
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">
              30-Day Inspection Pass
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-neutral-300">
              Pay once, unlock landlord contacts, and schedule inspections
              directly without agent fees.
            </p>
          </div>

          <div className="rounded-[24px] bg-white/10 px-6 py-5 text-right">
            <p className="text-xs font-bold text-neutral-300">Pass Fee</p>
            <h2 className="text-4xl font-black text-yellow-400">GH₵250</h2>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center text-sm font-black text-yellow-700">
          {message}
        </div>
      )}

      {isActive ? (
        <PassCard
          title="Inspection Pass Active"
          badge="Active"
          badgeStyle="bg-green-100 text-green-700"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="Days Remaining" value={daysRemaining} />
            <Info
              label="Expires On"
              value={new Date(pass!.expires_at!).toLocaleDateString()}
            />
            <Info
              label="Paid On"
              value={
                pass?.paid_at
                  ? new Date(pass.paid_at).toLocaleDateString()
                  : "Not added"
              }
            />
          </div>

          <Link
            href="/dashboard/apartments"
            className="mt-5 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </PassCard>
      ) : isPaidNotStarted ? (
        <PassCard
          title="Payment Successful"
          badge="Contacts Unlocked"
          badgeStyle="bg-green-100 text-green-700"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="Amount" value="GH₵250" />
            <Info label="Pass Status" value="Paid, not started" />
            <Info
              label="30 Days Starts"
              value="When you schedule your first inspection"
            />
          </div>

          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
            Your landlord contacts are now unlocked. Your 30-day countdown will
            start after your first scheduled inspection.
          </div>

          <Link
            href="/dashboard/apartments"
            className="mt-5 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Schedule Inspection
          </Link>
        </PassCard>
      ) : isPending ? (
        <PassCard
          title="Payment Processing"
          badge="Pending"
          badgeStyle="bg-yellow-100 text-yellow-700"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="Payment Method" value={pass?.payment_method} />
            <Info
              label="Reference"
              value={pass?.hubtel_client_reference || pass?.payment_reference}
            />
            <Info label="Amount" value={`GH₵${pass?.amount || 250}`} />
          </div>

          <p className="mt-5 text-sm font-bold text-neutral-500">
            We are waiting for Hubtel to confirm your payment.
          </p>

          <button
            type="button"
            onClick={loadPass}
            className="mt-4 rounded-full bg-black px-6 py-3 font-black text-white hover:bg-neutral-800"
          >
            Check Payment Status
          </button>
        </PassCard>
      ) : isFailed ? (
        <PassCard
          title="Payment Failed"
          badge="Failed"
          badgeStyle="bg-red-100 text-red-700"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="Payment Method" value={pass?.payment_method} />
            <Info
              label="Reference"
              value={pass?.hubtel_client_reference || pass?.payment_reference}
            />
            <Info label="Amount" value={`GH₵${pass?.amount || 250}`} />
          </div>

          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            Unfortunately, your payment was unsuccessful or cancelled. Please
            schedule inspection again or try payment again.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/apartments"
              className="rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
            >
              Return to Schedule Inspection
            </Link>

            <button
              type="button"
              onClick={startHubtelPayment}
              disabled={paying}
              className="rounded-full bg-black px-6 py-3 font-black text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {paying ? "Opening Hubtel..." : "Pay Again"}
            </button>
          </div>
        </PassCard>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">What Your Pass Gives You</h2>

            <div className="mt-5 grid gap-3">
              <Benefit text="Unlock landlord phone numbers after payment" />
              <Benefit text="Schedule inspections directly with landlords" />
              <Benefit text="Your 30-day access starts from your first inspection" />
              <Benefit text="No agent commissions or scouting stress" />
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Buy Inspection Pass</h2>

            <p className="mt-2 text-sm text-neutral-500">
              Pay GH₵250 securely with Hubtel.
            </p>

            <div className="mt-5 rounded-[24px] border border-neutral-200 p-5">
              <p className="text-sm text-neutral-500">Inspection Pass Fee</p>
              <h3 className="mt-2 text-4xl font-black text-yellow-600">
                GH₵250
              </h3>
            </div>

            <button
              type="button"
              onClick={startHubtelPayment}
              disabled={paying}
              className="mt-5 w-full rounded-full bg-yellow-400 p-4 font-black text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {paying ? "Opening Hubtel Checkout..." : "Pay GH₵250 with Hubtel"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function PassCard({
  title,
  badge,
  badgeStyle,
  children,
}: {
  title: string;
  badge: string;
  badgeStyle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
            Current Pass
          </p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>

        <span className={`rounded-full px-4 py-2 text-sm font-black ${badgeStyle}`}>
          {badge}
        </span>
      </div>

      <div className="mt-5">{children}</div>
    </section>
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
