import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireApiRole } from "@/app/lib/permissions";
import { isUniqueViolation, listProducts } from "@/app/lib/products";
import { productSchema } from "@/app/lib/validation";
import { z } from "zod";

// GET /api/products?search=&category=&status=&stock=&sort=&page=&pageSize=
export async function GET(request: Request) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  const sp = new URL(request.url).searchParams;
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
}

// POST /api/products
export async function POST(request: Request) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "รูปแบบ JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "ข้อมูลไม่ถูกต้อง", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ message: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ message: "ไม่สามารถบันทึกสินค้าได้" }, { status: 500 });
  }
}