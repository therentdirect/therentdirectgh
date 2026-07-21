import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SendBody = {
  userId?: string;
  title?: string;
  message?: string;
  url?: string;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    "mailto:rentdirect6@gmail.com";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are missing.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: Request) {
  try {
    configureWebPush();

    const body = (await request.json()) as SendBody;

    if (!body.userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", body.userId);

    if (error) {
      console.error("Subscription load error:", error);

      return NextResponse.json(
        { error: "Could not load subscriptions." },
        { status: 500 }
      );
    }

    if (!subscriptions?.length) {
      return NextResponse.json(
        { error: "This user has not enabled push notifications." },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: body.title || "RentDirect Ghana",
      body:
        body.message ||
        "Push notifications are working successfully.",
      url: body.url || "/dashboard/notifications",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
    });

    let sent = 0;
    let removed = 0;

    await Promise.all(
      subscriptions.map(async (item) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: item.endpoint,
              keys: {
                p256dh: item.p256dh,
                auth: item.auth,
              },
            },
            payload
          );

          sent += 1;
        } catch (error: unknown) {
          const pushError = error as {
            statusCode?: number;
          };

          if (
            pushError.statusCode === 404 ||
            pushError.statusCode === 410
          ) {
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("id", item.id);

            removed += 1;
          } else {
            console.error("Push delivery failed:", error);
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      sent,
      removed,
    });
  } catch (error) {
    console.error("Push send error:", error);

    return NextResponse.json(
      { error: "Failed to send push notification." },
      { status: 500 }
    );
  }
}
