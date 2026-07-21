import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import VisitorTracker from "@/components/VisitorTracker";
import PWARegister from "@/components/PWARegister";
import InstallAppButton from "@/components/InstallAppButton";
import PushNotificationButton from "@/components/PushNotificationButton";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  applicationName: "RentDirect Ghana",
  title: {
    default: "RentDirect Ghana | Apartments Without Agents",
    template: "%s | RentDirect Ghana",
  },
  description:
    "Find verified apartments and connect directly with landlords in Ghana without agents or commissions.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RentDirect",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.className} bg-[#F8FAFC] text-[#111827] antialiased`}
      >
        <PWARegister />
        <VisitorTracker />
        <Navbar />
        {children}
        <PushNotificationButton />
        <InstallAppButton />
      </body>
    </html>
  );
}
