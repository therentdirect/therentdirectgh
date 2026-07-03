import Link from "next/link";

export default function ApartmentsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-block rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black">
            RentDirect Apartments
          </p>

          <h1 className="mt-8 text-5xl font-black md:text-6xl">
            Browse verified apartments without agent fees.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
            Sign up or login to view available apartments, save your favourites,
            buy an inspection pass and contact landlords directly.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-yellow-400 px-8 py-4 font-black text-yellow-400 hover:bg-yellow-400 hover:text-black"
            >
              Login to Browse
            </Link>
          </div>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-[30px] bg-white/5 p-6">
            <h2 className="text-2xl font-black text-yellow-400">Verified Listings</h2>
            <p className="mt-4 text-neutral-300">
              View apartments with photos, videos, location details and rent information.
            </p>
          </div>

          <div className="rounded-[30px] bg-white/5 p-6">
            <h2 className="text-2xl font-black text-yellow-400">Direct Landlords</h2>
            <p className="mt-4 text-neutral-300">
              Unlock landlord contacts after purchasing your GH₵250 inspection pass.
            </p>
          </div>

          <div className="rounded-[30px] bg-white/5 p-6">
            <h2 className="text-2xl font-black text-yellow-400">No Agent Fees</h2>
            <p className="mt-4 text-neutral-300">
              Avoid agent commissions and schedule inspections directly.
            </p>
          </div>
        </section>

        <div className="mt-16 rounded-[32px] bg-white p-8 text-center text-black">
          <h2 className="text-3xl font-black">Already have an account?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
            Go straight to your dashboard to browse all available apartments.
          </p>

          <Link
            href="/dashboard/apartments"
            className="mt-8 inline-block rounded-full bg-black px-8 py-4 font-black text-yellow-400 hover:bg-neutral-800"
          >
            Open Apartment Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
