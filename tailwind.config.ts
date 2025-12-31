import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        king: {
          orange: {
            DEFAULT: "rgb(var(--king-orange) / <alpha-value>)",
            hover: "#FFA500",
            glow: "rgba(255, 140, 0, 0.2)",
          },
          gold: "rgb(var(--king-gold) / <alpha-value>)",
          black: "#050505",
          obsidian: {
            DEFAULT: "#000000",
            soft: "#0A0A0A",
            card: "rgba(10, 10, 10, 0.5)",
          },
        },
      },
      backgroundImage: {
        "sovereign-gradient":
          "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "mesh-dark":
          "radial-gradient(at 0% 0%, rgba(255, 140, 0, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(0, 0, 0, 1) 0, transparent 50%)",
      },
      borderRadius: {
        king: "0.75rem", // 12px - Sharp enough with a little curve
        sovereign: "1.25rem", // 20px - Slightly more curve for containers
      },
      boxShadow: {
        glass: "var(--glass-shadow)",
        "glass-orange": "0 8px 32px 0 rgba(255, 140, 0, 0.15)",
        "inner-glass": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)",
      },
      transitionTimingFunction: {
        "apple-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
