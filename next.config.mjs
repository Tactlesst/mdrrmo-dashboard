/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'res.cloudinary.com',
      'images.icon-icons.com',
      'via.placeholder.com',
      'unpkg.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Modern JavaScript target
  experimental: {
    optimizePackageImports: ['react-icons', 'leaflet', 'chart.js'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://*.tile.openstreetmap.org https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.openstreetmap.org https://res.cloudinary.com https://unpkg.com https://cdnjs.cloudflare.com https://images.icon-icons.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://api.cloudinary.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https:",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
