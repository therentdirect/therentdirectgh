"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/sendTelegramAlert";

function getVisitorId() {
  let visitorId = localStorage.getItem("rentdirect_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("rentdirect_visitor_id", visitorId);
  }

  return visitorId;
}

function getDevice() {
  const width = window.innerWidth;
  if (width < 768) return "Mobile";
  if (width < 1024) return "Tablet";
  return "Desktop";
}

function getBrowser() {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";

  return "Unknown";
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    async function trackVisit() {
      try {
        const visitorId = getVisitorId();
        const device = getDevice();
        const browser = getBrowser();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.from("visitor_logs").insert({
          visitor_id: visitorId,
          user_id: user?.id || null,
          user_email: user?.email || null,
          page_path: pathname || "/",
          browser,
          device,
        });

        if (error) {
          console.error("Visitor tracking error:", error.message);
          return;
        }

        await sendTelegramAlert(
          `RentDirect Visitor Alert\n\nPage: ${pathname || "/"}\nDevice: ${device}\nBrowser: ${browser}\nUser: ${
            user?.email || "Guest visitor"
          }\nTime: ${new Date().toLocaleString()}`
        );

        console.log("Visitor tracked:", pathname);
      } catch (error) {
        console.error("Visitor tracker failed:", error);
      }
    }

    trackVisit();
  }, [pathname]);

  return null;
}