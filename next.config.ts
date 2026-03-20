import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Turbopack config (Next.js 16 default)
  turbopack: {
    // Enable code splitting and optimization
    resolveAlias: {
      // Optimize large library imports
      'lucide-react': 'lucide-react/dist/esm/lucide-react',
    },
  },
  // Webpack config for backwards compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split large vendor chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            // Separate vendor chunks
            vendors: {
              test: /[\/]node_modules[\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
            },
            // Separate React chunks
            react: {
              test: /[\/]node_modules[\/](react|react-dom|react-server-dom-webpack)[\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
            },
            // Separate UI library chunks
            ui: {
              test: /[\/]node_modules[\/](@radix-ui|@supabase)[\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };
    }
    return config;
  },
  // Image optimization with CDN caching
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
  productionBrowserSourceMaps: false, // Disable source maps in production to reduce bundle
  // Security and CDN caching headers
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Static assets - long-term CDN caching (1 year)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Static media files - long-term CDN caching
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Optimized images - medium-term caching (30 days)
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // Avatars and banners from Supabase storage - CDN caching
      {
        source: '/api/upload/avatar/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/api/upload/banner/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Post media - medium-term caching
      {
        source: '/api/upload/post/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Fonts - long-term caching
      {
        source: '/:path*.(woff2?|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Favicon and manifest - medium-term caching
      {
        source: '/:path*.(ico|png|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
