/**
 * ไฟล์: app/login/actions.ts — Server Action ของการ login (ข้อ 3 Authentication)
 * - authenticate: ตรวจรหัสผ่านผ่าน Auth.js พร้อมจำกัดการลองผิด
 * - githubSignIn: เริ่ม login ด้วย GitHub
 */
"use server";

import { AuthError } from "next-auth";
import { PENDING_APPROVAL_CODE, signIn } from "@/app/auth";

export type LoginState = { error?: string };

// จำกัดจำนวนครั้งที่ล็อกอินผิด (เก็บในหน่วยความจำของ server process)
// จำกัดการเดารหัสผ่าน: นับจำนวนครั้งที่ login ผิดต่ออีเมล (เก็บในหน่วยความจำของเซิร์ฟเวอร์)
// ผิดครบ 8 ครั้งใน 15 นาที จะถูกบล็อกชั่วคราว
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function tooMany(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function fail(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else rec.count++;
}

// กัน open redirect: ยอมให้กลับเฉพาะ path ในเว็บเรา (ขึ้นต้นด้วย / แต่ไม่ใช่ //) ไม่งั้นใช้หน้าแรก
function safeRedirect(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

// ขั้นตอน: ตรวจว่าถูกบล็อกอยู่ไหม -> เรียก signIn -> ถ้าผิดแยกเป็น 'รออนุมัติ' หรือ 'อีเมล/รหัสผ่านผิด'
export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const key = email || "unknown";

  if (tooMany(key)) {
    return { error: "ลองเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" };
  }

  try {
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      if ((e as { code?: string }).code === PENDING_APPROVAL_CODE) {
        return { error: "บัญชีของคุณรอผู้ดูแลระบบอนุมัติ ยังเข้าสู่ระบบไม่ได้" };
      }
      fail(key);
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    // ถ้าไม่ใช่ error ของ Auth.js (เช่น redirect หลัง login สำเร็จ) ต้องโยนต่อให้ Next.js ทำงานเอง
    throw e; // redirect ของ Next.js ต้องถูกโยนต่อ
  }
  return {};
}

export async function githubSignIn() {
  await signIn("github", { redirectTo: "/" });
}