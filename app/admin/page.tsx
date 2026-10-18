/**
 * ไฟล์: app/admin/page.tsx — หน้า 'ภาพรวมสำหรับผู้ดูแลระบบ' (เฉพาะ ADMIN)
 * สรุปตัวเลข: สินค้าทั้งหมด, ใกล้หมด, หมดสต็อก, มูลค่าสต็อก, จำนวนผู้ใช้ และรายการสินค้าที่ต้องสั่งเพิ่ม
 */
import Link from "next/link";
import prisma from "@/app/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/app/lib/constants";
import { requirePageRole } from "@/app/lib/permissions";

const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default async function AdminPage() {
  await requirePageRole(["ADMIN"]);

  // ดึงตัวเลขสรุปทั้งหมดพร้อมกัน (Promise.all) เพื่อให้หน้าโหลดเร็ว
  const [total, active, low, out, users, prices, recent] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: true } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.product.findMany({ select: { price: true, stock: true } }),
    prisma.product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
  ]);

  // มูลค่าสต็อกรวม = ผลรวมของ (ราคา x จำนวนคงเหลือ) ของทุกสินค้า
  const stockValue = prices.reduce((sum, p) => sum + p.price * p.stock, 0);
  const userCount = (r: string) => users.find((u) => u.role === r)?._count ?? 0;

  // การ์ดสรุป 4 ใบที่แสดงด้านบนของหน้า
  const stats = [
    { label: "สินค้าทั้งหมด", value: total, note: `เปิดขาย ${active} รายการ` },
    { label: "ใกล้หมด", value: low, note: `เหลือไม่เกิน ${LOW_STOCK_THRESHOLD} ชิ้น`, warn: low > 0 },
    { label: "หมดสต็อก", value: out, note: "ต้องสั่งเพิ่ม", danger: out > 0 },
    { label: "มูลค่าสต็อก", value: baht.format(stockValue), note: "ราคา × จำนวนคงเหลือ" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">ภาพรวมสำหรับผู้ดูแลระบบ</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/products" className="btn-primary">
            📦 จัดการสินค้าในคลัง
          </Link>
          <Link href="/admin/users" className="btn-ghost">
            👥 จัดการบัญชีผู้ใช้
          </Link>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${s.danger ? "text-danger" : s.warn ? "text-warn" : ""}`}>
              {s.value}
            </dd>
            <p className="mt-1 text-xs text-muted">{s.note}</p>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="border-b border-line px-4 py-3 font-medium">สินค้าที่ควรสั่งเพิ่ม</h2>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">ตอนนี้สต็อกเพียงพอทุกรายการ</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <span>
                    <span className="font-mono text-xs text-muted">{p.sku}</span>{" "}
                    <span className="font-medium">{p.name}</span>
                  </span>
                  <span className={`tabular-nums ${p.stock === 0 ? "text-danger" : "text-warn"}`}>
                    {p.stock === 0 ? "หมด" : `เหลือ ${p.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-medium">ผู้ใช้งาน</h2>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>ผู้ดูแลระบบ</span><span className="tabular-nums">{userCount("ADMIN")}</span></li>
            <li className="flex justify-between"><span>เจ้าหน้าที่</span><span className="tabular-nums">{userCount("STAFF")}</span></li>
          </ul>
          <Link href="/admin/users" className="btn-ghost mt-4 w-full">จัดการผู้ใช้</Link>
        </section>
      </div>
    </div>
  );
}