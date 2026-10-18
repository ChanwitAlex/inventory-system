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

function validApiKey(request: Request) {
  const expected = process.env.API_KEY;
  const given = request.headers.get("x-api-key");
  if (!expected || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireApiRole(request: Request, roles: Role[]) {
  const session = await auth();

  let role: Role | undefined = session?.user?.role;
  if (!role && validApiKey(request)) role = "STAFF";

  if (!role) {
    return {
      error: NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ หรือส่ง x-api-key" },
        { status: 401 },
      ),
    };
  }
  if (!roles.includes(role)) {
    return {
      error: NextResponse.json({ message: "ไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 }),
    };
  }
  return { role };
}

export async function requirePageRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/unauthorized");
  return session.user;
}