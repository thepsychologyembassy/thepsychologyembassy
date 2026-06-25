"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { client, urlFor } from "../lib/sanity";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await client.fetch(`*[_type == "testimonial"]`);
        setTestimonials(data);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };
    fetchTestimonials();
  }, []);

  // Don't render the section at all if there are no testimonials in the database
  if (testimonials.length === 0) return null;

  // We duplicate the array 4 times to ensure the screen is always full, creating a seamless infinite loop
  const infiniteTestimonials = [...testimonials, ...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="relative w-full overflow-hidden bg-[#FBF8F2] py-24 sm:py-32">
      
      <div className="relative z-10 mx-auto mb-16 max-w-6xl px-6 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.35em] text-[#4F6F52]">
          Words of Healing
        </p>
        <h2 className="font-serif text-4xl font-medium text-[#3A3A38] sm:text-5xl">
          Hear from our Community
        </h2>
      </div>

      {/* The Scrolling Marquee Container */}
      <div className="relative flex w-full overflow-hidden">
        
        {/* Soft gradient fades on the left and right edges */}
        <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#FBF8F2] to-transparent sm:w-40" />
        <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#FBF8F2] to-transparent sm:w-40" />

        {/* The Animated Track */}
        <div className="flex w-max animate-marquee items-stretch gap-6 px-6 sm:gap-8">
          {infiniteTestimonials.map((t, i) => (
            <div 
              key={i} 
              className="flex w-[320px] shrink-0 flex-col justify-between rounded-3xl border border-[#3A3A38]/10 bg-white/60 p-8 shadow-sm backdrop-blur-md sm:w-[450px]"
            >
              <p className="mb-8 text-lg italic leading-relaxed text-[#3A3A38]/80">
                "{t.quote}"
              </p>
              
              <div className="flex items-center gap-4 border-t border-[#3A3A38]/10 pt-6">
                {t.image ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#CFE3E8]">
                    <Image 
                      src={urlFor(t.image).url()} 
                      alt={t.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#CFE3E8]/30 font-serif text-lg font-medium text-[#4A6B7C]">
                    {t.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-[#3A3A38]">{t.name}</p>
                  <p className="text-xs uppercase tracking-widest text-[#3A3A38]/50">Community Member</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}