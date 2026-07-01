"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  parking: string;
  status: string;
  main_image: string | null;
};

type Favorite = {
  id: string;
  property_id: string;
};

type Media = {
  id: string;
  property_id: string;
  media_type: string;
  media_url: string;
  file_name: string;
  display_order: number;
};

type ViewerItem = {
  media_type: string;
  media_url: string;
  file_name: string;
};

const categories = [
  "All",
  "Single Room",
  "Single Room (Porch)",
  "Single Self-Contained",
  "Chamber & Hall",
  "Chamber & Hall Self-Contained",
  "1 Bedroom Apartment",
  "2 Bedroom Apartment",
  "3 Bedroom Apartment",
  "4 Bedroom Apartment",
  "4 Bedrooms+",
  "Furnished",
  "Unfurnished",
  "Hostel",
  "Student Accommodation",
  "Roommate (Shared Apartment)",
];

export default function ApartmentsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});
  const [viewer, setViewer] = useState<{ items: ViewerItem[]; index: number } | null>(null);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      setUserEmail(user.email);
      setUserId(user.id);

      const { data: favoriteData } = await supabase
        .from("favorites")
        .select("id, property_id")
        .eq("user_email", user.email);

      if (favoriteData) setFavorites(favoriteData);
    }

    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (propertyData) setProperties(propertyData);

    const { data: mediaData } = await supabase
      .from("property_media")
      .select("*")
      .order("display_order", { ascending: true });

    if (mediaData) setMedia(mediaData);

    setLoading(false);
  }

  function getGallery(property: Property): ViewerItem[] {
    const gallery: ViewerItem[] = [];

    if (property.main_image) {
      gallery.push({
        media_type: "image",
        media_url: property.main_image,
        file_name: property.title,
      });
    }

    media
      .filter((item) => item.property_id === property.id)
      .forEach((item) => {
        if (!gallery.some((g) => g.media_url === item.media_url)) {
          gallery.push({
            media_type: item.media_type,
            media_url: item.media_url,
            file_name: item.file_name,
          });
        }
      });

    return gallery;
  }

  function nextSlide(propertyId: string, total: number) {
    setActiveSlides((prev) => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % total,
    }));
  }

  function previousSlide(propertyId: string, total: number) {
    setActiveSlides((prev) => ({
      ...prev,
      [propertyId]:
        (prev[propertyId] || 0) === 0 ? total - 1 : (prev[propertyId] || 0) - 1,
    }));
  }

  function nextViewer() {
    if (!viewer) return;

    setViewer({
      items: viewer.items,
      index: viewer.index === viewer.items.length - 1 ? 0 : viewer.index + 1,
    });
  }

  function previousViewer() {
    if (!viewer) return;

    setViewer({
      items: viewer.items,
      index: viewer.index === 0 ? viewer.items.length - 1 : viewer.index - 1,
    });
  }

  async function toggleFavorite(propertyId: string) {
    setMessage("");

    if (!userEmail) {
      setMessage("Please login again to save apartments.");
      return;
    }

    const existingFavorite = favorites.find((item) => item.property_id === propertyId);

    if (existingFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existingFavorite.id);

      if (error) {
        setMessage(error.message);
        return;
      }

      setFavorites((current) =>
        current.filter((item) => item.id !== existingFavorite.id)
      );

      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id: userId,
        user_email: userEmail,
        property_id: propertyId,
      })
      .select("id, property_id")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) setFavorites((current) => [...current, data]);
  }

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const searchText =
        `${p.title} ${p.region} ${p.city} ${p.area} ${p.apartment_type}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        p.apartment_type?.toLowerCase().includes(category.toLowerCase()) ||
        p.title?.toLowerCase().includes(category.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [properties, search, category]);

  return (
    <main className="min-h-screen bg-white text-black">
      {viewer && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 p-5">
          <button
            onClick={() => setViewer(null)}
            className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 font-black text-black"
          >
            ✕ Close
          </button>

          {viewer.items.length > 1 && (
            <>
              <button
                onClick={previousViewer}
                className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white px-5 py-3 text-4xl font-black text-black"
              >
                ‹
              </button>

              <button
                onClick={nextViewer}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white px-5 py-3 text-4xl font-black text-black"
              >
                ›
              </button>
            </>
          )}

          <div className="max-w-6xl text-center">
            {viewer.items[viewer.index].media_type === "video" ? (
              <video
                src={viewer.items[viewer.index].media_url}
                controls
                autoPlay
                className="max-h-[82vh] max-w-full rounded-2xl"
              />
            ) : (
              <img
                src={viewer.items[viewer.index].media_url}
                alt={viewer.items[viewer.index].file_name}
                className="max-h-[82vh] max-w-full rounded-2xl object-contain"
              />
            )}

            <p className="mt-4 text-sm font-bold text-white">
              {viewer.index + 1} / {viewer.items.length}
            </p>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Browse Apartments
          </h1>

          <p className="mt-2 text-lg text-neutral-500">
            Verified homes across Ghana. No agent fees.
          </p>
        </div>

        {message && (
          <div className="rounded-2xl bg-yellow-100 p-4 text-center font-bold text-yellow-700">
            {message}
          </div>
        )}

        <div className="sticky top-4 z-20 rounded-full border border-neutral-200 bg-white p-3 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="pl-3 text-2xl">🔍</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city, area or apartment..."
              className="w-full bg-transparent px-2 py-3 text-base outline-none"
            />

            <button className="rounded-full bg-yellow-400 px-5 py-3 font-bold text-black">
              Search
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition ${
                category === item
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-yellow-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="font-bold text-neutral-700">
            {filtered.length} apartment{filtered.length === 1 ? "" : "s"} found
          </p>

          <Link
            href="/dashboard/favorites"
            className="font-bold text-yellow-600 hover:text-yellow-500"
          >
            Saved Apartments →
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-neutral-50 p-12 text-center text-neutral-500">
            Loading apartments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-neutral-50 p-12 text-center">
            <h2 className="text-2xl font-bold">No apartments found</h2>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((property) => {
              const isSaved = favorites.some((item) => item.property_id === property.id);
              const isRented = property.status === "Rented";
              const gallery = getGallery(property);
              const activeIndex = activeSlides[property.id] || 0;
              const current = gallery[activeIndex];

              return (
                <article
                  key={property.id}
                  className={`group overflow-hidden rounded-[28px] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    isRented ? "border-red-100 opacity-90" : "border-neutral-100"
                  }`}
                >
                  <div className="relative h-64 overflow-hidden bg-neutral-950">
                    {current ? (
                      <button
                        type="button"
                        onClick={() => setViewer({ items: gallery, index: activeIndex })}
                        className="h-full w-full"
                      >
                        {current.media_type === "video" ? (
                          <video src={current.media_url} className="h-full w-full object-contain" muted />
                        ) : (
                          <img src={current.media_url} className="h-full w-full object-contain" alt={current.file_name} />
                        )}
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        No Image
                      </div>
                    )}

                    {gallery.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => previousSlide(property.id, gallery.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1 text-2xl font-black"
                        >
                          ‹
                        </button>

                        <button
                          type="button"
                          onClick={() => nextSlide(property.id, gallery.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1 text-2xl font-black"
                        >
                          ›
                        </button>

                        <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                          {activeIndex + 1} / {gallery.length}
                        </span>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleFavorite(property.id)}
                      className="absolute right-4 top-4 rounded-full bg-white/90 p-3 text-2xl shadow-md transition hover:scale-110"
                    >
                      {isSaved ? "❤️" : "♡"}
                    </button>

                    <span className="absolute bottom-4 left-4 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                      Verified
                    </span>

                    <span
                      className={`absolute bottom-4 right-4 rounded-full px-3 py-1 text-xs font-bold text-white ${
                        isRented ? "bg-red-500" : "bg-green-500"
                      }`}
                    >
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
                        {" "} / month
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
      </section>
    </main>
  );
}