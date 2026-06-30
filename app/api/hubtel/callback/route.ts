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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
  } catch {
    // Do not fail payment if Telegram fails
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = body?.Data || body?.data;
    const status = data?.Status || body?.Status;
    const responseCode = body?.ResponseCode || body?.responseCode;
    const clientReference = data?.ClientReference || data?.clientReference;

    if (!clientReference) {
      return NextResponse.json(
        { error: "Missing client reference" },
        { status: 400 }
      );
    }

    if (responseCode !== "0000" || status !== "Success") {
      await supabaseAdmin
        .from("user_passes")
        .update({
          status: "rejected",
          hubtel_payment_status: status || "failed",
        })
        .eq("hubtel_client_reference", clientReference);

      return NextResponse.json({ success: true });
    }

    const paidAt = new Date().toISOString();

    const { data: passData, error } = await supabaseAdmin
      .from("user_passes")
      .update({
        status: "paid_not_started",
        hubtel_checkout_id: data?.CheckoutId || null,
        hubtel_payment_status: "success",
        paid_at: paidAt,
        amount: Number(data?.Amount || 250),
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
      }\nAmount: GH₵${data?.Amount || 250}\nReference: ${clientReference}\n\nPass Status: Paid, not started`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Hubtel callback failed" },
      { status: 500 }
    );
  }
}