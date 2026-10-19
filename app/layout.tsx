/**
 * Layout หลักของทุกหน้า
 * - โหลดฟอนต์ IBM Plex Sans Thai (ตัวหนังสือ) และ IBM Plex Mono (รหัสสินค้า)
 * - ดึง session ของผู้ใช้: ถ้า login แล้วแสดงแถบเมนู (Navbar) + พื้นที่เนื้อหา
 *   ถ้ายังไม่ login (หน้า login/สมัครสมาชิก) แสดงหน้าเต็มจอโดยไม่มีแถบเมนู
 */
import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/app/auth";
import Navbar from "@/app/components/navbar";

// ข้อมูลหัวเว็บ (title / description) ที่แสดงบนแท็บเบราว์เซอร์
export const metadata: Metadata = {
  title: "ระบบจัดการสินค้าและคลังสินค้า",
  description: "บันทึก ค้นหา และติดตามสต็อกสินค้า",
};

// ครอบทุกหน้าด้วย <html>/<body> + Navbar + พื้นที่เนื้อหา (children)
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // อ่านผู้ใช้ที่ login อยู่จาก cookie (ไม่มี = ยังไม่ login)
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="th">
      <head>
        {/* ฟอนต์จาก Google Fonts (ถ้าออฟไลน์จะใช้ฟอนต์สำรองในระบบแทน) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen">
        {user ? (
          <>
            {/* แสดงแถบเมนูเฉพาะเมื่อเข้าสู่ระบบแล้ว */}
            <Navbar name={user.name ?? user.email ?? "ผู้ใช้"} role={user.role} />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
          </>
        ) : (
          // ยังไม่ login: หน้า login / สมัครสมาชิก ใช้เต็มจอ
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}