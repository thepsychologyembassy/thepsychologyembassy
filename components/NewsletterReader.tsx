"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import gsap from "gsap";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Self-hosted worker (see scripts/copy-pdf-worker.js) — keeps the site's
// Content-Security-Policy restricted to same-origin scripts.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs";

interface NewsletterReaderProps {
  pdfUrl: string;
  title: string;
}

export default function NewsletterReader({ pdfUrl, title }: NewsletterReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  // Tracks flip direction so the GSAP animation knows which way to turn.
  const direction = useRef<"next" | "prev">("next");

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      setPageWidth(Math.min(w, 720));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Page-flip animation: the outgoing page rotates/fades out on the Y axis
  // like a turning page, then the new page rotates/fades in from the other
  // side. Runs whenever pageNumber changes (after the first render).
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!pageWrapRef.current) return;
    const el = pageWrapRef.current;
    const fromRotation = direction.current === "next" ? -90 : 90;

    gsap.fromTo(
      el,
      { rotateY: fromRotation, opacity: 0, transformPerspective: 1200 },
      { rotateY: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
  }, [pageNumber]);

  const goToPage = (next: number) => {
    if (!numPages) return;
    const clamped = Math.min(Math.max(next, 1), numPages);
    if (clamped === pageNumber) return;
    direction.current = clamped > pageNumber ? "next" : "prev";
    setPageNumber(clamped);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
        style={{ perspective: "1600px" }}
      >
        {isLoading && !loadError && (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">
              Loading Newsletter...
            </p>
          </div>
        )}

        {loadError && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm text-[#3A3A38]/60">
              We couldn't load the preview for this newsletter.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-widest text-[#4F6F52] hover:underline"
            >
              Open the PDF directly →
            </a>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            setIsLoading(false);
          }}
          onLoadError={(err) => {
            console.error("Newsletter PDF failed to load:", err);
            setLoadError("load-failed");
            setIsLoading(false);
          }}
          loading={null}
          error={null}
          className="flex justify-center"
        >
          {!loadError && (
            <div ref={pageWrapRef} className="w-full" style={{ transformStyle: "preserve-3d" }}>
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                loading={null}
                className="mx-auto"
              />
            </div>
          )}
        </Document>
      </div>

      {/* Controls */}
      {!loadError && numPages && numPages > 0 && (
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3A3A38]/15 text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="min-w-[90px] text-center text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
            Page {pageNumber} of {numPages}
          </span>

          <button
            type="button"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={pageNumber >= numPages}
            aria-label="Next page"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3A3A38]/15 text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Download */}
      <a
        href={pdfUrl}
        download
        className="flex items-center gap-2 rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download {title ? `"${title}"` : "Newsletter"} PDF
      </a>
    </div>
  );
}
