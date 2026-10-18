/**
 * ไฟล์: app/lib/products.ts — ตัวช่วยดึงรายการสินค้า (ข้อ 4 Search + Filter)
 * ฟังก์ชัน listProducts ถูกใช้ร่วมกันโดย 'หน้ารายการสินค้า' และ 'GET /api/products'
 * จึงได้ผลค้นหา/กรองตรงกันทั้งหน้าเว็บและ API
 */
import type { Prisma } from "@/app/generated/prisma/client";
import { LOW_STOCK_THRESHOLD, PAGE_SIZE } from "./constants";
import prisma from "./prisma";

const MAX_PAGE_SIZE = 100;

/**
 * ฟังก์ชันตรวจสอบ Prisma Error Code P2025 (ไม่พบข้อมูลในฐานข้อมูล)
 */
// ตรวจว่า error นี้คือ 'ไม่พบข้อมูล' (รหัส P2025 ของ Prisma) -> นำไปตอบ 404
export function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}

/**
 * ฟังก์ชันสำหรับเช็ก Error Unique Constraint จาก Prisma (P2002)
 */
// ตรวจว่า error นี้คือ 'ค่าซ้ำที่ห้ามซ้ำ' เช่น SKU ซ้ำ (รหัส P2002) -> นำไปตอบ 409
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

/**
 * ดึงรายการสินค้า พร้อมค้นหา กรอง เรียงลำดับ และแบ่งหน้า
 */
// รับเงื่อนไข ค้นหา + กรอง + เรียงลำดับ + แบ่งหน้า แล้วคืนรายการสินค้าพร้อมจำนวนรวม
export async function listProducts(params: {
  search?: string;
  category?: string;
  status?: string; // active | inactive
  stock?: string; // ok | low | out
  sort?: string; // newest | name | price_asc | price_desc | stock_asc
  page?: number;
  pageSize?: number;
}) {
  // ขั้น 1: จัดการแบ่งหน้า — จำกัดสูงสุด 100 รายการ/หน้า และเลขหน้าต้องเป็นจำนวนเต็มตั้งแต่ 1
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(params.pageSize)) || PAGE_SIZE),
  );
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  // ขั้น 2: ประกอบเงื่อนไขค้นหา/กรอง (where) ทีละข้อ — ข้อไหนไม่ได้ส่งมาก็ไม่ใส่เงื่อนไข
  const where: Prisma.ProductWhereInput = {};

  // ค้นหา: ตรงกับ รหัสสินค้า หรือ ชื่อ หรือ รายละเอียด (OR) ไม่สนตัวพิมพ์เล็ก-ใหญ่ของภาษาอังกฤษ
  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { sku: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // กรองตามหมวดหมู่ (ต้องตรงกันทั้งข้อความ)
  if (params.category?.trim()) {
    where.category = params.category;
  }

  // กรองสถานะสินค้า: active = เปิดขาย, inactive = ปิดขาย
  if (params.status === "active") where.status = true;
  else if (params.status === "inactive") where.status = false;

  // กรองสถานะสต็อก: out = หมด (0), low = ใกล้หมด (1-10), ok = ปกติ (มากกว่า 10)
  if (params.stock === "out") where.stock = 0;
  else if (params.stock === "low") where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD };
  else if (params.stock === "ok") where.stock = { gt: LOW_STOCK_THRESHOLD };

  // ขั้น 3: เลือกการเรียงลำดับ (ชื่อ / ราคา / สต็อก) ถ้าไม่ระบุให้เรียงตามวันที่สร้างล่าสุดก่อน
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "name"
      ? { name: "asc" }
      : params.sort === "price_asc"
        ? { price: "asc" }
        : params.sort === "price_desc"
          ? { price: "desc" }
          : params.sort === "stock_asc"
            ? { stock: "asc" }
            : { createdAt: "desc" };

  // ขั้น 4: ดึงข้อมูลของหน้านั้น (skip/take) พร้อมนับจำนวนทั้งหมดที่ตรงเงื่อนไข พร้อมกัน 2 query เพื่อความเร็ว
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    // จำนวนหน้าทั้งหมด (อย่างน้อย 1 หน้า)
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}