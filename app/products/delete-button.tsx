/**
 * ไฟล์: app/products/delete-button.tsx — ปุ่ม 'ลบสินค้า' (ข้อ 1 Delete)
 * แสดงเฉพาะ ADMIN ถามยืนยันก่อนลบ (ถ้ากดยกเลิกจะไม่ส่งฟอร์ม) แล้วเรียก deleteProduct
 */
"use client";

import { deleteProduct } from "./actions";

export default function DeleteButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      // ผูก id ของสินค้าเข้ากับ Server Action ลบ
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