import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      endpoint?: string;
    };

    if (!body.endpoint) {
      return NextResponse.json(
        { error: "Subscription endpoint is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove subscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Push unsubscribe error:", error);

    return NextResponse.json(
      { error: "Unable to disable push notifications." },
      { status: 500 }
    );
  }
}
