import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("user_passes")
      .update({
        status: "expired",
      })
      .eq("status", "active")
      .lt("expires_at", now);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to expire passes" },
      { status: 500 }
    );
  }
}
