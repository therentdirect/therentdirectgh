"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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

    const userId = data.user?.id;
    const userEmail = data.user?.email?.toLowerCase();

    if (!userId || !userEmail) {
      setMessage("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    let role = "user";

    const { data: profileById } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileById?.role) {
      role = profileById.role;
    } else {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", userEmail)
        .maybeSingle();

      if (profileByEmail?.role) {
        role = profileByEmail.role;
      }
    }

    setMessage("Login successful. Redirecting...");

    setTimeout(() => {
      if (role === "super_admin" || role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }, 700);

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#07111F] px-6 pb-20 pt-32 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
            RentDirect Ghana
          </p>

          <h1 className="mt-4 text-5xl font-bold leading-tight">
            Welcome Back to RentDirect
          </h1>

          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Login to continue searching for verified apartments, manage your
            access pass, and schedule inspections directly with landlords.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              Verified apartments
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              30-day access pass
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              Schedule inspections
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              No agent fees
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
          <h2 className="text-3xl font-bold">Login</h2>
          <p className="mt-2 text-slate-500">
            Enter your email and password to continue.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-yellow-400"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-4 pr-20 outline-none focus:border-yellow-400"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-sm font-semibold text-yellow-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {message && (
              <p className="rounded-xl bg-slate-100 p-3 text-center text-sm font-semibold text-slate-700">
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-yellow-600 hover:text-yellow-700"
            >
              Create account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}