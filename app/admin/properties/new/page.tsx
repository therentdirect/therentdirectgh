"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type SelectedMedia = {
  file: File;
  preview: string;
};

export default function NewPropertyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedMedia[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<SelectedMedia[]>([]);

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
    verified: true,
    main_image: "",
    video_url: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setForm({ ...form, region, city: "" });
  };

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleVideosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newVideos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedVideos((prev) => [...prev, ...newVideos]);
    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeVideo = (indexToRemove: number) => {
    setSelectedVideos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadFile = async (file: File, folder: "images" | "videos") => {
    const safeFileName = file.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `${folder}/${Date.now()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("property-media")
      .upload(filePath, file);

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("property-media").getPublicUrl(filePath);

    return data.publicUrl;
  };

  const resetForm = () => {
    setForm({
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
      verified: true,
      main_image: "",
      video_url: "",
    });

    setSelectedRegion("");
    setSelectedImages([]);
    setSelectedVideos([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessageType("info");
    setMessage("Saving property details...");

    try {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          ...form,
          monthly_rent: Number(form.monthly_rent),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
        })
        .select()
        .single();

      if (propertyError) throw new Error(propertyError.message);

      const mediaRows: {
        property_id: string;
        media_type: string;
        media_url: string;
        file_name: string;
        display_order: number;
      }[] = [];

      for (let index = 0; index < selectedImages.length; index++) {
        setMessage(`Uploading image ${index + 1} of ${selectedImages.length}...`);
        const item = selectedImages[index];
        const publicUrl = await uploadFile(item.file, "images");

        mediaRows.push({
          property_id: property.id,
          media_type: "image",
          media_url: publicUrl,
          file_name: item.file.name,
          display_order: index,
        });
      }

      for (let index = 0; index < selectedVideos.length; index++) {
        setMessage(`Uploading video ${index + 1} of ${selectedVideos.length}...`);
        const item = selectedVideos[index];
        const publicUrl = await uploadFile(item.file, "videos");

        mediaRows.push({
          property_id: property.id,
          media_type: "video",
          media_url: publicUrl,
          file_name: item.file.name,
          display_order: index,
        });
      }

      if (mediaRows.length > 0) {
        setMessage("Saving media files...");

        const { error: mediaError } = await supabase
          .from("property_media")
          .insert(mediaRows);

        if (mediaError) throw new Error(mediaError.message);

        const firstImage = mediaRows.find((media) => media.media_type === "image");
        const firstVideo = mediaRows.find((media) => media.media_type === "video");

        await supabase
          .from("properties")
          .update({
            main_image: firstImage?.media_url || "",
            video_url: firstVideo?.media_url || "",
          })
          .eq("id", property.id);
      }

      setMessageType("success");
      setMessage("✅ Property saved successfully! Redirecting to Manage Properties...");
      resetForm();

      setTimeout(() => {
        router.push("/admin/properties");
      }, 2000);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error.message || "Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <main className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold">Add New Property</h1>
        <p className="mt-2 text-slate-500">
          Add property details, landlord information, multiple images and videos.
        </p>
      </section>

      {message && (
        <div
          className={`rounded-2xl p-4 text-center font-semibold ${
            messageType === "success"
              ? "bg-green-100 text-green-700"
              : messageType === "error"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Property Information</h2>

          <div className="mt-6 grid gap-5">
            <input name="title" value={form.title} placeholder="Property Title" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />

            <textarea name="description" value={form.description} placeholder="Property Description" onChange={handleChange} className="min-h-32 rounded-xl border border-slate-200 p-3" />

            <select name="apartment_type" value={form.apartment_type} onChange={handleChange} className="rounded-xl border border-slate-200 p-3">
              <option value="">Apartment Type</option>
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Location</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <select name="region" value={form.region} onChange={handleRegionChange} className="rounded-xl border border-slate-200 p-3">
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select name="city" value={form.city} onChange={handleChange} className="rounded-xl border border-slate-200 p-3">
              <option value="">{selectedRegion ? "Select City / Town / Area" : "Choose region first"}</option>
              {towns.map((town) => (
                <option key={town} value={town}>{town}</option>
              ))}
            </select>

            <input name="area" value={form.area} placeholder="Specific Area / Community" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
          </div>

          <input name="location" value={form.location} placeholder="Full Location / Landmark" onChange={handleChange} className="mt-5 w-full rounded-xl border border-slate-200 p-3" />
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Rent & Features</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <input name="monthly_rent" value={form.monthly_rent} placeholder="Monthly Rent" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="advance_payment" value={form.advance_payment} placeholder="Advance Payment" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="bedrooms" value={form.bedrooms} placeholder="Bedrooms" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="bathrooms" value={form.bathrooms} placeholder="Bathrooms" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <input name="parking" value={form.parking} placeholder="Parking" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="water_supply" value={form.water_supply} placeholder="Water Supply" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="electricity" value={form.electricity} placeholder="Electricity" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Media Upload</h2>
          <p className="mt-2 text-slate-500">
            Add multiple images and videos. Preview everything before saving.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-300 p-6">
              <div className="flex items-center justify-between">
                <p className="font-bold">Property Images</p>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                  {selectedImages.length} image(s)
                </span>
              </div>

              <label className="mt-4 block cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-center font-semibold text-white hover:bg-slate-700">
                {selectedImages.length > 0 ? "+ Add More Images" : "Choose Images"}
                <input type="file" accept="image/*" multiple onChange={handleImagesSelect} className="hidden" />
              </label>

              {selectedImages.length > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {selectedImages.map((item, index) => (
                    <div key={item.preview} className="rounded-2xl border p-2">
                      <img src={item.preview} alt={`Selected image ${index + 1}`} className="h-40 w-full rounded-xl object-cover" />
                      <p className="mt-2 truncate text-xs text-slate-500">Image {index + 1}: {item.file.name}</p>
                      <button type="button" onClick={() => removeImage(index)} className="mt-2 w-full rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 p-6">
              <div className="flex items-center justify-between">
                <p className="font-bold">Property Videos</p>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                  {selectedVideos.length} video(s)
                </span>
              </div>

              <label className="mt-4 block cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-center font-semibold text-white hover:bg-slate-700">
                {selectedVideos.length > 0 ? "+ Add More Videos" : "Choose Videos"}
                <input type="file" accept="video/*" multiple onChange={handleVideosSelect} className="hidden" />
              </label>

              {selectedVideos.length > 0 && (
                <div className="mt-5 grid gap-4">
                  {selectedVideos.map((item, index) => (
                    <div key={item.preview} className="rounded-2xl border p-2">
                      <video src={item.preview} controls className="h-48 w-full rounded-xl object-cover" />
                      <p className="mt-2 truncate text-xs text-slate-500">Video {index + 1}: {item.file.name}</p>
                      <button type="button" onClick={() => removeVideo(index)} className="mt-2 w-full rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Landlord Information</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <input name="landlord_name" value={form.landlord_name} placeholder="Landlord Name" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="landlord_phone" value={form.landlord_phone} placeholder="Landlord Phone" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
            <input name="landlord_whatsapp" value={form.landlord_whatsapp} placeholder="Landlord WhatsApp" onChange={handleChange} className="rounded-xl border border-slate-200 p-3" />
          </div>

          <select name="status" value={form.status} onChange={handleChange} className="mt-5 w-full rounded-xl border border-slate-200 p-3">
            <option>Available</option>
            <option>Rented</option>
            <option>Under Inspection</option>
            <option>Available Next Month</option>
          </select>
        </section>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:opacity-70">
          {loading ? "Saving..." : "Save Property"}
        </button>
      </form>
    </main>
  );
}