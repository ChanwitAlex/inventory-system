import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/navbar";

export const metadata: Metadata = {
  title: "ระบบจัดการสินค้าและคลังสินค้า",
  description: "บันทึก ค้นหา และติดตามสต็อกสินค้า",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
