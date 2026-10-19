/**
 * ไฟล์: app/admin/users/page.tsx — หน้า 'จัดการผู้ใช้และสิทธิ์' (เฉพาะ ADMIN)
 * แสดงรายชื่อผู้ใช้ทั้งหมด: อนุมัติผู้สมัคร, เปลี่ยนสิทธิ์ ADMIN/STAFF, ลบผู้ใช้ และเพิ่มผู้ใช้ใหม่
 * ผลลัพธ์ของแต่ละการกระทำแสดงเป็นข้อความด้านบน (อ่านจาก ?ok= / ?error= ใน URL)
 */
import Link from "next/link";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import AddUserForm from "./add-user-form";
import DeleteUserButton from "./delete-user-button";
import { approveUser, updateUserRole } from "./actions";

const ROLE_LABEL = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "เจ้าหน้าที่",
} as const;

const dateFmt = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  // ตรวจสิทธิ์ ADMIN และเก็บข้อมูลของตัวเอง (ใช้กันไม่ให้แก้/ลบบัญชีตัวเอง)
  const me = await requirePageRole(["ADMIN"]);
  const { ok, error } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, approved: true, createdAt: true },
  });

  // นับผู้สมัครที่ยังรออนุมัติ เพื่อแสดงแบนเนอร์เตือน
  const pending = users.filter((u) => !u.approved).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">จัดการผู้ใช้และสิทธิ์</h1>
          <p className="text-sm text-muted">
            ผู้ใช้ทั้งหมด {users.length} คน
          </p>
        </div>
        <Link href="/admin" className="btn-ghost text-sm">
          ← ภาพรวม
        </Link>
      </div>

      {/* แบนเนอร์แจ้งว่ามีผู้สมัครรออนุมัติ */}
      {pending > 0 && (
        <p className="mb-4 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">
          มีผู้สมัครรออนุมัติ {pending} คน — กดปุ่ม “อนุมัติ” ในตารางด้านล่าง
        </p>
      )}
      {ok && <p className="mb-4 rounded-lg border border-ok/20 bg-ok-soft px-3 py-2 text-sm font-medium text-ok">{ok}</p>}
      {error && (
        <p className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
      )}

      {/* ฟอร์มเพิ่มผู้ใช้ใหม่ (บัญชีที่แอดมินสร้างเองจะอนุมัติให้ทันที) */}
      <section className="card mb-6 p-4">
        <h2 className="mb-3 font-medium">เพิ่มผู้ใช้ใหม่</h2>
        <AddUserForm />
      </section>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">สิทธิ์</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">เพิ่มเมื่อ</th>
              <th className="px-4 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              // ถ้าเป็นแถวของตัวเอง จะไม่แสดงเมนูเปลี่ยนสิทธิ์/ปุ่มลบ (กันล็อกตัวเองออก)
              const isMe = u.id === me.id;
              return (
                <tr key={u.id} className="align-middle">
                  <td className="px-4 py-3 font-medium">
                    {u.name ?? "-"}
                    {isMe && <span className="badge ml-2 bg-brand-soft text-brand">คุณ</span>}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    {isMe ? (
                      ROLE_LABEL[u.role as keyof typeof ROLE_LABEL] ?? u.role
                    ) : (
                      <form action={updateUserRole.bind(null, u.id)} className="flex items-center gap-2">
                        <select
                          name="role"
                          defaultValue={u.role}
                          aria-label={`สิทธิ์ของ ${u.email}`}
                          className="input w-auto text-xs py-1 px-2"
                        >
                          {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => (
                            <option key={r} value={r}>
                              {r} ({ROLE_LABEL[r]})
                            </option>
                          ))}
                        </select>
                        <button className="btn-ghost btn-sm">บันทึก</button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.approved ? "bg-brand-soft text-brand" : "bg-warn-soft text-warn"}`}>
                      {u.approved ? "ใช้งานได้" : "รออนุมัติ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{dateFmt.format(u.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {isMe ? (
                      <span className="text-xs text-muted">-</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {/* ปุ่ม 'อนุมัติ' แสดงเฉพาะผู้ที่ยังรออนุมัติ */}
                        {!u.approved && (
                          <form action={approveUser.bind(null, u.id)}>
                            <button className="btn-primary btn-sm">อนุมัติ</button>
                          </form>
                        )}
                        <DeleteUserButton id={u.id} email={u.email} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}