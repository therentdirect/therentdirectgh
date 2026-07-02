import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegram(message: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch {
    // Do not fail payment because Telegram failed
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("HUBTEL CALLBACK BODY:", JSON.stringify(body, null, 2));

    const data = body?.Data || body?.data || body;

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

    const normalizedStatus = String(status).toLowerCase();

    if (!clientReference) {
      return NextResponse.json(
        { error: "Missing client reference" },
        { status: 400 }
      );
    }

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
        .from("user_passes")
        .update({
          hubtel_payment_status: "pending",
        })
        .eq("hubtel_client_reference", clientReference);

      return NextResponse.json({ success: true, status: "pending" });
    }

    if (!isSuccessful || isFailed) {
      await supabaseAdmin
        .from("user_passes")
        .update({
          status: "failed",
          hubtel_payment_status: status || "failed",
        })
        .eq("hubtel_client_reference", clientReference);

      return NextResponse.json({ success: true, status: "failed" });
    }

    const paidAt = new Date().toISOString();

    const { data: passData, error } = await supabaseAdmin
      .from("user_passes")
      .update({
        status: "paid_not_started",
        hubtel_checkout_id: data?.CheckoutId || data?.checkoutId || null,
        hubtel_payment_status: "success",
        paid_at: paidAt,
        amount: Number(data?.Amount || data?.amount || 250),
      })
      .eq("hubtel_client_reference", clientReference)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await sendTelegram(
      `RentDirect Payment Successful\n\nUser: ${
        passData?.username || passData?.user_email || "Unknown user"
      }\nEmail: ${passData?.user_email || "Not added"}\nPhone: ${
        passData?.user_phone || data?.CustomerPhoneNumber || "Not added"
      }\nAmount: GH₵${
        data?.Amount || data?.amount || 250
      }\nReference: ${clientReference}\n\nPass Status: Paid, not started`
    );

    return NextResponse.json({ success: true, status: "paid_not_started" });
  } catch (error: any) {
    console.error("Hubtel callback error:", error);

    return NextResponse.json(
      { error: error.message || "Hubtel callback failed" },
      { status: 500 }
    );
  }
}