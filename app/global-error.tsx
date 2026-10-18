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
