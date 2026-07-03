import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <p className="inline-block rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black">
            Contact RentDirect
          </p>

          <h1 className="mt-8 text-5xl font-black md:text-6xl">
            We're here to help.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
            Have questions about an apartment, your inspection pass or your
            account? Our support team is ready to help.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">

          <div className="rounded-[32px] bg-white/5 p-8">
            <h2 className="text-3xl font-black text-yellow-400">
              Contact Information
            </h2>

            <div className="mt-8 space-y-6">

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm font-black uppercase text-yellow-400">
                  WhatsApp
                </p>
                <a
                  href="https://wa.me/233541456133"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xl font-black hover:text-yellow-400"
                >
                  +233 54 145 6133
                </a>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm font-black uppercase text-yellow-400">
                  Email
                </p>
                <a
                  href="mailto:rentdirect25@outlook.com"
                  className="mt-2 block text-xl font-black hover:text-yellow-400"
                >
                  rentdirect25@outlook.com
                </a>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm font-black uppercase text-yellow-400">
                  Support Hours
                </p>

                <p className="mt-2 text-lg font-bold text-neutral-300">
                  Monday – Sunday
                </p>

                <p className="text-neutral-400">
                  8:00 AM – 8:00 PM
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-[32px] bg-white p-8 text-black">
            <h2 className="text-3xl font-black">
              Need an apartment?
            </h2>

            <p className="mt-4 text-neutral-600">
              Browse verified apartments across Ghana and connect directly with
              landlords after purchasing your inspection pass.
            </p>

            <Link
              href="/apartments"
              className="mt-8 block rounded-full bg-yellow-400 px-8 py-4 text-center font-black text-black hover:bg-yellow-300"
            >
              Browse Apartments
            </Link>

            <Link
              href="/pricing"
              className="mt-4 block rounded-full border-2 border-black px-8 py-4 text-center font-black hover:bg-black hover:text-white"
            >
              View Pricing
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
