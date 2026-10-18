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
 */
export async function adjustStock(
  id: number,
  type: "IN" | "OUT",
  amount: number,
): Promise<{ success: boolean; message: string }> {
  await requirePageRole(["ADMIN", "STAFF"]);

  if (!amount || amount <= 0) {
    return { success: false, message: "จำนวนต้องมากกว่า 0" };
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return { success: false, message: "ไม่พบสินค้าในระบบ" };
    }

    if (type === "OUT" && product.stock < amount) {
      return { success: false, message: "จำนวนสินค้าคงเหลือไม่เพียงพอสำหรับเบิกจ่าย" };
    }

    const newStock = type === "IN" ? product.stock + amount : product.stock - amount;

    await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    revalidatePath("/products");
    return { success: true, message: "ปรับปรุงสต็อกเรียบร้อยแล้ว" };
  } catch (e) {
    if (isNotFound(e)) {
      return { success: false, message: "ไม่พบสินค้าในระบบ" };
    }
    return { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}