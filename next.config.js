/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

// Content Security Policy: el sitio no carga scripts ni fuentes de afuera (next/font las incluye).
// 'unsafe-inline' en scripts lo necesita Next para sus scripts de hidratación (sin nonces).
// En las previews de Vercel se permite su barra de comentarios (vercel.live).
function contentSecurityPolicy() {
  const preview = process.env.VERCEL_ENV === "preview";
  const vercelLive = preview ? " https://vercel.live" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${vercelLive}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${preview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
    `frame-src ${preview ? "https://vercel.live" : "'none'"}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

// En desarrollo no se aplica: el recargado en caliente de Next necesita eval.
if (process.env.NODE_ENV === "production") {
  securityHeaders.push({ key: "Content-Security-Policy", value: contentSecurityPolicy() });
}

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [],
  },
  // Chromium para renderizar las imágenes de IG: no se empaqueta con el bundler
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    // Las claves son globs: los corchetes de [formato]/[token] no coincidirían literalmente
    "/api/img/**": [
      "./melera-templates/*.html",
      "./melera-templates/logo.png",
      "./melera-templates/panal-fondo.js",
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

module.exports = nextConfig;
