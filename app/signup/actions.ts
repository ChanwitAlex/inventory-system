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
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // ผู้สมัครใหม่เป็น USER (ดูอย่างเดียว) เสมอ ผู้ดูแลระบบเป็นคนปรับสิทธิ์ให้ภายหลัง
    await prisma.user.create({ data: { name, email, passwordHash, role: "USER" } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { errors: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] }, values };
    }
    throw e;
  }

  redirect("/login?registered=1");
}
