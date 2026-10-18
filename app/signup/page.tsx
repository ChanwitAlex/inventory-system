"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignUpState } from "./actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, {});
  const err = (f: string) => state.errors?.[f]?.[0];

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-brand">สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-muted">บัญชีใหม่จะดูข้อมูลสินค้าได้อย่างเดียว</p>
      </div>

      <form action={action} className="card space-y-4 p-6">
        <div>
          <label htmlFor="name" className="label">ชื่อ</label>
          <input id="name" name="name" required className="input" defaultValue={state.values?.name} />
          {err("name") && <p className="field-error">{err("name")}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">อีเมล</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" defaultValue={state.values?.email} />
          {err("email") && <p className="field-error">{err("email")}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">รหัสผ่าน</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="อย่างน้อย 8 ตัวอักษร" />
          {err("password") && <p className="field-error">{err("password")}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">ยืนยันรหัสผ่าน</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" className="input" />
          {err("confirmPassword") && <p className="field-error">{err("confirmPassword")}</p>}
        </div>

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
