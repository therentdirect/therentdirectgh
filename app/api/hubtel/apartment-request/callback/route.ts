import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegram(message: string) {
  try {
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const chatId =
      process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      }
    );
  } catch {
    // Telegram failure must not fail the payment callback.
  }
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(
      "APARTMENT REQUEST HUBTEL CALLBACK:",
      JSON.stringify(body, null, 2)
    );

    const data =
      body?.Data ||
      body?.data ||
      body;

    const clientReference =
      data?.ClientReference ||
      data?.clientReference ||
      body?.ClientReference ||
      body?.clientReference;

    const status =
      data?.Status ||
      data?.status ||
      body?.Status ||
      body?.status ||
      "";

    const responseCode =
      data?.ResponseCode ||
      data?.responseCode ||
      body?.ResponseCode ||
      body?.responseCode ||
      "";

    if (!clientReference) {
      return NextResponse.json(
        { error: "Missing client reference." },
        { status: 400 }
      );
    }

    const normalizedStatus = String(
      status
    ).toLowerCase();

    const isSuccessful =
      responseCode === "0000" ||
      normalizedStatus === "success" ||
      normalizedStatus === "successful" ||
      normalizedStatus === "paid" ||
      normalizedStatus === "completed";

    const isPending =
      normalizedStatus === "pending" ||
      normalizedStatus === "processing" ||
      normalizedStatus === "ongoing";

    const isFailed =
      normalizedStatus === "failed" ||
      normalizedStatus === "fail" ||
      normalizedStatus === "cancelled" ||
      normalizedStatus === "canceled" ||
      normalizedStatus === "declined" ||
      normalizedStatus === "expired" ||
      normalizedStatus === "insufficient funds" ||
      normalizedStatus.includes("insufficient");

    if (isPending) {
      await supabaseAdmin
        .from("apartment_requests")
        .update({
          payment_status: "pending",
          hubtel_payment_status: "pending",
        })
        .eq(
          "hubtel_client_reference",
          clientReference
        );

      return NextResponse.json({
        success: true,
        status: "pending",
      });
    }

    if (!isSuccessful || isFailed) {
      await supabaseAdmin
        .from("apartment_requests")
        .update({
          payment_status: "failed",
          hubtel_payment_status:
            status || "failed",
        })
        .eq(
          "hubtel_client_reference",
          clientReference
        );

      return NextResponse.json({
        success: true,
        status: "failed",
      });
    }

    const now = new Date();
    const paidAt = now.toISOString();

    const paidAmount = Number(
      data?.Amount ||
      data?.amount ||
      450
    );

    const { data: apartmentRequest, error } =
      await supabaseAdmin
        .from("apartment_requests")
        .update({
          payment_status: "paid",
          hubtel_payment_status: "success",
          hubtel_checkout_id:
            data?.CheckoutId ||
            data?.checkoutId ||
            null,
          paid_at: paidAt,
          service_fee: paidAmount,
          request_status: "payment_confirmed",
          search_started_at: null,
          search_expires_at: null,
          extension_expires_at: null,
          latest_update:
            "Payment received successfully. Your request is waiting for a RentDirect search officer to begin the apartment search.",
        })
        .eq(
          "hubtel_client_reference",
          clientReference
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Apartment payment callback update error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await sendTelegram(
      `RentDirect Find Me a Home Payment Successful

Customer: ${
        apartmentRequest?.customer_name ||
        apartmentRequest?.user_email ||
        "Unknown customer"
      }
Email: ${
        apartmentRequest?.user_email ||
        "Not provided"
      }
Phone: ${
        apartmentRequest?.whatsapp_number ||
        apartmentRequest?.phone ||
        data?.CustomerPhoneNumber ||
        "Not provided"
      }
Amount: GH₵${paidAmount}
Reference: ${clientReference}
Request ID: ${
        apartmentRequest?.id ||
        "Not available"
      }

Status: Payment confirmed
Search period: Waiting for a search officer to start the 30-day search.`
    );

    return NextResponse.json({
      success: true,
      status: "paid",
      requestId: apartmentRequest?.id,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Hubtel callback failed.";

    console.error(
      "Apartment request Hubtel callback error:",
      error
    );

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
