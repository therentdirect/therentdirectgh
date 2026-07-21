"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
};

const apartmentTypes = [
  "Single Room",
  "Single Room and Porch",
  "Chamber and Hall",
  "Chamber and Hall Self-Contained",
  "1 Bedroom Apartment",
  "2 Bedroom Apartment",
  "3 Bedroom Apartment",
  "4+ Bedroom Apartment",
  "Shared Apartment",
  "Office or Commercial Space",
];

export default function FindMeAHomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [preferredRegion, setPreferredRegion] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");

  const [apartmentType, setApartmentType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [furnishedPreference, setFurnishedPreference] =
    useState("Either");

  const [minimumBudget, setMinimumBudget] = useState("");
  const [maximumBudget, setMaximumBudget] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("Monthly");

  const [rentalDurationYears, setRentalDurationYears] = useState("1");
  const [preferredMoveInDate, setPreferredMoveInDate] = useState("");
  const [additionalRequirements, setAdditionalRequirements] =
    useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, username, phone, email")
        .eq("email", user.email)
        .maybeSingle();

      const profile = profileData as Profile | null;

      if (profile) {
        const fullName =
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

        setCustomerName(fullName || profile.username || "");
        setPhone(profile.phone || "");
        setWhatsappNumber(profile.phone || "");
      }

      setLoading(false);
    }

    void loadUser();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!userId || !email) {
      setMessage("Your login session has expired. Please login again.");
      return;
    }

    if (!customerName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!preferredRegion.trim() || !preferredCity.trim()) {
      setMessage("Please enter your preferred region and city.");
      return;
    }

    if (!preferredLocations.trim()) {
      setMessage("Please enter at least one preferred location.");
      return;
    }

    if (!apartmentType) {
      setMessage("Please select the type of apartment you need.");
      return;
    }

    if (!maximumBudget || Number(maximumBudget) <= 0) {
      setMessage("Please enter your maximum rental budget.");
      return;
    }

    if (
      minimumBudget &&
      Number(minimumBudget) > Number(maximumBudget)
    ) {
      setMessage(
        "Your minimum budget cannot be greater than your maximum budget."
      );
      return;
    }

    if (!acceptedTerms) {
      setMessage(
        "Please accept the Apartment Search Service terms before continuing."
      );
      return;
    }

    const locations = preferredLocations
      .split(",")
      .map((location) => location.trim())
      .filter(Boolean);

    if (locations.length === 0) {
      setMessage("Please enter at least one valid preferred location.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("apartment_requests")
        .insert({
          user_id: userId,
          user_email: email,
          customer_name: customerName.trim(),
          phone: phone.trim(),
          whatsapp_number: whatsappNumber.trim() || phone.trim(),

          preferred_region: preferredRegion.trim(),
          preferred_city: preferredCity.trim(),
          preferred_locations: locations,

          apartment_type: apartmentType,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          furnished_preference: furnishedPreference,

          minimum_budget: minimumBudget
            ? Number(minimumBudget)
            : null,
          maximum_budget: Number(maximumBudget),
          payment_frequency: paymentFrequency,

          rental_duration_years: Number(rentalDurationYears),
          preferred_move_in_date: preferredMoveInDate || null,
          additional_requirements:
            additionalRequirements.trim() || null,

          service_fee: 350,
          payment_status: "unpaid",
          request_status: "payment_pending",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      router.push(
        `/dashboard/find-me-a-home/requests/${data.id}`
      );
    } catch (error: any) {
      console.error("Apartment request error:", error);

      setMessage(
        error?.message ||
          "We could not save your apartment request. Please try again."
      );

      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold text-black outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100";

  const labelClass =
    "text-sm font-black text-neutral-800";

  if (loading) {
    return (
      <main className="rounded-[30px] bg-white p-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-yellow-400" />
        <p className="mt-4 font-bold text-neutral-500">
          Loading apartment search service...
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-16">
      <section className="overflow-hidden rounded-[34px] bg-black p-6 text-white shadow-xl md:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-400">
              RentDirect Apartment Search
            </p>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              Tell us what you need. We will search for you.
            </h1>

            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-neutral-300 md:text-base">
              Submit your preferred location, apartment type and
              budget. Our team will actively search for suitable
              options for up to 30 days.
            </p>
          </div>

          <div className="min-w-[220px] rounded-[28px] border border-white/10 bg-white/10 p-6 lg:text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
              Search Service Fee
            </p>

            <h2 className="mt-2 text-4xl font-black text-yellow-400">
              GH₵350
            </h2>

            <p className="mt-2 text-xs font-semibold text-neutral-300">
              Initial transport included
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[26px] border border-neutral-200 bg-white p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
            1
          </div>
          <h3 className="mt-4 font-black">Submit Your Request</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Tell us the exact location, type and budget you prefer.
          </p>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
            2
          </div>
          <h3 className="mt-4 font-black">Pay Securely</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Pay GH₵350 through Hubtel to activate your search.
          </p>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
            3
          </div>
          <h3 className="mt-4 font-black">We Start Searching</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Track your request and receive updates for up to 30 days.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-[34px] border border-neutral-200 bg-white p-5 shadow-sm md:p-9"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
            Personal details
          </p>

          <h2 className="mt-2 text-2xl font-black">
            How can we contact you?
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Full Name
            <input
              className={inputClass}
              value={customerName}
              onChange={(event) =>
                setCustomerName(event.target.value)
              }
              placeholder="Your full name"
              required
            />
          </label>

          <label className={labelClass}>
            Email Address
            <input
              className={`${inputClass} bg-neutral-100 text-neutral-500`}
              value={email}
              readOnly
            />
          </label>

          <label className={labelClass}>
            Phone Number
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Example: 024 000 0000"
              required
            />
          </label>

          <label className={labelClass}>
            WhatsApp Number
            <input
              className={inputClass}
              value={whatsappNumber}
              onChange={(event) =>
                setWhatsappNumber(event.target.value)
              }
              placeholder="WhatsApp number"
            />
          </label>
        </div>

        <div className="my-9 h-px bg-neutral-200" />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
            Preferred location
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Where do you want to live?
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Region
            <input
              className={inputClass}
              value={preferredRegion}
              onChange={(event) =>
                setPreferredRegion(event.target.value)
              }
              placeholder="Example: Greater Accra"
              required
            />
          </label>

          <label className={labelClass}>
            City or Town
            <input
              className={inputClass}
              value={preferredCity}
              onChange={(event) =>
                setPreferredCity(event.target.value)
              }
              placeholder="Example: Accra"
              required
            />
          </label>

          <label className={`${labelClass} md:col-span-2`}>
            Preferred Areas
            <input
              className={inputClass}
              value={preferredLocations}
              onChange={(event) =>
                setPreferredLocations(event.target.value)
              }
              placeholder="Example: Madina, Adenta, East Legon Hills"
              required
            />

            <span className="mt-2 block text-xs font-medium text-neutral-500">
              Separate multiple locations with commas.
            </span>
          </label>
        </div>

        <div className="my-9 h-px bg-neutral-200" />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
            Apartment preference
          </p>

          <h2 className="mt-2 text-2xl font-black">
            What type of property do you need?
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Apartment Type
            <select
              className={inputClass}
              value={apartmentType}
              onChange={(event) =>
                setApartmentType(event.target.value)
              }
              required
            >
              <option value="">Select apartment type</option>

              {apartmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Number of Bedrooms
            <select
              className={inputClass}
              value={bedrooms}
              onChange={(event) =>
                setBedrooms(event.target.value)
              }
            >
              <option value="">Not applicable</option>
              <option value="1">1 bedroom</option>
              <option value="2">2 bedrooms</option>
              <option value="3">3 bedrooms</option>
              <option value="4">4 bedrooms</option>
              <option value="5">5+ bedrooms</option>
            </select>
          </label>

          <label className={labelClass}>
            Furnishing
            <select
              className={inputClass}
              value={furnishedPreference}
              onChange={(event) =>
                setFurnishedPreference(event.target.value)
              }
            >
              <option value="Either">Either</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Furnished">Furnished</option>
            </select>
          </label>

          <label className={labelClass}>
            Number of Years
            <select
              className={inputClass}
              value={rentalDurationYears}
              onChange={(event) =>
                setRentalDurationYears(event.target.value)
              }
            >
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5 years</option>
              <option value="6">6 years</option>
              <option value="7">7 years</option>
              <option value="8">8 years</option>
              <option value="9">9 years</option>
              <option value="10">10 years</option>
            </select>
          </label>
        </div>

        <div className="my-9 h-px bg-neutral-200" />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
            Budget and timing
          </p>

          <h2 className="mt-2 text-2xl font-black">
            What can you afford?
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Minimum Budget
            <input
              className={inputClass}
              type="number"
              min="0"
              value={minimumBudget}
              onChange={(event) =>
                setMinimumBudget(event.target.value)
              }
              placeholder="Example: 800"
            />
          </label>

          <label className={labelClass}>
            Maximum Budget
            <input
              className={inputClass}
              type="number"
              min="1"
              value={maximumBudget}
              onChange={(event) =>
                setMaximumBudget(event.target.value)
              }
              placeholder="Example: 1500"
              required
            />
          </label>

          <label className={labelClass}>
            Budget Frequency
            <select
              className={inputClass}
              value={paymentFrequency}
              onChange={(event) =>
                setPaymentFrequency(event.target.value)
              }
            >
              <option value="Monthly">Per month</option>
              <option value="Yearly">Per year</option>
            </select>
          </label>

          <label className={labelClass}>
            Preferred Move-in Date
            <input
              className={inputClass}
              type="date"
              value={preferredMoveInDate}
              onChange={(event) =>
                setPreferredMoveInDate(event.target.value)
              }
            />
          </label>

          <label className={`${labelClass} md:col-span-2`}>
            Additional Requirements
            <textarea
              className={`${inputClass} min-h-36 resize-y`}
              value={additionalRequirements}
              onChange={(event) =>
                setAdditionalRequirements(event.target.value)
              }
              placeholder="Example: Gated compound, self meter, water available, close to main road, parking space..."
            />
          </label>
        </div>

        <div className="mt-9 rounded-[26px] border border-yellow-200 bg-yellow-50 p-5">
          <h3 className="font-black text-neutral-900">
            Important information
          </h3>

          <p className="mt-3 text-sm font-medium leading-7 text-neutral-700">
            RentDirect will actively search for apartments matching
            your submitted requirements for up to 30 days after
            successful payment. Apartment availability cannot be
            guaranteed because it depends on the rental market.
          </p>

          <p className="mt-3 text-sm font-medium leading-7 text-neutral-700">
            The GH₵350 service fee covers the apartment search
            service and initial transportation expenses. It is not
            apartment rent, advance payment, inspection fee or a
            landlord deposit.
          </p>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) =>
                setAcceptedTerms(event.target.checked)
              }
              className="mt-1 h-5 w-5 accent-yellow-400"
            />

            <span className="text-sm font-bold leading-6 text-neutral-800">
              I understand and agree to the Apartment Search Service
              terms.
            </span>
          </label>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-black text-red-700">
            {message}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/dashboard"
            className="rounded-full border border-neutral-300 px-7 py-4 text-center text-sm font-black text-neutral-700 hover:bg-neutral-100"
          >
            Return to Dashboard
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-black px-8 py-4 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving Request..."
              : "Continue to Payment — GH₵350"}
          </button>
        </div>
      </form>
    </main>
  );
}
