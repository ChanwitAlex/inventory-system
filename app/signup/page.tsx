/**
 * หน้าสมัครสมาชิก /signup
 * ผู้สมัครเองจะได้สิทธิ์ STAFF แต่ต้องรอผู้ดูแลระบบอนุมัติก่อนจึงจะ login ได้
 * ตัวฟอร์มอยู่ใน signup-form.tsx ส่วนโครงหน้าอยู่ใน components/auth-shell.tsx
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/auth";
import AuthShell from "@/app/components/auth-shell";
import SignUpForm from "./signup-form";

// หน้าสมัครสมาชิก (Server Component)
export default async function SignUpPage() {
  const session = await auth();
  // login อยู่แล้วไม่ต้องสมัครซ้ำ
  if (session?.user) redirect("/");

  return (
    <AuthShell
      title="สมัครสมาชิก"
      subtitle="บัญชีใหม่ต้องรอผู้ดูแลระบบอนุมัติก่อนเข้าใช้งาน"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}