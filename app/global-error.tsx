/**
 * ไฟล์: app/global-error.tsx — หน้าแสดงเมื่อเกิดข้อผิดพลาดร้ายแรงที่ไม่ได้ดักไว้ มีปุ่ม 'ลองใหม่'
 */
"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="th">
      <body style={{ fontFamily: "system-ui", padding: 32 }}>
        <h1>เกิดข้อผิดพลาดบางอย่าง</h1>
        <p>กรุณาลองใหม่อีกครั้ง</p>
        <button onClick={reset}>ลองใหม่</button>
      </body>
    </html>
  );
}