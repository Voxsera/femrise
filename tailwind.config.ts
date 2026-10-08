import type { Config } from "tailwindcss";

/**
 * FEMRISE! design system
 * Warm White + Black → structure · Yellow → energy · Blue → excitement · Green → health · Orange → warmth
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0B",
        fr: {
          yellow: "#FBBE18",
          blue: "#1748E8",
          green: "#62B946",
          orange: "#F4A623",
          warm: "#FFFDF7",
          cream: "#FFF6D8",
          softblue: "#DCE8FF",
          softgreen: "#E5F4DF",
          charcoal: "#292929",
          muted: "#77736A",
          red: "#E5484D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      boxShadow: {
        pop: "5px 5px 0 #0B0B0B",
        "pop-sm": "3px 3px 0 #0B0B0B",
        "pop-lg": "8px 8px 0 #0B0B0B",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
        fadein: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        wiggle: "wiggle 2.4s ease-in-out infinite",
        fadein: "fadein 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
