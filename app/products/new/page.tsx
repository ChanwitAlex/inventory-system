/**
 * ไฟล์: app/products/new/page.tsx — หน้า 'เพิ่มสินค้าใหม่' (ข้อ 1 Create)
 * ตรวจสิทธิ์ ADMIN/STAFF แล้วแสดงฟอร์มว่าง เมื่อกดบันทึกจะเรียก createProduct (app/products/actions.ts)
 */
import { requirePageRole } from "@/app/lib/permissions";
import { createProduct } from "../actions";
import ProductForm from "../product-form";

export default async function NewProductPage() {
  await requirePageRole(["ADMIN", "STAFF"]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 page-title">เพิ่มสินค้าใหม่</h1>
      <ProductForm
        action={createProduct}
        submitLabel="บันทึกสินค้า"
        defaults={{ sku: "", name: "", category: "", description: "", price: "", stock: "0", status: true }}
      />
    </div>
  );
}