import type { Config } from "tailwindcss";

// Shared design tokens — source of truth is the "Regiment Marketplace MVP"
// design doc. Every branch building a page for this site should pull
// colors from here rather than re-approximating them, since apps/web is
// the one Next.js frontend the whole marketplace shares.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#071C35",
          900: "#0B223D",
          800: "#132C49",
          DEFAULT: "#0B223D",
        },
        brand: {
          red: "#C8102E",
          "red-dark": "#A90D27",
          green: "#0E7A45",
          "green-dark": "#0A5E35",
        },
        page: "#F5F4F1",
        card: "#FFFFFF",
        hairline: "#E2E4E7",
        ink: "#10233E",
        "ink-secondary": "#68758A",
        "ink-muted": "#98A2B3",
        "warning-bg": "#FFF8DF",
        "warning-text": "#9A5B00",
        success: "#18B57B",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
