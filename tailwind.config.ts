import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#0d9488",   // teal-600
          secondary: "#475569", // slate-600
          accent: "#d97706",    // amber-600
          light: "#f0fdfa",     // teal-50
          dark: "#0f172a",      // slate-900
        },
        team: {
          alpha: "#0d9488",   // teal
          bravo: "#7c3aed",   // violet
          charlie: "#d97706", // amber
          delta: "#0284c7",   // sky
        },
      },
      animation: {
        "count-up": "countUp 0.6s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        countUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-16px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
