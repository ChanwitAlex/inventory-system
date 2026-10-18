import prisma from "./prisma";

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
 * ดึงรายการสินค้า พร้อมการค้นหาและแบ่งหน้า
 */
export async function listProducts(params: {
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search && params.search.trim() !== "") {
    where.OR = [
      { sku: { contains: params.search } },
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.category && params.category.trim() !== "") {
    where.category = params.category;
  }

  if (params.status && params.status.trim() !== "") {
    where.status = params.status === "active";
  }

  // กำหนดการเรียงลำดับ
  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (params.sort === "price_desc") {
    orderBy = { price: "desc" };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.error("Error in listProducts:", error);
    return { items: [], total: 0, page: 1, totalPages: 1 };
  }
}