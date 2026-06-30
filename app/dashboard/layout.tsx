"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("first_name,last_name,email,username")
      .eq("email", user.email)
      .single();

    setProfile(
      data || {
        first_name: "RentDirect",
        last_name: "User",
        email: user.email || "",
        username: "",
      }
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = profile
    ? profile.username || `${profile.first_name || ""} ${profile.last_name || ""}`
    : "Loading...";

  const navItems = [
    { name: "Apartments", href: "/dashboard/apartments" },
    { name: "Saved Apartments", href: "/dashboard/favorites" },
    { name: "My Inspections", href: "/dashboard/inspections" },
    { name: "Reviews", href: "/dashboard/reviews" },
    { name: "Inspection Pass", href: "/dashboard/pass" },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <aside className="fixed left-0 top-0 hidden h-screen w-80 border-r border-neutral-200 bg-white px-6 py-6 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl font-black text-yellow-400">
            R
          </div>

          <div>
            <h1 className="text-2xl font-black">
              Rent<span className="text-yellow-500">Direct</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
              No Agent Fees
            </p>
          </div>
        </Link>

        <div className="mt-10">
          <p className="mb-4 px-4 text-xs font-black uppercase tracking-[0.3em] text-neutral-400">
            Dashboard
          </p>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-2xl px-4 py-3 font-bold transition ${
                    active
                      ? "bg-yellow-400 text-black shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-10 rounded-[28px] border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Logged in as
          </p>

          <p className="mt-2 truncate text-lg font-black">{displayName}</p>

          <p className="mt-1 truncate text-xs text-neutral-500">
            {profile?.email || ""}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              ● Online
            </span>

            <button
              onClick={handleLogout}
              className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-80">
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                RentDirect
              </p>
              <h2 className="text-xl font-black md:text-2xl">
                Welcome back, {displayName} 👋
              </h2>
            </div>

            <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
              ● Online
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          {children}
        </div>
      </section>
    </main>
  );
}