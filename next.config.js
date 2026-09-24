/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
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
