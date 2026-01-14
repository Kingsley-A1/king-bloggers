import withPWA from "@ducanh2912/next-pwa";

// ============================================
// 👑 KING BLOGGERS - Next.js Configuration
// ============================================
// SEC-009: ✅ Security headers configured
// PERF: ✅ Image optimization for R2
// ============================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/bloggers/:path*",
        destination: "/blogger/:path*",
      },
    ];
  },

  // Allow R2 images + external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-2aa1172cadf14ba89fb907ce9a9bcaa1.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  // SEC-009: Security headers
  async headers() {
    return [
      {
        // Allow manifest.json and PWA assets to be fetched without restrictions
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

const isDev = process.env.NODE_ENV === "development";
const enablePwaInDev = process.env.KING_PWA_DEV === "1";

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        // Avoid noisy Workbox errors for /favicon.ico
        urlPattern: /\/favicon\.ico$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "favicon",
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // App router navigations (/, /login, /blogger/editor, etc)
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // NextAuth endpoints should never be cached
        urlPattern: /\/api\/auth\/.*$/i,
        handler: "NetworkOnly",
        options: {
          cacheName: "auth",
        },
      },
    ],
  },
  // next-pwa + Next 15 can trigger dev-only stream errors on some Node versions.
  // Keep PWA enabled for production; disable by default in dev.
  disable: isDev && !enablePwaInDev,
})(nextConfig);
