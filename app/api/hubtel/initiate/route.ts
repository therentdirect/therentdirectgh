import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const apiId = process.env.HUBTEL_API_ID;
    const apiKey = process.env.HUBTEL_API_KEY;
    const merchantAccountNumber = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const propertyId = body.property_id || "";
    const returnTo = propertyId
      ? `/dashboard/apartments/${propertyId}`
      : "/dashboard/apartments";

    if (!apiId || !apiKey || !merchantAccountNumber) {
      return NextResponse.json(
        { error: "Hubtel settings are missing." },
        { status: 500 }
      );
    }

    const clientReference = `RD${Date.now()}`;
    const auth = Buffer.from(`${apiId}:${apiKey}`).toString("base64");

    const { error: passError } = await supabaseAdmin.from("user_passes").insert({
      user_id: body.user_id,
      user_email: body.email,
      username: body.username || "",
      user_phone: body.phone || "",
      amount: 250,
      payment_method: "Hubtel Online Checkout",
      payment_reference: clientReference,
      hubtel_client_reference: clientReference,
      status: "pending_verification",
      hubtel_payment_status: "pending",
    });

    if (passError) {
      return NextResponse.json({ error: passError.message }, { status: 500 });
    }

    const response = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        totalAmount: 250.0,
        description: "RentDirect 30-Day Inspection Pass",
        callbackUrl: `${siteUrl}/api/hubtel/callback`,
        returnUrl: `${siteUrl}/dashboard/pass/success?reference=${clientReference}&returnTo=${encodeURIComponent(returnTo)}`,
        cancellationUrl: `${siteUrl}/dashboard/pass/cancelled?reference=${clientReference}&returnTo=${encodeURIComponent(returnTo)}`,
        merchantAccountNumber,
        clientReference,
        payeeName: body.name || "RentDirect User",
        payeeMobileNumber: body.phone || "",
        payeeEmail: body.email || "",
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.responseCode !== "0000") {
      await supabaseAdmin
        .from("user_passes")
        .update({
          status: "failed",
          hubtel_payment_status: "failed",
        })
        .eq("hubtel_client_reference", clientReference);

      return NextResponse.json(
        { error: data?.message || "Hubtel checkout failed.", details: data },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("user_passes")
      .update({
        hubtel_checkout_id: data.data.checkoutId,
      })
      .eq("hubtel_client_reference", clientReference);

    return NextResponse.json({
      success: true,
      checkoutUrl: data.data.checkoutUrl,
      checkoutId: data.data.checkoutId,
      clientReference,
      returnTo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to start Hubtel checkout." },
      { status: 500 }
    );
  }
}
