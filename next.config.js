/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const dest = process.env.NEXT_PUBLIC_API_URL;
    if (!dest) return [];
    try {
      // Validate URL
      const url = new URL(dest);
      const base = url.toString().replace(/\/$/, '');
      return [
        {
          source: '/api/:path*',
          destination: `${base}/api/:path*`,
        },
      ];
    } catch (_) {
      // If invalid, skip rewrites
      return [];
    }
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
