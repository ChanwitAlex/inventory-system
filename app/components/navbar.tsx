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
    // ใช้ sticky, bg-white/80 และ backdrop-blur-md เพื่อทำเอฟเฟกต์ Glassmorphism เมนูลอยโปร่งแสง
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        
        {/* ฝั่งซ้าย: โลโก้ และ เมนู Admin */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors">
            <span className="text-xl">📦</span>
            {/* ซ่อนข้อความยาวในจอมือถือ แสดงแค่จอใหญ่ */}
            <span className="hidden sm:inline-block">ระบบจัดการสินค้า/คลังสินค้า</span>
            <span className="sm:hidden">Inventory</span>
          </Link>

          {/* ปุ่มเฉพาะ Admin: จัดการผู้ใช้งาน & ดูประวัติ Logs */}
          {canManageUsers(role) && (
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 rounded-full bg-purple-100/80 px-3.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200 transition-colors"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline-block">จัดการผู้ใช้ & สิทธิ์</span>
              <span className="sm:hidden">จัดการ</span>
            </Link>
          )}
        </div>

        {/* ฝั่งขวา: ข้อมูลผู้ใช้ และ ปุ่มออกจากระบบ */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* ข้อมูลผู้ใช้ (ซ่อนในจอมือถือเพื่อประหยัดพื้นที่) */}
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-800">{name}</div>
            <div className="text-xs font-medium text-blue-600">{ROLE_LABEL[role]}</div>
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
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
        
      </div>
    </header>
  );
}