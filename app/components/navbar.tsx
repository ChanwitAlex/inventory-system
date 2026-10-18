/**
 * ไฟล์: app/components/navbar.tsx — แถบเมนูด้านบน
 * แสดงชื่อผู้ใช้ + ระดับสิทธิ์, ปุ่ม 'จัดการผู้ใช้' (เฉพาะ ADMIN) และปุ่ม 'ออกจากระบบ'
 */
import Link from "next/link";
import { signOut } from "@/app/auth";
import { canManageUsers } from "@/app/lib/permissions";

const ROLE_LABEL = {
  ADMIN: "ผู้ดูแลระบบ (Admin)",
  STAFF: "เจ้าหน้าที่คลัง (Staff)",
} as const;

export default function Navbar({
  name,
  role,
}: {
  name: string;
  role: keyof typeof ROLE_LABEL;
}) {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-900">
            📦 ระบบจัดการสินค้า/คลังสินค้า
          </Link>

          {/* ปุ่มเฉพาะ Admin: จัดการผู้ใช้งาน & ดูประวัติ Logs */}
          {canManageUsers(role) && (
            <Link
              href="/admin/users"
              className="rounded-md bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-200"
            >
              ⚙️ จัดการผู้ใช้ & สิทธิ์
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-xs font-semibold text-blue-600">{ROLE_LABEL[role]}</div>
          </div>

          <form
            // ปุ่มออกจากระบบ: Server Action เล็ก ๆ ที่เรียก signOut แล้วไปหน้า login
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}