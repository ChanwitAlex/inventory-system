import Link from "next/link";
import { auth } from "@/app/auth";
import { CATEGORIES, LOW_STOCK_THRESHOLD } from "@/app/lib/constants";
import { canDelete, canManageUsers, canWrite } from "@/app/lib/permissions";
import { listProducts } from "@/app/lib/products";
import DeleteButton from "./delete-button";
import StockButtons from "./stock-buttons";

type SP = {
  search?: string;
  category?: string;
  status?: string;
  page?: string;
  saved?: string;
};

const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

const SAVED_TEXT: Record<string, string> = {
  created: "เพิ่มสินค้าเรียบร้อยแล้ว",
  updated: "บันทึกการแก้ไขเรียบร้อยแล้ว",
};

function StockCell({ stock }: { stock: number }) {
  const out = stock === 0;
  const low = !out && stock <= LOW_STOCK_THRESHOLD;
  const pct = Math.min(100, Math.round((stock / (LOW_STOCK_THRESHOLD * 3)) * 100));
  const color = out ? "bg-danger" : low ? "bg-warn" : "bg-brand";

  return (
    <div className="min-w-24">
      <div className="flex items-baseline gap-2">
        <span className="font-medium tabular-nums">{stock}</span>
        {out && <span className="text-xs font-bold text-danger">หมด</span>}
        {low && <span className="text-xs font-semibold text-warn">ใกล้หมด</span>}
      </div>
      <div className="mt-1 h-1 w-full rounded-full bg-line">
        <div className={`h-1 rounded-full ${color}`} style={{ width: `${out ? 0 : Math.max(pct, 4)}%` }} />
      </div>
    </div>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await auth();
  const role = session?.user?.role;

  const { items, total, page, totalPages } = await listProducts({
    search: sp.search,
    category: sp.category,
    status: sp.status,
    page: Number(sp.page) || 1,
  });

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const k of ["search", "category", "status"] as const) {
      if (sp[k]) q.set(k, sp[k]!);
    }
    q.set("page", String(p));
    return `/products?${q.toString()}`;
  };

  const hasFilter = Boolean(sp.search || sp.category || sp.status);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">สินค้าในคลัง</h1>
          <p className="text-sm text-muted">พบ {total} รายการ</p>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่มจัดการผู้ใช้สำหรับ ADMIN (ปรับเป็นปุ่มแล้ว) */}
          {canManageUsers(role) && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              ⚙️ จัดการผู้ใช้ (Admin)
            </Link>
          )}

          {canWrite(role) && (
            <Link href="/products/new" className="btn-primary text-sm">
              + เพิ่มสินค้า
            </Link>
          )}
        </div>
      </div>

      {sp.saved && SAVED_TEXT[sp.saved] && (
        <p className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand">
          {SAVED_TEXT[sp.saved]}
        </p>
      )}

      {/* ฟอร์มค้นหาและกรองข้อมูล */}
      <form method="GET" className="card mb-5 grid gap-3 p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="search" className="label">ค้นหา</label>
          <input id="search" name="search" defaultValue={sp.search ?? ""} placeholder="รหัส ชื่อ หรือรายละเอียด" className="input" />
        </div>

        <div>
          <label htmlFor="category" className="label">หมวดหมู่</label>
          <select id="category" name="category" defaultValue={sp.category ?? ""} className="input">
            <option value="">ทั้งหมด</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="label">สถานะ</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">ทั้งหมด</option>
            <option value="active">เปิดขาย</option>
            <option value="inactive">ปิดขาย</option>
          </select>
        </div>

        <div className="flex gap-2 md:col-span-4">
          <button className="btn-primary">ค้นหา</button>
          {hasFilter && (
            <Link href="/products" className="btn-ghost">
              ล้างตัวกรอง
            </Link>
          )}
        </div>
      </form>

      {/* ตารางสินค้า */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">รหัส</th>
              <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
              <th className="px-4 py-3 font-medium">หมวดหมู่</th>
              <th className="px-4 py-3 text-right font-medium">ราคา</th>
              <th className="px-4 py-3 font-medium">คงเหลือ</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              {canWrite(role) && <th className="px-4 py-3 font-medium text-center">จัดการ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="line-clamp-1 max-w-xs text-xs text-muted">{p.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">{baht.format(p.price)}</td>
                <td className="px-4 py-3"><StockCell stock={p.stock} /></td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.status ? "bg-brand-soft text-brand" : "bg-paper text-muted"}`}>
                    {p.status ? "เปิดขาย" : "ปิดขาย"}
                  </span>
                </td>
                
                {canWrite(role) && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <StockButtons productId={p.id} currentStock={p.stock} />
                      <Link href={`/products/${p.id}/edit`} className="btn-ghost btn-sm">
                        แก้ไข
                      </Link>
                      {canDelete(role) && <DeleteButton id={p.id} name={p.name} />}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={canWrite(role) ? 7 : 6} className="px-4 py-10 text-center text-muted">
                  {hasFilter
                    ? "ไม่พบสินค้าตามเงื่อนไขที่เลือก ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"
                    : "ยังไม่มีสินค้าในระบบ กด “เพิ่มสินค้า” เพื่อเริ่มต้น"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between text-sm" aria-label="แบ่งหน้า">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-ghost btn-sm">ก่อนหน้า</Link>
          ) : <span />}
          <span className="text-muted">หน้า {page} จาก {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="btn-ghost btn-sm">ถัดไป</Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}