import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">คุณไม่มีสิทธิ์เข้าหน้านี้</h1>
      <p className="mt-2 text-muted">
        หน้านี้สำหรับผู้ที่มีสิทธิ์สูงกว่า หากต้องการใช้งาน ให้ติดต่อผู้ดูแลระบบ
      </p>
      <Link href="/products" className="btn-primary mt-5">
        กลับไปรายการสินค้า
      </Link>
    </div>
  );
}
