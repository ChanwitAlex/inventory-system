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

export const config = {
  matcher: ["/products/:path*", "/admin/:path*"],
};
