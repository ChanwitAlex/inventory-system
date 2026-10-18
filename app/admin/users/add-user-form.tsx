/**
 * ไฟล์: app/admin/users/add-user-form.tsx — ฟอร์มเพิ่มผู้ใช้ใหม่ (Client Component)
 * กรอก ชื่อ อีเมล รหัสผ่าน และเลือกสิทธิ์ แล้วเรียก createStaffUser แสดงผลสำเร็จ/ผิดพลาดใต้ฟอร์ม
 */
"use client";

import { useState } from "react";
import { createStaffUser } from "./actions";

export default function AddUserForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ success?: boolean; text?: string }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg({});

    const formData = new FormData(e.currentTarget);
    const res = await createStaffUser(null, formData);
    setLoading(false);

    if (res.success) {
      setMsg({ success: true, text: res.message });
      (e.target as HTMLFormElement).reset();
    } else {
      setMsg({ success: false, text: res.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อ - นามสกุล</label>
        <input name="name" required placeholder="สมชาย ใจดี" className="input w-full border px-3 py-1.5 rounded text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">อีเมล</label>
        <input name="email" type="email" required placeholder="staff@example.com" className="input w-full border px-3 py-1.5 rounded text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">รหัสผ่าน</label>
        <input name="password" type="password" required placeholder="••••••••" className="input w-full border px-3 py-1.5 rounded text-sm" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">ตำแหน่ง / สิทธิ์ (Role)</label>
        <select name="role" defaultValue="STAFF" className="input w-full border px-3 py-1.5 rounded text-sm bg-white">
          <option value="STAFF">STAFF (เพิ่ม/แก้ไขสินค้า)</option>
          <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
        </select>
      </div>

      <div className="md:col-span-4 flex items-center justify-between mt-2">
        {msg.text && (
          <span className={`text-xs font-medium ${msg.success ? "text-emerald-600" : "text-rose-600"}`}>
            {msg.text}
          </span>
        )}
        <button
          type="submit"
          disabled={loading}
          className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "กำลังบันทึก..." : "+ บันทึกผู้ใช้ใหม่"}
        </button>
      </div>
    </form>
  );
}