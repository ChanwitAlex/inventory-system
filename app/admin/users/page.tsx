import Link from "next/link";
import prisma from "@/app/lib/prisma";
import { requirePageRole } from "@/app/lib/permissions";
import AddUserForm from "./add-user-form";
import DeleteUserButton from "./delete-user-button";
import { updateUserRole } from "./actions";

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
  const me = await requirePageRole(["ADMIN"]);
  const { ok, error } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">จัดการผู้ใช้และสิทธิ์</h1>
          <p className="text-sm text-muted">
            ผู้ใช้ทั้งหมด {users.length} คน
          </p>
        </div>
        <Link href="/admin" className="btn-ghost text-sm">
          ← ภาพรวม
        </Link>
      </div>

      {ok && <p className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand">{ok}</p>}
      {error && (
        <p className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

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
              <th className="px-4 py-3 font-medium">เพิ่มเมื่อ</th>
              <th className="px-4 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
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
                  <td className="px-4 py-3 text-muted">{dateFmt.format(u.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {isMe ? (
                      <span className="text-xs text-muted">-</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
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