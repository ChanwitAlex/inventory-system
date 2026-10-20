/**
 * ไฟล์: app/login/login-form.tsx — ฟอร์ม login (Client Component)
 * ส่งอีเมล/รหัสผ่านไปที่ authenticate (app/login/actions.ts) และแสดงข้อความผิดพลาดที่ได้กลับมา[cite: 1]
 */
"use client"; // กำหนดให้ Component นี้ทำงานฝั่ง Client (เบราว์เซอร์) เพื่อรองรับการใช้งาน React Hooks[cite: 1]

// นำเข้า useActionState จาก React เพื่อใช้จัดการสถานะการส่งฟอร์มผ่าน Server Action
import { useActionState } from "react";
// นำเข้าฟังก์ชัน authenticate และ Type LoginState จากไฟล์ actions.ts ในโฟลเดอร์เดียวกัน[cite: 1]
import { authenticate, type LoginState } from "./actions";

// ประกาศ Component รับ prop ชื่อ callbackUrl ซึ่งเป็น URL ของหน้าที่ต้องส่งกลับไปหลัง Login สำเร็จ
export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  // ใช้ Hook useActionState สำหรับผูกฟังก์ชัน authenticate เข้ากับฟอร์ม
  // - state: เก็บผลลัพธ์ที่ตอบกลับมาจาก Server (เช่น ข้อความ error)[cite: 1]
  // - action: ฟังก์ชันที่จะนำไปใส่ในคุณสมบัติ action ของแท็ก <form>
  // - pending: สถานะ Boolean บอกว่ากำลังประมวลผลอยู่หรือไม่ (true = กำลังทำงาน)
  const [state, action, pending] = useActionState<LoginState, FormData>(authenticate, {});

  return (
    // เมื่อกด Submit ฟอร์มจะเรียกใช้ฟังก์ชัน action ที่เชื่อมกับ Server Action ไว้
    <form action={action} className="space-y-4">
      {/* ฝังหน้าที่ต้องกลับไปหลัง login ไว้ในฟอร์มแบบซ่อน (Hidden Input) เพื่อส่งไปพร้อมกับข้อมูลฟอร์ม[cite: 1] */}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {/* ช่องกรอกอีเมล */}
      <div>
        <label htmlFor="email" className="label">
          อีเมล
        </label>
        <input
          id="email" // ID สำหรับจับคู่กับ label
          name="email" // ชื่อ field ที่จะส่งไปยัง Server Action
          type="email" // ชนิดข้อมูลแบบ Email
          autoComplete="email" // ช่วยเติมข้อมูลอีเมลอัตโนมัติของเบราว์เซอร์
          required // บังคับกรอกข้อมูลก่อนกด Submit
          className="input"
          placeholder="you@example.com"
        />
      </div>

      {/* ช่องกรอกรหัสผ่าน */}
      <div>
        <label htmlFor="password" className="label">
          รหัสผ่าน
        </label>
        <input
          id="password" // ID สำหรับจับคู่กับ label
          name="password" // ชื่อ field ที่จะส่งไปยัง Server Action
          type="password" // ชนิดข้อมูลแบบรหัสผ่าน (ซ่อนตัวอักษร)
          autoComplete="current-password" // ช่วยเติมรหัสผ่านอัตโนมัติ
          required // บังคับกรอกข้อมูลก่อนกด Submit
          className="input"
        />
      </div>

      {/* แสดงกล่องข้อความเตือนเฉพาะเมื่อมี error ส่งมาจาก Server Action */}
      {state.error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error} {/* ข้อความข้อผิดพลาด เช่น "อีเมลหรือรหัสผ่านไม่ถูกต้อง" */}
        </p>
      )}

      {/* ปุ่มกดส่งข้อมูล */}
      <button 
        type="submit" 
        disabled={pending} // ปิดการกดปุ่มชั่วคราวขณะกำลังประมวลผลเพื่อป้องกันการกดซ้ำ
        className="btn-primary w-full"
      >
        {/* เปลี่ยนข้อความบนปุ่มตามสถานะ pending */}
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}