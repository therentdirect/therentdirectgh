"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user!.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: "user",
    });

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    setMessage("✅ Account created successfully.");
    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] pt-20 text-white">
      <section className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative hidden overflow-hidden bg-black lg:block">
          <img
            src="/images/signup-bg.jpg"
            alt="Modern premium home"
            className="h-full w-full object-contain object-left"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/20 to-black/80" />

          <div className="absolute bottom-10 left-10 max-w-xl">
            <p className="mb-4 inline-block rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
              RentDirect Ghana
            </p>

            <h1 className="text-5xl font-black leading-tight">
              Find verified homes without agent fees.
            </h1>

            <p className="mt-5 text-lg text-white/80">
              Connect directly with landlords and schedule apartment inspections
              without the stress of agents.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-8">
          <form
            onSubmit={handleSignUp}
            className="w-full max-w-[430px] rounded-[28px] border border-white/15 bg-black/75 p-6 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-center text-3xl font-black">Create Account</h2>

            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/65">
              Join RentDirect and unlock verified apartments.
            </p>

            {message && (
              <div className="mt-4 rounded-2xl bg-yellow-100 p-3 text-center text-sm font-bold text-yellow-800">
                {message}
              </div>
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm outline-none placeholder:text-white/55"
              />

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm outline-none placeholder:text-white/55"
              />
            </div>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@ Username"
              required
              className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 p-3 text-sm outline-none placeholder:text-white/55"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email Address"
              required
              className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 p-3 text-sm outline-none placeholder:text-white/55"
            />

            <div className="mt-3 flex overflow-hidden rounded-xl border border-white/20 bg-white/10">
              <span className="flex items-center border-r border-white/20 px-3 text-sm">
                🇬🇭 +233
              </span>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                required
                className="w-full bg-transparent p-3 text-sm outline-none placeholder:text-white/55"
              />
            </div>

            <div className="mt-3 flex overflow-hidden rounded-xl border border-white/20 bg-white/10">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="w-full bg-transparent p-3 text-sm outline-none placeholder:text-white/55"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 text-sm font-bold text-yellow-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-yellow-400 p-3 text-sm font-black text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>

            <p className="mt-4 text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link href="/login" className="font-black text-yellow-400">
                Login
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
