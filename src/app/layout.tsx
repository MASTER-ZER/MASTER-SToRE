import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "متجر ماستر | Master Store",
  description: "أقوى العروض والخدمات الرقمية وتفعيل الحسابات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Header />
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  );
}
