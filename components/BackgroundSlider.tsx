"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/slide1.jpg",
    title: "Find Apartments Without Agent Fees",
    text: "Connect directly with verified landlords across Ghana.",
  },
  {
    image: "/images/slide2.jpg",
    title: "Verified Properties",
    text: "Every listing is reviewed by RentDirect before it goes live.",
  },
  {
    image: "/images/slide3.jpg",
    title: "Schedule Apartment Inspections",
    text: "Book inspections directly with landlords after unlocking access.",
  },
  {
    image: "/images/slide4.jpg",
    title: "One Payment. 30 Days Access.",
    text: "Pay GHS 250 once and unlock landlord contacts for 30 days.",
  },
  {
    image: "/images/slide5.jpg",
    title: "Your Next Home Starts Here",
    text: "Fast, secure and transparent apartment search across Ghana.",
  },
];

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      <div className="absolute inset-0 bg-black/65" />

      <div className="absolute left-10 bottom-16 max-w-xl text-white z-10">
        <span className="inline-block mb-4 rounded-full bg-yellow-500 px-4 py-1 text-sm font-semibold text-black">
          RentDirect Ghana
        </span>

        <h1 className="text-5xl font-bold leading-tight">
          {slides[current].title}
        </h1>

        <p className="mt-6 text-lg text-gray-200">
          {slides[current].text}
        </p>
      </div>
    </div>
  );
}