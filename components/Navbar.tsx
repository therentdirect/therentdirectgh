"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    return null;
  }

  const links = [
    { name: "Home", href: "/" },
    { name: "Apartments", href: "/apartments" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-3xl font-bold tracking-wide text-white">
          Rent<span className="text-yellow-400">Direct</span>
        </Link>

        <nav className="hidden items-center gap-8 text-white lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-yellow-400">
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-5 py-2 text-white transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-3xl text-white lg:hidden"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden">
          <div className="ml-auto h-screen w-[82%] max-w-sm bg-[#07111F] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">
                Rent<span className="text-yellow-400">Direct</span>
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 px-4 py-2 font-black"
              >
                Close
              </button>
            </div>

            <nav className="mt-8 space-y-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl bg-white/10 px-5 py-4 font-black hover:bg-yellow-400 hover:text-black"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-8 block rounded-full bg-yellow-400 px-6 py-4 text-center font-black text-black"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
