"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PaymentCancelledPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl py-16 text-center">
          Loading...
        </main>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}

function CancelledContent() {
  const searchParams = useSearchParams();

  const reference = searchParams.get("reference") || "";

  const returnTo =
    decodeURIComponent(searchParams.get("returnTo") || "") ||
    "/dashboard/apartments";

  useEffect(() => {
    async function markCancelled() {
      if (!reference) return;

      await supabase
        .from("user_passes")
        .update({
          status: "failed",
          hubtel_payment_status: "cancelled",
        })
        .eq("hubtel_client_reference", reference);
    }

    markCancelled();
  }, [reference]);

  return (
    <main className="mx-auto max-w-3xl py-16">
      <section className="rounded-[32px] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-5xl">
          ❌
        </div>

        <h1 className="mt-6 text-4xl font-black">Payment Cancelled</h1>

        <p className="mt-4 text-neutral-600">
          Your payment was cancelled before completion.
        </p>

        <p className="mt-2 text-neutral-600">
          No inspection pass has been activated.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={returnTo}
            className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
          >
            Return to Apartment
          </Link>

          <Link
            href={`/dashboard/pass${returnTo !== "/dashboard/apartments" ? `?property=${returnTo.split("/").pop()}` : ""}`}
            className="rounded-full bg-black px-8 py-4 font-black text-white hover:bg-neutral-800"
          >
            Try Payment Again
          </Link>
        </div>
      </section>
    </main>
  );
}
