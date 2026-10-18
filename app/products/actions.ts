"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import { isNotFound, isUniqueViolation } from "@/app/lib/products";
import { productSchema, type FieldErrors } from "@/app/lib/validation";

export type ProductFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string | boolean>;
};

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

export async function createProduct(
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
    await prisma.product.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { errors: { sku: ["รหัสสินค้านี้มีอยู่แล้ว"] }, values: echo(raw) };
    }
    return { message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", values: echo(raw) };
  }

  revalidatePath("/products");
  redirect("/products?saved=created");
}

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
    if (isNotFound(e)) {
      return { message: "ไม่พบสินค้านี้แล้ว อาจถูกลบไปก่อนหน้า", values: echo(raw) };
    }
    return { message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", values: echo(raw) };
  }

  revalidatePath("/products");
  redirect("/products?saved=updated");
}

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
export async function adjustStock(
  id: number,
  type: "IN" | "OUT",
  amount: number,
): Promise<{ success: boolean; message: string }> {
  await requirePageRole(["ADMIN", "STAFF"]);

  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, message: "จำนวนต้องเป็นจำนวนเต็มที่มากกว่า 0" };
  }
  if (amount > 1_000_000) {
    return { success: false, message: "จำนวนสูงเกินไป" };
  }

  try {
    if (type === "IN") {
      await prisma.product.update({ where: { id }, data: { stock: { increment: amount } } });
    } else {
      // ลดเฉพาะเมื่อสต็อกพอ ตรวจและลดใน query เดียว
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