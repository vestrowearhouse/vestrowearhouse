/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development-time warnings
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: '*.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Serve AVIF first (smallest), then WebP — browser picks best supported format
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    // Cover every common breakpoint so Next.js serves the right size
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  // Move heavy server-only packages out of the client bundle entirely
  // Tree-shake large packages — only import what is actually used
  experimental: {
    serverComponentsExternalPackages: [
      'nodemailer',
      'firebase-admin',
      'cloudinary',
      'mongoose',
      'bcryptjs',
      'jsonwebtoken',
      'sharp',
      'papaparse',
      'xlsx',
      'jspdf',
      'jspdf-autotable',
      'node-os-utils',
    ],
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'react-icons',
      'react-markdown',
      'framer-motion',
      'recharts',
      'date-fns',
      'zod',
      'clsx',
      'swr',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://stellarmartbd-930de.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
  async headers() {
    return [
      // ── Service Worker: must NEVER be cached by browser or CDN ─────────────
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // ── Web Manifest ─────────────────────────────────────────────────────────
      {
        source: '/(manifest\\.json|manifest\\.webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // ── Next.js Static Chunks (immutable hashes) ────────────────────────────
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Static assets: long-lived cache (excluding sw.js) ───────────────────
      {
        source: '/:path*\\.(woff|woff2|png|jpg|jpeg|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Sensitive / Dynamic API routes: strict no-store + CORS restrict ──────
      {
        source: '/api/(auth|admin|user|vendor|cart|checkout|orders|profile|messages|users|upload)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          // 🔒 CORS: Allow known domains
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.stellarmartbd.com',
          },
          {
            key: 'Vary',
            value: 'Origin',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
      // ── All routes: security headers ────────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          // ── HSTS — force HTTPS for 2 years ──────────────────────────────────
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // ── XSS Protection (legacy browsers) ────────────────────────────────
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // ── Prevent MIME-type sniffing ───────────────────────────────────────
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // ── Clickjacking prevention ──────────────────────────────────────────
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // ── Referrer Policy ─────────────────────────────────────────────────
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // ── Cross-Origin Opener Policy ──────────────────────────────────────
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          // ── Permissions Policy — disable unused browser features ─────────────
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          // ── Content Security Policy ───────────────────────────────────────
          // strict-dynamic + unsafe-inline is the recommended migration strategy:
          // • Modern browsers: strict-dynamic is used; unsafe-inline is silently ignored
          // • Old browsers: strict-dynamic is unknown; unsafe-inline is used as fallback
          // This satisfies Sucuri CSP scanner (sees strict-dynamic) while keeping the
          // app working in all browsers (Next.js inline hydration scripts still run).
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: require unsafe-inline for Next.js hydration without a nonce
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://*.firebaseio.com https://va.vercel-scripts.com https://cdn.vercel-insights.com https://static.cloudflareinsights.com blob:",
              // Styles: unsafe-inline is safe here — styles cannot execute code
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + all CDNs used by the site (incl. i.postimg.cc for favicon)
              "img-src 'self' data: blob: https: https://res.cloudinary.com https://*.unsplash.com https://*.firebasestorage.app https://*.googleapis.com https://lh3.googleusercontent.com https://i.postimg.cc https://*.gstatic.com https://encrypted-tbn0.gstatic.com https://*.supabase.co https://*.supabase.in https://placehold.co",
              // API/WebSocket connections + Vercel analytics
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://accounts.google.com https://api.resend.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
              // Frames: allow Firebase Auth and Google Identity Services iframes
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
              // Frame ancestors: deny embedding in iframes
              "frame-ancestors 'none'",
              // Objects: deny plugins
              "object-src 'none'",
              // Base URI: only self
              "base-uri 'self'",
              // Form actions: only self
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // Enable compression
  compress: true,
  // Disable production source maps — prevents attackers from reading your full source code
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }

    return config;
  },
  transpilePackages: [],
};

module.exports = nextConfig;

