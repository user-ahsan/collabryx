import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  // Image optimization
  images: {
    remotePatterns: [
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
        hostname: '*.amazonaws.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable minimum cache TTL for optimized images
    minimumCacheTTL: 60,
  },
  poweredByHeader: false,
  compress: true,
  // Security headers only (Cache-Control removed — Next.js manages chunk caching internally)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // SECURITY NOTE: CSP uses 'unsafe-inline' and 'unsafe-eval' which are required
            // by Next.js for next/image runtime and React dev mode. In production,
            // consider using strict CSP with nonces once Next.js supports them.
            // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/contentSecurityPolicy
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com",
              // Tightened image remote domains to Supabase, Unsplash, and Amazon CDN only
              "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.amazonaws.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* ws://localhost:*",
              "media-src 'self' blob:",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), midi=()',
          },
        ],
      },
    ]
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
