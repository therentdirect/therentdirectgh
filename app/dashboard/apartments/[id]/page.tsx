"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  description: string;
  region: string;
  city: string;
  area: string;
  location: string;
  apartment_type: string;
  monthly_rent: number;
  advance_payment: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  water_supply: string;
  electricity: string;
  landlord_name: string;
  landlord_phone: string;
  landlord_whatsapp: string;
  status: string;
  main_image: string;
};

type Media = {
  id: string;
  media_type: string;
  media_url: string;
  file_name: string;
  display_order: number;
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [hasActivePass, setHasActivePass] = useState(false);
  const [passExpiresAt, setPassExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [inspectionScheduled, setInspectionScheduled] = useState(false);

  useEffect(() => {
    loadPageData();
  }, [propertyId]);

  const loadPageData = async () => {
    setLoading(true);
    setInspectionScheduled(false);

    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propertyData) setProperty(propertyData);

    const { data: mediaData } = await supabase
      .from("property_media")
      .select("*")
      .eq("property_id", propertyId)
      .order("display_order", { ascending: true });

    if (mediaData) setMedia(mediaData);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const { data: passData } = await supabase
        .from("user_passes")
        .select("*")
        .eq("user_email", user.email)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (passData?.expires_at && new Date(passData.expires_at) > new Date()) {
        setHasActivePass(true);
        setPassExpiresAt(passData.expires_at);

        const { data: inspectionData } = await supabase
          .from("inspections")
          .select("id")
          .eq("user_email", user.email)
          .eq("property_id", propertyId)
          .eq("inspection_status", "confirmed")
          .gte("created_at", passData.approved_at || passData.created_at)
          .maybeSingle();

        if (inspectionData) setInspectionScheduled(true);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center text-neutral-500">
        Loading property...
      </main>
    );
  }

  if (!property) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center">
        <h1 className="text-2xl font-black">Property not found</h1>
        <Link
          href="/dashboard/apartments"
          className="mt-6 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black"
        >
          Back to Apartments
        </Link>
      </main>
    );
  }

  const galleryItems: Media[] = [
    ...(property.main_image
      ? [
          {
            id: "cover",
            media_type: "image",
            media_url: property.main_image,
            file_name: property.title,
            display_order: -1,
          },
        ]
      : []),
    ...media.filter((item) => item.media_url !== property.main_image),
  ];

  const currentSelected = galleryItems[selectedIndex];
  const currentViewer = viewerIndex !== null ? galleryItems[viewerIndex] : null;
  const isRented = property.status === "Rented";

  const previousMedia = () => {
    if (viewerIndex === null) return;
    setViewerIndex(viewerIndex === 0 ? galleryItems.length - 1 : viewerIndex - 1);
  };

  const nextMedia = () => {
    if (viewerIndex === null) return;
    setViewerIndex(viewerIndex === galleryItems.length - 1 ? 0 : viewerIndex + 1);
  };

  const whatsappNumber = property.landlord_whatsapp?.replace(/\D/g, "");

  const inspectionMessage = encodeURIComponent(
    `Hello, I found your apartment on RentDirect and I want to schedule an inspection.

Apartment: ${property.title}
Location: ${property.area}, ${property.city}, ${property.region}
Rent: GH₵${property.monthly_rent}/month`
  );

  const scheduleInspectionLink = whatsappNumber
    ? `https://wa.me/233${whatsappNumber.slice(-9)}?text=${inspectionMessage}`
    : "#";

  const scheduleInspection = async () => {
    setBooking(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setMessage("Please login again before scheduling an inspection.");
      setBooking(false);
      return;
    }

    const { data: latestPass } = await supabase
      .from("user_passes")
      .select("*")
      .eq("user_email", user.email)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const passStillActive =
      latestPass?.expires_at && new Date(latestPass.expires_at) > new Date();

    if (!passStillActive) {
      setMessage("Your Inspection Pass has expired. Please buy a new pass.");
      setBooking(false);
      setHasActivePass(false);
      return;
    }

    const { data: existingInspection } = await supabase
      .from("inspections")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", property.id)
      .eq("inspection_status", "confirmed")
      .gte("created_at", latestPass.approved_at || latestPass.created_at)
      .maybeSingle();

    if (existingInspection) {
      setInspectionScheduled(true);
      setBooking(false);
      setMessage("✅ Inspection already scheduled. Opening landlord WhatsApp...");
      window.open(scheduleInspectionLink, "_blank");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .single();

    const { error } = await supabase.from("inspections").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : "",
      user_phone: profile?.phone || "",

      property_id: property.id,
      property_title: property.title,
      property_location: `${property.area}, ${property.city}, ${property.region}`,

      landlord_name: property.landlord_name,
      landlord_phone: property.landlord_phone,
      landlord_whatsapp: property.landlord_whatsapp,

      inspection_status: "confirmed",
    });

    if (error) {
      setMessage(error.message);
      setBooking(false);
      return;
    }

    await fetch("/api/telegram/inspection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_email: user.email,
        user_name: profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "",
        user_phone: profile?.phone || "",
        property_title: property.title,
        property_location: `${property.area}, ${property.city}, ${property.region}`,
        landlord_name: property.landlord_name,
        landlord_phone: property.landlord_phone,
      }),
    });

    if (latestPass.status === "paid_not_started") {
      const activatedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from("user_passes")
        .update({
          status: "active",
          approved_at: activatedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", latestPass.id);

      setHasActivePass(true);
      setPassExpiresAt(expiresAt.toISOString());
    }

    setInspectionScheduled(true);
    setBooking(false);
    setMessage("✅ Inspection scheduled. Opening landlord WhatsApp...");
    window.open(scheduleInspectionLink, "_blank");
  };

  return (
    <main className="space-y-6">
      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-black text-yellow-700">
          {message}
        </div>
      )}

      {currentViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6">
          <button
            onClick={() => setViewerIndex(null)}
            className="absolute right-6 top-6 rounded-full bg-white px-4 py-2 font-black text-black"
          >
            ✕ Close
          </button>

          {galleryItems.length > 1 && (
            <>
              <button
                onClick={previousMedia}
                className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white px-5 py-3 text-4xl font-black text-black hover:bg-yellow-400"
              >
                ‹
              </button>

              <button
                onClick={nextMedia}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white px-5 py-3 text-4xl font-black text-black hover:bg-yellow-400"
              >
                ›
              </button>
            </>
          )}

          <div className="max-w-6xl text-center">
            {currentViewer.media_type === "image" ? (
              <img
                src={currentViewer.media_url}
                alt={currentViewer.file_name}
                className="max-h-[82vh] max-w-full rounded-2xl object-contain"
              />
            ) : (
              <video
                src={currentViewer.media_url}
                controls
                autoPlay
                className="max-h-[82vh] max-w-full rounded-2xl"
              />
            )}

            <p className="mt-4 text-sm font-semibold text-white">
              {viewerIndex !== null ? viewerIndex + 1 : 1} / {galleryItems.length}
            </p>
          </div>
        </div>
      )}

      <section>
        <Link
          href="/dashboard/apartments"
          className="text-sm font-black text-yellow-600"
        >
          ← Back to Apartments
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">{property.title}</h1>
            <p className="mt-2 text-neutral-500">
              📍 {property.area}, {property.city}, {property.region}
            </p>
          </div>

          <span
            className={`rounded-full px-5 py-3 font-black ${
              isRented
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {property.status || "Available"}
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        {currentSelected ? (
          <button
            type="button"
            onClick={() => setViewerIndex(selectedIndex)}
            className="flex h-[250px] w-full items-center justify-center overflow-hidden bg-black md:h-[300px] lg:h-[340px]"
          >
            {currentSelected.media_type === "video" ? (
              <video
                src={currentSelected.media_url}
                className="max-h-full max-w-full object-contain"
                muted
              />
            ) : (
              <img
                src={currentSelected.media_url}
                alt={currentSelected.file_name}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </button>
        ) : (
          <div className="flex h-[250px] items-center justify-center bg-neutral-100 text-neutral-400 md:h-[300px] lg:h-[340px]">
            No image uploaded
          </div>
        )}

        {galleryItems.length > 1 && (
          <div className="flex gap-3 overflow-x-auto bg-neutral-950 p-3">
            {galleryItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${
                  selectedIndex === index
                    ? "border-yellow-400"
                    : "border-transparent"
                }`}
              >
                {item.media_type === "video" ? (
                  <>
                    <video
                      src={item.media_url}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-xl text-white">
                      ▶
                    </span>
                  </>
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.file_name}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 p-5 md:grid-cols-4">
          <div>
            <p className="text-sm font-bold text-neutral-500">Monthly Rent</p>
            <h2 className="mt-2 text-2xl font-black text-yellow-600">
              GH₵{property.monthly_rent}
            </h2>
          </div>

          <Info label="Apartment Type" value={property.apartment_type} />
          <Info label="Bedrooms" value={property.bedrooms} />
          <Info label="Bathrooms" value={property.bathrooms} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Property Description</h2>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {property.description || "No description available."}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="Advance Payment" value={property.advance_payment} />
            <Info label="Parking" value={property.parking} />
            <Info label="Water Supply" value={property.water_supply} />
            <Info label="Electricity" value={property.electricity} />
            <Info label="Full Location" value={property.location} />
          </div>
        </div>

        {hasActivePass ? (
          <div className="rounded-[28px] bg-green-50 p-5 shadow-sm">
            <h2 className="text-xl font-black text-green-700">
              Landlord Contact Unlocked
            </h2>

            <p className="mt-3 text-sm text-green-700">
              Your Inspection Pass is active until{" "}
              {new Date(passExpiresAt).toLocaleDateString()}.
            </p>

            <div className="mt-5 space-y-3">
              <Info label="Landlord Name" value={property.landlord_name} />
              <Info label="Phone Number" value={property.landlord_phone} />
              <Info label="WhatsApp" value={property.landlord_whatsapp} />
            </div>

            <a
              href={`tel:${property.landlord_phone}`}
              className="mt-5 block rounded-full bg-black px-5 py-3 text-center font-black text-white hover:bg-neutral-800"
            >
              📞 Call Landlord
            </a>

            <button
              type="button"
              onClick={scheduleInspection}
              disabled={booking || inspectionScheduled}
              className={`mt-3 flex w-full items-center justify-center gap-3 rounded-full px-5 py-3 text-center font-black text-white transition disabled:opacity-80 ${
                inspectionScheduled
                  ? "cursor-default bg-green-700"
                  : "bg-[#25D366] hover:bg-[#1EBE5D]"
              }`}
            >
              <span className="text-xl">
                {inspectionScheduled ? "✅" : "💬"}
              </span>

              {inspectionScheduled
                ? "Inspection Scheduled"
                : booking
                ? "Opening WhatsApp..."
                : "Schedule Inspection"}
            </button>
          </div>
        ) : (
          <div className="rounded-[28px] bg-black p-5 text-white shadow-sm">
            <h2 className="text-xl font-black">Inspection Pass Required</h2>

            <p className="mt-3 text-sm text-neutral-300">
              Unlock contact details to schedule apartment inspections directly
              with the landlord.
            </p>

            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-neutral-300">Inspection Pass Fee</p>
              <h3 className="mt-2 text-3xl font-black text-yellow-400">
                GH₵250
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                Your 30-day Inspection Pass begins automatically after you schedule your first inspection with a landlord.
              </p>
            </div>

            <Link
              href={`/dashboard/pass?property=${property.id}`}
              className="mt-5 block rounded-full bg-yellow-400 px-5 py-3 text-center font-black text-black hover:bg-yellow-300"
            >
              Schedule Inspection
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string | any; value: any }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 font-black text-neutral-900">{value || "Not added"}</p>
    </div>
  );
}