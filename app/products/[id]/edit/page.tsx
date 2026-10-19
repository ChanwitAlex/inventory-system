/**
 * ไฟล์: app/products/[id]/edit/page.tsx — หน้า 'แก้ไขสินค้า' (ข้อ 1 Update)
 * 1) ตรวจสิทธิ์  2) อ่าน id จาก URL  3) ดึงสินค้าเดิมมาเติมในฟอร์ม  4) กดบันทึกเรียก updateProduct
 * ถ้า id ไม่ถูกต้องหรือไม่พบสินค้า จะแสดงหน้า 404
 */
import { notFound } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import { updateProduct } from "../../actions";
import ProductForm from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ADMIN", "STAFF"]);

  // แปลง id จาก URL เป็นตัวเลข ถ้าไม่ใช่จำนวนเต็มบวกให้แสดง 404
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 page-title">แก้ไขสินค้า</h1>
      <p className="mb-6 text-sm text-muted">{product.sku} · {product.name}</p>
      <ProductForm
        // bind: ผูก id ของสินค้านี้เข้ากับ action เพื่อให้รู้ว่าต้องแก้ตัวไหน
        action={updateProduct.bind(null, product.id)}
        submitLabel="บันทึกการแก้ไข"
        defaults={{
          sku: product.sku,
          name: product.name,
          category: product.category,
          description: product.description ?? "",
          price: String(product.price),
          stock: String(product.stock),
          status: product.status,
        }}
      />
    </div>
  );
}