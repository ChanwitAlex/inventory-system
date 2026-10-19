/**
 * หน้าเข้าสู่ระบบ /login
 * แสดงฟอร์ม login, ปุ่ม GitHub (ถ้าเปิดใช้) และลิงก์ไปสมัครสมาชิก
 * โครงหน้า (ซ้าย-ขวา) อยู่ใน components/auth-shell.tsx
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, githubEnabled } from "@/app/auth";
import AuthShell from "@/app/components/auth-shell";
import LoginForm from "./login-form";
import { githubSignIn } from "./actions";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
};

// หน้า login (Server Component)
export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  // login อยู่แล้วไม่ต้องเห็นหน้านี้ ส่งกลับหน้าแรก
  if (session?.user) redirect("/");

  // callbackUrl = หน้าที่จะกลับไปหลัง login / registered = เพิ่งสมัครเสร็จ
  const { callbackUrl, registered } = await searchParams;

  return (
    <AuthShell
      title="เข้าสู่ระบบ"
      subtitle="ใช้อีเมลและรหัสผ่านของคุณเพื่อจัดการสต็อกสินค้า"
      footer={
        <>
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      {/* แจ้งผู้ที่เพิ่งสมัครว่าต้องรอผู้ดูแลระบบอนุมัติ */}
      {registered && (
        <p className="mb-4 rounded-lg border border-ok/20 bg-ok-soft px-3 py-2 text-sm font-medium text-ok">
          สมัครสมาชิกเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบอนุมัติก่อนเข้าสู่ระบบ
        </p>
      )}

      {/* ฟอร์ม login (Client Component) */}
      <LoginForm callbackUrl={callbackUrl ?? "/"} />

      {/* ปุ่ม GitHub แสดงเมื่อตั้งค่า env ครบเท่านั้น */}
      {githubEnabled && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            หรือ
            <span className="h-px flex-1 bg-line" />
          </div>
          <form action={githubSignIn}>
            <button className="btn-ghost w-full">เข้าสู่ระบบด้วย GitHub</button>
          </form>
        </>
      )}
    </AuthShell>
  );
}