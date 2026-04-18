import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
        ring: "hsl(var(--ring))",
        cortex: {
          ember: "#9f1d2c",
          garnet: "#6c1420",
          gold: "#d5b672",
          parchment: "#f5efe4",
          ink: "#12110f",
          moss: "#3f5f55"
        }
      },
      borderRadius: {
        xl: "1.1rem",
        "2xl": "1.5rem"
      },
      boxShadow: {
        glow: "0 18px 48px rgba(18, 17, 15, 0.12)"
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top left, rgba(213,182,114,0.16), transparent 28%), radial-gradient(circle at top right, rgba(63,95,85,0.1), transparent 34%), radial-gradient(circle at bottom center, rgba(18,17,15,0.08), transparent 42%)"
      },
      fontFamily: {
        sans: [
          "\"Neue Haas Grotesk Text Pro\"",
          "\"Avenir Next\"",
          "\"SF Pro Text\"",
          "\"Segoe UI Variable\"",
          "\"Helvetica Neue\"",
          "system-ui",
          "sans-serif"
        ],
        display: [
          "\"Canela\"",
          "\"IvyPresto Display\"",
          "\"Iowan Old Style\"",
          "\"Palatino Linotype\"",
          "Georgia",
          "serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
