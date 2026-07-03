import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ success: false, error: "Telegram settings missing" });
    }

    const message = `🏠 RentDirect Inspection Scheduled

Tenant: ${body.user_name || "Not added"}
Phone: ${body.user_phone || "Not added"}
Email: ${body.user_email || "Not added"}

Property: ${body.property_title || "Not added"}
Location: ${body.property_location || "Not added"}

Landlord: ${body.landlord_name || "Not added"}
Landlord Phone: ${body.landlord_phone || "Not added"}

Time: ${new Date().toLocaleString()}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
