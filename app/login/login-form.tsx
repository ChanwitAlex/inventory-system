/**
 * ไฟล์: app/login/login-form.tsx — ฟอร์ม login (Client Component)
 * ส่งอีเมล/รหัสผ่านไปที่ authenticate (app/login/actions.ts) และแสดงข้อความผิดพลาดที่ได้กลับมา
 */
"use client";

import { useActionState } from "react";
import { authenticate, type LoginState } from "./actions";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(authenticate, {});

  return (
    <form action={action} className="space-y-4">
      {/* ฝังหน้าที่ต้องกลับไปหลัง login ไว้ในฟอร์ม (ผู้ใช้มองไม่เห็น) */}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="email" className="label">
          อีเมล
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}