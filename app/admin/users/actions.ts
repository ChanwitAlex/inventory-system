"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import { isUniqueViolation } from "@/app/lib/products";
import { Role } from "@/app/generated/prisma/client";

export async function createStaffUser(prevState: any, formData: FormData) {
  // ตรวจสอบสิทธิ์เฉพาะ ADMIN เท่านั้น
  await requirePageRole(["ADMIN"]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleInput = (formData.get("role") as string) || "STAFF";

  if (!name || !email || !password) {
    return { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  // แปลงและตรวจสอบค่า Role ให้ตรงตาม Enum ของ Prisma
  const validRoles: Role[] = ["ADMIN", "STAFF", "USER"];
  const role: Role = validRoles.includes(roleInput as Role)
    ? (roleInput as Role)
    : "STAFF";

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: `เพิ่มผู้ใช้งาน (${role}) เรียบร้อยแล้ว` };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, message: "อีเมลนี้ถูกใช้งานในระบบแล้ว" };
    }
    return { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}