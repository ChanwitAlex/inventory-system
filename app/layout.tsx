import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/app/auth";
import Navbar from "@/app/components/navbar";

export const metadata: Metadata = {
  title: "ระบบจัดการสินค้าและคลังสินค้า",
  description: "บันทึก ค้นหา และติดตามสต็อกสินค้า",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="th">
      <body className="min-h-screen">
        {/* แสดงแถบเมนูเฉพาะเมื่อเข้าสู่ระบบแล้ว (หน้า login ไม่แสดง) */}
        {user && <Navbar name={user.name ?? user.email ?? "ผู้ใช้"} role={user.role} />}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}