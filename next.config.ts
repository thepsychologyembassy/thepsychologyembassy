import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing Sanity images config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  
  // The new security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevents clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevents MIME-sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains', // Enforces HTTPS
          }
        ],
      },
    ];
  },
};

export default nextConfig;