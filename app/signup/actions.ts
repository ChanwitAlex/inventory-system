/**
 * ไฟล์: app/signup/actions.ts — Server Action สมัครสมาชิก
 * ผู้สมัครเองจะเป็น STAFF และ approved = true: สามารถ login ได้ทันทีไม่ต้องรอ ADMIN อนุมัติ
 */
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { isUniqueViolation } from "@/app/lib/products";
import { signUpSchema, type FieldErrors } from "@/app/lib/validation";

export type SignUpState = {
  errors?: FieldErrors;
  values?: { name: string; email: string };
};

// ขั้นตอน: รับค่าจากฟอร์ม -> ตรวจด้วย signUpSchema -> เข้ารหัสรหัสผ่าน -> สร้างผู้ใช้ -> ไปหน้า login
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name, email, password } = parsed.data;
  // เข้ารหัสรหัสผ่านด้วย bcrypt (cost 12) ก่อนเก็บ — ในฐานข้อมูลไม่มีรหัสผ่านจริง
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // กำหนดบทบาทเป็น STAFF และอนุมัติทันที (approved: true) เพื่อให้ล็อกอินได้เลย
    await prisma.user.create({
      data: { name, email, passwordHash, role: "STAFF", approved: true },
    });
  } catch (e) {
    // อีเมลนี้มีผู้ใช้แล้ว -> แจ้งที่ช่องอีเมล
    if (isUniqueViolation(e)) {
      return { errors: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] }, values };
    }
    throw e;
  }

  redirect("/login?registered=1");
}