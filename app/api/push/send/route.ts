import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SendBody = {
  audience?: "all" | "specific";
  userId?: string;
  title?: string;
  message?: string;
  url?: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Admin authentication is required." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your admin session is invalid or has expired." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

    if (
      profileError ||
      (profile?.role !== "admin" &&
        profile?.role !== "super_admin")
    ) {
      return NextResponse.json(
        { error: "You are not authorised to send notifications." },
        { status: 403 }
      );
    }

    const publicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject =
      process.env.VAPID_SUBJECT ||
      "mailto:rentdirect25@outlook.com";

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: "VAPID notification keys are missing." },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = (await request.json()) as SendBody;

    if (!body.title?.trim() || !body.message?.trim()) {
      return NextResponse.json(
        { error: "A title and message are required." },
        { status: 400 }
      );
    }

    const audience = body.audience || "specific";

    if (audience === "specific" && !body.userId) {
      return NextResponse.json(
        { error: "Select the user who should receive the notification." },
        { status: 400 }
      );
    }

    let subscriptionQuery = supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (audience === "specific") {
      subscriptionQuery = subscriptionQuery.eq(
        "user_id",
        body.userId
      );
    }

    const {
      data: subscriptions,
      error: subscriptionsError,
    } = await subscriptionQuery;

    if (subscriptionsError) {
      console.error(
        "Could not load push subscriptions:",
        subscriptionsError
      );

      return NextResponse.json(
        { error: subscriptionsError.message },
        { status: 500 }
      );
    }

    if (!subscriptions?.length) {
      return NextResponse.json(
        {
          error:
            audience === "all"
              ? "No users have enabled push notifications yet."
              : "This user has not enabled push notifications.",
        },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: body.title.trim(),
      body: body.message.trim(),
      url: body.url?.trim() || "/dashboard/notifications",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map(
        async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
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
                .eq("id", subscription.id);

              removed += 1;
            } else {
              failed += 1;
              console.error(
                "Push notification delivery failed:",
                error
              );
            }
          }
        }
      )
    );

    return NextResponse.json({
      success: true,
      sent,
      failed,
      removed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("Push notification API error:", error);

    return NextResponse.json(
      { error: "Unable to send the notification." },
      { status: 500 }
    );
  }
}
