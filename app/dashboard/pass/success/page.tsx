"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl py-16 text-center">
          Loading...
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();

  const returnTo =
    decodeURIComponent(searchParams.get("returnTo") || "") ||
    "/dashboard/apartments";

  return (
    <main className="mx-auto max-w-3xl py-16">
      <section className="rounded-[32px] bg-white p-10 text-center shadow-sm">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl">
          ✅
        </div>

        <h1 className="mt-6 text-4xl font-black">
          Payment Successful
        </h1>

        <p className="mt-4 text-neutral-600">
          Thank you for purchasing your RentDirect 30-Day Inspection Pass.
        </p>

        <div className="mt-8 rounded-3xl bg-green-50 p-6">
          <h2 className="text-xl font-black text-green-700">
            Landlord Contacts Unlocked
          </h2>

          <p className="mt-3 text-neutral-700">
            You can now contact the landlord directly.
          </p>

          <p className="mt-3 text-neutral-700">
            Your 30-day pass begins after your first scheduled inspection.
          </p>
        </div>

        <Link
          href={returnTo}
          className="mt-8 inline-block rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
        >
          Continue to Apartment
        </Link>

      </section>
    </main>
  );
}