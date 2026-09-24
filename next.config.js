/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Chromium para renderizar las imágenes de IG: no se empaqueta con webpack
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    outputFileTracingIncludes: {
      "/api/img/[formato]/[token]": [
        "./melera-templates/*.html",
        "./melera-templates/logo.png",
        "./node_modules/@sparticuz/chromium/bin/**",
      ],
    },
  },
};

module.exports = nextConfig;
