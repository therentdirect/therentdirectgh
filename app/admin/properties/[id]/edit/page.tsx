"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const locations: Record<string, string[]> = {
  "Greater Accra": ["Accra", "Tema", "Madina", "East Legon", "Adenta", "Spintex", "Kasoa", "Achimota", "Weija", "Dansoman", "Lapaz", "Haatso", "Ashaley Botwe", "Teshie", "Nungua", "Dome", "Kaneshie", "Osu", "Labone", "Cantonments", "Airport", "Dzorwulu"],
  Ashanti: ["Kumasi", "Ejisu", "Obuasi", "Mampong", "Konongo", "Bekwai"],
  Central: ["Cape Coast", "Winneba", "Elmina", "Swedru", "Kasoa"],
  Eastern: ["Koforidua", "Nsawam", "Akosombo", "Nkawkaw", "Somanya"],
  Western: ["Takoradi", "Sekondi", "Tarkwa", "Axim", "Prestea"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Juaboso", "Enchi"],
  Volta: ["Ho", "Keta", "Hohoe", "Sogakope", "Aflao"],
  Oti: ["Dambai", "Nkwanta", "Kadjebi", "Jasikan"],
  Northern: ["Tamale", "Yendi", "Savelugu", "Bimbilla"],
  "North East": ["Nalerigu", "Walewale", "Gambaga"],
  Savannah: ["Damongo", "Bole", "Salaga", "Yapei"],
  "Upper East": ["Bolgatanga", "Navrongo", "Bawku", "Zebilla"],
  "Upper West": ["Wa", "Tumu", "Lawra", "Nandom"],
  Bono: ["Sunyani", "Berekum", "Dormaa Ahenkro", "Wenchi"],
  "Bono East": ["Techiman", "Kintampo", "Atebubu", "Nkoranza"],
  Ahafo: ["Goaso", "Bechem", "Duayaw Nkwanta", "Kenyasi"],
};

const regions = Object.keys(locations);

const propertyTypes = [
  "Single Room (Porch)",
  "Single Room (Self Contained)",
  "Chamber & Hall (Porch)",
  "Chamber & Hall (Self Contained)",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "4 Bedroom",
  "5 Bedroom+",
  "Furnished Apartment",
  "Unfurnished Apartment",
  "Studio Apartment",
  "Hostel",
  "Student Accommodation",
  "Roommate (Shared Apartment)",
];

const statuses = [
  "Available",
  "Rented",
  "Under Inspection",
  "Available Next Month",
];

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");

  const towns = selectedRegion ? locations[selectedRegion] || [] : [];

  const [form, setForm] = useState({
    title: "",
    description: "",
    region: "",
    city: "",
    area: "",
    location: "",
    apartment_type: "",
    monthly_rent: "",
    advance_payment: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    water_supply: "",
    electricity: "",
    landlord_name: "",
    landlord_phone: "",
    landlord_whatsapp: "",
    status: "Available",
  });

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        region: data.region || "",
        city: data.city || "",
        area: data.area || "",
        location: data.location || "",
        apartment_type: data.apartment_type || "",
        monthly_rent: data.monthly_rent?.toString() || "",
        advance_payment: data.advance_payment || "",
        bedrooms: data.bedrooms?.toString() || "",
        bathrooms: data.bathrooms?.toString() || "",
        parking: data.parking || "",
        water_supply: data.water_supply || "",
        electricity: data.electricity || "",
        landlord_name: data.landlord_name || "",
        landlord_phone: data.landlord_phone || "",
        landlord_whatsapp: data.landlord_whatsapp || "",
        status: data.status || "Available",
      });

      setSelectedRegion(data.region || "");
    }

    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setSelectedRegion(region);

    setForm({
      ...form,
      region,
      city: "",
    });
  };

  const updateStatus = (status: string) => {
    setForm({
      ...form,
      status,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage("Updating property...");

    const { error } = await supabase
      .from("properties")
      .update({
        ...form,
        monthly_rent: Number(form.monthly_rent),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      })
      .eq("id", propertyId);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("✅ Property updated successfully. Redirecting...");

    setTimeout(() => {
      router.push(`/admin/properties/${propertyId}`);
    }, 1500);

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center text-slate-500">
        Loading property editor...
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/admin/properties" className="hover:text-yellow-600">
              Properties
            </Link>{" "}
            /{" "}
            <Link
              href={`/admin/properties/${propertyId}`}
              className="hover:text-yellow-600"
            >
              View Property
            </Link>{" "}
            / Edit
          </div>

          <h1 className="mt-3 text-4xl font-bold">Edit Property</h1>
          <p className="mt-2 text-slate-500">
            Update property details, landlord information, rent and availability.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/properties/${propertyId}`}
            className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Back to Property
          </Link>

          <Link
            href={`/admin/properties/${propertyId}/gallery`}
            className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
          >
            📸 Gallery
          </Link>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-semibold text-yellow-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Property Information</h2>

          <div className="mt-6 grid gap-5">
            <input
              name="title"
              value={form.title}
              placeholder="Property Title"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <textarea
              name="description"
              value={form.description}
              placeholder="Property Description"
              onChange={handleChange}
              className="min-h-32 rounded-xl border border-slate-200 p-3"
            />

            <select
              name="apartment_type"
              value={form.apartment_type}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            >
              <option value="">Apartment Type</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Location</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <select
              name="region"
              value={form.region}
              onChange={handleRegionChange}
              className="rounded-xl border border-slate-200 p-3"
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              name="city"
              value={form.city}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            >
              <option value="">
                {selectedRegion ? "Select City / Town / Area" : "Choose region first"}
              </option>

              {towns.map((town) => (
                <option key={town} value={town}>
                  {town}
                </option>
              ))}
            </select>

            <input
              name="area"
              value={form.area}
              placeholder="Specific Area / Community"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />
          </div>

          <input
            name="location"
            value={form.location}
            placeholder="Full Location / Landmark"
            onChange={handleChange}
            className="mt-5 w-full rounded-xl border border-slate-200 p-3"
          />
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Rent & Features</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <input
              name="monthly_rent"
              value={form.monthly_rent}
              placeholder="Monthly Rent"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="advance_payment"
              value={form.advance_payment}
              placeholder="Advance Payment"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="bedrooms"
              value={form.bedrooms}
              placeholder="Bedrooms"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="bathrooms"
              value={form.bathrooms}
              placeholder="Bathrooms"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <input
              name="parking"
              value={form.parking}
              placeholder="Parking"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="water_supply"
              value={form.water_supply}
              placeholder="Water Supply"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="electricity"
              value={form.electricity}
              placeholder="Electricity"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Landlord Information</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <input
              name="landlord_name"
              value={form.landlord_name}
              placeholder="Landlord Name"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="landlord_phone"
              value={form.landlord_phone}
              placeholder="Landlord Phone"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />

            <input
              name="landlord_whatsapp"
              value={form.landlord_whatsapp}
              placeholder="Landlord WhatsApp"
              onChange={handleChange}
              className="rounded-xl border border-slate-200 p-3"
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Property Status</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateStatus(status)}
                className={`rounded-2xl border p-5 text-left font-bold transition ${
                  form.status === status
                    ? "border-yellow-400 bg-yellow-100 text-yellow-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:opacity-70"
        >
          {saving ? "Saving Changes..." : "💾 Save Changes"}
        </button>
      </form>
    </main>
  );
}