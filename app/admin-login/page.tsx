"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const userEmail = data.user?.email?.toLowerCase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", userEmail)
      .maybeSingle();

    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      await supabase.auth.signOut();
      setMessage("Access denied. This login is for admins only.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111F] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-slate-900 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-500">
          RentDirect
        </p>

        <h1 className="mt-3 text-3xl font-black">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Authorized RentDirect administrators only.
        </p>

        <form onSubmit={handleAdminLogin} className="mt-8 space-y-5">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-yellow-400"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 p-4 pr-20 outline-none focus:border-yellow-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-sm font-bold text-yellow-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 p-4 font-black text-black hover:bg-yellow-300 disabled:opacity-70"
          >
            {loading ? "Checking access..." : "Login as Admin"}
          </button>

          {message && (
            <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}