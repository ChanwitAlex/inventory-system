/**
 * ไฟล์: app/products/actions.ts — Server Actions ของสินค้า (ข้อ 1 CRUD ฝั่งหน้าเว็บ)
 * Server Action คือฟังก์ชันที่ทำงานบนเซิร์ฟเวอร์ ฟอร์ม/ปุ่มบนหน้าเว็บเรียกได้โดยตรง ไม่ต้องเขียน API แยก
 * ทุกฟังก์ชันตรวจสิทธิ์ก่อนเสมอ (ผู้ใช้เรียกตรงโดยข้ามปุ่มบนหน้าเว็บก็ไม่ได้)
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import { isNotFound, isUniqueViolation } from "@/app/lib/products";
import { productSchema, type FieldErrors } from "@/app/lib/validation";

// สถานะที่ส่งกลับให้ฟอร์ม: errors (รายช่อง), message (ข้อความรวม), values (ค่าที่กรอก ใช้เติมฟอร์มกลับ)
export type ProductFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string | boolean>;
};

// อ่านค่าจาก FormData ของฟอร์ม (checkbox ที่ติ๊กจะส่งค่า 'on')
function readForm(fd: FormData) {
  return {
    sku: fd.get("sku"),
    name: fd.get("name"),
    category: fd.get("category"),
    description: fd.get("description"),
    price: fd.get("price"),
    stock: fd.get("stock"),
    status: fd.get("status") === "on",
  };
}

// แปลงค่าที่กรอกเป็นข้อความ เพื่อส่งกลับไปเติมฟอร์มเมื่อบันทึกไม่ผ่าน (ฟอร์มจะได้ไม่ถูกล้าง)
function echo(raw: ReturnType<typeof readForm>): ProductFormState["values"] {
  return {
    sku: String(raw.sku ?? ""),
    name: String(raw.name ?? ""),
    category: String(raw.category ?? ""),
    description: String(raw.description ?? ""),
    price: String(raw.price ?? ""),
    stock: String(raw.stock ?? ""),
    status: raw.status,
  };
}

// เพิ่มสินค้า (Create): ตรวจสิทธิ์ -> อ่านฟอร์ม -> ตรวจข้อมูล -> บันทึก -> กลับหน้ารายการพร้อมข้อความ
export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  // ขั้น 1: ตรวจสิทธิ์ (ADMIN/STAFF)
  await requirePageRole(["ADMIN", "STAFF"]);

  const raw = readForm(formData);
  // ขั้น 2: ตรวจข้อมูลด้วย validation.ts ถ้าไม่ผ่านส่ง errors + ค่าที่กรอกกลับให้ฟอร์ม
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: echo(raw) };
  }

  try {
    // ขั้น 3: บันทึกลงฐานข้อมูล (SKU ซ้ำจะถูกจับด้านล่างและแจ้งที่ช่อง SKU)
    await prisma.product.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { errors: { sku: ["รหัสสินค้านี้มีอยู่แล้ว"] }, values: echo(raw) };
    }
    return { message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", values: echo(raw) };
  }

  revalidatePath("/products");
  // ขั้น 4: สั่งให้หน้ารายการโหลดข้อมูลใหม่ แล้วกลับไปหน้ารายการ (พร้อมข้อความ 'เพิ่มสินค้าเรียบร้อย')
  redirect("/products?saved=created");
}

// แก้ไขสินค้า (Update): ขั้นตอนเหมือน createProduct แต่ใช้ update ตาม id ที่ผูกมาจากหน้าแก้ไข
export async function updateProduct(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requirePageRole(["ADMIN", "STAFF"]);

  const raw = readForm(formData);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: echo(raw) };
  }

  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { errors: { sku: ["รหัสสินค้านี้มีอยู่แล้ว"] }, values: echo(raw) };
    }
    // กรณีสินค้าถูกลบไปแล้วระหว่างที่กำลังแก้ไข
    if (isNotFound(e)) {
      return { message: "ไม่พบสินค้านี้แล้ว อาจถูกลบไปก่อนหน้า", values: echo(raw) };
    }
    return { message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", values: echo(raw) };
  }

  revalidatePath("/products");
  redirect("/products?saved=updated");
}

// ลบสินค้า (Delete): เฉพาะ ADMIN — ถ้าไม่พบ (ถูกลบไปแล้ว) ก็ถือว่าสำเร็จ
export async function deleteProduct(id: number) {
  await requirePageRole(["ADMIN"]);

  try {
    await prisma.product.delete({ where: { id } });
  } catch (e) {
    if (!isNotFound(e)) throw e;
  }
  revalidatePath("/products");
}

/**
 * ฟังก์ชันปรับปรุงสต็อก (รับเข้า IN / เบิกจ่าย OUT)
 * ใช้ increment/decrement ใน query เดียว เพื่อไม่ให้สต็อกเพี้ยนเมื่อมีหลายคนเบิกพร้อมกัน
 */
// ปรับสต็อก รับเข้า (IN) / เบิกจ่าย (OUT) — ไม่ให้สต็อกติดลบ แม้มีหลายคนเบิกพร้อมกัน
export async function adjustStock(
  id: number,
  type: "IN" | "OUT",
  amount: number,
): Promise<{ success: boolean; message: string }> {
  await requirePageRole(["ADMIN", "STAFF"]);

  // ตรวจจำนวนที่กรอก: ต้องเป็นจำนวนเต็มมากกว่า 0 และไม่เกิน 1,000,000
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, message: "จำนวนต้องเป็นจำนวนเต็มที่มากกว่า 0" };
  }
  if (amount > 1_000_000) {
    return { success: false, message: "จำนวนสูงเกินไป" };
  }

  try {
    // รับเข้า: เพิ่มจำนวนด้วย increment (ทำใน query เดียว ไม่อ่านแล้วค่อยบวกเอง จึงไม่พลาดเมื่อมีคนทำพร้อมกัน)
    if (type === "IN") {
      await prisma.product.update({ where: { id }, data: { stock: { increment: amount } } });
    } else {
      // ลดเฉพาะเมื่อสต็อกพอ ตรวจและลดใน query เดียว
      // เบิกจ่าย: ลดจำนวน 'เฉพาะเมื่อสต็อก >= จำนวนที่เบิก' ถ้าไม่เข้าเงื่อนไข count = 0 (ไม่มีอะไรถูกลด)
      const { count } = await prisma.product.updateMany({
        where: { id, stock: { gte: amount } },
        data: { stock: { decrement: amount } },
      });
      if (count === 0) {
        const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
        return {
          success: false,
          message: exists
            ? "จำนวนสินค้าคงเหลือไม่เพียงพอสำหรับเบิกจ่าย"
            : "ไม่พบสินค้าในระบบ",
        };
      }
    }

    revalidatePath("/products");
    return { success: true, message: "ปรับปรุงสต็อกเรียบร้อยแล้ว" };
  } catch (e) {
    if (isNotFound(e)) {
      return { success: false, message: "ไม่พบสินค้าในระบบ" };
    }
    return { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}