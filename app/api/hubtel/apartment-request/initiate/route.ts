import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requestId = String(body?.request_id || "").trim();

    if (!requestId) {
      return NextResponse.json(
        { error: "Apartment request ID is required." },
        { status: 400 }
      );
    }

    const apiId = process.env.HUBTEL_API_ID;
    const apiKey = process.env.HUBTEL_API_KEY;
    const merchantAccountNumber =
      process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

    const requestOrigin = new URL(request.url).origin;

    const siteUrl =
      process.env.NODE_ENV === "development"
        ? requestOrigin
        : process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;

    if (!apiId || !apiKey || !merchantAccountNumber) {
      return NextResponse.json(
        { error: "Hubtel settings are missing." },
        { status: 500 }
      );
    }

    const { data: apartmentRequest, error: requestError } =
      await supabaseAdmin
        .from("apartment_requests")
        .select(
          `
            id,
            user_id,
            user_email,
            customer_name,
            phone,
            whatsapp_number,
            service_fee,
            payment_status
          `
        )
        .eq("id", requestId)
        .single();

    if (requestError || !apartmentRequest) {
      return NextResponse.json(
        {
          error:
            requestError?.message ||
            "Apartment request was not found.",
        },
        { status: 404 }
      );
    }

    const normalizedPaymentStatus = String(
      apartmentRequest.payment_status || ""
    ).toLowerCase();

    if (
      [
        "paid",
        "successful",
        "success",
        "completed",
        "confirmed",
      ].includes(normalizedPaymentStatus)
    ) {
      return NextResponse.json(
        {
          error:
            "This apartment search request has already been paid.",
        },
        { status: 400 }
      );
    }

    const amount = Number(
      apartmentRequest.service_fee || 450
    );

    const clientReference = `RDHOME${Date.now()}${requestId
      .replaceAll("-", "")
      .slice(0, 6)
      .toUpperCase()}`;

    const auth = Buffer.from(
      `${apiId}:${apiKey}`
    ).toString("base64");

    const { error: updateError } = await supabaseAdmin
      .from("apartment_requests")
      .update({
        service_fee: amount,
        payment_status: "pending",
        hubtel_payment_status: "pending",
        hubtel_client_reference: clientReference,
      })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const returnUrl =
      `${siteUrl}/dashboard/find-me-a-home/requests/` +
      `${requestId}?payment=processing`;

    const cancellationUrl =
      `${siteUrl}/dashboard/find-me-a-home/requests/` +
      `${requestId}?payment=cancelled`;

    const callbackUrl =
      `${siteUrl}/api/hubtel/apartment-request/callback`;

    const response = await fetch(
      "https://payproxyapi.hubtel.com/items/initiate",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          totalAmount: amount,
          description:
            "RentDirect Find Me a Home Apartment Search",
          callbackUrl,
          returnUrl,
          cancellationUrl,
          merchantAccountNumber,
          clientReference,
          payeeName:
            apartmentRequest.customer_name ||
            body?.name ||
            "RentDirect Customer",
          payeeMobileNumber:
            apartmentRequest.whatsapp_number ||
            apartmentRequest.phone ||
            body?.phone ||
            "",
          payeeEmail:
            apartmentRequest.user_email ||
            body?.email ||
            "",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data?.responseCode !== "0000") {
      await supabaseAdmin
        .from("apartment_requests")
        .update({
          payment_status: "failed",
          hubtel_payment_status: "failed",
        })
        .eq("id", requestId)
        .eq(
          "hubtel_client_reference",
          clientReference
        );

      return NextResponse.json(
        {
          error:
            data?.message ||
            "Hubtel checkout could not be started.",
          details: data,
        },
        { status: 400 }
      );
    }

    const checkoutId =
      data?.data?.checkoutId || null;

    const checkoutUrl =
      data?.data?.checkoutUrl || null;

    if (!checkoutUrl) {
      await supabaseAdmin
        .from("apartment_requests")
        .update({
          payment_status: "failed",
          hubtel_payment_status: "failed",
        })
        .eq("id", requestId);

      return NextResponse.json(
        {
          error:
            "Hubtel did not return a checkout link.",
        },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("apartment_requests")
      .update({
        hubtel_checkout_id: checkoutId,
      })
      .eq("id", requestId)
      .eq(
        "hubtel_client_reference",
        clientReference
      );

    return NextResponse.json({
      success: true,
      checkoutUrl,
      checkoutId,
      clientReference,
      requestId,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start Hubtel checkout.";

    console.error(
      "Apartment request payment initiation error:",
      error
    );

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
