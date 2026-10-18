"use client";

import { useActionState } from "react";
import { signUp, type SignUpState } from "./actions";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <p className="field-error">{messages[0]}</p> : null;
}

export default function SignUpForm() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">ชื่อ - นามสกุล</label>
        <input id="name" name="name" required autoComplete="name" defaultValue={state.values?.name} className="input" />
        <FieldError messages={e.name} />
      </div>

      <div>
        <label htmlFor="email" className="label">อีเมล</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state.values?.email} className="input" placeholder="you@example.com" />
        <FieldError messages={e.email} />
      </div>

      <div>
        <label htmlFor="password" className="label">รหัสผ่าน</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <p className="mt-1 text-xs text-muted">อย่างน้อย 8 ตัวอักษร</p>
        <FieldError messages={e.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">ยืนยันรหัสผ่าน</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" className="input" />
        <FieldError messages={e.confirmPassword} />
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </button>
    </form>
  );
}