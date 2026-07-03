import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="inline-flex rounded-full bg-yellow-400 px-4 py-2 font-black text-black">
          RentDirect Ghana
        </div>

        <h1 className="mt-8 text-5xl font-black capitalize">
          apartments
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
          This page is currently being completed as part of the RentDirect
          platform. More premium features and information will be available
          here very soon.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
          >
            Back Home
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-yellow-400 px-8 py-4 font-black text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
