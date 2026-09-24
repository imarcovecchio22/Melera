/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/generate": ["./melera-templates/*.html", "./melera-templates/logo.png"],
    },
  },
};

module.exports = nextConfig;
