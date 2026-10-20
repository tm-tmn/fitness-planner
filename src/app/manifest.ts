import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fit & Meal Planner",
    short_name: "Fit & Meal",
    description: "ตารางออกกำลังกายและอาหารการกินส่วนตัว",
    lang: "th",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#CDEBFF",
    theme_color: "#FFD23F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
