"use client";

import { useState } from "react";

/**
 * Read-only star rating display, e.g. "★★★★☆ 4.3 (12 ratings)"
 * Renders a partially-filled star for fractional averages.
 */
export function StarRatingDisplay({
  average,
  count,
  size = "sm",
  className = "",
}: {
  average: number;
  count: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const starSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const clamped = Math.max(0, Math.min(5, average || 0));

  if (!count) {
    return (
      <span className={`flex items-center gap-1.5 text-xs font-medium text-[#3A3A38]/40 ${className}`}>
        <svg className={starSize} fill="none" viewBox="0 0 20 20" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2.5l2.34 4.74 5.24.76-3.79 3.7.9 5.22L10 14.5l-4.69 2.42.9-5.22-3.79-3.7 5.24-.76z" />
        </svg>
        No ratings yet
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <span className="relative inline-flex">
        {/* Empty stars (background) */}
        <span className="flex gap-0.5 text-[#3A3A38]/20">
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} className={starSize} fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 1.5l2.7 5.47 6.04.88-4.37 4.26 1.03 6.02L10 15.1l-5.4 2.84 1.03-6.02L1.26 7.85l6.04-.88z" />
            </svg>
          ))}
        </span>
        {/* Filled stars (foreground, clipped to rating %) */}
        <span
          className="absolute inset-0 flex gap-0.5 overflow-hidden text-[#F6D86B]"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} className={`${starSize} shrink-0`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 1.5l2.7 5.47 6.04.88-4.37 4.26 1.03 6.02L10 15.1l-5.4 2.84 1.03-6.02L1.26 7.85l6.04-.88z" />
            </svg>
          ))}
        </span>
      </span>
      <span className="text-xs font-semibold text-[#3A3A38]/70">
        {clamped.toFixed(1)}{" "}
        <span className="font-normal text-[#3A3A38]/45">
          ({count} {count === 1 ? "rating" : "ratings"})
        </span>
      </span>
    </span>
  );
}

/**
 * Interactive 1–5 star picker used in the "rate this article" form.
 */
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} out of 5`}
            className="transition-transform hover:scale-110"
          >
            <svg
              className={`h-8 w-8 ${filled ? "text-[#F6D86B]" : "text-[#3A3A38]/20"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 1.5l2.7 5.47 6.04.88-4.37 4.26 1.03 6.02L10 15.1l-5.4 2.84 1.03-6.02L1.26 7.85l6.04-.88z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
