"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  main_image: string;
};

type Media = {
  id: string;
  property_id: string;
  media_type: string;
  media_url: string;
  file_name: string;
  display_order: number;
};

type SelectedMedia = {
  file: File;
  preview: string;
};

export default function PropertyGalleryPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedMedia[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<SelectedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (propertyId) fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    setLoading(true);

    const { data: propertyData } = await supabase
      .from("properties")
      .select("id,title,main_image")
      .eq("id", propertyId)
      .single();

    if (propertyData) setProperty(propertyData);

    const { data: mediaData } = await supabase
      .from("property_media")
      .select("*")
      .eq("property_id", propertyId)
      .order("display_order", { ascending: true });

    if (mediaData) setMedia(mediaData);

    setLoading(false);
  };

  const images = media.filter((item) => item.media_type === "image");
  const videos = media.filter((item) => item.media_type === "video");

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

  const removeSelectedImage = (indexToRemove: number) => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const removeSelectedVideo = (indexToRemove: number) => {
    setSelectedVideos((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const uploadFile = async (file: File, folder: "images" | "videos") => {
    const safeFileName = file.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `${folder}/${Date.now()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("property-media")
      .upload(filePath, file);

    if (error) throw new Error(error.message);

    const { data } = supabase.storage
      .from("property-media")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const uploadSelectedMedia = async () => {
    setUploading(true);
    setMessage("");

    try {
      const newRows: {
        property_id: string;
        media_type: string;
        media_url: string;
        file_name: string;
        display_order: number;
      }[] = [];

      for (let index = 0; index < selectedImages.length; index++) {
        setMessage(`Uploading image ${index + 1} of ${selectedImages.length}...`);
        const item = selectedImages[index];
        const url = await uploadFile(item.file, "images");

        newRows.push({
          property_id: propertyId,
          media_type: "image",
          media_url: url,
          file_name: item.file.name,
          display_order: media.length + newRows.length,
        });
      }

      for (let index = 0; index < selectedVideos.length; index++) {
        setMessage(`Uploading video ${index + 1} of ${selectedVideos.length}...`);
        const item = selectedVideos[index];
        const url = await uploadFile(item.file, "videos");

        newRows.push({
          property_id: propertyId,
          media_type: "video",
          media_url: url,
          file_name: item.file.name,
          display_order: media.length + newRows.length,
        });
      }

      if (newRows.length > 0) {
        const { error } = await supabase.from("property_media").insert(newRows);
        if (error) throw new Error(error.message);

        const firstNewImage = newRows.find((row) => row.media_type === "image");

        if (firstNewImage && !property?.main_image) {
          await supabase
            .from("properties")
            .update({ main_image: firstNewImage.media_url })
            .eq("id", propertyId);
        }
      }

      setSelectedImages([]);
      setSelectedVideos([]);
      setMessage("✅ Media uploaded successfully.");
      fetchData();
    } catch (error: any) {
      setMessage(error.message || "Something went wrong.");
    }

    setUploading(false);
  };

  const makeCoverImage = async (url: string) => {
    setMessage("Updating cover image...");

    const { error } = await supabase
      .from("properties")
      .update({ main_image: url })
      .eq("id", propertyId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Cover image updated.");
    fetchData();
  };

  const deleteMedia = async (mediaId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this media?");
    if (!confirmDelete) return;

    const mediaToDelete = media.find((item) => item.id === mediaId);

    const { error } = await supabase
      .from("property_media")
      .delete()
      .eq("id", mediaId);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mediaToDelete && property?.main_image === mediaToDelete.media_url) {
      const remainingImages = media.filter(
        (item) => item.id !== mediaId && item.media_type === "image"
      );

      const newCover =
        remainingImages.length > 0 ? remainingImages[0].media_url : "";

      await supabase
        .from("properties")
        .update({ main_image: newCover })
        .eq("id", propertyId);
    }

    setMessage("✅ Media deleted.");
    fetchData();
  };

  if (loading) {
    return (
      <main className="rounded-3xl bg-white p-12 text-center text-slate-500">
        Loading gallery...
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
            / <span>{property?.title}</span> / Gallery
          </div>

          <h1 className="mt-3 text-4xl font-bold">Property Gallery</h1>
          <p className="mt-2 text-slate-500">
            Manage images, videos, cover photo and property media.
          </p>
        </div>

        <Link
          href={`/admin/properties/${propertyId}`}
          className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700"
        >
          Back to Property
        </Link>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-semibold text-yellow-700">
          {message}
        </div>
      )}

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold">Upload More Media</h2>
        <p className="mt-2 text-slate-500">
          Add more property images or videos anytime.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-300 p-6">
            <div className="flex items-center justify-between">
              <p className="font-bold">New Images</p>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                {selectedImages.length} selected
              </span>
            </div>

            <label className="mt-4 block cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-center font-semibold text-white hover:bg-slate-700">
              {selectedImages.length > 0 ? "+ Add More Images" : "Choose Images"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesSelect}
                className="hidden"
              />
            </label>

            {selectedImages.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {selectedImages.map((item, index) => (
                  <div key={item.preview} className="rounded-2xl border p-2">
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="h-40 w-full rounded-xl object-cover"
                    />

                    <p className="mt-2 truncate text-xs text-slate-500">
                      {item.file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      className="mt-2 w-full rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 p-6">
            <div className="flex items-center justify-between">
              <p className="font-bold">New Videos</p>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                {selectedVideos.length} selected
              </span>
            </div>

            <label className="mt-4 block cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-center font-semibold text-white hover:bg-slate-700">
              {selectedVideos.length > 0 ? "+ Add More Videos" : "Choose Videos"}
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideosSelect}
                className="hidden"
              />
            </label>

            {selectedVideos.length > 0 && (
              <div className="mt-5 grid gap-4">
                {selectedVideos.map((item, index) => (
                  <div key={item.preview} className="rounded-2xl border p-2">
                    <video
                      src={item.preview}
                      controls
                      className="h-48 w-full rounded-xl object-cover"
                    />

                    <p className="mt-2 truncate text-xs text-slate-500">
                      {item.file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeSelectedVideo(index)}
                      className="mt-2 w-full rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={
            uploading ||
            (selectedImages.length === 0 && selectedVideos.length === 0)
          }
          onClick={uploadSelectedMedia}
          className="mt-6 w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload Selected Media"}
        </button>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold">Existing Images</h2>
        <p className="mt-2 text-slate-500">
          Choose a cover photo or delete images that are no longer needed.
        </p>

        {images.length === 0 ? (
          <p className="mt-6 text-slate-500">No images uploaded yet.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {images.map((item) => (
              <div key={item.id} className="rounded-2xl border p-3">
                <img
                  src={item.media_url}
                  alt={item.file_name}
                  className="h-56 w-full rounded-xl object-cover"
                />

                {property?.main_image === item.media_url && (
                  <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-center text-sm font-bold text-green-700">
                    ⭐ Current Cover Photo
                  </p>
                )}

                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => makeCoverImage(item.media_url)}
                    className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                  >
                    Make Cover
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMedia(item.id)}
                    className="rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                  >
                    Delete Image
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold">Existing Videos</h2>

        {videos.length === 0 ? (
          <p className="mt-6 text-slate-500">No videos uploaded yet.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {videos.map((item) => (
              <div key={item.id} className="rounded-2xl border p-3">
                <video
                  src={item.media_url}
                  controls
                  className="h-72 w-full rounded-xl object-cover"
                />

                <button
                  type="button"
                  onClick={() => deleteMedia(item.id)}
                  className="mt-3 w-full rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                >
                  Delete Video
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}