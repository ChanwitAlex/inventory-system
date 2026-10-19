"use client";

/**
 * ลิงก์เมนูบนแถบด้านบน (Client Component)
 * ไฮไลต์เมนูของหน้าที่เปิดอยู่ เพื่อให้รู้ว่าอยู่หน้าไหน
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  exact = false,
  children,
}: {
  href: string;
  exact?: boolean; // true = ไฮไลต์เฉพาะเมื่อ path ตรงทุกตัว (ใช้กับ /admin ไม่ให้ติดตอนอยู่ /admin/users)
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}