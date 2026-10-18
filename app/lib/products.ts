import type { Prisma } from "@/app/generated/prisma/client";
import { LOW_STOCK_THRESHOLD, PAGE_SIZE } from "./constants";
import prisma from "./prisma";

const MAX_PAGE_SIZE = 100;

/**
 * ฟังก์ชันตรวจสอบ Prisma Error Code P2025 (ไม่พบข้อมูลในฐานข้อมูล)
 */
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
export async function listProducts(params: {
  search?: string;
  category?: string;
  status?: string; // active | inactive
  stock?: string; // ok | low | out
  sort?: string; // newest | name | price_asc | price_desc | stock_asc
  page?: number;
  pageSize?: number;
}) {
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(params.pageSize)) || PAGE_SIZE),
  );
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const where: Prisma.ProductWhereInput = {};

  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { sku: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (params.category?.trim()) {
    where.category = params.category;
  }

  if (params.status === "active") where.status = true;
  else if (params.status === "inactive") where.status = false;

  if (params.stock === "out") where.stock = 0;
  else if (params.stock === "low") where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD };
  else if (params.stock === "ok") where.stock = { gt: LOW_STOCK_THRESHOLD };

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

  try {
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
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error("Error in listProducts:", error);
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }
}