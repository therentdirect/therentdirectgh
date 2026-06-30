"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin-login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    setChecking(false);
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-center font-bold text-slate-600">
        Checking admin access...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-[#07111F] px-6 py-8 text-white">
        <h1 className="text-2xl font-bold">
          Rent<span className="text-yellow-400">Direct</span>
        </h1>

        <p className="mt-1 text-sm text-slate-400">Admin Panel</p>

        <nav className="mt-10 space-y-2">
          <Link href="/admin" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Dashboard
          </Link>

          <Link href="/admin/properties" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Properties
          </Link>

          <Link href="/admin/properties/new" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Add Property
          </Link>

          <Link href="/admin/users" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Users
          </Link>

          <Link href="/admin/payments" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Payments
          </Link>

          <Link href="/admin/inspections" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Inspections
          </Link>

          <Link href="/admin/reviews" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Reviews
          </Link>

          <Link href="/admin/analytics" className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/10">
            Analytics
          </Link>
        </nav>
      </aside>

      <section className="ml-72 min-h-screen p-8">{children}</section>
    </main>
  );
}