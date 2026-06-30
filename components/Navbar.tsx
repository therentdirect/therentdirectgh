"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-3xl font-bold tracking-wide text-white">
          Rent<span className="text-yellow-400">Direct</span>
        </Link>

        <nav className="hidden items-center gap-8 text-white lg:flex">
          <Link href="/" className="transition hover:text-yellow-400">
            Home
          </Link>

          <Link href="/apartments" className="transition hover:text-yellow-400">
            Apartments
          </Link>

          <Link href="/how-it-works" className="transition hover:text-yellow-400">
            How It Works
          </Link>

          <Link href="/pricing" className="transition hover:text-yellow-400">
            Pricing
          </Link>

          <Link href="/about" className="transition hover:text-yellow-400">
            About
          </Link>

          <Link href="/contact" className="transition hover:text-yellow-400">
            Contact
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-5 py-2 text-white transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Login
          </Link>
        </div>

        <button className="text-3xl text-white lg:hidden">☰</button>
      </div>
    </header>
  );
}