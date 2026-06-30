"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  description?: string;
  region: string;
  city: string;
  area: string;
  apartment_type: string;
  monthly_rent: number;
  status: string;
  landlord_name: string;
  landlord_phone?: string;
  main_image: string;
  created_at?: string;
};

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

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    if (data) setProperties(data);

    setLoading(false);
  };

  const updateStatus = async (
    propertyId: string,
    newStatus: "Available" | "Rented"
  ) => {
    setMessage(`Updating property to ${newStatus}...`);

    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", propertyId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? { ...property, status: newStatus }
          : property
      )
    );

    setMessage(`Property marked as ${newStatus}.`);
  };

  const deleteProperty = async (propertyId: string, title: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setMessage("Deleting property...");

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProperties((prev) =>
      prev.filter((property) => property.id !== propertyId)
    );

    setMessage("Property deleted successfully.");
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const searchText =
        `${property.title} ${property.region} ${property.city} ${property.area} ${property.landlord_name}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesRegion = selectedRegion
        ? property.region === selectedRegion
        : true;
      const matchesType = selectedType
        ? property.apartment_type === selectedType
        : true;
      const matchesStatus = selectedStatus
        ? property.status === selectedStatus
        : true;

      return matchesSearch && matchesRegion && matchesType && matchesStatus;
    });
  }, [properties, search, selectedRegion, selectedType, selectedStatus]);

  const clearFilters = () => {
    setSearch("");
    setSelectedRegion("");
    setSelectedType("");
    setSelectedStatus("");
  };

  const getStatusStyle = (status: string) => {
    if (status === "Available") return "bg-green-100 text-green-700";
    if (status === "Rented") return "bg-red-100 text-red-700";
    if (status === "Under Inspection") return "bg-blue-100 text-blue-700";
    if (status === "Available Next Month") return "bg-yellow-100 text-yellow-700";

    return "bg-slate-100 text-slate-700";
  };

  return (
    <main className="space-y-8">
      <section className="rounded-[32px] bg-black p-8 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
              RentDirect Admin
            </p>

            <h1 className="mt-3 text-4xl font-black">Property Management</h1>

            <p className="mt-3 max-w-2xl text-neutral-300">
              Manage uploaded properties, landlord details, availability and media.
            </p>
          </div>

          <Link
            href="/admin/properties/new"
            className="rounded-full bg-yellow-400 px-6 py-3 text-center font-black text-black hover:bg-yellow-300"
          >
            Add Property
          </Link>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-black text-yellow-700">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Stat title="Total Properties" value={properties.length} />
        <Stat
          title="Available"
          value={properties.filter((p) => p.status === "Available").length}
        />
        <Stat
          title="Rented"
          value={properties.filter((p) => p.status === "Rented").length}
        />
        <Stat title="Showing Results" value={filteredProperties.length} />
      </section>

      <section className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, area, landlord..."
            className="rounded-2xl border border-neutral-200 p-3 lg:col-span-2"
          />

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-2xl border border-neutral-200 p-3"
          >
            <option value="">Select Region</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-2xl border border-neutral-200 p-3"
          >
            <option value="">Apartment Type</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-2xl border border-neutral-200 p-3"
          >
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Available Next Month">Available Next Month</option>
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 rounded-full bg-neutral-100 px-5 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-200"
        >
          Clear Filters
        </button>
      </section>

      {loading ? (
        <section className="rounded-[32px] bg-white p-12 text-center text-neutral-500 shadow-sm">
          Loading properties...
        </section>
      ) : filteredProperties.length === 0 ? (
        <section className="rounded-[32px] bg-white p-12 text-center shadow-sm">
          <h2 className="text-2xl font-black">No properties found</h2>
          <p className="mt-2 text-neutral-500">
            Try clearing your filters or add a new property.
          </p>

          <Link
            href="/admin/properties/new"
            className="mt-6 inline-block rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Add Property
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {filteredProperties.map((property) => (
            <article
              key={property.id}
              className="overflow-hidden rounded-[32px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                <div className="relative h-64 md:h-full">
                  {property.main_image ? (
                    <img
                      src={property.main_image}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                      No Image
                    </div>
                  )}

                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-black ${getStatusStyle(
                      property.status
                    )}`}
                  >
                    {property.status || "Not added"}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h2 className="text-2xl font-black">{property.title}</h2>
                      <p className="mt-2 text-neutral-500">
                        📍 {property.area}, {property.city}, {property.region}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm text-neutral-500">Monthly Rent</p>
                      <p className="text-2xl font-black text-yellow-600">
                        GH₵{property.monthly_rent}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info label="Apartment Type" value={property.apartment_type} />
                    <Info
                      label="Landlord"
                      value={property.landlord_name || "Not added"}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="rounded-full bg-black px-4 py-2 text-sm font-black text-white hover:bg-neutral-800"
                    >
                      View
                    </Link>

                    <Link
                      href={`/admin/properties/${property.id}/edit`}
                      className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black hover:bg-yellow-300"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/admin/properties/${property.id}/gallery`}
                      className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-200"
                    >
                      Gallery
                    </Link>

                    {property.status !== "Available" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(property.id, "Available")}
                        className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700 hover:bg-green-200"
                      >
                        Mark Available
                      </button>
                    )}

                    {property.status !== "Rented" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(property.id, "Rented")}
                        className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-200"
                      >
                        Mark Rented
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteProperty(property.id, property.title)}
                      className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-neutral-500">{title}</p>
      <h2 className="mt-2 text-3xl font-black">{value}</h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}