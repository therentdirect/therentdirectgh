"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Favorite = {
  id: string;
  property_id: string;
  created_at: string;
  properties: {
    id: string;
    title: string;
    area: string;
    city: string;
    region: string;
    apartment_type: string;
    monthly_rent: number;
    bedrooms: number;
    bathrooms: number;
    parking: string;
    status: string;
    main_image: string | null;
  };
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("id, property_id, created_at, properties(*)")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    }

    if (data) {
      setFavorites(data as any);
    }

    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setFavorites((current) => current.filter((item) => item.id !== favoriteId));
  };

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">
          Saved Apartments
        </h1>

        <p className="mt-2 text-lg text-neutral-500">
          Apartments you saved for later.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-bold text-yellow-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-[28px] bg-white p-12 text-center text-neutral-500 shadow-sm">
          Loading saved apartments...
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-[32px] bg-white p-12 text-center shadow-sm">
          <h2 className="text-3xl font-black">No saved apartments yet</h2>

          <p className="mt-3 text-neutral-500">
            Tap the heart on apartments you like, and they will appear here.
          </p>

          <Link
            href="/dashboard/apartments"
            className="mt-6 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Browse Apartments
          </Link>
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((favorite) => {
            const property = favorite.properties;

            if (!property) return null;

            return (
              <article
                key={favorite.id}
                className="group overflow-hidden rounded-[28px] border border-neutral-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden">
                  {property.main_image ? (
                    <img
                      src={property.main_image}
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-100 text-neutral-400">
                      No Image
                    </div>
                  )}

                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="absolute right-4 top-4 rounded-full bg-white/90 p-3 text-2xl shadow-md transition hover:scale-110"
                  >
                    ❤️
                  </button>

                  <span className="absolute bottom-4 left-4 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                    ✅ Verified
                  </span>

                  <span className="absolute bottom-4 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                    {property.status || "Available"}
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  <h2 className="text-xl font-black leading-tight">
                    {property.title}
                  </h2>

                  <p className="text-sm text-neutral-500">
                    📍 {property.area}, {property.city}, {property.region}
                  </p>

                  <p className="text-xl font-black">
                    GH₵{property.monthly_rent}
                    <span className="text-sm font-medium text-neutral-500">
                      {" "}
                      / month
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-5 text-sm text-neutral-600">
                    <span>🛏 {property.bedrooms || 0}</span>
                    <span>🛁 {property.bathrooms || 0}</span>
                    <span>🚗 {property.parking ? 1 : 0}</span>
                  </div>

                  <p className="inline-block rounded-full bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-700">
                    {property.apartment_type}
                  </p>

                  <Link
                    href={`/dashboard/apartments/${property.id}`}
                    className="block rounded-full border border-yellow-400 px-5 py-3 text-center font-bold text-black transition hover:bg-yellow-400"
                  >
                    View Details →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}