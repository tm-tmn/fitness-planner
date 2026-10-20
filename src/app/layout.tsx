import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PwaSetup from "@/components/PwaSetup";

export const metadata: Metadata = {
  title: "Fit & Meal Planner",
  description: "ตารางออกกำลังกายและอาหารการกินส่วนตัว",
  applicationName: "Fit & Meal",
  authors: [{ name: "Teerawat Maneewat" }],
  creator: "Teerawat Maneewat",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Fit & Meal", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFD23F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Mali:wght@400;600&family=Mitr:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:px-6 md:pb-10">
          <PwaSetup />
          {children}
          <footer className="mt-10 text-center text-sm opacity-80">
            พัฒนาโดย Teerawat Maneewat
          </footer>
        </main>
      </body>
    </html>
  );
}
