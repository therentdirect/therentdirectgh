"use client";

import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <main className="mx-auto max-w-3xl py-16">
      <section className="rounded-[32px] bg-white p-10 text-center shadow-sm">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-5xl">
          ❌
        </div>

        <h1 className="mt-6 text-4xl font-black">
          Payment Cancelled
        </h1>

        <p className="mt-4 text-neutral-600">
          Your payment was cancelled.
        </p>

        <p className="mt-2 text-neutral-600">
          No money has been deducted by RentDirect.
        </p>

        <Link
          href="/dashboard/pass"
          className="mt-8 inline-block rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
        >
          Try Again
        </Link>

      </section>
    </main>
  );
}