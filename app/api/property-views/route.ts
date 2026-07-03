import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.property_id) {
      return NextResponse.json({ success: false, error: "Missing property_id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("property_views").insert({
      property_id: body.property_id,
      user_id: body.user_id || null,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to track view" },
      { status: 500 }
    );
  }
}
