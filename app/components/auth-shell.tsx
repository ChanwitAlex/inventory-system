/**
 * โครงหน้าสำหรับ login และสมัครสมาชิก (แบ่งสองฝั่ง)
 * ซ้าย (เฉพาะจอใหญ่): แผงสีเข้มมีภาพ "ช่องเก็บสินค้า" ที่แต่ละช่องเติมตามระดับสต็อก
 *   (ฟ้า = พอ, เหลือง = ใกล้หมด, ช่องว่าง = หมด) เป็นสีเดียวกับที่ใช้ในตารางสินค้า
 * ขวา: ชื่อหน้า + เนื้อหา (ฟอร์ม) ที่ส่งเข้ามาทาง children
 */

// ระดับสต็อกของแต่ละช่องในภาพ (เปอร์เซ็นต์) เรียงเป็นแถวชั้นวาง
const BINS = [
  [82, 55, 92, 38, 70],
  [64, 12, 86, 0, 46],
  [76, 96, 30, 66, 52],
];

// สีของช่อง: ว่าง = ไม่เติมสี, <= 15% = เหลือง (ใกล้หมด), นอกนั้นฟ้า (พอ)
function fillClass(pct: number) {
  return pct <= 15 ? "bg-[#f2b84b]" : "bg-[#7cc4e0]";
}

export default function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string; // หัวข้อฝั่งขวา เช่น "เข้าสู่ระบบ"
  subtitle: string; // คำอธิบายใต้หัวข้อ
  footer?: React.ReactNode; // ลิงก์ใต้ฟอร์ม เช่น "ยังไม่มีบัญชี? สมัครสมาชิก"
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[5fr_6fr]">
      {/* ---------- ฝั่งซ้าย: แผงแบรนด์ (ซ่อนบนมือถือ) ---------- */}
      <aside className="hidden flex-col justify-between bg-nav p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-white/10" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" opacity="0.45" />
            </svg>
          </span>
          ระบบจัดการสินค้า/คลังสินค้า
        </div>

        <div>
          <h2 className="max-w-sm text-3xl font-bold leading-snug">
            คลังอุปกรณ์ไอที เห็นสต็อกครบในหน้าเดียว
          </h2>
          <p className="mt-3 max-w-sm text-white/70">
            ค้นหาสินค้า รับเข้า เบิกจ่าย และดูรายการที่ใกล้หมดก่อนจะขาดของ
          </p>

          {/* ภาพช่องเก็บสินค้า (ตกแต่งอย่างเดียว ไม่ต้องอ่านออกเสียง) */}
          <div className="mt-10 grid max-w-md gap-2.5" aria-hidden="true">
            {BINS.map((row, r) => (
              <div key={r} className="grid grid-cols-5 gap-2.5 border-b-4 border-white/10 pb-2.5">
                {row.map((pct, c) => (
                  <div
                    key={c}
                    className="flex h-16 items-end overflow-hidden rounded-md border border-white/20 bg-white/5"
                  >
                    <div className={`w-full ${fillClass(pct)}`} style={{ height: `${pct}%` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* คำอธิบายสีของภาพ */}
          <ul className="mt-4 flex gap-5 text-xs text-white/65">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#7cc4e0]" /> พอใช้
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#f2b84b]" /> ใกล้หมด
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-white/40" /> หมด
            </li>
          </ul>
        </div>

        <p className="text-xs text-white/45">สำหรับเจ้าหน้าที่คลังและผู้ดูแลระบบ</p>
      </aside>

      {/* ---------- ฝั่งขวา: ฟอร์ม ---------- */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="page-title">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>

          <div className="card p-6">{children}</div>

          {footer && <p className="mt-5 text-center text-sm text-muted">{footer}</p>}
        </div>
      </section>
    </div>
  );
}