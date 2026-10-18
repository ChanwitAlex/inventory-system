/**
 * ไฟล์: app/api/products/route.ts — REST API ของสินค้า (ข้อ 5)
 *   GET  /api/products   ดูรายการ + ค้นหา/กรอง/เรียง/แบ่งหน้า
 *   POST /api/products   เพิ่มสินค้าใหม่
 * สิทธิ์: ADMIN/STAFF (login หรือส่ง header x-api-key)
 * รหัสตอบกลับ: 200/201 สำเร็จ, 400 ข้อมูลผิด, 401 ยังไม่ login, 403 ไม่มีสิทธิ์, 409 SKU ซ้ำ, 500 ผิดพลาดฝั่งเซิร์ฟเวอร์
 */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireApiRole } from "@/app/lib/permissions";
import { isUniqueViolation, listProducts } from "@/app/lib/products";
import { productSchema } from "@/app/lib/validation";
import { z } from "zod";

// GET /api/products?search=&category=&status=&stock=&sort=&page=&pageSize=
// GET: ดึงรายการสินค้า — ตัวอย่าง /api/products?search=CPU&stock=low&sort=price_desc&page=1
export async function GET(request: Request) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  // อ่านเงื่อนไขค้นหา/กรองจาก query string แล้วส่งให้ listProducts (ตัวเดียวกับที่หน้าเว็บใช้)
  const sp = new URL(request.url).searchParams;
  try {
    const result = await listProducts({
      search: sp.get("search") ?? undefined,
      category: sp.get("category") ?? undefined,
      status: sp.get("status") ?? undefined,
      stock: sp.get("stock") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || undefined,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/products failed:", e);
    return NextResponse.json({ message: "ไม่สามารถดึงรายการสินค้าได้" }, { status: 500 });
  }
}

// POST /api/products
// POST: เพิ่มสินค้าใหม่ ทำทีละขั้น: ตรวจสิทธิ์ -> อ่าน JSON -> ตรวจข้อมูล -> บันทึก
export async function POST(request: Request) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  // อ่าน JSON จาก body ถ้ารูปแบบพัง -> 400
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "รูปแบบ JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  // ตรวจข้อมูลด้วยกฎใน validation.ts ถ้าไม่ผ่านตอบ 400 พร้อม errors แยกรายฟิลด์
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "ข้อมูลไม่ถูกต้อง", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  try {
    // บันทึกลงฐานข้อมูล สำเร็จตอบ 201 Created
    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    // SKU ซ้ำกับสินค้าที่มีอยู่ -> 409 Conflict
    if (isUniqueViolation(e)) {
      return NextResponse.json({ message: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ message: "ไม่สามารถบันทึกสินค้าได้" }, { status: 500 });
  }
}