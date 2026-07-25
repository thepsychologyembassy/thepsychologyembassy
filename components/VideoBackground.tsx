"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface VideoBackgroundProps {
  /** Path to the background video, e.g. "/videos/aurora.mp4" */
  src: string;
  /** Path to a lightweight poster image shown instantly, before the video loads */
  poster: string;
  /** Applied to both the poster image and the video so they stay perfectly aligned */
  className?: string;
}

/**
 * Renders a looping, muted, decorative background video.
 *
 * Performance behaviour (this is what makes it fast, not just DRY):
 * - The poster image paints immediately, so there is never a blank/black hero.
 * - The (much larger) video file is only requested once this component's
 *   container scrolls into view, via IntersectionObserver.
 * - People with "prefers-reduced-motion" enabled, or on a slow/data-saver
 *   connection, never download the video at all -- they just see the poster.
 * - The video fades in over the poster once it can actually play, so there
 *   is no flash of unstyled/blank content while it buffers.
 */
export default function VideoBackground({
  src,
  poster,
  className = "h-full w-full object-cover",
}: VideoBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (shouldRespectDataAndMotionPreferences()) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start fetching a little before it's on screen
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Image
        src={poster}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className={`${className} transition-opacity duration-700 ${
          isVideoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      {shouldLoadVideo && (
        <video
          className={`absolute inset-0 ${className} transition-opacity duration-700 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onCanPlay={() => setIsVideoReady(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

/**
 * Decides whether we should skip the video entirely and rely on the poster
 * image alone -- true for people who've asked for reduced motion, and for
 * connections where a multi-megabyte download is unwelcome.
 */
function shouldRespectDataAndMotionPreferences(): boolean {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const connection = (navigator as unknown as { connection?: NetworkInformation })
    .connection;
  const isSlowOrDataSaverConnection =
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g";

  return prefersReducedMotion || isSlowOrDataSaverConnection;
}

// Minimal typing for the non-standard Network Information API.
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}
