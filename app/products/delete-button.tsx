"use client";

import { deleteProduct } from "./actions";

export default function DeleteButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      action={deleteProduct.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`ลบสินค้า "${name}" ใช่หรือไม่? การลบย้อนกลับไม่ได้`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="btn-danger btn-sm">ลบ</button>
    </form>
  );
}
