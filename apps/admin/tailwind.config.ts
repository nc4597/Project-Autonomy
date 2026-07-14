import type { Config } from "tailwindcss";

// Same token set as apps/web (see apps/web/tailwind.config.ts) so the
// admin tool feels like part of the same product rather than a
// generic internal dashboard.
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
        content: "1080px",
      },
    },
  },
  plugins: [],
};

export default config;
