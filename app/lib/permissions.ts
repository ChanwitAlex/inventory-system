/**
 * ไฟล์: app/lib/permissions.ts — ศูนย์กลางการตรวจสิทธิ์ (ข้อ 3 Authentication/Authorization)
 * ทุกหน้า ทุก Server Action และทุก API เรียกฟังก์ชันในไฟล์นี้ก่อนทำงาน
 * เป็นด่านชั้นที่ 2 ต่อจาก proxy.ts (ป้องกันกรณีมีคนเรียกตรงโดยข้าม proxy)
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/app/auth";

export type Role = "ADMIN" | "STAFF";

/** Admin และ Staff มีสิทธิ์เพิ่ม/แก้ไขสินค้า และปรับสต็อก (ระบบมีสิทธิ์แค่ 2 ระดับ) */
export const canWrite = (role?: string) => role === "ADMIN" || role === "STAFF";

/** เฉพาะ Admin เท่านั้นที่ลบสินค้าได้ */
export const canDelete = (role?: string) => role === "ADMIN";

/** เฉพาะ Admin เท่านั้นที่จัดการผู้ใช้และดู Logs ระบบได้ */
export const canManageUsers = (role?: string) => role === "ADMIN";

// ตรวจ API key ที่ส่งมาใน header  x-api-key  (ใช้กับ Postman/ระบบภายนอก)
// 1) ถ้าไม่ได้ตั้ง API_KEY ใน .env หรือไม่ได้ส่ง key มา -> ไม่ผ่าน
// 2) เทียบด้วย timingSafeEqual เพื่อกันการเดา key จากความเร็วในการตอบ
function validApiKey(request: Request) {
  const expected = process.env.API_KEY;
  const given = request.headers.get("x-api-key");
  if (!expected || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ใช้ใน API (app/api/**): คืน error 401/403 เป็น JSON แทนการ redirect
export async function requireApiRole(request: Request, roles: Role[]) {
  const session = await auth();

  // ขั้น 1: ดูว่า login อยู่ไหม (cookie session) ถ้าไม่ ให้ลองใช้ x-api-key (ถือเป็นสิทธิ์ STAFF)
  let role: Role | undefined = session?.user?.role;
  if (!role && validApiKey(request)) role = "STAFF";

  // ขั้น 2: ไม่ login และไม่มี key ที่ถูกต้อง -> 401 Unauthorized
  if (!role) {
    return {
      error: NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ หรือส่ง x-api-key" },
        { status: 401 },
      ),
    };
  }
  // ขั้น 3: login แล้วแต่สิทธิ์ไม่อยู่ในรายการที่อนุญาต -> 403 Forbidden
  if (!roles.includes(role)) {
    return {
      error: NextResponse.json({ message: "ไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 }),
    };
  }
  return { role };
}

// ใช้ในหน้าเว็บและ Server Action: ตรวจไม่ผ่านให้ redirect ไปหน้าที่เหมาะสม
export async function requirePageRole(roles: Role[]) {
  const session = await auth();
  // ยังไม่ login -> ไปหน้า login
  if (!session?.user) redirect("/login");
  // login แล้วแต่สิทธิ์ไม่พอ -> ไปหน้า 'ไม่มีสิทธิ์'
  if (!roles.includes(session.user.role)) redirect("/unauthorized");
  return session.user;
}