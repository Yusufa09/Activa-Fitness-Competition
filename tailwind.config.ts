import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  // Team colors are referenced dynamically from TEAM_COLORS in lib/points.ts.
  // Safelist guarantees every team's bar/badge classes are always generated.
  safelist: [
    { pattern: /^(bg|text|border)-(orange|rose|blue|emerald|violet|amber|sky|teal)-(50|300|500|700)$/ },
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#ea580c",   // orange-600
          secondary: "#475569", // slate-600
          accent: "#f59e0b",    // amber-500
          light: "#fff7ed",     // orange-50
          dark: "#0f172a",      // slate-900
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
