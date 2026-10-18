/**
 * ไฟล์: app/products/page.tsx — หน้า 'รายการสินค้า' (ข้อ 1 Read + ข้อ 4 Search/Filter)
 * เป็น Server Component: ดึงข้อมูลจากฐานข้อมูลบนเซิร์ฟเวอร์แล้วสร้าง HTML ส่งให้เบราว์เซอร์
 * เงื่อนไขค้นหา/กรองอยู่ใน URL (?search=...&stock=low) ทำให้แชร์ลิงก์และกดย้อนกลับได้
 * ปุ่มที่แสดงขึ้นกับสิทธิ์: ทุกคนดูได้, ADMIN/STAFF เห็นปุ่มเพิ่ม/แก้ไข/สต็อก, เฉพาะ ADMIN เห็นปุ่มลบ
 */
import Link from "next/link";
import { auth } from "@/app/auth";
import { CATEGORIES, LOW_STOCK_THRESHOLD } from "@/app/lib/constants";
import { canDelete, canManageUsers, canWrite } from "@/app/lib/permissions";
import { listProducts } from "@/app/lib/products";
import DeleteButton from "./delete-button";
import StockButtons from "./stock-buttons";

// ชนิดของค่าที่อ่านจาก URL (query string) ของหน้านี้
type SP = {
  search?: string;
  category?: string;
  stock?: string;
  status?: string;
  sort?: string;
  page?: string;
  saved?: string;
};

// ตัวจัดรูปแบบราคาเป็นเงินบาท เช่น ฿15,900.00
const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

// ข้อความแจ้งผลหลังเพิ่ม/แก้ไขสำเร็จ (อ่านจาก ?saved=created|updated)
const SAVED_TEXT: Record<string, string> = {
  created: "เพิ่มสินค้าเรียบร้อยแล้ว",
  updated: "บันทึกการแก้ไขเรียบร้อยแล้ว",
};

// คอมโพเนนต์แสดงจำนวนคงเหลือ + ป้าย 'ใกล้หมด'/'หมด' + แถบสี (เขียว ปกติ / เหลือง ใกล้หมด / แดง หมด)
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

// ตัวหน้า: ทำงานทีละขั้น
// 1) อ่านเงื่อนไขจาก URL  2) ดูสิทธิ์ของผู้ใช้  3) ดึงสินค้าตามเงื่อนไข  4) แสดงฟอร์มค้นหา ตาราง และปุ่มแบ่งหน้า
export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await auth();
  const role = session?.user?.role;

  // เรียงตามราคาเท่านั้น (ค่าเริ่มต้น: ราคาต่ำสุดก่อน)
  const sort = sp.sort === "price_desc" ? "price_desc" : "price_asc";

  // ดึงสินค้าตามเงื่อนไข ค้นหา/กรอง/เรียง/แบ่งหน้า (ฟังก์ชันเดียวกับ API)
  const { items, total, page, totalPages } = await listProducts({
    search: sp.search,
    category: sp.category,
    stock: sp.stock,
    status: sp.status,
    sort,
    page: Number(sp.page) || 1,
  });

  // สร้างลิงก์ 'ก่อนหน้า/ถัดไป' โดยคงตัวกรองเดิมไว้ ไม่ให้ตัวกรองหายเมื่อเปลี่ยนหน้า
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const k of ["search", "category", "stock", "status"] as const) {
      if (sp[k]) q.set(k, sp[k]!);
    }
    q.set("sort", sort);
    q.set("page", String(p));
    return `/products?${q.toString()}`;
  };

  // มีการใช้ตัวกรองอยู่หรือไม่ (ใช้แสดงปุ่ม 'ล้างตัวกรอง' และเลือกข้อความเมื่อไม่พบสินค้า)
  const hasFilter = Boolean(sp.search || sp.category || sp.stock || sp.status);

  return (
    <div className="p-6">
      {/* ส่วนหัวหน้า: ชื่อหน้า, จำนวนที่พบ และปุ่มด้านขวา (ตามสิทธิ์) */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">สินค้าในคลัง</h1>
          <p className="text-sm text-muted">พบ {total} รายการ</p>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่มกลับหน้าภาพรวม (เฉพาะ ADMIN) */}
          {canManageUsers(role) && (
            <Link href="/admin" className="btn-ghost text-sm">
              ← กลับหน้าภาพรวม
            </Link>
          )}

          {/* ปุ่ม 'เพิ่มสินค้า' แสดงเฉพาะ ADMIN/STAFF */}
          {canWrite(role) && (
            <Link href="/products/new" className="btn-primary text-sm">
              + เพิ่มสินค้า
            </Link>
          )}
        </div>
      </div>

      {/* แถบแจ้งผลหลังบันทึกสำเร็จ */}
      {sp.saved && SAVED_TEXT[sp.saved] && (
        <p className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand">
          {SAVED_TEXT[sp.saved]}
        </p>
      )}

      {/* ฟอร์มค้นหาและกรองข้อมูล */}
      <form method="GET" className="card mb-5 grid gap-3 p-4 md:grid-cols-4">
        {/* ช่องค้นหา: พิมพ์รหัส ชื่อ หรือรายละเอียดสินค้า */}
        <div className="md:col-span-2">
          <label htmlFor="search" className="label">ค้นหา</label>
          <input id="search" name="search" defaultValue={sp.search ?? ""} placeholder="รหัส ชื่อ หรือรายละเอียด" className="input" />
        </div>

        <div>
          {/* ตัวกรอง: หมวดหมู่ */}
          <label htmlFor="category" className="label">หมวดหมู่</label>
          <select id="category" name="category" defaultValue={sp.category ?? ""} className="input">
            <option value="">ทั้งหมด</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          {/* ตัวเลือก: เรียงตามราคา ต่ำ→สูง หรือ สูง→ต่ำ */}
          <label htmlFor="sort" className="label">เรียงตาม</label>
          <select id="sort" name="sort" defaultValue={sort} className="input">
            <option value="price_asc">ราคาต่ำสุด</option>
            <option value="price_desc">ราคาสูงสุด</option>
          </select>
        </div>

        <div>
          {/* ตัวกรอง: สถานะสต็อก (ปกติ / ใกล้หมด / หมด) */}
          <label htmlFor="stock" className="label">สถานะสต็อก</label>
          <select id="stock" name="stock" defaultValue={sp.stock ?? ""} className="input">
            <option value="">ทั้งหมด</option>
            <option value="ok">ปกติ</option>
            <option value="low">ใกล้หมด</option>
            <option value="out">หมดสต็อก</option>
          </select>
        </div>

        <div>
          {/* ตัวกรอง: สถานะสินค้า (เปิดขาย / ปิดขาย) */}
          <label htmlFor="status" className="label">สถานะสินค้า</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">ทั้งหมด</option>
            <option value="active">เปิดขาย</option>
            <option value="inactive">ปิดขาย</option>
          </select>
        </div>

        {/* ปุ่มค้นหา (ส่งฟอร์มแบบ GET ค่าไปอยู่ใน URL) และปุ่มล้างตัวกรอง */}
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
            {/* วนลูปแสดงสินค้าทีละแถว */}
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
                
                {/* คอลัมน์ 'จัดการ': รับเข้า/เบิกจ่าย, แก้ไข (ADMIN/STAFF) และลบ (เฉพาะ ADMIN) */}
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

            {/* ไม่พบสินค้า: แสดงข้อความตามว่ามีการกรองอยู่หรือยังไม่มีสินค้าเลย */}
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

      {/* ปุ่มแบ่งหน้า แสดงเมื่อมีมากกว่า 1 หน้า */}
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