/**
 * ไฟล์: proxy.ts — ด่านตรวจชั้นแรก (ข้อ 3 Authentication)
 * ทำงานก่อนเปิดหน้าใน /products/* และ /admin/* (Next.js 16 เปลี่ยนชื่อจาก middleware เป็น proxy)
 * 1) ยังไม่ login -> ส่งไปหน้า login (จำหน้าเดิมไว้ใน callbackUrl เพื่อกลับมาหลัง login)
 * 2) เข้า /admin แต่ไม่ใช่ ADMIN -> ส่งไปหน้า 'ไม่มีสิทธิ์'
 * ทุกหน้า/Action/API ยังตรวจสิทธิ์ซ้ำอีกชั้น (ดู app/lib/permissions.ts)
 */
import { NextResponse } from "next/server";
import { auth } from "@/app/auth";

// ด่านแรก: ไม่ login ให้ไปหน้า login, ไม่ใช่ ADMIN ห้ามเข้า /admin
// (ทุก route/action ยังตรวจสิทธิ์ซ้ำอีกชั้นของตัวเอง)
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth?.user) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
  }
});

// กำหนดว่า proxy นี้ใช้กับ path ไหนบ้าง
export const config = {
  matcher: ["/products/:path*", "/admin/:path*"],
};