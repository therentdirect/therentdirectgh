import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      title: "Browse verified apartments",
      text: "Search available rooms, apartments and hostels by location, price and apartment type.",
    },
    {
      title: "Choose the apartment you like",
      text: "View photos, videos, rent details, location and property information before making a decision.",
    },
    {
      title: "Buy your Inspection Pass",
      text: "Pay GH₵250 securely with Hubtel to unlock landlord contact details.",
    },
    {
      title: "Contact the landlord directly",
      text: "Call or WhatsApp the landlord and schedule your inspection without paying agent commission.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-block rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black">
            How RentDirect Works
          </p>

          <h1 className="mt-8 text-5xl font-black md:text-6xl">
            Find apartments without agent stress.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
            RentDirect helps tenants connect directly with landlords, schedule
            inspections and avoid expensive agent commissions.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[30px] border border-white/10 bg-white/5 p-6"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-2xl font-black text-black">
                {index + 1}
              </div>

              <h2 className="mt-6 text-2xl font-black">{step.title}</h2>

              <p className="mt-4 text-sm leading-7 text-neutral-300">
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-16 rounded-[32px] bg-white p-8 text-black">
          <h2 className="text-3xl font-black">Why this is better than agents</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-700">
              ❌ Agent commissions and repeated fees
            </div>
            <div className="rounded-2xl bg-green-50 p-5 font-bold text-green-700">
              ✅ One GH₵250 inspection pass
            </div>
            <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-700">
              ❌ Waiting for someone to scout for you
            </div>
            <div className="rounded-2xl bg-green-50 p-5 font-bold text-green-700">
              ✅ Browse and contact landlords yourself
            </div>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            href="/apartments"
            className="inline-block rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </div>
      </section>
    </main>
  );
}
