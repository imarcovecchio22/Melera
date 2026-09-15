import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        miel: {
          50: "#fdf8ed",
          100: "#faeecb",
          200: "#f5dc98",
          300: "#efc45c",
          400: "#eaad32",
          500: "#dc9420",
          600: "#c07618",
          700: "#9a5818",
          800: "#7d4719",
          900: "#693c19",
        },
        crema: "#fffaf0",
        ambar: "#e8a33d",
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
