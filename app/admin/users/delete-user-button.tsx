"use client";

import { deleteUser } from "./actions";

export default function DeleteUserButton({ id, email }: { id: string; email: string }) {
  return (
    <form
      action={deleteUser.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`ลบผู้ใช้ ${email} ใช่หรือไม่?`)) e.preventDefault();
      }}
    >
      <button className="btn-danger btn-sm">ลบ</button>
    </form>
  );
}
