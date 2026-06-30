"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Reviews from "@/components/Reviews";

type Property = {
  id: string;
  title: string;
  region: string;
  city: string;
  area: string;
  apartment_type: string;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  main_image: string | null;
};

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (data) setProperties(data);
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-black uppercase tracking-[0.3em] text-yellow-400">
            RentDirect Ghana
          </p>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            Find verified homes without agent fees.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-neutral-300">
            Browse verified apartments, unlock landlord contacts, and schedule
            inspections directly with landlords.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/20 px-8 py-4 font-black text-white hover:border-yellow-400"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-16 md:grid-cols-4">
        <MiniCard title="No Agent Fees" text="Deal directly with landlords." />
        <MiniCard title="Verified Homes" text="Listings reviewed before upload." />
        <MiniCard title="30-Day Pass" text="Unlock contacts for 30 days." />
        <MiniCard title="Easy Inspection" text="Schedule directly on WhatsApp." />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-black uppercase tracking-[0.3em] text-yellow-500">
              Featured Homes
            </p>
            <h2 className="mt-2 text-4xl font-black">Latest Apartments</h2>
          </div>

          <Link href="/signup" className="font-black text-yellow-600">
            View more →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <article
              key={property.id}
              className="overflow-hidden rounded-[28px] border border-neutral-100 bg-white shadow-sm"
            >
              <div className="h-60 bg-neutral-100">
                {property.main_image ? (
                  <img
                    src={property.main_image}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="space-y-3 p-5">
                <h3 className="text-xl font-black">{property.title}</h3>

                <p className="text-sm text-neutral-500">
                  📍 {property.area}, {property.city}
                </p>

                <p className="text-xl font-black">
                  GH₵{property.monthly_rent}
                  <span className="text-sm font-medium text-neutral-500">
                    {" "}
                    / month
                  </span>
                </p>

                <Link
                  href="/signup"
                  className="block rounded-full border border-yellow-400 px-5 py-3 text-center font-black hover:bg-yellow-400"
                >
                  Sign up to view details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-center font-black uppercase tracking-[0.3em] text-yellow-500">
            How It Works
          </p>

          <h2 className="mt-3 text-center text-4xl font-black">
            Simple. Direct. Stress-free.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Step number="1" title="Create Account" text="Sign up and browse verified apartments." />
            <Step number="2" title="Get Inspection Pass" text="Pay once and unlock landlord contacts for 30 days." />
            <Step number="3" title="Contact Landlord" text="Schedule inspections directly without agents." />
          </div>
        </div>
      </section>

      <Reviews />

      <section className="bg-black px-6 py-20 text-center text-white">
        <h2 className="text-4xl font-black">
          Ready to find your next home?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-neutral-300">
          Join RentDirect Ghana and stop paying unnecessary agent fees.
        </p>

        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300"
        >
          Get Started
        </Link>
      </section>
    </main>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{text}</p>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] bg-white p-8 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-xl font-black">
        {number}
      </div>

      <h3 className="mt-6 text-2xl font-black">{title}</h3>
      <p className="mt-3 text-neutral-500">{text}</p>
    </div>
  );
}
