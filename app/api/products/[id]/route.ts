/**
 * ไฟล์: app/api/products/[id]/route.ts — REST API จัดการสินค้ารายชิ้น (ข้อ 5)
 *   GET    /api/products/:id   ดูสินค้าชิ้นเดียว
 *   PUT    /api/products/:id   แก้ไขสินค้า (ต้องส่งข้อมูลครบทุกฟิลด์)
 *   DELETE /api/products/:id   ลบสินค้า (เฉพาะ ADMIN ที่ login — x-api-key ลบไม่ได้)
 * รหัสตอบกลับ: 400 id ไม่ใช่ตัวเลข, 404 ไม่พบสินค้า, 409 SKU ซ้ำ
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { requireApiRole } from "@/app/lib/permissions";
import { isNotFound, isUniqueViolation } from "@/app/lib/products";
import { productSchema } from "@/app/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// แปลง id จาก URL เป็นเลขจำนวนเต็มบวก ถ้าไม่ใช่ (เช่น /abc) คืน null -> ตอบ 400
function parseId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const badId = () =>
  NextResponse.json({ message: "รหัสสินค้า (id) ไม่ถูกต้อง" }, { status: 400 });
const notFound = () =>
  NextResponse.json({ message: "ไม่พบสินค้า" }, { status: 404 });

// GET /api/products/:id
// GET: ดูสินค้าชิ้นเดียว ไม่พบตอบ 404
export async function GET(request: Request, { params }: Ctx) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  const id = parseId((await params).id);
  if (!id) return badId();

  const product = await prisma.product.findUnique({ where: { id } });
  return product ? NextResponse.json(product) : notFound();
}

// PUT /api/products/:id
// PUT: แก้ไขสินค้า ทำทีละขั้น: ตรวจสิทธิ์ -> ตรวจ id -> อ่าน JSON -> ตรวจข้อมูล -> อัปเดต
export async function PUT(request: Request, { params }: Ctx) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  const id = parseId((await params).id);
  if (!id) return badId();

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
    // อัปเดตข้อมูลสินค้า
    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    return NextResponse.json(product);
  } catch (e) {
    // ไม่พบ id นี้ในฐานข้อมูล -> 404 (ซ้ำกันอีกที่ในฟังก์ชันถัดไป)
    if (isNotFound(e)) return notFound();
    if (isUniqueViolation(e)) {
      return NextResponse.json({ message: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ message: "ไม่สามารถแก้ไขสินค้าได้" }, { status: 500 });
  }
}

// DELETE /api/products/:id  (เฉพาะ ADMIN)
// DELETE: ลบสินค้า — ใช้ requireApiRole(['ADMIN']) จึงเฉพาะ ADMIN เท่านั้น
// (STAFF หรือ x-api-key จะได้ 403)
export async function DELETE(request: Request, { params }: Ctx) {
  const guard = await requireApiRole(request, ["ADMIN"]);
  if (guard.error) return guard.error;

  const id = parseId((await params).id);
  if (!id) return badId();

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "ลบสินค้าเรียบร้อยแล้ว" });
  } catch (e) {
    if (isNotFound(e)) return notFound();
    return NextResponse.json({ message: "ไม่สามารถลบสินค้าได้" }, { status: 500 });
  }
}