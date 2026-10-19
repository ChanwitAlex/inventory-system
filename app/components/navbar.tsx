/**
 * แถบเมนูด้านบน (แสดงเมื่อ login แล้ว)
 * โลโก้ -> หน้าแรก, เมนูหลัก (ADMIN เห็น ภาพรวม/สินค้า/ผู้ใช้ ส่วน STAFF เห็นสินค้า),
 * ชื่อ/สิทธิ์ของผู้ใช้, ปุ่มออกจากระบบ
 */
import Link from "next/link";
import { signOut } from "@/app/auth";
import { canManageUsers } from "@/app/lib/permissions";
import NavLink from "./nav-link";

// ข้อความแสดงสิทธิ์ใต้ชื่อผู้ใช้
const ROLE_LABEL = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "เจ้าหน้าที่คลัง",
} as const;

// รับชื่อและสิทธิ์ของผู้ใช้จาก layout
export default function Navbar({
  name,
  role,
}: {
  name: string;
  role: keyof typeof ROLE_LABEL;
}) {
  return (
    <header className="bg-nav text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-6">
          {/* โลโก้: ไอคอนช่องเก็บของ + ชื่อระบบ กดแล้วกลับหน้าแรก */}
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-white/10" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" opacity="0.45" />
              </svg>
            </span>
            <span className="hidden sm:inline">ระบบจัดการสินค้า/คลังสินค้า</span>
          </Link>

          {/* เมนูหลัก (บนมือถือจะลงไปอยู่บรรทัดล่าง) */}
          <nav aria-label="เมนูหลัก" className="order-last flex w-full items-center gap-1 sm:order-none sm:w-auto">
            {canManageUsers(role) && (
              <NavLink href="/admin" exact>
                ภาพรวม
              </NavLink>
            )}
            <NavLink href="/products">สินค้า</NavLink>
            {canManageUsers(role) && <NavLink href="/admin/users">ผู้ใช้และสิทธิ์</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {/* ตัวอักษรแรกของชื่อ + ชื่อ + สิทธิ์ */}
          <span
            className="grid size-8 place-items-center rounded-full bg-white/15 text-sm font-semibold"
            aria-hidden="true"
          >
            {name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-white/65">{ROLE_LABEL[role]}</div>
          </div>

          {/* ปุ่มออกจากระบบ: server action ล้าง session แล้วไปหน้า login */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-white/25 px-3 py-1.5 text-white/90 transition-colors hover:bg-white/10"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}