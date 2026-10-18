/**
 * ไฟล์: app/admin/users/actions.ts — Server Actions จัดการผู้ใช้ (เฉพาะ ADMIN)
 *   createStaffUser  เพิ่มผู้ใช้ | updateUserRole  เปลี่ยนสิทธิ์
 *   deleteUser       ลบผู้ใช้   | approveUser     อนุมัติผู้สมัคร
 * มีกฎป้องกัน: แก้/ลบบัญชีตัวเองไม่ได้ และต้องเหลือ ADMIN อย่างน้อย 1 คนเสมอ
 */
"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import { isNotFound, isUniqueViolation } from "@/app/lib/products";
import { adminCreateUserSchema, roleSchema } from "@/app/lib/validation";

type CreateUserResult = { success: boolean; message: string };

/** กลับหน้ารายชื่อผู้ใช้พร้อมข้อความแจ้งผล */
// กลับหน้ารายชื่อผู้ใช้พร้อมข้อความผลลัพธ์ใน URL (ok= สำเร็จ, error= ผิดพลาด)
function back(kind: "ok" | "error", text: string): never {
  redirect(`/admin/users?${kind}=${encodeURIComponent(text)}`);
}

/** ตรวจว่าการลบ/ลดสิทธิ์ผู้ใช้คนนี้จะทำให้ไม่เหลือ ADMIN เลยหรือไม่ */
// ตรวจว่าผู้ใช้คนนี้เป็น ADMIN คนสุดท้ายหรือไม่ (ถ้าใช่ห้ามลบ/ลดสิทธิ์ ไม่งั้นไม่เหลือคนดูแลระบบ)
async function isLastAdmin(id: string) {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, approved: true },
  });
  if (target?.role !== "ADMIN" || !target.approved) return false;
  return (await prisma.user.count({ where: { role: "ADMIN", approved: true } })) <= 1;
}

// เพิ่มผู้ใช้ใหม่: ตรวจข้อมูล -> เข้ารหัสรหัสผ่าน -> สร้างบัญชี (approved อัตโนมัติ)
export async function createStaffUser(
  _prev: unknown,
  formData: FormData,
): Promise<CreateUserResult> {
  await requirePageRole(["ADMIN"]);

  const parsed = adminCreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "STAFF",
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { name, email, password, role } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash, role } });
    revalidatePath("/admin/users");
    return { success: true, message: `เพิ่มผู้ใช้งาน (${role}) เรียบร้อยแล้ว` };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, message: "อีเมลนี้ถูกใช้งานในระบบแล้ว" };
    }
    return { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}

// เปลี่ยนสิทธิ์: ห้ามเปลี่ยนของตัวเอง และห้ามลด ADMIN คนสุดท้าย
export async function updateUserRole(id: string, formData: FormData): Promise<void> {
  const me = await requirePageRole(["ADMIN"]);

  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success) back("error", "สิทธิ์ไม่ถูกต้อง");
  if (id === me.id) back("error", "ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้");
  if (role.data !== "ADMIN" && (await isLastAdmin(id))) {
    back("error", "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน");
  }

  try {
    await prisma.user.update({ where: { id }, data: { role: role.data } });
  } catch (e) {
    if (isNotFound(e)) back("error", "ไม่พบผู้ใช้นี้แล้ว");
    throw e;
  }

  revalidatePath("/admin/users");
  back("ok", "เปลี่ยนสิทธิ์เรียบร้อยแล้ว");
}

// ลบผู้ใช้: ห้ามลบตัวเอง และห้ามลบ ADMIN คนสุดท้าย
export async function deleteUser(id: string): Promise<void> {
  const me = await requirePageRole(["ADMIN"]);

  if (id === me.id) back("error", "ไม่สามารถลบบัญชีของตัวเองได้");
  if (await isLastAdmin(id)) back("error", "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน");

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    if (!isNotFound(e)) throw e;
  }

  revalidatePath("/admin/users");
  back("ok", "ลบผู้ใช้เรียบร้อยแล้ว");
}

// อนุมัติผู้สมัคร: ตั้ง approved = true ผู้ใช้จะ login ได้หลังจากนี้
export async function approveUser(id: string): Promise<void> {
  await requirePageRole(["ADMIN"]);

  try {
    await prisma.user.update({ where: { id }, data: { approved: true } });
  } catch (e) {
    if (isNotFound(e)) back("error", "ไม่พบผู้ใช้นี้แล้ว");
    throw e;
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  back("ok", "อนุมัติผู้ใช้เรียบร้อยแล้ว");
}