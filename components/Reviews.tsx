"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  name: string;
  rating: number;
  review: string;
};

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6);

    if (data) setReviews(data);
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center font-bold uppercase tracking-[0.3em] text-yellow-500">
          Reviews
        </p>

        <h2 className="mt-3 text-center text-5xl font-black">
          What Our Users Say
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-500">
          Real experiences from people who have used RentDirect to find apartments without paying agent commissions.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[32px] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="text-2xl">
                {"⭐".repeat(review.rating)}
              </div>

              <p className="mt-5 leading-8 text-neutral-600">
                "{review.review}"
              </p>

              <h3 className="mt-8 text-xl font-black">
                {review.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}