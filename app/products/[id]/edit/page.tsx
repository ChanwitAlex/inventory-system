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

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">แก้ไขสินค้า</h1>
      <p className="mb-6 text-sm text-muted">{product.sku} · {product.name}</p>
      <ProductForm
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
