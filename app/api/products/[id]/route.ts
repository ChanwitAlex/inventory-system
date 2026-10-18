import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { requireApiRole } from "@/app/lib/permissions";
import { isNotFound, isUniqueViolation } from "@/app/lib/products";
import { productSchema } from "@/app/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const badId = () =>
  NextResponse.json({ message: "รหัสสินค้า (id) ไม่ถูกต้อง" }, { status: 400 });
const notFound = () =>
  NextResponse.json({ message: "ไม่พบสินค้า" }, { status: 404 });

// GET /api/products/:id
export async function GET(request: Request, { params }: Ctx) {
  const guard = await requireApiRole(request, ["ADMIN", "STAFF"]);
  if (guard.error) return guard.error;

  const id = parseId((await params).id);
  if (!id) return badId();

  const product = await prisma.product.findUnique({ where: { id } });
  return product ? NextResponse.json(product) : notFound();
}

// PUT /api/products/:id
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
    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    return NextResponse.json(product);
  } catch (e) {
    if (isNotFound(e)) return notFound();
    if (isUniqueViolation(e)) {
      return NextResponse.json({ message: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ message: "ไม่สามารถแก้ไขสินค้าได้" }, { status: 500 });
  }
}

// DELETE /api/products/:id  (เฉพาะ ADMIN)
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