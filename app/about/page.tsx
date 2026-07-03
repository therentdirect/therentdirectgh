import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="inline-block rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black">
          About RentDirect
        </p>

        <h1 className="mt-8 max-w-4xl text-5xl font-black md:text-6xl">
          We are making apartment hunting simpler in Ghana.
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
          RentDirect connects tenants directly with landlords so people can find
          apartments without agent commissions, scouting stress or hidden charges.
        </p>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-[30px] bg-white/5 p-6">
            <h2 className="text-2xl font-black text-yellow-400">Our Mission</h2>
            <p className="mt-4 text-neutral-300">
              To make renting in Ghana transparent, affordable and stress-free.
            </p>
          </div>

          <div className="rounded-[30px] bg-white/5 p-6">
            <h2 className="text-2xl font-black text-yellow-400">Our Promise</h2>
            <p className="mt-4 text-neutral-300">
              Verified listings, direct landlord access and no agent commissions.
            </p>
          </div>

          <div className="rounded-[30px] bg-white/5 p-6">
            <h2 className="text-2xl font-black text-yellow-400">Our Vision</h2>
            <p className="mt-4 text-neutral-300">
              To become Ghana’s most trusted direct rental platform.
            </p>
          </div>
        </section>

        <div className="mt-12">
          <Link
            href="/apartments"
            className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </div>
      </section>
    </main>
  );
}
