"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { name: "Home", href: "/" },
  { name: "Apartments", href: "/apartments" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousWidth = document.body.style.width;
    const scrollPosition = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollPosition}px`;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    function handleResize() {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    }

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);

      const savedTop = document.body.style.top;

      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.width = previousWidth;
      document.body.style.top = "";

      if (savedTop) {
        window.scrollTo(0, Math.abs(parseInt(savedTop, 10)) || 0);
      }
    };
  }, [open]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] w-full border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div
          className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <Link
            href="/"
            onClick={closeMenu}
            className="shrink-0 text-2xl font-bold tracking-wide text-white sm:text-3xl"
          >
            Rent<span className="text-yellow-400">Direct</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-white lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-yellow-400"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/login"
              className="rounded-xl border border-white/20 px-5 py-2.5 font-bold text-white transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Login
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="relative z-[120] flex min-h-12 min-w-12 touch-manipulation items-center justify-center rounded-xl border border-white/15 bg-white/10 text-2xl text-white transition active:scale-95 lg:hidden"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[200] lg:hidden ${
          open ? "pointer-events-auto visible" : "pointer-events-none invisible"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close navigation menu"
          className={`absolute inset-0 h-full w-full touch-manipulation bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,390px)] max-w-full flex-col overflow-hidden bg-[#07111F] text-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingRight: "env(safe-area-inset-right)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
            <h2 className="min-w-0 truncate text-2xl font-black">
              Rent<span className="text-yellow-400">Direct</span>
            </h2>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="ml-3 flex min-h-12 min-w-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-white/10 text-xl font-black transition active:scale-95"
            >
              ✕
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            }}
          >
            <nav className="space-y-3">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex min-h-14 w-full touch-manipulation items-center rounded-2xl px-5 py-4 text-base font-black transition active:scale-[0.98] ${
                      active
                        ? "bg-yellow-400 text-black"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    <span className="min-w-0 break-words">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/login"
              onClick={closeMenu}
              className="mt-6 flex min-h-14 w-full touch-manipulation items-center justify-center rounded-2xl bg-yellow-400 px-6 py-4 text-center text-base font-black text-black transition active:scale-[0.98]"
            >
              Login
            </Link>

            <p className="mt-6 break-words px-2 pb-4 text-center text-xs leading-5 text-white/50">
              Find verified apartments and connect directly with landlords.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
