import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Fit & Meal Planner",
  description: "ตารางออกกำลังกายและอาหารการกินส่วนตัว",
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
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 md:pb-10">
          {children}
        </main>
      </body>
    </html>
  );
}
