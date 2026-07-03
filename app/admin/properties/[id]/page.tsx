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
  video_url: string;
  created_at: string;
};

type Media = {
  id: string;
  media_type: string;
  media_url: string;
  file_name: string;
  display_order: number;
};

type Inspection = {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  inspection_status: string;
  created_at: string;
};

export default function AdminPropertyDetailsPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    setLoading(true);

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (!propertyError && propertyData) {
      setProperty(propertyData);
    }

    const { data: mediaData } = await supabase
      .from("property_media")
      .select("*")
      .eq("property_id", propertyId)
      .order("display_order", { ascending: true });

    if (mediaData) {
      setMedia(mediaData);
    }

    const { data: inspectionData } = await supabase
      .from("inspections")
      .select("id,user_name,user_email,user_phone,inspection_status,created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (inspectionData) {
      setInspections(inspectionData);
    }

    const { count: views } = await supabase
      .from("property_views")
      .select("*", { count: "exact", head: true })
      .eq("property_id", propertyId);

    const { count: favorites } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("property_id", propertyId);

    setViewCount(views || 0);
    setFavoriteCount(favorites || 0);

    setLoading(false);
  };

  const images = media.filter((item) => item.media_type === "image");
  const videos = media.filter((item) => item.media_type === "video");

  const getStatusStyle = (status: string) => {
    if (status === "Available") return "bg-green-100 text-green-700";
    if (status === "Rented") return "bg-red-100 text-red-700";
    if (status === "Under Inspection") return "bg-blue-100 text-blue-700";
    if (status === "Available Next Month") return "bg-yellow-100 text-yellow-700";
    return "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center text-slate-500">
        Loading property...
      </main>
    );
  }

  if (!property) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center">
        <h1 className="text-2xl font-bold">Property not found</h1>
        <Link
          href="/admin/properties"
          className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black"
        >
          Back to Properties
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/admin" className="hover:text-yellow-600">
              Dashboard
            </Link>{" "}
            /{" "}
            <Link href="/admin/properties" className="hover:text-yellow-600">
              Properties
            </Link>{" "}
            / <span>{property.title}</span>
          </div>

          <h1 className="mt-3 text-4xl font-bold">{property.title}</h1>

          <p className="mt-2 text-slate-500">
            {property.area}, {property.city}, {property.region}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
          >
            ✏ Edit Property
          </Link>

          <Link
            href={`/admin/properties/${property.id}/gallery`}
            className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            📸 Manage Gallery
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {property.main_image ? (
          <img
            src={property.main_image}
            alt={property.title}
            className="h-[420px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[420px] items-center justify-center bg-slate-100 text-slate-400">
            No cover image uploaded
          </div>
        )}

        <div className="grid gap-6 p-8 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Monthly Rent</p>
            <h2 className="mt-2 text-3xl font-bold text-yellow-600">
              GH₵{property.monthly_rent}
            </h2>
          </div>

          <div>
            <p className="text-sm text-slate-500">Property Type</p>
            <h2 className="mt-2 text-xl font-bold">{property.apartment_type}</h2>
          </div>

          <div>
            <p className="text-sm text-slate-500">Status</p>
            <span
              className={`mt-2 inline-block rounded-full px-4 py-2 text-sm font-bold ${getStatusStyle(
                property.status
              )}`}
            >
              {property.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-500">Media</p>
            <h2 className="mt-2 text-xl font-bold">
              {images.length} Image(s), {videos.length} Video(s)
            </h2>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <PerformanceCard title="Total Views" value={viewCount} />
        <PerformanceCard title="Favorites" value={favoriteCount} />
        <PerformanceCard title="Inspections" value={inspections.length} />
        <PerformanceCard
          title="Conversion Rate"
          value={viewCount ? `${((inspections.length / viewCount) * 100).toFixed(1)}%` : "0%"}
        />
        <PerformanceCard title="Images" value={images.length} />
        <PerformanceCard title="Videos" value={videos.length} />
        <PerformanceCard title="Status" value={property.status || "Not added"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-2xl font-bold">Property Details</h2>

          <p className="mt-4 leading-7 text-slate-600">
            {property.description || "No description added."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Info label="Advance Payment" value={property.advance_payment} />
            <Info label="Bedrooms" value={property.bedrooms} />
            <Info label="Bathrooms" value={property.bathrooms} />
            <Info label="Parking" value={property.parking} />
            <Info label="Water Supply" value={property.water_supply} />
            <Info label="Electricity" value={property.electricity} />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Landlord</h2>

          <div className="mt-6 space-y-4">
            <Info label="Name" value={property.landlord_name} />
            <Info label="Phone" value={property.landlord_phone} />
            <Info label="WhatsApp" value={property.landlord_whatsapp} />
          </div>

          {property.landlord_whatsapp && (
            <a
              href={`https://wa.me/${property.landlord_whatsapp}`}
              target="_blank"
              className="mt-6 block rounded-xl bg-green-500 px-5 py-3 text-center font-bold text-white hover:bg-green-600"
            >
              Message on WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Inspections</h2>
          <Link
            href="/admin/inspections"
            className="text-sm font-bold text-yellow-600"
          >
            View All
          </Link>
        </div>

        {inspections.length === 0 ? (
          <p className="mt-6 text-slate-500">No inspections booked for this property yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {inspections.slice(0, 6).map((inspection) => (
              <div
                key={inspection.id}
                className="rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">
                      {inspection.user_name || inspection.user_email || "Unknown user"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {inspection.user_phone || "No phone"} • {inspection.user_email || "No email"}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-black text-green-700">
                    {inspection.inspection_status || "confirmed"}
                  </span>
                </div>

                <p className="mt-2 text-xs font-bold text-slate-400">
                  {new Date(inspection.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Images</h2>
          <Link
            href={`/admin/properties/${property.id}/gallery`}
            className="text-sm font-bold text-yellow-600"
          >
            Manage Images
          </Link>
        </div>

        {images.length === 0 ? (
          <p className="mt-6 text-slate-500">No images uploaded.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {images.map((item) => (
              <img
                key={item.id}
                src={item.media_url}
                alt={item.file_name}
                className="h-56 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Videos</h2>
          <Link
            href={`/admin/properties/${property.id}/gallery`}
            className="text-sm font-bold text-yellow-600"
          >
            Manage Videos
          </Link>
        </div>

        {videos.length === 0 ? (
          <p className="mt-6 text-slate-500">No videos uploaded.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {videos.map((item) => (
              <video
                key={item.id}
                src={item.media_url}
                controls
                className="h-72 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PerformanceCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h2 className="mt-2 break-words text-3xl font-black">{value}</h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-900">
        {value || "Not added"}
      </p>
    </div>
  );
}