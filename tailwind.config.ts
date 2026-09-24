import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        miel: {
          50: "#fdf3e3",
          100: "#fae3be",
          200: "#f2cc85",
          300: "#edb855",
          400: "#eaa52c",
          500: "#e8970a",
          600: "#c97f08",
          700: "#8b4513",
          800: "#6b3410",
          900: "#4a230b",
        },
        crema: "#fff3dc",
        beige: "#f5e6c8",
        marron: "#3b1f0a",
        ambar: "#e8970a",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(120, 80, 20, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
