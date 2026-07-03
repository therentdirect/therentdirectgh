import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-block rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black">
            RentDirect Pricing
          </p>

          <h1 className="mt-8 text-5xl font-black md:text-6xl">
            One simple fee. No agent commission.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
            Pay once and unlock direct landlord contacts for apartment inspections.
            No scouting stress, no middleman pressure, no hidden agent fees.
          </p>
        </div>

        <section className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <h2 className="text-3xl font-black">What You Get</h2>

            <div className="mt-6 grid gap-4">
              {[
                "Direct landlord phone numbers",
                "Direct WhatsApp access",
                "Unlimited apartment inspections during your pass period",
                "No agent commissions",
                "Verified property listings",
                "Your 30-day pass starts after your first inspection",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold">
                  ✅ {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-8 text-black shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-600">
              Direct Landlord Access
            </p>

            <h2 className="mt-5 text-6xl font-black">GH₵250</h2>

            <p className="mt-4 font-bold text-neutral-600">
              Get direct landlord phone numbers and WhatsApp access after your one-time payment.
            </p>

            <div className="mt-6 rounded-2xl bg-yellow-50 p-4 text-sm font-black text-yellow-800">
              Many tenants save more than GH₵250 by avoiding just one agent commission.
            </div>

            <Link
              href="/dashboard/pass"
              className="mt-8 block rounded-full bg-yellow-400 px-8 py-4 text-center font-black text-black hover:bg-yellow-300"
            >
              Unlock Landlord Contact
            </Link>

            <p className="mt-4 text-center text-xs font-bold text-neutral-500">
              Secure payment powered by Hubtel.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
