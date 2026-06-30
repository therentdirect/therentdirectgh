"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  property_title: string;
  rating: number;
  review_text: string;
  status: string;
  created_at: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    if (data) setReviews(data);

    setLoading(false);
  }

  async function updateReview(id: string, status: string) {
    setMessage("Updating review...");

    const { error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Review updated.");
    fetchReviews();
  }

  async function deleteReview(id: string) {
    const confirmDelete = confirm("Delete this review permanently?");
    if (!confirmDelete) return;

    setMessage("Deleting review...");

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Review deleted.");
    fetchReviews();
  }

  const filteredReviews = useMemo(() => {
    if (!filter) return reviews;
    return reviews.filter((item) => item.status === filter);
  }, [reviews, filter]);

  return (
    <main className="space-y-5">
      <section className="rounded-[28px] bg-black p-6 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">Reviews</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Approve, reject, or delete RentDirect user reviews.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-3 text-center text-sm font-black text-yellow-700">
          {message}
        </div>
      )}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">All Reviews</h2>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="py-10 text-center text-neutral-500">
            Loading reviews...
          </p>
        ) : filteredReviews.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">
            No reviews found.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {filteredReviews.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black">
                      {"⭐".repeat(item.rating || 0)}
                    </p>
                    <p className="mt-2 font-black">
                      {item.user_name || "Anonymous User"}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {item.user_email}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black uppercase text-yellow-700">
                    {item.status}
                  </span>
                </div>

                <p className="mt-4 text-neutral-700">{item.review_text}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateReview(item.id, "approved")}
                    className="rounded-xl bg-green-100 px-4 py-2 text-sm font-black text-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateReview(item.id, "rejected")}
                    className="rounded-xl bg-red-100 px-4 py-2 text-sm font-black text-red-700"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => deleteReview(item.id)}
                    className="rounded-xl bg-black px-4 py-2 text-sm font-black text-white"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}