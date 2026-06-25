import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from "@next/third-parties/google"; // <-- NEW: GA4 Import
import "./globals.css";

// 1. IMPORT YOUR NEW COMPONENTS
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Psychology Embassy",
  description: "You are on a better path.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col relative">
          
          {/* Main Page Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* 2. RENDER THE LEGAL FOOTER AT THE VERY BOTTOM */}
          <Footer />

          {/* 3. RENDER THE COOKIE BANNER OVERLAY */}
          <CookieBanner />

        </body>
        {/* NEW: GA4 Tracker running securely in the background */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
      </html>
    </ClerkProvider>
  );
}