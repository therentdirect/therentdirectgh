"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Properties", href: "/admin/properties" },
    { name: "Add Property", href: "/admin/properties/new" },
    { name: "Users", href: "/admin/users" },
    { name: "Payments", href: "/admin/payments" },
    { name: "Inspections", href: "/admin/inspections" },
    { name: "Reviews", href: "/admin/reviews" },
    { name: "Analytics", href: "/admin/analytics" },
  ];

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
      .eq("email", user.email)
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
      <aside className="fixed left-0 top-0 hidden h-screen w-72 overflow-y-auto bg-[#07111F] px-6 py-8 text-white lg:block">
        <h1 className="text-2xl font-bold">
          Rent<span className="text-yellow-400">Direct</span>
        </h1>

        <p className="mt-1 text-sm text-slate-400">Admin Panel</p>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 font-semibold ${
                  active
                    ? "bg-yellow-400 text-black"
                    : "hover:bg-white/10"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-500">
                RentDirect Admin
              </p>
              <h2 className="text-xl font-black">Admin Panel</h2>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
            >
              Menu
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/45 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 h-full w-full"
              aria-label="Close menu"
            />

            <div className="relative ml-auto h-full w-[75%] max-w-sm overflow-y-auto bg-[#07111F] px-6 py-8 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    Rent<span className="text-yellow-400">Direct</span>
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">Admin Panel</p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-white/10 px-4 py-2 font-black text-white"
                >
                  Close
                </button>
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                Menu
              </p>

              <nav className="mt-4 space-y-2">
                {navItems.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-2xl px-4 py-4 font-black ${
                        active
                          ? "bg-yellow-400 text-black"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <div className="min-h-screen p-4 lg:p-8">{children}</div>
      </section>
    </main>
  );
}
