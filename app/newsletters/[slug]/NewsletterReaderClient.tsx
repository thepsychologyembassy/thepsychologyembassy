"use client";

import dynamic from "next/dynamic";

// react-pdf touches browser-only APIs (canvas, DOMMatrix), so the reader
// must never be rendered during SSR.
const NewsletterReader = dynamic(() => import("../../../components/NewsletterReader"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center">
      <p className="animate-pulse text-sm uppercase tracking-widest text-[#CFE3E8]">Loading Newsletter...</p>
    </div>
  ),
});

export default function NewsletterReaderClient({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  return <NewsletterReader pdfUrl={pdfUrl} title={title} />;
}
