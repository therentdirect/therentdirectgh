import "./globals.css";
import Navbar from "@/components/Navbar";
import VisitorTracker from "@/components/VisitorTracker";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.className} bg-[#F8FAFC] text-[#111827] antialiased`}
      >
        <VisitorTracker />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
