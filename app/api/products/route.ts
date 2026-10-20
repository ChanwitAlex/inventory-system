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

// GET: ดึงรายการสินค้า พร้อมรองรับการค้นหา/หมวดหมู่/เรียงตาม
export async function GET(request: Request) {
  // 1. ตรวจสอบสิทธิ์ผู้ใช้งาน
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  // 2. ดึงข้อมูล Query Parameters จาก URL (พารามิเตอร์หลังตัว ?)
  const sp = new URL(request.url).searchParams;
  
  try {
    // 3. ส่งเงื่อนไขการกรอง/ค้นหา ให้ฟังก์ชัน listProducts ไปประมวลผล
    const result = await listProducts({
      search: sp.get("search") ?? undefined,     // คำค้นหา เช่น ชื่อสินค้า
      category: sp.get("category") ?? undefined, // กรองตามหมวดหมู่
      sort: sp.get("sort") ?? undefined,         // การเรียงลำดับ (เช่น price_desc)
      pageSize: Number(sp.get("pageSize")) || undefined, // จำนวนต่อหน้า
    });

    // 4. คืนค่าผลลัพธ์กลับเป็น JSON (ส่ง HTTP Status 200 โดยอัตโนมัติ)
    return NextResponse.json(result);
  } catch (e) {
    // 5. ดักจับข้อผิดพลาดฝั่ง Server -> คืนค่า Status 500
    console.error("GET /api/products failed:", e);
    return NextResponse.json({ message: "ไม่สามารถดึงรายการสินค้าได้" }, { status: 500 });
  }
}

// POST /api/products
// POST: เพิ่มสินค้าใหม่ ทำทีละขั้น: ตรวจสิทธิ์ -> อ่าน JSON -> ตรวจข้อมูล -> บันทึก
export async function POST(request: Request) {
  // ชั้นที่ 1: ตรวจสอบสิทธิ์การใช้งาน (ADMIN หรือ STAFF เท่านั้น)
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  // ชั้นที่ 2: อ่านและตรวจโครงสร้างไฟล์ JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // ถ้ารูปแบบ JSON เสียหาย (เช่น วงเล็บปีกกาไม่ครบ) ตอบกลับด้วย HTTP 400 Bad Request
    return NextResponse.json({ message: "รูปแบบ JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  // ชั้นที่ 3: ตรวจสอบความถูกต้องของข้อมูลรายฟิลด์ด้วย Zod
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    // ถ้าพิมพ์ข้อมูลผิดกฎ (เช่น ราคิติดลบ, ลืมใส่ชื่อ) ตอบกลับ HTTP 400 พร้อมแจกแจง error แยกตามชื่อฟิลด์
    return NextResponse.json(
      { message: "ข้อมูลไม่ถูกต้อง", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  // ชั้นที่ 4: บันทึกลงฐานข้อมูลและจัดการ Error กรณี SKU ซ้ำ
  try {
    // บันทึกข้อมูลที่ผ่านการตรวจแล้วลงในฐานข้อมูล
    const product = await prisma.product.create({ data: parsed.data });
    
    // บันทึกสำเร็จ ตอบกลับด้วยข้อมูลสินค้าที่สร้างใหม่ พร้อม HTTP Status 201 Created
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    // ตรวจสอบว่า Error เกิดจาก SKU หรือ รหัสสินค้า ซ้ำหรือไม่
    if (isUniqueViolation(e)) {
      // ตอบกลับ HTTP 409 Conflict เพื่อระบุว่าข้อมูลซ้ำ
      return NextResponse.json({ message: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
    }
    // Error อื่นๆ ของ Server -> ตอบกลับ HTTP 500 Internal Server Error
    return NextResponse.json({ message: "ไม่สามารถบันทึกสินค้าได้" }, { status: 500 });
  }
}