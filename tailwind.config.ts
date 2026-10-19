import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#26234A",
        sky: { DEFAULT: "#CDEBFF", deep: "#9FD5F5" },
        sun: "#FFD23F",
        mint: { DEFAULT: "#5ED6A8", soft: "#BFF2DA" },
        bubble: "#FF6F91",
        grape: "#C9B8FF",
        coral: "#FF8A5B",
        candy: "#FFB3C7",
      },
      fontFamily: {
        display: ["Mitr", "Mali", "sans-serif"],
        sans: ["Mali", "Mitr", "sans-serif"],
      },
      boxShadow: {
        pop: "5px 5px 0 #26234A",
        "pop-sm": "3px 3px 0 #26234A",
      },
    },
  },
  plugins: [],
};
export default config;
