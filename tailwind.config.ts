import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fdf9f3",
        surface: "#fdf9f3",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e6e2dc",
        "surface-container-high": "#ebe8e2",
        "surface-container": "#f1ede7",
        "surface-container-low": "#f7f3ed",
        "surface-variant": "#e6e2dc",
        "surface-bright": "#fdf9f3",
        "surface-dim": "#dddad4",
        "surface-tint": "#9d4223",
        "on-surface": "#1c1c18",
        "on-surface-variant": "#56423c",
        "on-background": "#1c1c18",
        "inverse-surface": "#31302d",
        "inverse-on-surface": "#f4f0ea",
        primary: "#9d4223",
        "primary-container": "#f4845f",
        "primary-fixed": "#ffdbd0",
        "primary-fixed-dim": "#ffb59d",
        "on-primary": "#ffffff",
        "on-primary-container": "#6c1e02",
        "on-primary-fixed": "#390b00",
        "on-primary-fixed-variant": "#7e2b0d",
        secondary: "#655781",
        "secondary-container": "#deccfd",
        "secondary-fixed": "#eaddff",
        "secondary-fixed-dim": "#d0bfef",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#62547e",
        "on-secondary-fixed": "#21143a",
        "on-secondary-fixed-variant": "#4d4068",
        tertiary: "#3d6751",
        "tertiary-container": "#81ad94",
        "tertiary-fixed": "#bfedd1",
        "tertiary-fixed-dim": "#a4d1b6",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#17412d",
        "on-tertiary-fixed": "#002113",
        "on-tertiary-fixed-variant": "#254f3a",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        outline: "#89726b",
        "outline-variant": "#dcc1b8",
        charcoal: "#2d2d2d",
        coral: "#f4845f",
        lavender: "#c9b8e8",
        mint: "#a8d5ba",
        cream: "#fdf9f3"
      },
      boxShadow: {
        tactile: "4px 4px 0px 0px #2d2d2d",
        "tactile-sm": "2px 2px 0px 0px #2d2d2d",
        "tactile-lg": "8px 8px 0px 0px #2d2d2d",
        ambient: "0px 12px 32px rgba(28, 28, 24, 0.08)"
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Plus Jakarta Sans", "sans-serif"]
      },
      borderRadius: {
        panel: "1.5rem",
        shell: "2rem"
      }
    }
  },
  plugins: []
};

export default config;
