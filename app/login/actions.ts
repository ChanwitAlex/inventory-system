"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/app/auth";

export type LoginState = { error?: string };

// จำกัดจำนวนครั้งที่ล็อกอินผิด (เก็บในหน่วยความจำของ server process)
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

function safeRedirect(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/products";
}

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
      fail(key);
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw e; // redirect ของ Next.js ต้องถูกโยนต่อ
  }
  return {};
}

export async function githubSignIn() {
  await signIn("github", { redirectTo: "/products" });
}
