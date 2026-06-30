"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReviewsPage() {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setMessage("Please login again.");
        setSubmitting(false);
        return;
      }

      if (!reviewText.trim()) {
        setMessage("Please write your review.");
        setSubmitting(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .single();

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        user_email: user.email,
        user_name: profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "",
        user_phone: profile?.phone || "",

        property_id: null,
        property_title: "RentDirect Platform",
        property_location: "Ghana",

        rating,
        review_text: reviewText,
        status: "pending",
      });

      if (error) throw new Error(error.message);

      setMessage("✅ Thank you for your review.");
      setRating(5);
      setReviewText("");
    } catch (error: any) {
      setMessage(error.message || "Something went wrong.");
    }

    setSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-500">
          RentDirect
        </p>

        <h1 className="mt-2 text-2xl font-black">Leave a Review</h1>

        <p className="mt-1 text-sm text-neutral-500">
          Tell us about your experience using RentDirect.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-3 text-center text-sm font-black text-yellow-700">
          {message}
        </div>
      )}

      <form
        onSubmit={submitReview}
        className="rounded-2xl bg-white p-5 shadow-sm"
      >
        <label className="block">
          <p className="mb-2 text-sm font-bold text-neutral-600">Rating</p>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-3xl"
              >
                {star <= rating ? "⭐" : "☆"}
              </button>
            ))}
          </div>
        </label>

        <label className="mt-5 block">
          <p className="mb-2 text-sm font-bold text-neutral-600">
            Your Review
          </p>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            required
            rows={4}
            placeholder="Tell us what you liked, what was helpful, or what we can improve..."
            className="w-full rounded-2xl border border-neutral-200 p-4 text-sm outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-full bg-yellow-400 px-6 py-3 text-sm font-black text-black hover:bg-yellow-300 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </main>
  );
}