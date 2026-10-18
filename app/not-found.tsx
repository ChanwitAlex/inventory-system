/**
 * ไฟล์: app/not-found.tsx — หน้า 404 'ไม่พบหน้าที่ต้องการ' (เช่น แก้ไขสินค้าที่ id ไม่มีอยู่)
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <p className="mt-2 text-muted">ลิงก์อาจผิด หรือข้อมูลถูกลบไปแล้ว</p>
      <Link href="/products" className="btn-primary mt-5">
        กลับไปรายการสินค้า
      </Link>
    </div>
  );
}