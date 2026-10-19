/**
 * ไฟล์: app/lib/permissions.ts — ศูนย์กลางการตรวจสิทธิ์ (ข้อ 3 Authentication/Authorization)[cite: 1]
 * ทุกหน้า ทุก Server Action และทุก API เรียกฟังก์ชันในไฟล์นี้ก่อนทำงาน[cite: 1]
 * เป็นด่านชั้นที่ 2 ต่อจาก proxy.ts (ป้องกันกรณีมีคนเรียกตรงโดยข้าม proxy)[cite: 1]
 */

// นำเข้าโมดูล timingSafeEqual จาก Node.js Crypto เพื่อใช้เปรียบเทียบข้อความแบบปลอดภัยต่อการเดารหัสจากเวลา (Timing Attack)[cite: 1]
import { timingSafeEqual } from "node:crypto";
// นำเข้า NextResponse สำหรับส่งการตอบกลับในรูปแบบ JSON พร้อม HTTP Status[cite: 1]
import { NextResponse } from "next/server";
// นำเข้า redirect สำหรับเปลี่ยนหน้าเว็บไปยัง URL อื่น[cite: 1]
import { redirect } from "next/navigation";
// นำเข้า auth เพื่อดึงข้อมูล Session การเข้าสู่ระบบของผู้ใช้[cite: 1]
import { auth } from "@/app/auth";

// กำหนดชนิดข้อมูล (Type) ของระดับสิทธิ์ในระบบ ได้แก่ ADMIN และ STAFF[cite: 1]
export type Role = "ADMIN" | "STAFF";

/** 
 * ฟังก์ชันเช็คสิทธิ์การเขียน/แก้ไขข้อมูล: Admin และ Staff มีสิทธิ์เพิ่ม/แก้ไขสินค้า และปรับสต็อก[cite: 1]
 */
export const canWrite = (role?: string) => role === "ADMIN" || role === "STAFF"; // คืนค่า true ถ้าเป็น ADMIN หรือ STAFF[cite: 1]

/** 
 * ฟังก์ชันเช็คสิทธิ์การลบ: เฉพาะ Admin เท่านั้นที่ลบสินค้าได้[cite: 1]
 */
export const canDelete = (role?: string) => role === "ADMIN"; // คืนค่า true เฉพาะเมื่อบทบาทเป็น ADMIN เท่านั้น[cite: 1]

/** 
 * ฟังก์ชันเช็คสิทธิ์การจัดการผู้ใช้: เฉพาะ Admin เท่านั้นที่จัดการผู้ใช้และดู Logs ระบบได้[cite: 1]
 */
export const canManageUsers = (role?: string) => role === "ADMIN"; // คืนค่า true เฉพาะเมื่อบทบาทเป็น ADMIN เท่านั้น[cite: 1]

/**
 * ฟังก์ชันตรวจสอบ API key ที่ส่งมาใน header ชื่อ x-api-key (ใช้สำหรับ Postman หรือระบบภายนอก)[cite: 1]
 * 1) ถ้าไม่ได้ตั้ง API_KEY ใน .env หรือไม่ได้ส่ง key มา -> ไม่ผ่าน[cite: 1]
 * 2) เทียบด้วย timingSafeEqual เพื่อกันการเดา key จากความเร็วในการตอบสนอง[cite: 1]
 */
function validApiKey(request: Request) {
  const expected = process.env.API_KEY; // ดึงรหัสลับ API Key ที่ตั้งไว้ในไฟล์ระบบ (.env)[cite: 1]
  const given = request.headers.get("x-api-key"); // อ่านรหัส API Key ที่ส่งมาจาก Header ของ Request[cite: 1]
  if (!expected || !given) return false; // ถ้าไม่มีการตั้งค่าในระบบ หรือผู้ใช้ไม่ส่งมา ให้ถือว่าไม่ผ่านทันที[cite: 1]

  const a = Buffer.from(given); // แปลงรหัสที่ผู้ใช้ส่งมาให้เป็น Buffer[cite: 1]
  const b = Buffer.from(expected); // แปลงรหัสที่ถูกต้องจากระบบให้เป็น Buffer[cite: 1]
  return a.length === b.length && timingSafeEqual(a, b); // เช็คว่าความยาวเท่ากัน และใช้ timingSafeEqual เทียบรหัสเพื่อความปลอดภัย[cite: 1]
}

/**
 * ฟังก์ชันตรวจสิทธิ์สำหรับใช้งานใน API Routes (app/api/**)[cite: 1]
 * จะคืนค่า Error เป็น JSON พร้อม HTTP Status (401/403) แทนการ redirect หน้าเว็บ[cite: 1]
 */
export async function requireApiRole(request: Request, roles: Role[]) {
  const session = await auth(); // อ่านข้อมูล Session การเข้าสู่ระบบปัจจุบัน[cite: 1]

  // ขั้น 1: ดูว่าผู้ใช้ login อยู่ไหม (ผ่าน cookie session) ถ้าไม่ได้ login ให้ลองตรวจผ่าน x-api-key (ถือให้เป็นสิทธิ์ STAFF)[cite: 1]
  let role: Role | undefined = session?.user?.role; // ดึงระดับสิทธิ์ของผู้ใช้จาก Session[cite: 1]
  if (!role && validApiKey(request)) role = "STAFF"; // ถ้าไม่มี Session แต่ส่ง API Key ถูกต้อง ให้กำหนดสิทธิ์ชั่วคราวเป็น STAFF[cite: 1]

  // ขั้น 2: ถ้าไม่ได้ login และไม่มี API Key ที่ถูกต้อง -> คืนค่า 401 Unauthorized[cite: 1]
  if (!role) {
    return {
      error: NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ หรือส่ง x-api-key" }, // ข้อความแจ้งเตือน[cite: 1]
        { status: 401 }, // ส่ง HTTP Status 401 (ยังไม่ได้ยืนยันตัวตน)[cite: 1]
      ),
    };
  }

  // ขั้น 3: ถ้า login แล้ว แต่สิทธิ์ (Role) ไม่อยู่ในรายการที่อนุญาต -> คืนค่า 403 Forbidden[cite: 1]
  if (!roles.includes(role)) {
    return {
      error: NextResponse.json({ message: "ไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 }), // ส่ง HTTP Status 403 (ไม่มีสิทธิ์ทำรายการ)[cite: 1]
    };
  }

  return { role }; // ถ้าผ่านการตรวจสอบทั้งหมด ให้คืนค่าสิทธิ์นั้นออกไป[cite: 1]
}

/**
 * ฟังก์ชันตรวจสิทธิ์สำหรับใช้งานในหน้าเว็บ (Pages) และ Server Actions[cite: 1]
 * หากตรวจไม่ผ่านจะสั่ง redirect เปลี่ยนหน้าไปยังหน้าที่เหมาะสมทันที[cite: 1]
 */
export async function requirePageRole(roles: Role[]) {
  const session = await auth(); // อ่านข้อมูล Session ปัจจุบันของผู้ใช้งาน[cite: 1]

  // กรณีที่ 1: ยังไม่ได้เข้าสู่ระบบ -> เปลี่ยนหน้าไปยัง /login[cite: 1]
  if (!session?.user) redirect("/login"); // สั่ง Redirect ไปยังหน้าล็อกอิน[cite: 1]

  // กรณีที่ 2: เข้าสู่ระบบแล้ว แต่ระดับสิทธิ์ไม่เพียงพอ -> เปลี่ยนหน้าไปยัง /unauthorized[cite: 1]
  if (!roles.includes(session.user.role)) redirect("/unauthorized"); // สั่ง Redirect ไปยังหน้าแจ้งไม่มีสิทธิ์[cite: 1]

  return session.user; // ถ้าผ่านการตรวจสอบทั้งหมด ให้คืนค่าข้อมูลผู้ใช้ออกไปใช้งานต่อ[cite: 1]
}